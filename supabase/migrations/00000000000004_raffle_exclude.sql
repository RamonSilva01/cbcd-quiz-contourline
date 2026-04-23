-- =====================================================================
-- Migration 004 — Sorteio com exclusão (para "Sortear novamente")
-- =====================================================================
-- Se o ganhador não estiver presente no recinto, a operadora clica em
-- "Sortear novamente". Esta versão aceita uma lista de UUIDs a excluir
-- do pool elegível — garantindo que o mesmo médico NUNCA seja sorteado
-- duas vezes.
-- Execute TUDO de uma vez no Supabase SQL Editor.
-- =====================================================================

-- Remove a assinatura antiga (2 parâmetros) pra evitar overload confuso.
drop function if exists public.execute_raffle_live(text, text);

create or replace function public.execute_raffle_live(
  p_raffle_name text default 'CBCD_2026_trilift',
  p_notes       text default null,
  p_exclude_ids uuid[] default null
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

  v_seed := to_char(clock_timestamp() at time zone 'UTC', 'YYYYMMDD"T"HH24MISS.US')
         || '-' || gen_random_uuid()::text;

  -- Elegíveis menos os excluídos (ex: ganhadores anteriores que não compareceram)
  select array_agg(id order by id) into v_eligible
  from public.leads
  where quiz_completed_at is not null
    and lgpd_consent = true
    and is_duplicate_of is null
    and is_test = false
    and (p_exclude_ids is null or id <> all(p_exclude_ids));

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
    (p_raffle_name, auth.uid(), v_seed,
     case when p_exclude_ids is not null and array_length(p_exclude_ids, 1) > 0
          then 'auto-live-redraw'
          else 'auto-live' end,
     array_length(v_eligible, 1),
     v_winner, to_jsonb(v_eligible), v_hash, p_notes)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.execute_raffle_live(text, text, uuid[]) from public;
grant execute on function public.execute_raffle_live(text, text, uuid[]) to authenticated;

-- =====================================================================
-- FIM
-- =====================================================================
