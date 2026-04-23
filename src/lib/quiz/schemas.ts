import { z } from "zod";

/**
 * CRM: aceita "12345 SP", "12345/SP", "CRM-SP 12345", "CRM 12345 SP", etc.
 * Normalizamos no backend. Aqui validamos só o essencial: contém número e UF (2 letras).
 */
const crmSchema = z
  .string()
  .min(3, "CRM obrigatório")
  .max(30, "CRM inválido")
  .refine(
    (v) => /\d{3,}/.test(v) && /[A-Za-z]{2}/.test(v),
    { message: "Informe números e a UF (ex: 123456 SP)" },
  );

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10 && v.length <= 13, {
    message: "Informe DDD + número (ex: 11 99999-9999)",
  });

export const leadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(200, "Nome muito longo")
    .refine((v) => v.includes(" "), "Informe nome e sobrenome"),
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

export const submitPayloadSchema = z.object({
  lead: leadSchema,
  answers: z.object({
    q1: z.enum(["A", "B", "C", "D"]),
    q2: z.enum(["A", "B", "C", "D"]),
    q3: z.enum(["A", "B", "C", "D"]),
  }),
  deviceHint: z.enum(["tablet_kiosk", "qr_mobile", "unknown"]).default("unknown"),
  source: z.string().max(60).default("cbcd_2026"),
});

export type SubmitPayload = z.input<typeof submitPayloadSchema>;
