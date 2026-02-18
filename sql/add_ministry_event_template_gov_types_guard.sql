-- Guard ministry_event_templates.gov_types against unknown values.
-- Canonical values: Democracy, Autocracy, Presidential.
-- During migration window, known aliases are accepted and canonicalized.
-- Migration-window toggle:
--   ALTER DATABASE postgres SET app.ministry_event_template_allow_gov_type_aliases = 'on';
--   ALTER DATABASE postgres SET app.ministry_event_template_allow_gov_type_aliases = 'off';

BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_and_validate_ministry_event_template_gov_types()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    canonical_values constant text[] := ARRAY['Democracy', 'Autocracy', 'Presidential'];
    alias_map constant jsonb := jsonb_build_object(
        'democracy', 'Democracy',
        'democratic', 'Democracy',
        'parliamentary', 'Democracy',
        'parliamentarian', 'Democracy',
        'parliamentary democracy', 'Democracy',
        'autocracy', 'Autocracy',
        'authoritarian', 'Autocracy',
        'authoritarianism', 'Autocracy',
        'dictatorship', 'Autocracy',
        'dictatorial', 'Autocracy',
        'military junta', 'Autocracy',
        'presidential', 'Presidential',
        'presidential republic', 'Presidential',
        'executive presidency', 'Presidential'
    );
    allow_aliases boolean := COALESCE(
        NULLIF(current_setting('app.ministry_event_template_allow_gov_type_aliases', true), ''),
        'on'
    ) IN ('on', 'true', '1');
    raw_value text;
    normalized_value text;
    normalized_values text[] := ARRAY[]::text[];
    invalid_values text[] := ARRAY[]::text[];
    valid_values_msg text;
BEGIN
    IF NEW.gov_types IS NULL THEN
        RETURN NEW;
    END IF;

    FOREACH raw_value IN ARRAY NEW.gov_types LOOP
        raw_value := btrim(raw_value);

        IF raw_value = '' THEN
            invalid_values := array_append(invalid_values, '<blank>');
            CONTINUE;
        END IF;

        normalized_value := NULL;

        IF raw_value = ANY (canonical_values) THEN
            normalized_value := raw_value;
        ELSIF allow_aliases AND alias_map ? lower(raw_value) THEN
            normalized_value := alias_map ->> lower(raw_value);
        END IF;

        IF normalized_value IS NULL THEN
            invalid_values := array_append(invalid_values, raw_value);
        ELSE
            normalized_values := array_append(normalized_values, normalized_value);
        END IF;
    END LOOP;

    IF array_length(invalid_values, 1) IS NOT NULL THEN
        valid_values_msg := array_to_string(canonical_values, ', ');
        IF allow_aliases THEN
            valid_values_msg := valid_values_msg || ' (aliases currently accepted: ' ||
                array_to_string(ARRAY(SELECT DISTINCT jsonb_object_keys(alias_map) ORDER BY 1), ', ') || ')';
        END IF;

        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = format(
                'Invalid ministry_event_templates.gov_types value(s): %s. Valid canonical values: %s.',
                array_to_string(ARRAY(SELECT DISTINCT v FROM unnest(invalid_values) AS v ORDER BY 1), ', '),
                valid_values_msg
            ),
            HINT = 'Use canonical values exactly as cased. Disable alias migration window after cleanup.';
    END IF;

    NEW.gov_types := normalized_values;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ministry_event_templates_validate_gov_types ON public.ministry_event_templates;

CREATE TRIGGER trg_ministry_event_templates_validate_gov_types
BEFORE INSERT OR UPDATE OF gov_types
ON public.ministry_event_templates
FOR EACH ROW
EXECUTE FUNCTION public.normalize_and_validate_ministry_event_template_gov_types();

-- One-time operator report: list templates containing unknown gov_types.
-- (Unknown = not canonical and not recognized alias.)
WITH canonical_values AS (
    SELECT unnest(ARRAY['Democracy', 'Autocracy', 'Presidential']::text[]) AS gov_type
), alias_values AS (
    SELECT unnest(ARRAY[
        'democracy', 'democratic', 'parliamentary', 'parliamentarian', 'parliamentary democracy',
        'autocracy', 'authoritarian', 'authoritarianism', 'dictatorship', 'dictatorial', 'military junta',
        'presidential', 'presidential republic', 'executive presidency'
    ]::text[]) AS gov_type
)
SELECT
    met.id,
    met.event_key,
    met.gov_types,
    ARRAY_AGG(DISTINCT btrim(gt.gov_type) ORDER BY btrim(gt.gov_type)) AS offending_gov_types
FROM ministry_event_templates met
CROSS JOIN LATERAL unnest(COALESCE(met.gov_types, ARRAY[]::text[])) AS gt(gov_type)
LEFT JOIN canonical_values cv
    ON gt.gov_type = cv.gov_type
LEFT JOIN alias_values av
    ON lower(btrim(gt.gov_type)) = av.gov_type
WHERE cv.gov_type IS NULL
  AND av.gov_type IS NULL
GROUP BY met.id, met.event_key, met.gov_types
ORDER BY met.event_key;

COMMIT;
