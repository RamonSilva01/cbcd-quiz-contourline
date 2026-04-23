/**
 * Normaliza um CRM para uma forma canônica comparável.
 * Mesma lógica da função SQL `public.normalize_crm` — garante consistência
 * entre validação no cliente, no backend e no índice único do banco.
 *
 * Exemplos:
 *   "123456 SP"        → "123456SP"
 *   "123456/SP"        → "123456SP"
 *   "CRM-SP 123456"    → "123456SP"
 *   "CRM 123456 SP"    → "123456SP"
 *   "crm-sp 123.456"   → "123456SP"
 */
export function normalizeCRM(input: string): string {
  if (!input) return "";
  let cleaned = input.toUpperCase();
  cleaned = cleaned.replace(/CRM[^A-Z0-9]*/g, "");
  cleaned = cleaned.replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return "";

  const digitsMatch = cleaned.match(/(\d+)/);
  const ufMatch = cleaned.match(/([A-Z]{2})/);
  const digits = digitsMatch?.[1];
  const uf = ufMatch?.[1];
  if (!digits || !uf) return cleaned;
  return digits + uf;
}
