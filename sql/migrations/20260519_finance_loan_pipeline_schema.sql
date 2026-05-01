-- ══════════════════════════════════════════════════════════════
-- Finance Operations Phase C1: loan-request pipeline (schema only)
--
-- Two new tables. RPCs (submit / approve / decline) and per-tick
-- processing land in C2 and C4 respectively.
--
-- Pipeline shape:
--   1. A corp or government INSERTs a finance_loan_requests row
--      with target_bank_ids[] = UUIDs of banks they want to ask.
--   2. Each targeted bank sees the request on its Operations page
--      ("Available Offers" section) and can approve or decline.
--   3. First approval wins: the row's status flips to 'approved',
--      winning_bank_id is set, and a finance_loans row is created.
--   4. Other targeted banks lose the race; their UIs see the row
--      vanish from Available Offers on next refresh.
--   5. Unapproved requests expire at expires_at_tick and the row's
--      status flips to 'expired'.
--
-- Design notes:
-- ── target_bank_ids is UUID[] not a join table because a request
--    has at most a handful of targets and we always read the whole
--    list at once. A join table would be more storage-correct but
--    would force every read to do an IN-list query — not worth the
--    complexity at this scale.
-- ── status uses a CHECK constraint rather than an enum so future
--    states can be added with an ALTER without a type rewrite.
-- ── finance_loans does NOT carry duplicated loan-request fields;
--    it links back via request_id and reads them when needed. One
--    source of truth.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS finance_loan_requests (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who's asking. Faction id; can be a corp or a party (the latter
    -- represents a government taking on sovereign debt via the ruling
    -- party). Nation derived from the faction row if needed.
    requesting_faction_id UUID       NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    requesting_nation_id  UUID       NOT NULL REFERENCES nations(id),

    -- Banks the request is sent to. Empty array = nobody can approve;
    -- not enforced at the DB level (RPC validates non-empty).
    target_bank_ids     UUID[]       NOT NULL DEFAULT '{}',

    -- Terms.
    principal           BIGINT       NOT NULL CHECK (principal > 0),
    term_ticks          INT          NOT NULL CHECK (term_ticks > 0),
    requested_apr       NUMERIC(6,3) NOT NULL CHECK (requested_apr >= 0 AND requested_apr <= 100),
    risk_grade          TEXT         NOT NULL DEFAULT 'B'
                            CHECK (risk_grade IN ('AAA','AA','A','BBB','BB','B','CCC','CC','C','D')),
    purpose             TEXT,

    -- Lifecycle.
    status              TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','declined','expired','cancelled')),
    expires_at_tick     INT          NOT NULL,
    winning_bank_id     UUID         REFERENCES factions(id) ON DELETE SET NULL,

    -- Per-bank decline tracking — when every targeted bank declines
    -- the request flips to 'declined' even before expiry. NULL until
    -- at least one decline.
    declined_by_bank_ids UUID[]      NOT NULL DEFAULT '{}',

    -- Audit.
    created_at_tick     INT          NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick    INT,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flr_requesting_faction ON finance_loan_requests (requesting_faction_id);
CREATE INDEX IF NOT EXISTS idx_flr_status            ON finance_loan_requests (status);
CREATE INDEX IF NOT EXISTS idx_flr_expires           ON finance_loan_requests (expires_at_tick);
-- GIN index lets the Operations page query "WHERE bank_id = ANY(target_bank_ids)"
-- in O(log n) instead of a full scan.
CREATE INDEX IF NOT EXISTS idx_flr_target_banks_gin  ON finance_loan_requests USING GIN (target_bank_ids);

COMMENT ON TABLE finance_loan_requests IS
    'Loan requests opened by corps or governments, targeting one or more banks. First-approval-wins resolution; expires at expires_at_tick if unresolved.';

-- ── Active loan agreements ──
-- Created when a bank approves a request. Tracks outstanding
-- principal, missed payments, and status until paid off / defaulted.
CREATE TABLE IF NOT EXISTS finance_loans (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source request (one finance_loans row per approved request).
    request_id          UUID         NOT NULL UNIQUE REFERENCES finance_loan_requests(id),

    -- Lender + borrower (denormalized for fast queries; immutable
    -- once written so they can't drift from the request).
    lender_faction_id   UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    borrower_faction_id UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    nation_id           UUID         NOT NULL REFERENCES nations(id),

    -- Terms snapshot (copied from the request at approval time).
    principal           BIGINT       NOT NULL CHECK (principal > 0),
    apr                 NUMERIC(6,3) NOT NULL CHECK (apr >= 0 AND apr <= 100),
    term_ticks          INT          NOT NULL CHECK (term_ticks > 0),

    -- Live state.
    outstanding         BIGINT       NOT NULL CHECK (outstanding >= 0),
    payments_missed     INT          NOT NULL DEFAULT 0 CHECK (payments_missed >= 0),
    status              TEXT         NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','paid','defaulted','foreclosed','called')),

    -- Schedule.
    issued_at_tick      INT          NOT NULL,
    matures_at_tick     INT          NOT NULL,
    last_payment_tick   INT,
    closed_at_tick      INT,

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_floans_lender   ON finance_loans (lender_faction_id);
CREATE INDEX IF NOT EXISTS idx_floans_borrower ON finance_loans (borrower_faction_id);
CREATE INDEX IF NOT EXISTS idx_floans_status   ON finance_loans (status);

COMMENT ON TABLE finance_loans IS
    'Active loan agreements created on approval of a finance_loan_request. Tracks outstanding principal, missed payments, status. One row per approved request (UNIQUE on request_id).';

-- ── RLS ──
-- Reads are wide-open (any authenticated user can see the loan
-- market — same model as the construction contracts table). Writes
-- are SECURITY DEFINER RPC only; no direct INSERT/UPDATE/DELETE
-- policies, so service_role + RPC are the only writers.
ALTER TABLE finance_loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_loans         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_loan_requests_read_all" ON finance_loan_requests;
CREATE POLICY "finance_loan_requests_read_all"
    ON finance_loan_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "finance_loans_read_all" ON finance_loans;
CREATE POLICY "finance_loans_read_all"
    ON finance_loans FOR SELECT TO authenticated USING (true);
