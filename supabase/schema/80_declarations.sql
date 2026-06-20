-- ===========================================================================
-- Declarations — admin-defined "name slots" a nation can set (Head of State
-- Title, Capital Name, National Emblem, …). Purely cosmetic: a declaration
-- changes a name/title/emblem and has NO mechanical effect in game. This file is
-- the admin-side definition (which slots exist + their selectable options). The
-- player propose flow and per-nation chosen values land in later stages.
--
-- Options are a simple ordered jsonb array of strings with one default index —
-- no per-option server logic, so a child table would be overkill here.
-- ===========================================================================

create table if not exists public.declarations (
  id             uuid primary key default gen_random_uuid(),
  grp            text not null default 'Custom',   -- the register grouping ("Titles & offices", …)
  label          text not null,                    -- the slot name ("Head of State Title")
  slug           text not null,                    -- stable key derived from the label (for per-nation values later)
  options        jsonb not null default '[]'::jsonb, -- ordered array of selectable names
  default_index  int  not null default 0,          -- which option a nation starts with
  custom_allowed boolean not null default false,   -- may a player type their own instead of picking?
  sort_order     int  not null default 0,          -- register order
  created_at     timestamptz not null default now()
);
create index if not exists declarations_sort_idx on public.declarations (sort_order, created_at);

-- RLS: world-readable (players read the slots to propose against); admin writes.
alter table public.declarations enable row level security;
drop policy if exists "decl_select_all"   on public.declarations;
create policy "decl_select_all"   on public.declarations for select using (true);
drop policy if exists "decl_insert_admin" on public.declarations;
create policy "decl_insert_admin" on public.declarations for insert with check (public.is_admin());
drop policy if exists "decl_update_admin" on public.declarations;
create policy "decl_update_admin" on public.declarations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "decl_delete_admin" on public.declarations;
create policy "decl_delete_admin" on public.declarations for delete using (public.is_admin());

-- Seed the default slots once (only when the table is empty, so re-applying this
-- file never duplicates them and never clobbers admin edits).
insert into public.declarations (grp, label, slug, options, default_index, custom_allowed, sort_order)
select v.grp, v.label, v.slug, v.options::jsonb, v.default_index, v.custom_allowed, v.sort_order
from (values
  ('Titles & offices',   'Head of State Title',      'head_of_state_title',      '["President","Chairman","Supreme Leader","King","Emperor"]',                 0, false, 1),
  ('Titles & offices',   'Head of Government Title',  'head_of_government_title',  '["Prime Minister","Chancellor","Premier","First Minister"]',                 0, false, 2),
  ('Titles & offices',   'Legislature Name',          'legislature_name',          '["National Assembly","Parliament","Congress","Senate","Supreme Soviet"]',    0, false, 3),
  ('Titles & offices',   'State Form',                'state_form',                '["Republic","Federation","Union","Empire","Kingdom","People''s Republic"]',   0, false, 4),
  ('Titles & offices',   'Armed Forces Name',         'armed_forces_name',         '["National Army","Grand Army","People''s Defence Forces","Royal Army"]',      0, false, 5),
  ('Names & places',     'Formal State Name',         'formal_state_name',         '["The Republic of Sessau"]',                                                 0, true,  6),
  ('Names & places',     'Capital Name',              'capital_name',              '["Seyonne"]',                                                                0, true,  7),
  ('Names & places',     'Currency Name',             'currency_name',             '["Franc","Credit","Crown","People''s Note"]',                                0, true,  8),
  ('Symbols & identity', 'National Motto',            'national_motto',            '["Liberty, Order, Prosperity"]',                                             0, true,  9),
  ('Symbols & identity', 'National Emblem',           'national_emblem',           '["Wreath","Eagle","Star","Lion","Sheaf of Wheat"]',                          0, false, 10),
  ('Symbols & identity', 'National Day',              'national_day',              '["14 July"]',                                                                0, true,  11),
  ('Culture & creed',    'State Religion',            'state_religion',            '["Secular state","Established faith","State atheism"]',                       0, false, 12),
  ('Culture & creed',    'Official Language',         'official_language',         '["Sessauan"]',                                                               0, true,  13),
  ('Culture & creed',    'Calendar System',           'calendar_system',           '["Standard calendar","Revolutionary calendar","Religious calendar"]',        0, false, 14)
) as v(grp, label, slug, options, default_index, custom_allowed, sort_order)
where not exists (select 1 from public.declarations);

notify pgrst, 'reload schema';
