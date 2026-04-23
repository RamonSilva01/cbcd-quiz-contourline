export type AnswerKey = "A" | "B" | "C" | "D";

export interface QuizQuestion {
  number: 1 | 2 | 3;
  prompt: string;
  options: { key: AnswerKey; text: string }[];
  correct: AnswerKey;
}

export interface LeadData {
  fullName: string;
  specialty: MedicalSpecialty;
  specialtyOther?: string;
  crm: string;
  phone: string;
  email: string;
  consent: boolean;
}

/**
 * Especialidades exclusivamente médicas (exigem CRM emitido pelo Conselho
 * Regional de Medicina). Profissões com outros conselhos (CRO, CREFITO,
 * CRBM) não aparecem aqui.
 */
export type MedicalSpecialty =
  | "dermatologia"
  | "cirurgia_plastica"
  | "ginecologia"
  | "medicina_estetica"
  | "cirurgia_geral"
  | "cirurgia_vascular"
  | "oftalmologia"
  | "otorrinolaringologia"
  | "endocrinologia"
  | "clinica_medica"
  | "outros";

export interface QuizAnswers {
  q1?: AnswerKey;
  q2?: AnswerKey;
  q3?: AnswerKey;
}

export type QuizStep = "lead" | "q1" | "q2" | "q3" | "thanks";
