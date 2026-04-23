-- =====================================================================
-- Migration 003 — Sorteio ao vivo (sem seed pública)
-- =====================================================================
-- O cliente optou por fazer o sorteio ao vivo na festa de encerramento
-- (02/mai), sem necessidade de seed pública. A legitimidade vem do
-- evento físico presencial. O sistema ainda grava prova forense
-- (timestamp + snapshot + hash + operadora) caso seja questionado.
-- Execute no Supabase SQL Editor.
-- =====================================================================

create or replace function public.execute_raffle_live(
  p_raffle_name text default 'CBCD_2026_trilift',
  p_notes       text default null
)
returns public.raffle_draws
language plpgsql security definer as $$
declare
  v_seed       text;
  v_eligible   uuid[];
  v_hash       text;
  v_winner_idx int;
  v_winner     uuid;
  v_row        public.raffle_draws;
begin
  if not public.is_admin() then
    raise exception 'forbidden: only admins may draw';
  end if;

  -- Seed auto-gerada internamente (timestamp em microssegundos + UUID).
  -- Não precisa ser conhecida externamente — serve só para auditoria.
  v_seed := to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US')
         || '-' || gen_random_uuid()::text;

  select array_agg(id order by id) into v_eligible
  from public.leads
  where quiz_completed_at is not null
    and lgpd_consent = true
    and is_duplicate_of is null
    and is_test = false;

  if v_eligible is null or array_length(v_eligible, 1) = 0 then
    raise exception 'no eligible leads for raffle';
  end if;

  v_hash := encode(
    digest(v_seed || '|' || array_to_string(v_eligible, ','), 'sha256'),
    'hex'
  );

  v_winner_idx := (('x' || substr(v_hash, 1, 15))::bit(60)::bigint
                   % array_length(v_eligible, 1))::int;
  v_winner := v_eligible[v_winner_idx + 1];

  insert into public.raffle_draws
    (raffle_name, drawn_by, seed, seed_kind, total_eligible,
     winner_lead_id, eligibility_snapshot, eligibility_hash, notes)
  values
    (p_raffle_name, auth.uid(), v_seed, 'auto-live',
     array_length(v_eligible, 1), v_winner, to_jsonb(v_eligible), v_hash, p_notes)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.execute_raffle_live(text, text) from public;
grant execute on function public.execute_raffle_live(text, text) to authenticated;

-- =====================================================================
-- FIM
-- =====================================================================
