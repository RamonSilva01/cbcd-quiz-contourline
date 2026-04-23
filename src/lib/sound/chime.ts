"use client";

/**
 * Chime metálico suave para o momento da revelação do sorteio.
 * Gerado via Web Audio API — zero dependência externa.
 *
 * Acorde: C5 + E5 + G5 (Dó maior brilhante) com decaimento exponencial
 * de ~1.8s. Timbre: senoide pura + leve harmônico em oitava, simulando
 * um carrilhão de luxo (não badalada de igreja).
 */
export function playChime(volume = 0.22): void {
  try {
    const AudioCtor =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const now = ctx.currentTime;

    // Fundamentais do acorde maior
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const startAt = now + i * 0.04; // leve stagger entre as notas

      // Oscillator fundamental
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      // Harmônico em oitava (menor volume — dá brilho metálico)
      const oscH = ctx.createOscillator();
      oscH.type = "sine";
      oscH.frequency.value = freq * 2;

      // Envelope de decaimento
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(volume, startAt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.8);

      const gainH = ctx.createGain();
      gainH.gain.setValueAtTime(0, startAt);
      gainH.gain.linearRampToValueAtTime(volume * 0.25, startAt + 0.02);
      gainH.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.2);

      osc.connect(gain).connect(ctx.destination);
      oscH.connect(gainH).connect(ctx.destination);

      osc.start(startAt);
      oscH.start(startAt);
      osc.stop(startAt + 2.0);
      oscH.stop(startAt + 1.4);
    });

    // Libera o contexto depois que o som decai
    window.setTimeout(() => ctx.close().catch(() => {}), 2500);
  } catch {
    // silencia qualquer falha de áudio — não deve quebrar o sorteio
  }
}
