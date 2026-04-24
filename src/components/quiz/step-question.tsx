"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioCard } from "@/components/ui/radio-group";
import { QUIZ_QUESTIONS } from "@/lib/quiz/questions";
import { useQuiz } from "@/lib/quiz/context";
import type { AnswerKey } from "@/lib/quiz/types";
import { StickyPortal } from "./sticky-portal";

interface StepQuestionProps {
  questionNumber: 1 | 2 | 3;
}

export function StepQuestion({ questionNumber }: StepQuestionProps) {
  const { answers, dispatch, submit, submitting, error } = useQuiz();
  const question = QUIZ_QUESTIONS[questionNumber - 1];
  const currentAnswer = answers[`q${questionNumber}` as const];
  const isLast = questionNumber === 3;

  const onSelect = (value: string) => {
    dispatch({
      type: "setAnswer",
      question: questionNumber,
      answer: value as AnswerKey,
    });
  };

  const onNext = () => {
    if (!currentAnswer) return;
    if (isLast) {
      submit();
    } else {
      dispatch({
        type: "goto",
        step: `q${questionNumber + 1}` as "q2" | "q3",
      });
    }
  };

  const onBack = () => {
    if (questionNumber === 1) {
      dispatch({ type: "goto", step: "lead" });
    } else {
      dispatch({
        type: "goto",
        step: `q${questionNumber - 1}` as "q1" | "q2",
      });
    }
  };

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-col gap-7 md:gap-9">
        {/* Prompt */}
      <div className="space-y-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-bronze-600)]">
          Pergunta {String(questionNumber).padStart(2, "0")} de 03
        </span>
        <h1 className="font-display text-[clamp(1.5rem,2.5vw+1rem,2.5rem)] leading-[1.15]">
          {question.prompt}
        </h1>
        <p className="text-[13px] text-[var(--color-clinical-500)] md:text-sm">
          Selecione a alternativa que melhor representa sua visão clínica.
        </p>
      </div>

      {/* Alternatives — stagger animation em entrada */}
      <RadioGroup
        value={currentAnswer ?? ""}
        onValueChange={onSelect}
        className="stagger grid gap-3 md:grid-cols-2"
      >
        {question.options.map((opt) => (
          <div key={opt.key} className="animate-fade-up">
            <RadioCard
              value={opt.key}
              letter={opt.key}
              label={opt.text}
              className="h-full"
            />
          </div>
        ))}
      </RadioGroup>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-4 text-sm text-[var(--destructive)]"
        >
          {error}
        </div>
      )}

      {/* CTAs — sticky mobile / inline desktop */}
      <div className="hidden items-center justify-between gap-4 pt-2 sm:flex">
        <Button
          variant="ghost"
          size="md"
          onClick={onBack}
          disabled={submitting}
        >
          Voltar
        </Button>
        <Button
          variant="primary"
          size="xl"
          onClick={onNext}
          disabled={!currentAnswer || submitting}
          className="min-w-[200px]"
        >
          {submitting
            ? "Enviando..."
            : isLast
            ? "Finalizar quiz"
            : "Continuar"}
        </Button>
      </div>

    </div>

      {/* Mobile sticky bar — portal pra document.body
          (escapa do containing block criado por animate-fade-up ancestral) */}
      <StickyPortal>
        <div
          className="fixed bottom-0 left-0 right-0 z-[70] flex items-center gap-3 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 pt-4 backdrop-blur-md sm:hidden"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <Button
            variant="ghost"
            size="md"
            onClick={onBack}
            disabled={submitting}
            className="shrink-0"
          >
            Voltar
          </Button>
          <Button
            variant="primary"
            size="xl"
            onClick={onNext}
            disabled={!currentAnswer || submitting}
            className="flex-1"
          >
            {submitting
              ? "Enviando..."
              : isLast
              ? "Finalizar"
              : "Continuar"}
          </Button>
        </div>
      </StickyPortal>
    </>
  );
}
