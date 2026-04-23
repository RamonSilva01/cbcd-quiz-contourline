"use client";

import * as React from "react";

/**
 * Marca `true` quando não houve interação do usuário durante `timeoutMs`.
 * Eventos monitorados: pointer, touch, keyboard, scroll.
 * `reset()` zera o timer manualmente (útil ao sair de um estado ocioso).
 */
export function useIdle(timeoutMs: number, enabled = true) {
  const [idle, setIdle] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const reset = React.useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setIdle(false);
    if (!enabled) return;
    timerRef.current = window.setTimeout(() => setIdle(true), timeoutMs);
  }, [timeoutMs, enabled]);

  React.useEffect(() => {
    if (!enabled) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setIdle(false);
      return;
    }

    reset();

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "scroll",
    ];
    const handler = () => reset();
    events.forEach((evt) =>
      window.addEventListener(evt, handler, { passive: true }),
    );

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [reset, enabled]);

  return { idle, reset };
}
