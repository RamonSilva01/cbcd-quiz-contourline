import { z } from "zod";

/**
 * CRM: aceita "12345 SP", "12345/SP", "CRM-SP 12345", "CRM 12345 SP", etc.
 * Normalizamos no backend. Bloqueia caracteres especiais (#, @, !, emojis,
 * etc) tanto no input (sanitização) quanto aqui (validação defensiva).
 * Só aceita: letras, números, espaço, hífen, ponto e barra.
 */
const crmSchema = z
  .string()
  .min(3, "CRM obrigatório")
  .max(30, "CRM inválido")
  .refine((v) => /^[A-Za-z0-9 \-./]+$/.test(v), {
    message: "CRM contém caracteres inválidos — use apenas letras, números e espaço",
  })
  .refine((v) => /\d{3,}/.test(v), {
    message: "Informe o número do CRM",
  })
  .refine((v) => /[A-Za-z]{2}/.test(v), {
    message: "Informe a UF (ex: SP, RJ, MG)",
  });

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10 && v.length <= 13, {
    message: "Informe DDD + número (ex: 11 99999-9999)",
  });

export const leadSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(60, "Nome muito longo"),
  lastName: z
    .string()
    .trim()
    .min(2, "Informe seu sobrenome")
    .max(120, "Sobrenome muito longo"),
  specialty: z.enum([
    "dermatologia",
    "cirurgia_plastica",
    "ginecologia",
    "medicina_estetica",
    "cirurgia_geral",
    "cirurgia_vascular",
    "oftalmologia",
    "otorrinolaringologia",
    "endocrinologia",
    "clinica_medica",
    "outros",
  ]),
  specialtyOther: z.string().max(80).optional(),
  crm: crmSchema,
  phone: phoneSchema,
  email: z.string().email("E-mail inválido").max(200),
  consent: z.boolean().refine((v) => v === true, {
    message: "Consentimento LGPD obrigatório para participar",
  }),
});

export type LeadFormValues = z.input<typeof leadSchema>;
export type LeadFormParsed = z.output<typeof leadSchema>;

/**
 * Schema da API — recebe fullName já concatenado (o form converte
 * firstName + lastName → fullName antes de submeter).
 */
export const leadApiSchema = leadSchema
  .omit({ firstName: true, lastName: true })
  .extend({
    fullName: z
      .string()
      .trim()
      .min(3, "Nome completo inválido")
      .max(200, "Nome muito longo"),
  });

export const submitPayloadSchema = z.object({
  lead: leadApiSchema,
  answers: z.object({
    q1: z.enum(["A", "B", "C", "D"]),
    q2: z.enum(["A", "B", "C", "D"]),
    q3: z.enum(["A", "B", "C", "D"]),
  }),
  deviceHint: z.enum(["tablet_kiosk", "qr_mobile", "unknown"]).default("unknown"),
  source: z.string().max(60).default("cbcd_2026"),
});

export type SubmitPayload = z.input<typeof submitPayloadSchema>;
