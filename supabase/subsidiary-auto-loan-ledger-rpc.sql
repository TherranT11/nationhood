-- Transactional issuance flow for subsidiary auto insurance/loans.
-- Adds immutable origination ledger + backfill repair utility.

create table if not exists public.subsidiary_auto_loan_ledger (
    id uuid primary key default gen_random_uuid(),
    policy_id uuid not null references public.subsidiary_auto_policies(id) on delete restrict,
    rate_id uuid not null references public.subsidiary_auto_rates(id) on delete restrict,
    event_type text not null check (event_type in ('origination', 'origination_repair')),
    service_type text not null check (service_type = 'loan'),
    principal bigint not null check (principal > 0),
    borrower_faction_id uuid not null references public.factions(id) on delete restrict,
    lender_faction_id uuid not null references public.factions(id) on delete restrict,
    subsidiary_id uuid not null references public.corp_properties(id) on delete restrict,
    lender_funding_model text not null,
    source_debited text not null check (source_debited in ('corp_properties.sub_cash', 'factions.corp_cash_reserves')),
    started_tick integer not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    metadata jsonb not null default '{}'::jsonb,
    unique(policy_id, event_type)
);

create or replace function public.prevent_subsidiary_auto_loan_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'subsidiary_auto_loan_ledger is immutable';
end;
$$;

drop trigger if exists trg_subsidiary_auto_loan_ledger_no_update on public.subsidiary_auto_loan_ledger;
create trigger trg_subsidiary_auto_loan_ledger_no_update
before update on public.subsidiary_auto_loan_ledger
for each row execute function public.prevent_subsidiary_auto_loan_ledger_mutation();

drop trigger if exists trg_subsidiary_auto_loan_ledger_no_delete on public.subsidiary_auto_loan_ledger;
create trigger trg_subsidiary_auto_loan_ledger_no_delete
before delete on public.subsidiary_auto_loan_ledger
for each row execute function public.prevent_subsidiary_auto_loan_ledger_mutation();

create or replace function public.accept_subsidiary_auto_policy_txn(
    p_rate_id uuid,
    p_borrower_faction_id uuid,
    p_principal bigint,
    p_term_months integer,
    p_monthly_payment bigint,
    p_started_tick integer,
    p_expires_tick integer
)
returns public.subsidiary_auto_policies
language plpgsql
security definer
set search_path = public
as $$
declare
    v_rate public.subsidiary_auto_rates%rowtype;
    v_lender_sub public.corp_properties%rowtype;
    v_lender_faction public.factions%rowtype;
    v_borrower public.factions%rowtype;
    v_policy public.subsidiary_auto_policies%rowtype;
    v_model text;
    v_source_debited text;
    v_source_amount numeric;
begin
    if p_principal is null or p_principal <= 0 then
        raise exception 'principal must be > 0';
    end if;
    if p_term_months is null or p_term_months <= 0 then
        raise exception 'term must be > 0';
    end if;
    if p_monthly_payment is null or p_monthly_payment <= 0 then
        raise exception 'monthly payment must be > 0';
    end if;

    select * into v_rate
    from public.subsidiary_auto_rates
    where id = p_rate_id
      and is_active = true
    for update;

    if not found then
        raise exception 'rate not found or inactive';
    end if;

    if p_principal > coalesce(v_rate.coverage_limit, 0) then
        raise exception 'principal exceeds rate coverage limit';
    end if;

    if p_term_months < coalesce(v_rate.min_term_months, 1)
       or p_term_months > coalesce(v_rate.max_term_months, 600) then
        raise exception 'term out of bounds for selected rate';
    end if;

    select * into v_lender_sub
    from public.corp_properties
    where id = v_rate.subsidiary_id
      and is_active = true
    for update;

    if not found then
        raise exception 'lender subsidiary not found or inactive';
    end if;

    select * into v_lender_faction
    from public.factions
    where id = v_lender_sub.faction_id
    for update;

    if not found then
        raise exception 'lender faction not found';
    end if;

    select * into v_borrower
    from public.factions
    where id = p_borrower_faction_id
    for update;

    if not found then
        raise exception 'borrower faction not found';
    end if;

    v_model := coalesce(to_jsonb(v_rate)->>'loan_funding_model', to_jsonb(v_rate)->>'funding_model', 'subsidiary_cash');

    insert into public.subsidiary_auto_policies (
        rate_id,
        service_type,
        borrower_faction_id,
        lender_faction_id,
        subsidiary_id,
        principal,
        interest_rate,
        monthly_payment,
        remaining_principal,
        term_months,
        payments_made,
        total_paid,
        total_interest_paid,
        deductible_pct,
        status,
        started_tick,
        expires_tick,
        last_paid_tick,
        payments_missed
    ) values (
        v_rate.id,
        v_rate.service_type,
        p_borrower_faction_id,
        v_lender_faction.id,
        v_lender_sub.id,
        p_principal,
        coalesce(v_rate.effective_rate, 0),
        p_monthly_payment,
        case when v_rate.service_type = 'loan' then p_principal else 0 end,
        p_term_months,
        0,
        0,
        0,
        coalesce(v_rate.deductible_pct, 0),
        'active',
        p_started_tick,
        p_expires_tick,
        null,
        0
    ) returning * into v_policy;

    if v_rate.service_type = 'loan' then
        update public.factions
        set corp_cash_reserves = coalesce(corp_cash_reserves, 0) + p_principal
        where id = v_borrower.id;

        if v_model in ('parent_corp', 'parent_corp_funded', 'parent_funded', 'faction_cash') then
            v_source_amount := coalesce(v_lender_faction.corp_cash_reserves, 0);
            if v_source_amount < p_principal then
                raise exception 'insufficient lender faction cash for loan origination';
            end if;

            update public.factions
            set corp_cash_reserves = v_source_amount - p_principal
            where id = v_lender_faction.id;

            v_source_debited := 'factions.corp_cash_reserves';
        else
            v_source_amount := coalesce(v_lender_sub.sub_cash, 0);
            if v_source_amount < p_principal then
                raise exception 'insufficient subsidiary cash for loan origination';
            end if;

            update public.corp_properties
            set sub_cash = v_source_amount - p_principal
            where id = v_lender_sub.id;

            v_source_debited := 'corp_properties.sub_cash';
        end if;

        insert into public.subsidiary_auto_loan_ledger (
            policy_id,
            rate_id,
            event_type,
            service_type,
            principal,
            borrower_faction_id,
            lender_faction_id,
            subsidiary_id,
            lender_funding_model,
            source_debited,
            started_tick,
            metadata
        ) values (
            v_policy.id,
            v_rate.id,
            'origination',
            'loan',
            p_principal,
            p_borrower_faction_id,
            v_lender_faction.id,
            v_lender_sub.id,
            v_model,
            v_source_debited,
            p_started_tick,
            jsonb_build_object('rpc', 'accept_subsidiary_auto_policy_txn')
        );
    end if;

    update public.subsidiary_auto_rates
    set policies_issued = coalesce(policies_issued, 0) + 1
    where id = v_rate.id;

    return v_policy;
