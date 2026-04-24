-- =====================================================================
-- Contourline · triLift Quiz (CBCD 2026) — Initial Schema
-- =====================================================================
-- Rode este arquivo inteiro no Supabase SQL Editor (uma única transação).
-- Criado em 2026-04-23. Prazo do evento: 30/abr a 03/mai/2026.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists citext;

-- =====================================================================
-- ENUMs
-- =====================================================================
do $$ begin
  create type medical_specialty as enum (
    'dermatologia',
    'cirurgia_plastica',
    'ginecologia',
    'medicina_estetica',
    'biomedicina_estetica',
    'odontologia',
    'fisioterapia_dermatofuncional',
    'outros'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type integration_target as enum ('rd_station', 'whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type integration_status as enum ('pending', 'success', 'failed', 'retrying');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABLES
-- =====================================================================

-- ---------- leads ----------
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null check (char_length(full_name) between 3 and 200),
  specialty         medical_specialty not null,
  specialty_other   text,
  crm               text not null check (char_length(crm) between 3 and 30),
  phone             text not null,
  email             citext not null,
  lgpd_consent      boolean not null default false,
  consent_version   text,
  source            text not null default 'cbcd_2026',
  device_hint       text,                           -- 'tablet_kiosk' | 'qr_mobile'
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  quiz_completed_at timestamptz,
  is_duplicate_of   uuid references public.leads(id),
  is_test           boolean not null default false
);

comment on table public.leads is
  'Lead capturado no stand CBCD 2026 (triLift). Anon pode INSERT, nunca SELECT.';

create index if not exists leads_email_idx      on public.leads (lower(email));
create index if not exists leads_crm_idx        on public.leads (crm);
create index if not exists leads_phone_idx      on public.leads (phone);
create index if not exists leads_created_idx    on public.leads (created_at desc);
create index if not exists leads_completed_idx  on public.leads (quiz_completed_at)
  where quiz_completed_at is not null;

-- ---------- quiz_questions ----------
create table if not exists public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  version         text not null default 'cbcd_2026_v1',
  question_number smallint not null check (question_number between 1 and 10),
  prompt          text not null,
  options         jsonb not null,         -- [{"key":"A","text":"..."}, ...]
  correct_key     char(1) not null check (correct_key in ('A','B','C','D','E')),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (version, question_number)
);

comment on table public.quiz_questions is
  'Perguntas versionadas. Nunca editar uma versao em uso — criar versao nova.';

-- ---------- quiz_sessions ----------
create table if not exists public.quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  quiz_version  text not null default 'cbcd_2026_v1',
  status        text not null default 'completed'
                check (status in ('started','completed','abandoned')),
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  device_hint   text,
  ip_address    inet,
  user_agent    text
);

create index if not exists quiz_sessions_lead_idx on public.quiz_sessions (lead_id);

-- ---------- quiz_answers ----------
create table if not exists public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.quiz_sessions(id) on delete cascade,
  lead_id         uuid not null references public.leads(id) on delete cascade,
  question_id     uuid not null references public.quiz_questions(id),
  question_number smallint not null,
  answer_selected char(1) not null check (answer_selected in ('A','B','C','D','E')),
  is_correct      boolean not null,
  answered_at     timestamptz not null default now(),
  unique (session_id, question_number)
);

create index if not exists quiz_answers_lead_idx on public.quiz_answers (lead_id);

-- ---------- lgpd_consents ----------
create table if not exists public.lgpd_consents (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null references public.leads(id) on delete cascade,
  granted           boolean not null,
  consent_version   text not null,
  consent_text_hash text,
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz not null default now()
);

create index if not exists lgpd_consents_lead_idx
  on public.lgpd_consents (lead_id, created_at desc);

-- ---------- raffle_draws ----------
create table if not exists public.raffle_draws (
  id                    uuid primary key default gen_random_uuid(),
  raffle_name           text not null default 'CBCD_2026_trilift',
  drawn_by              uuid references auth.users(id),
  drawn_at              timestamptz not null default now(),
  seed                  text not null,              -- ex: "n. Loteria Federal #06543"
  seed_kind             text not null default 'public-external',
  total_eligible        integer not null,
  winner_lead_id        uuid not null references public.leads(id),
  eligibility_snapshot  jsonb not null,             -- array ordenado dos lead_ids
  eligibility_hash      text not null,              -- sha256 do snapshot p/ prova
  notes                 text
);

