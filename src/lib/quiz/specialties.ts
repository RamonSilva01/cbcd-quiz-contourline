import type { MedicalSpecialty } from "./types";

/**
 * Apenas especialidades exclusivamente médicas (exigem CRM).
 * Odontologia, biomedicina, fisioterapia e outras profissões regulamentadas
 * por outros conselhos não aparecem aqui.
 */
export const MEDICAL_SPECIALTIES: { value: MedicalSpecialty; label: string }[] = [
  { value: "dermatologia", label: "Dermatologia" },
  { value: "cirurgia_plastica", label: "Cirurgia Plástica" },
  { value: "medicina_estetica", label: "Medicina Estética" },
  { value: "ginecologia", label: "Ginecologia" },
  { value: "cirurgia_geral", label: "Cirurgia Geral" },
  { value: "cirurgia_vascular", label: "Cirurgia Vascular" },
  { value: "oftalmologia", label: "Oftalmologia" },
  { value: "otorrinolaringologia", label: "Otorrinolaringologia" },
  { value: "endocrinologia", label: "Endocrinologia" },
  { value: "clinica_medica", label: "Clínica Médica" },
  { value: "outros", label: "Outra especialidade médica" },
];
