import type { QuizQuestion } from "./types";

export const QUIZ_VERSION = "cbcd_2026_v1";

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    number: 1,
    prompt: "O que torna o triLift® uma tecnologia única no mercado?",
    options: [
      { key: "A", text: "Atua apenas na pele com radiofrequência" },
      { key: "B", text: "Atua em músculo, pele e volume em um único protocolo" },
      { key: "C", text: "É um laser ablativo para resurfacing" },
      { key: "D", text: "Substitui completamente preenchimentos faciais" },
    ],
    correct: "B",
  },
  {
    number: 2,
    prompt: "Qual tecnologia do triLift é responsável pela estimulação muscular facial?",
    options: [
      { key: "A", text: "Laser fracionado" },
      { key: "B", text: "Ultrassom microfocado" },
      { key: "C", text: "DMSt (Dynamic Muscle Stimulation)" },
      { key: "D", text: "Criolipólise" },
    ],
    correct: "C",
  },
  {
    number: 3,
    prompt: "Qual é o principal efeito do tratamento com triLift ao longo das sessões?",
    options: [
      { key: "A", text: "Apenas melhora superficial da textura da pele" },
      { key: "B", text: "Redução de gordura localizada no corpo" },
      { key: "C", text: "Lifting natural com melhora de tônus muscular e qualidade da pele" },
      { key: "D", text: "Paralisia muscular temporária" },
    ],
    correct: "C",
  },
];