-- ---------- integration_logs ----------
create table if not exists public.integration_logs (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references public.leads(id) on delete set null,
  target           integration_target not null,
  status           integration_status not null default 'pending',
  attempts         smallint not null default 0,
  request_payload  jsonb,
  response_payload jsonb,
  error_message    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists integration_logs_status_idx
  on public.integration_logs (status, target);

-- ---------- admin_users ----------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'operator' check (role in ('operator','admin')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists trg_integ_updated on public.integration_logs;
create trigger trg_integ_updated before update on public.integration_logs
  for each row execute function public.set_updated_at();

-- log automático de mudança de consent em leads
create or replace function public.log_consent_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT')
     or (new.lgpd_consent is distinct from old.lgpd_consent) then
    insert into public.lgpd_consents
      (lead_id, granted, consent_version, ip_address, user_agent)
    values
      (new.id, new.lgpd_consent, coalesce(new.consent_version, 'unversioned'),
       new.ip_address, new.user_agent);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_consent on public.leads;
create trigger trg_leads_consent
  after insert or update of lgpd_consent on public.leads
  for each row execute function public.log_consent_change();

-- dedupe soft: ao inserir, flagar se for duplicata
create or replace function public.detect_duplicate_lead()
returns trigger language plpgsql as $$
declare v_master uuid;
begin
  select id into v_master
  from public.leads
  where id <> new.id
    and is_duplicate_of is null
    and is_test = new.is_test
    and (
      lower(email) = lower(new.email)
      or (crm is not null and crm = new.crm and length(crm) > 5)
      or regexp_replace(coalesce(phone,''), '\D', '', 'g')
         = regexp_replace(coalesce(new.phone,''), '\D', '', 'g')
    )
  order by created_at asc
  limit 1;

  if v_master is not null then
    new.is_duplicate_of := v_master;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_dedupe on public.leads;
create trigger trg_leads_dedupe before insert on public.leads
  for each row execute function public.detect_duplicate_lead();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.leads            enable row level security;
alter table public.quiz_sessions    enable row level security;
alter table public.quiz_answers     enable row level security;
alter table public.quiz_questions   enable row level security;
alter table public.lgpd_consents    enable row level security;
alter table public.raffle_draws     enable row level security;
alter table public.integration_logs enable row level security;
alter table public.admin_users      enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------- policies ----------
-- Observação: o fluxo do quiz grava via Route Handler usando service_role,
-- portanto a maioria dos INSERTs NÃO precisa de policy de anon.
-- Mantemos policies de anon apenas onde quisermos permitir escrita direta
-- (aqui: nenhuma — todas as escritas passam pelo backend).

drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists questions_anon_read on public.quiz_questions;
create policy questions_anon_read on public.quiz_questions
  for select to anon using (is_active = true);

drop policy if exists questions_auth_read on public.quiz_questions;
create policy questions_auth_read on public.quiz_questions
  for select to authenticated using (is_active = true);

drop policy if exists questions_admin_all on public.quiz_questions;
create policy questions_admin_all on public.quiz_questions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sessions_admin_all on public.quiz_sessions;
create policy sessions_admin_all on public.quiz_sessions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists answers_admin_all on public.quiz_answers;
create policy answers_admin_all on public.quiz_answers
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists consents_admin_read on public.lgpd_consents;
create policy consents_admin_read on public.lgpd_consents
  for select to authenticated using (public.is_admin());

drop policy if exists raffle_admin_all on public.raffle_draws;
create policy raffle_admin_all on public.raffle_draws
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists integ_admin_read on public.integration_logs;
create policy integ_admin_read on public.integration_logs
  for select to authenticated using (public.is_admin());

drop policy if exists admins_self_read on public.admin_users;
create policy admins_self_read on public.admin_users
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- =====================================================================
-- FUNCTIONS — SORTEIO AUDITÁVEL
-- =====================================================================

create or replace function public.execute_raffle(
  p_seed        text,
  p_raffle_name text default 'CBCD_2026_trilift',
  p_notes       text default null
)
returns public.raffle_draws
language plpgsql security definer as $$
declare
  v_eligible       uuid[];
  v_hash           text;
  v_winner_idx     int;
  v_winner         uuid;
  v_row            public.raffle_draws;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admins may draw';
  end if;

  if p_seed is null or char_length(p_seed) < 3 then
    raise exception 'seed must be provided and public (ex: n. da Loteria Federal)';
  end if;

  -- Elegíveis: completou, consent, não duplicata, não teste
  select array_agg(id order by id) into v_eligible
  from public.leads
  where quiz_completed_at is not null
    and lgpd_consent = true
    and is_duplicate_of is null
    and is_test = false;

  if v_eligible is null or array_length(v_eligible, 1) = 0 then
    raise exception 'no eligible leads for raffle';
  end if;

  -- Hash determinístico: sha256(seed + join(eligible_ids))
  v_hash := encode(
    digest(p_seed || '|' || array_to_string(v_eligible, ','), 'sha256'),
    'hex'
  );

  -- Primeiros 16 hex → bigint → módulo N
  v_winner_idx := (('x' || substr(v_hash, 1, 15))::bit(60)::bigint
                   % array_length(v_eligible, 1))::int;
  v_winner := v_eligible[v_winner_idx + 1];

  insert into public.raffle_draws
    (raffle_name, drawn_by, seed, seed_kind, total_eligible,
     winner_lead_id, eligibility_snapshot, eligibility_hash, notes)
  values
    (p_raffle_name, auth.uid(), p_seed, 'public-external',
     array_length(v_eligible, 1), v_winner, to_jsonb(v_eligible), v_hash, p_notes)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.execute_raffle(text, text, text) from public;
grant execute on function public.execute_raffle(text, text, text) to authenticated;

-- =====================================================================
-- VIEWS — DASHBOARD ADMIN
-- =====================================================================

create or replace view public.v_dashboard_kpis as
with base as (
  select * from public.leads where is_test = false and is_duplicate_of is null
)
select
  (select count(*) from base)                                                  as total_leads,
  (select count(*) from base where created_at > now() - interval '1 hour')     as leads_last_hour,
  (select count(*) from base where quiz_completed_at is not null)              as leads_completed,
  (select count(*) from base where lgpd_consent)                               as consented_total,
  round(100.0 * (select count(*) from base where quiz_completed_at is not null)
        / nullif((select count(*) from base), 0), 1)                           as completion_pct;

create or replace view public.v_accuracy_per_question as
select
  qa.question_number,
  count(*) filter (where qa.is_correct) * 100.0 / nullif(count(*), 0) as accuracy_pct,
  count(*) as total_answers
from public.quiz_answers qa
join public.leads l on l.id = qa.lead_id
where l.is_test = false and l.is_duplicate_of is null
group by qa.question_number
order by qa.question_number;

create or replace view public.v_leads_by_specialty as
select specialty::text as specialty, count(*) as total
from public.leads
where is_duplicate_of is null and is_test = false
group by specialty
order by total desc;

-- Export CSV fallback (para importar manual em RD Station se a integração falhar)
create or replace view public.v_rd_export as
select
  full_name    as nome,
  email,
  phone        as telefone,
  crm,
  specialty::text as especialidade,
  created_at   as cadastrado_em,
  quiz_completed_at as concluiu_quiz_em,
  source       as origem
from public.leads
where lgpd_consent = true
  and is_duplicate_of is null
  and is_test = false;

-- =====================================================================
-- ANONIMIZAÇÃO LGPD
-- =====================================================================

create or replace function public.anonymize_lead(p_lead uuid)
returns void language plpgsql security definer as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.leads set
    full_name       = 'ANONIMIZADO',
    email           = concat('anon+', id, '@invalid.local')::citext,
    phone           = '+000000000000',
    crm             = 'ANON',
    specialty_other = null,
    ip_address      = null,
    user_agent      = null,
    updated_at      = now()
  where id = p_lead;

  update public.lgpd_consents
    set ip_address = null, user_agent = null where lead_id = p_lead;
  update public.quiz_sessions
    set ip_address = null, user_agent = null where lead_id = p_lead;
end;
$$;

revoke all on function public.anonymize_lead(uuid) from public;
grant execute on function public.anonymize_lead(uuid) to authenticated;

-- =====================================================================
-- SEED — perguntas oficiais triLift CBCD 2026
-- =====================================================================

insert into public.quiz_questions (version, question_number, prompt, options, correct_key)
values
(
  'cbcd_2026_v1', 1,
  'O que torna o triLift® uma tecnologia única no mercado?',
  '[
    {"key":"A","text":"Atua apenas na pele com radiofrequência"},
    {"key":"B","text":"Atua em músculo, pele e volume em um único protocolo"},
    {"key":"C","text":"É um laser ablativo para resurfacing"},
    {"key":"D","text":"Substitui completamente preenchimentos faciais"}
  ]'::jsonb,
  'B'
),
(
  'cbcd_2026_v1', 2,
  'Qual tecnologia do triLift é responsável pela estimulação muscular facial?',
  '[
    {"key":"A","text":"Laser fracionado"},
    {"key":"B","text":"Ultrassom microfocado"},
    {"key":"C","text":"DMSt (Dynamic Muscle Stimulation)"},
    {"key":"D","text":"Criolipólise"}
  ]'::jsonb,
  'C'
),
(
  'cbcd_2026_v1', 3,
  'Qual é o principal efeito do tratamento com triLift ao longo das sessões?',
  '[
    {"key":"A","text":"Apenas melhora superficial da textura da pele"},
    {"key":"B","text":"Redução de gordura localizada no corpo"},
    {"key":"C","text":"Lifting natural com melhora de tônus muscular e qualidade da pele"},
    {"key":"D","text":"Paralisia muscular temporária"}
  ]'::jsonb,
  'C'
)
on conflict (version, question_number) do nothing;

-- =====================================================================
-- FIM
-- =====================================================================
