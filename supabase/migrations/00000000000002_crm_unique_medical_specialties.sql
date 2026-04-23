-- =====================================================================
-- Migration 002 — CRM único + especialidades exclusivamente médicas
-- =====================================================================
-- Execute TUDO de uma vez no Supabase SQL Editor.
-- Criado 2026-04-23 — cliente solicitou hard-block em CRM duplicado.
-- =====================================================================

-- ------------------------------------------------------------------
-- 1. Novas especialidades médicas (exige CRM)
-- ------------------------------------------------------------------
alter type medical_specialty add value if not exists 'cirurgia_geral';
alter type medical_specialty add value if not exists 'cirurgia_vascular';
alter type medical_specialty add value if not exists 'oftalmologia';
alter type medical_specialty add value if not exists 'otorrinolaringologia';
alter type medical_specialty add value if not exists 'endocrinologia';
alter type medical_specialty add value if not exists 'clinica_medica';

-- Observação: valores antigos não-médicos (`biomedicina_estetica`,
-- `odontologia`, `fisioterapia_dermatofuncional`) permanecem no enum
-- por compatibilidade mas não são mais exibidos no frontend. Postgres
-- não remove valores de enum em uso com facilidade — mantê-los é seguro.

-- ------------------------------------------------------------------
-- 2. Função de normalização de CRM — "123456 SP" = "CRM-SP 123456"
-- ------------------------------------------------------------------
create or replace function public.normalize_crm(crm text)
returns text
language plpgsql immutable as $$
declare
  cleaned text;
  digits  text;
  uf      text;
begin
  if crm is null then return null; end if;
  cleaned := upper(crm);
  cleaned := regexp_replace(cleaned, 'CRM[^A-Z0-9]*', '', 'g');
  cleaned := regexp_replace(cleaned, '[^A-Z0-9]', '', 'g');
  if cleaned = '' then return ''; end if;

  digits := (regexp_match(cleaned, '(\d+)'))[1];
  uf     := (regexp_match(cleaned, '([A-Z]{2})'))[1];

  if digits is null or uf is null then
    return cleaned;
  end if;
  return digits || uf;
end;
$$;

-- Permitir chamada via PostgREST RPC (frontend pode normalizar)
grant execute on function public.normalize_crm(text) to anon, authenticated;

-- ------------------------------------------------------------------
-- 3. Remover o trigger de soft-dedupe — hard-unique substitui
-- ------------------------------------------------------------------
drop trigger if exists trg_leads_dedupe on public.leads;

-- A função detect_duplicate_lead continua existindo (caso seja útil
-- depois), mas não é mais acionada automaticamente.

-- ------------------------------------------------------------------
-- 4. Coluna gerada + índice único em CRM normalizado
-- ------------------------------------------------------------------
alter table public.leads
  add column if not exists crm_normalized text
  generated always as (public.normalize_crm(crm)) stored;

-- Unique só para leads reais (não-teste). Leads de teste podem
-- colidir livremente — útil no dry-run.
drop index if exists leads_crm_normalized_unique;
create unique index leads_crm_normalized_unique
  on public.leads (crm_normalized)
  where is_test = false and crm_normalized <> '';

-- ------------------------------------------------------------------
-- 5. Confirmação dos leads existentes (não há conflito esperado)
-- ------------------------------------------------------------------
-- Execute abaixo para ver o CRM normalizado dos leads existentes:
-- select id, full_name, crm, crm_normalized from public.leads order by created_at;

-- =====================================================================
-- FIM
-- =====================================================================
