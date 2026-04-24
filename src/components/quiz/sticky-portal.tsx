"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/**
 * Renderiza children diretamente no <body>, fora da hierarquia do React.
 *
 * MOTIVO: o QuizShell tem `animate-fade-up` que aplica `transform:
 * translateY(0)` no estado final. Qualquer ancestral com `transform != none`
 * cria um containing block que QUEBRA `position: fixed` — a sticky bar
 * deixa de ser fixa ao viewport e passa a ser "fixa" ao ancestral animado.
 *
 * Ao portal-ar a sticky bar pro document.body, ela escapa da hierarquia do
 * quiz-shell e volta a respeitar o viewport como containing block de
 * `position: fixed`. Funciona em qualquer tela, qualquer browser, qualquer
 * orientação — é o fix mais robusto possível pra esse problema.
 */
export function StickyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
