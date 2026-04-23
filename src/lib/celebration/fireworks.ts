"use client";

import confetti, { type Options } from "canvas-confetti";

type FireFn = (options?: Options) => void;

/**
 * Paleta de celebração — navy + bronze + dourado (champagne) + creme.
 * Mantém o vocabulário visual da Contourline (clinical elegance) ao
 * invés de cores primárias estridentes.
 */
const BRAND_COLORS = [
  "#B8946A", // bronze Contourline
  "#D4B48A", // rose-gold claro
  "#E1C6A3", // champanhe
  "#FFD54A", // dourado
  "#FBF9F5", // creme/branco
  "#0F2B4B", // navy (contraste)
];

const GOLD_COLORS = [
  "#B8946A",
  "#D4B48A",
  "#E1C6A3",
  "#FFD54A",
  "#FBF9F5",
];

/**
 * Celebração em 3 atos:
 *   1. POP central (champagne estourando) — burst grande do centro
 *   2. Cannons laterais — jorrada de partículas das bordas
 *   3. Fogos sustentados por ~2.2s — bursts aleatórios subindo das bordas
 *
 * IMPORTANTE: quando o teatro está em modo fullscreen, o canvas padrão
 * do canvas-confetti (adicionado ao document.body) não é renderizado —
 * só o elemento em fullscreen e seus descendentes aparecem. Por isso
 * aceitamos um canvas custom que fica DENTRO do container do teatro.
 */
export function celebrateWinner(canvas?: HTMLCanvasElement | null): void {
  try {
    // Cria a instância UMA vez (canvas-confetti adiciona listener de resize)
    const instance = canvas
      ? confetti.create(canvas, { resize: true, useWorker: true })
      : null;

    const fire: FireFn = instance
      ? (opts) => {
          instance(opts);
        }
      : (opts) => {
          confetti(opts);
        };

    // ============ ATO 1: POP central ============
    fire({
      particleCount: 220,
      spread: 95,
      startVelocity: 55,
      ticks: 220,
      gravity: 1.1,
      origin: { x: 0.5, y: 0.42 },
      colors: BRAND_COLORS,
      scalar: 1.2,
      shapes: ["circle", "square"],
    });

    // ============ ATO 2: cannons laterais (champagne spray) ============
    window.setTimeout(() => {
      fire({
        particleCount: 110,
        angle: 65,
        spread: 55,
        startVelocity: 52,
        origin: { x: 0.08, y: 0.58 },
        colors: GOLD_COLORS,
        ticks: 200,
      });
      fire({
        particleCount: 110,
        angle: 115,
        spread: 55,
        startVelocity: 52,
        origin: { x: 0.92, y: 0.58 },
        colors: GOLD_COLORS,
        ticks: 200,
      });
    }, 220);

    // ============ ATO 3: fogos sustentados (~2.2s) ============
    const duration = 2200;
    const end = performance.now() + duration;

    function fireworkFrame() {
      const now = performance.now();
      if (now > end) return;

      const side = Math.random() > 0.5 ? 0 : 1;
      const originX =
        side === 0 ? Math.random() * 0.25 : 0.75 + Math.random() * 0.25;

      fire({
        particleCount: 6 + Math.floor(Math.random() * 6),
        angle:
          side === 0 ? 55 + Math.random() * 25 : 100 + Math.random() * 25,
        spread: 48 + Math.random() * 20,
        startVelocity: 45 + Math.random() * 25,
        origin: { x: originX, y: 0.7 + Math.random() * 0.2 },
        colors: BRAND_COLORS,
        ticks: 180,
        gravity: 1.0,
      });

      window.setTimeout(fireworkFrame, 90 + Math.random() * 60);
    }

    window.setTimeout(fireworkFrame, 500);
  } catch {
    // Silencia qualquer falha — celebração é bônus, sorteio não quebra
  }
}
