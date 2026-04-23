"use client";

import * as React from "react";
import type { AnswerKey, LeadData, QuizAnswers, QuizStep } from "./types";

interface QuizState {
  step: QuizStep;
  lead: Partial<LeadData>;
  answers: QuizAnswers;
  submitting: boolean;
  error: string | null;
  submittedLeadId: string | null;
}

type QuizAction =
  | { type: "goto"; step: QuizStep }
  | { type: "setLead"; lead: LeadData }
  | { type: "setAnswer"; question: 1 | 2 | 3; answer: AnswerKey }
  | { type: "submitting" }
  | { type: "success"; leadId: string }
  | { type: "error"; message: string }
  | { type: "reset" };

const INITIAL: QuizState = {
  step: "lead",
  lead: {},
  answers: {},
  submitting: false,
  error: null,
  submittedLeadId: null,
};

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "goto":
      return { ...state, step: action.step, error: null };
    case "setLead":
      return { ...state, lead: action.lead, step: "q1", error: null };
    case "setAnswer": {
      const key = `q${action.question}` as const;
      return { ...state, answers: { ...state.answers, [key]: action.answer } };
    }
    case "submitting":
      return { ...state, submitting: true, error: null };
    case "success":
      return {
        ...state,
        submitting: false,
        submittedLeadId: action.leadId,
        step: "thanks",
      };
    case "error":
      return { ...state, submitting: false, error: action.message };
    case "reset":
      return INITIAL;
    default:
      return state;
  }
}

interface QuizContextValue extends QuizState {
  dispatch: React.Dispatch<QuizAction>;
  submit: () => Promise<void>;
}

const QuizContext = React.createContext<QuizContextValue | null>(null);

export function QuizProvider({
  children,
  deviceHint = "unknown",
}: {
  children: React.ReactNode;
  deviceHint?: "tablet_kiosk" | "qr_mobile" | "unknown";
}) {
  const [state, dispatch] = React.useReducer(reducer, INITIAL);

  const submit = React.useCallback(async () => {
    const { lead, answers } = state;
    if (
      !lead.fullName ||
      !lead.specialty ||
      !lead.crm ||
      !lead.email ||
      !lead.phone ||
      !lead.consent ||
      !answers.q1 ||
      !answers.q2 ||
      !answers.q3
    ) {
      dispatch({ type: "error", message: "Dados incompletos" });
      return;
    }

    dispatch({ type: "submitting" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
          deviceHint,
          source: "cbcd_2026",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        dispatch({
          type: "error",
          message: body?.error ?? `Falha no envio (${res.status})`,
        });
        return;
      }

      const body = (await res.json()) as { leadId: string };
      dispatch({ type: "success", leadId: body.leadId });
    } catch {
      dispatch({
        type: "error",
        message: "Sem conexão. Verifique o Wi-Fi e tente novamente.",
      });
    }
  }, [state, deviceHint]);

  const value = React.useMemo(
    () => ({ ...state, dispatch, submit }),
    [state, submit],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = React.useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used inside <QuizProvider>");
  return ctx;
}