end;
$$;


create or replace function public.accept_subsidiary_auto_policy(
    p_rate_id uuid,
    p_borrower_faction_id uuid,
    p_principal bigint,
    p_term_months integer,
    p_monthly_payment bigint,
    p_started_tick integer,
    p_expires_tick integer
)
returns public.subsidiary_auto_policies
language sql
security definer
set search_path = public
as $$
    select public.accept_subsidiary_auto_policy_txn(
        p_rate_id,
        p_borrower_faction_id,
        p_principal,
        p_term_months,
        p_monthly_payment,
        p_started_tick,
        p_expires_tick
    );
$$;

create or replace function public.backfill_subsidiary_loan_originations(
    p_dry_run boolean default true,
    p_started_tick_min integer default null,
    p_started_tick_max integer default null
)
returns table (
    policy_id uuid,
    action text,
    principal bigint,
    reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    r record;
    v_model text;
    v_source_debited text;
    v_source_balance numeric;
begin
    for r in
        select p.id as policy_id,
               p.principal,
               p.started_tick,
               p.borrower_faction_id,
               p.lender_faction_id,
               p.subsidiary_id,
               p.rate_id,
               coalesce(to_jsonb(ar)->>'loan_funding_model', to_jsonb(ar)->>'funding_model', 'subsidiary_cash') as model,
               coalesce(cp.sub_cash, 0) as sub_cash,
               coalesce(lf.corp_cash_reserves, 0) as lender_cash
        from public.subsidiary_auto_policies p
        join public.subsidiary_auto_rates ar on ar.id = p.rate_id
        join public.corp_properties cp on cp.id = p.subsidiary_id
        join public.factions lf on lf.id = p.lender_faction_id
        where p.service_type = 'loan'
          and p.status = 'active'
          and (p_started_tick_min is null or p.started_tick >= p_started_tick_min)
          and (p_started_tick_max is null or p.started_tick <= p_started_tick_max)
          and not exists (
              select 1
              from public.subsidiary_auto_loan_ledger l
              where l.policy_id = p.id
                and l.event_type in ('origination', 'origination_repair')
          )
        order by p.started_tick asc, p.id
    loop
        v_model := r.model;

        if v_model in ('parent_corp', 'parent_corp_funded', 'parent_funded', 'faction_cash') then
            v_source_debited := 'factions.corp_cash_reserves';
            v_source_balance := r.lender_cash;
        else
            v_source_debited := 'corp_properties.sub_cash';
            v_source_balance := r.sub_cash;
        end if;

        if v_source_balance < r.principal then
            policy_id := r.policy_id;
            action := 'skipped';
            principal := r.principal;
            reason := 'insufficient source funds for safe repair';
            return next;
            continue;
        end if;

        policy_id := r.policy_id;
        principal := r.principal;

        if p_dry_run then
            action := 'would_repair';
            reason := 'eligible (missing origination ledger + sufficient source funds)';
            return next;
            continue;
        end if;

        update public.factions
        set corp_cash_reserves = coalesce(corp_cash_reserves, 0) + r.principal
        where id = r.borrower_faction_id;

        if v_source_debited = 'factions.corp_cash_reserves' then
            update public.factions
            set corp_cash_reserves = coalesce(corp_cash_reserves, 0) - r.principal
            where id = r.lender_faction_id;
        else
            update public.corp_properties
            set sub_cash = coalesce(sub_cash, 0) - r.principal
            where id = r.subsidiary_id;
        end if;

        insert into public.subsidiary_auto_loan_ledger (
            policy_id,
            rate_id,
            event_type,
            service_type,
            principal,
            borrower_faction_id,
            lender_faction_id,
            subsidiary_id,
            lender_funding_model,
            source_debited,
            started_tick,
            metadata
        ) values (
            r.policy_id,
            r.rate_id,
            'origination_repair',
            'loan',
            r.principal,
            r.borrower_faction_id,
            r.lender_faction_id,
            r.subsidiary_id,
            v_model,
            v_source_debited,
            r.started_tick,
            jsonb_build_object('backfilled_at', timezone('utc'::text, now()))
        );

        action := 'repaired';
        reason := 'balances transferred and immutable ledger row recorded';
        return next;
    end loop;

    return;
end;
$$;
