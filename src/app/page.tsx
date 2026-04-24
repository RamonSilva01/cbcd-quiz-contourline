"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuizProvider, useQuiz } from "@/lib/quiz/context";
import { QuizShell } from "@/components/quiz/quiz-shell";
import { StepLead } from "@/components/quiz/step-lead";
import { StepQuestion } from "@/components/quiz/step-question";
import { StepThanks } from "@/components/quiz/step-thanks";
import { StepFarewell } from "@/components/quiz/step-farewell";
import { AttractLoop } from "@/components/quiz/attract-loop";
import { useIdle } from "@/lib/hooks/use-idle";

const KIOSK_IDLE_TIMEOUT_MS = 30_000; // 30s sem interação em modo kiosk

function QuizContent({ isKiosk }: { isKiosk: boolean }) {
  const { step, dispatch, submittedLeadId } = useQuiz();
  const [attractActive, setAttractActive] = React.useState(false);

  // No modo kiosk, detecta ociosidade e ativa a tela de atração
  const { idle, reset } = useIdle(KIOSK_IDLE_TIMEOUT_MS, isKiosk);

  // Quando o usuário finaliza o quiz (chega em thanks), o StepThanks já
  // gerencia o próprio countdown. Não queremos o attract sobrepondo.
  const canAttract = isKiosk && step === "lead" && !submittedLeadId;

  React.useEffect(() => {
    if (canAttract && idle) setAttractActive(true);
  }, [canAttract, idle]);

  const dismissAttract = React.useCallback(() => {
    setAttractActive(false);
    // limpa qualquer estado parcial deixado pelo visitante anterior
    dispatch({ type: "reset" });
    reset();
  }, [dispatch, reset]);

  const showProgress = step === "q1" || step === "q2" || step === "q3";
  const currentStep =
    step === "q1" ? 1 : step === "q2" ? 2 : step === "q3" ? 3 : 1;

  return (
    <>
      <QuizShell
        showProgress={showProgress}
        currentStep={currentStep}
        totalSteps={3}
        animationKey={step}
      >
        {step === "lead" && <StepLead />}
        {step === "q1" && <StepQuestion questionNumber={1} />}
        {step === "q2" && <StepQuestion questionNumber={2} />}
        {step === "q3" && <StepQuestion questionNumber={3} />}
        {step === "thanks" && <StepThanks isKiosk={isKiosk} />}
        {step === "farewell" && <StepFarewell />}
      </QuizShell>
      {attractActive && <AttractLoop onDismiss={dismissAttract} />}
    </>
  );
}

function QuizInner() {
  const params = useSearchParams();
  const src = params.get("src");
  const deviceHint: "tablet_kiosk" | "qr_mobile" | "unknown" =
    src === "kiosk" ? "tablet_kiosk" : src === "qr" ? "qr_mobile" : "unknown";
  const isKiosk = deviceHint === "tablet_kiosk";

  return (
    <QuizProvider deviceHint={deviceHint}>
      <QuizContent isKiosk={isKiosk} />
    </QuizProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <QuizInner />
    </Suspense>
  );
}
