-- One-shot recovery: execute one-time `transfer` articles that silently
-- skipped at ratification because resolveTransferEndpoints checked
-- `article.type` while the diplomacy modal saves `article_type`.
--
-- Affected agreements: every active goods_trade (or any other type) that
-- contains a transfer article authored via the structured wizard. The
-- code fix in this same commit makes the resolver accept either field
-- going forward; this script clears the existing backlog.
--
-- Idempotent — guarded by data.executed_at_tick. Safe to re-run.

DO $$
DECLARE
    cur_tick    INT;
    agreement   RECORD;
    art         JSONB;
    art_idx     INT;
    art_type    TEXT;
    art_data    JSONB;
    transfer_kind TEXT;
    amount      NUMERIC;
    direction   TEXT;
    author_id   UUID;
    counterparty UUID;
    from_nation UUID;
    to_nation   UUID;
    from_reserves NUMERIC;
    to_reserves NUMERIC;
    actual_debit NUMERIC;
    new_articles JSONB;
    rows_changed INT := 0;
BEGIN
    SELECT current_tick INTO cur_tick FROM shard WHERE name = 'Alpha Shard';

    FOR agreement IN
        SELECT id, nation_a_id, nation_b_id, articles
        FROM trade_agreements
        WHERE status = 'active'
          AND articles IS NOT NULL
    LOOP
        new_articles := agreement.articles;
        art_idx := 0;

        FOR art IN SELECT value FROM jsonb_array_elements(agreement.articles) LOOP
            art_type := COALESCE(art->>'type', art->>'article_type');
            art_data := art->'data';

            -- Only one-time transfers. Recurring fires every tick via the
            -- step 3.5f loop and shouldn't be retro-fired in lump sum.
            IF art_type IS DISTINCT FROM 'transfer' THEN
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            transfer_kind := COALESCE(art_data->>'transfer_type', 'one_time');
            IF transfer_kind = 'recurring' THEN
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            -- Already executed: skip.
            IF (art_data->>'executed_at_tick') IS NOT NULL THEN
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            amount := COALESCE((art_data->>'amount')::NUMERIC, 0);
            IF amount <= 0 THEN
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            author_id := NULLIF(art->>'author_nation_id', '')::UUID;
            IF author_id IS NULL
               OR (author_id <> agreement.nation_a_id AND author_id <> agreement.nation_b_id) THEN
                RAISE NOTICE 'Skipping malformed transfer (bad author) on agreement %', agreement.id;
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            counterparty := CASE WHEN author_id = agreement.nation_a_id
                                 THEN agreement.nation_b_id
                                 ELSE agreement.nation_a_id END;
            direction := COALESCE(art_data->>'direction', 'a_to_b');
            IF direction = 'a_to_b' THEN
                from_nation := author_id;
                to_nation   := counterparty;
            ELSE
                from_nation := counterparty;
                to_nation   := author_id;
            END IF;

            -- Read both reserves under a row-level lock to avoid concurrent drift.
            SELECT budget_reserves INTO from_reserves
              FROM nations WHERE id = from_nation FOR UPDATE;
            SELECT budget_reserves INTO to_reserves
              FROM nations WHERE id = to_nation FOR UPDATE;
            IF from_reserves IS NULL OR to_reserves IS NULL THEN
                RAISE NOTICE 'Skipping transfer on agreement %: reserves read failed', agreement.id;
                art_idx := art_idx + 1; CONTINUE;
            END IF;

            actual_debit := LEAST(amount, GREATEST(0, from_reserves));
            UPDATE nations SET budget_reserves = GREATEST(0, from_reserves - amount)
             WHERE id = from_nation;
            UPDATE nations SET budget_reserves = to_reserves + actual_debit
             WHERE id = to_nation;

            -- Mark the article executed so a re-run is a no-op.
            new_articles := jsonb_set(
                new_articles,
                ARRAY[art_idx::TEXT, 'data'],
                COALESCE(new_articles->art_idx->'data', '{}'::jsonb)
                    || jsonb_build_object(
                        'executed_at_tick', cur_tick,
                        'executed_amount',  actual_debit
                    )
            );

            rows_changed := rows_changed + 1;
            RAISE NOTICE 'Executed % transfer: % -> %, $% (agreement %)',
                'one-time', from_nation, to_nation, actual_debit, agreement.id;

            art_idx := art_idx + 1;
        END LOOP;

        IF new_articles IS DISTINCT FROM agreement.articles THEN
            UPDATE trade_agreements
               SET articles = new_articles
             WHERE id = agreement.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Total transfers executed: %', rows_changed;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY — Dravka should show the $5B credit on its budget_reserves
-- ═══════════════════════════════════════════════════════════════════════
SELECT
    n.name,
    n.budget_reserves
FROM nations n
WHERE n.name IN ('Dravka', 'Vostia', 'Hajjara')
ORDER BY n.name;
