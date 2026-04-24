"use client";

import * as React from "react";
import Image from "next/image";
import { X, RotateCcw } from "lucide-react";
import { ContourlineMark } from "@/components/brand/contourline-mark";
import { Button } from "@/components/ui/button";
import { playChime } from "@/lib/sound/chime";
import { celebrateWinner } from "@/lib/celebration/fireworks";

interface Winner {
  id: string;
  full_name: string;
  specialty: string;
  crm: string;
}

interface EligibleEntry {
  id: string;
  full_name: string;
  specialty?: string;
}

type Phase = "idle" | "loading" | "rolling" | "revealed" | "error";

const SCROLL_DURATION_MS = 18_000;       // 18s — adrenalina prolongada
const WINNER_POSITION = 80;              // muitos nomes passando pra gerar tensão
const PAD_AFTER_WINNER = 12;             // nomes extras depois do winner (scroll não "bate")
const ROWS_VISIBLE = 9;
const CENTER_ROW_INDEX = Math.floor(ROWS_VISIBLE / 2); // = 4

/**
 * Easing customizada estilo caça-níquel:
 * Phase 1 (primeiros 8s de 18s = 44.4% do tempo): scroll constante MUITO rápido,
 *   cobre 80% da distância — ~8 nomes/segundo passando em alta velocidade
 * Phase 2 (últimos 10s): desacelera em curva potência 5 (easeOutQuint),
 *   cobre últimos 20% da distância — arrastando dramático nos segundos finais
 * Potência 5 calibrada pra RATE contínuo na fronteira (sem "stop & go").
 */
function slotMachineEase(t: number): number {
  const PHASE_1_END = 8 / 18;        // 8s de 18s = 0.4444
  const PHASE_1_PROGRESS = 0.80;     // 80% da distância no 1º fase
  const PHASE_2_POWER = 5;           // easeOutQuint — drama no final
  if (t < PHASE_1_END) {
    return (t / PHASE_1_END) * PHASE_1_PROGRESS;
  }
  const local = (t - PHASE_1_END) / (1 - PHASE_1_END);
  return (
    PHASE_1_PROGRESS +
    (1 - PHASE_1_PROGRESS) * (1 - Math.pow(1 - local, PHASE_2_POWER))
  );
}

/**
 * Coordenadas da tela visível na imagem trilift-zoom.png (% da imagem).
 * Imagem real: 1760×2410 px. Ajustáveis se necessário.
 */
const SCREEN_RECT = {
  top: "17%",
  left: "26.5%",
  width: "47%",
  height: "38%",
};

/** Aspect ratio da imagem trilift-zoom (width/height). */
const TRILIFT_ZOOM_ASPECT = 1760 / 2410;

const SPECIALTY_LABEL: Record<string, string> = {
  dermatologia: "Dermatologia",
  cirurgia_plastica: "Cirurgia Plástica",
  ginecologia: "Ginecologia",
  medicina_estetica: "Medicina Estética",
  biomedicina_estetica: "Biomedicina Estética",
  odontologia: "Odontologia",
  fisioterapia_dermatofuncional: "Fisioterapia Dermato",
  cirurgia_geral: "Cirurgia Geral",
  cirurgia_vascular: "Cirurgia Vascular",
  oftalmologia: "Oftalmologia",
  otorrinolaringologia: "Otorrino",
  endocrinologia: "Endocrinologia",
  clinica_medica: "Clínica Médica",
  outros: "Médico(a)",
};

// ========== Helpers ==========

/**
 * Formata nome completo com prefixo "Dr(a)." para exibição no sorteio.
 * Strip de título existente (Dr., Dra., Doutor, etc) + reaplica padronizado.
 *
 * Exemplos:
 *   "Dra. Marina Carvalho"    → "Dr(a). Marina Carvalho"
 *   "dr. joão silva pereira"  → "Dr(a). joão silva pereira"
 *   "Marina Carvalho"         → "Dr(a). Marina Carvalho"
 *
 * (Note: o nome já chega do DB com Title Case correto porque aplicamos
 *  toTitleCaseName no input do cadastro.)
 *
 * Motivo: evitar ambiguidade quando 2 médicos têm mesmo primeiro nome
 * e mesma especialidade. Nome completo distingue inequivocamente.
 */
function formatFullDoctorName(fullName: string): string {
  if (!fullName) return "";
  const cleaned = fullName
    .trim()
    .replace(/^(dr\(a\)|doutora?|dra|dr)\.?\s+/i, "");
  return `Dr(a). ${cleaned}`;
}

// ========== Main ==========

interface RaffleTheaterProps {
  onClose: () => void;
  eligibleCount: number;
}

export function RaffleTheater({ onClose, eligibleCount }: RaffleTheaterProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const confettiCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const inFlightRef = React.useRef(false);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [winner, setWinner] = React.useState<Winner | null>(null);
  const [scrollList, setScrollList] = React.useState<EligibleEntry[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  // IDs dos ganhadores anteriores — nunca serão sorteados novamente.
  const [previousWinnerIds, setPreviousWinnerIds] = React.useState<string[]>([]);

  // ---- handleClose: estável mas re-aponta para onClose atual via ref
  const handleClose = React.useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  }, [onClose]);

  const handleCloseRef = React.useRef(handleClose);
  React.useEffect(() => {
    handleCloseRef.current = handleClose;
  });

  // ---- Escape: só fecha quando não está rodando o sorteio
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "rolling") handleCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  // Executa sorteio — aceita lista de IDs a excluir (ganhadores anteriores)
  const executeRaffle = async (excludeIds: string[]) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setPhase("loading");
    setError(null);
    setWinner(null);
    setScrollList([]);

    // Fullscreen só no primeiro click (1º sorteio). Re-sorteios não re-disparam.
    if (excludeIds.length === 0) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    }

    try {
      const res = await fetch("/api/admin/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes:
            excludeIds.length > 0
              ? `sorteio ao vivo — CBCD 2026 (re-sorteio ${excludeIds.length})`
              : "sorteio ao vivo — CBCD 2026",
          excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? `Falha no sorteio (${res.status})`);
        setPhase("error");
        return;
      }

      const body = (await res.json()) as {
        winner: Winner;
        eligible: EligibleEntry[];
      };

      setWinner(body.winner);

      const others = body.eligible.filter((e) => e.id !== body.winner.id);
      const shuffled = [...others].sort(() => Math.random() - 0.5);

      // Guard: se só 1 elegível (raro no re-sorteio), evita loop infinito
      if (shuffled.length === 0) {
        shuffled.push({
          id: `__pad_${body.winner.id}`,
          full_name: body.winner.full_name,
          specialty: body.winner.specialty,
        });
      }

      while (shuffled.length < WINNER_POSITION + PAD_AFTER_WINNER) {
        shuffled.push(...shuffled);
      }

      const winnerEntry: EligibleEntry = {
        id: body.winner.id,
        full_name: body.winner.full_name,
        specialty: body.winner.specialty,
      };
      const list = [
        ...shuffled.slice(0, WINNER_POSITION),
        winnerEntry,
        ...shuffled.slice(WINNER_POSITION, WINNER_POSITION + PAD_AFTER_WINNER),
      ];
      setScrollList(list);
      setPhase("rolling");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPhase("error");
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleStartRaffle = () => {
    executeRaffle([]);
  };

  const handleReDraw = () => {
    if (!winner) return;
    const newExcluded = [...previousWinnerIds, winner.id];
    setPreviousWinnerIds(newExcluded);
    executeRaffle(newExcluded);
  };

  const handleRollComplete = React.useCallback(() => {
    setPhase("revealed");
  }, []);

  return (
    <div
      ref={containerRef}
      className="kiosk-lock fixed inset-0 z-[60] overflow-hidden bg-black text-white"
    >
      {/* =================== BG — Monumento iluminado =================== */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image
          src="/equipment/bg-goiania.png"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.85]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      </div>

      {/* =================== TOP BAR =================== */}
      <div className="relative z-20 flex w-full items-center justify-between px-8 py-5 md:px-12">
        <div className="flex items-center gap-4">
          <ContourlineMark variant="full" tone="white" width={130} height={28} />
          <span className="hidden h-4 w-px bg-white/20 md:block" />
          <span className="hidden text-[10px] uppercase tracking-[0.32em] text-[var(--color-bronze-400)] md:block">
            Sorteio triLift® · CBCD 2026
          </span>
        </div>

        <button
          type="button"
          onClick={handleClose}
          disabled={phase === "rolling"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
          aria-label="Encerrar teatro do sorteio"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* =================== STAGE =================== */}
      {phase === "idle" && (
        <IdleStage
          eligibleCount={eligibleCount}
          onStart={handleStartRaffle}
          disabled={inFlightRef.current}
        />
      )}

      {phase === "loading" && (
        <div className="relative z-10 flex h-[calc(100vh-80px)] items-center justify-center">
          <p className="animate-pulse text-sm uppercase tracking-[0.32em] text-[var(--color-bronze-400)]">
            Preparando o sorteio…
          </p>
        </div>
      )}

      {(phase === "rolling" || phase === "revealed") && (
        <SlotMachineStage
          list={scrollList}
          winner={winner}
          phase={phase}
          onComplete={handleRollComplete}
          onClose={handleClose}
          onReDraw={handleReDraw}
          confettiCanvas={confettiCanvasRef.current}
        />
      )}

      {/* Canvas dos fogos — DENTRO do container pra funcionar em fullscreen */}
      <canvas
        ref={confettiCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[100]"
        style={{ width: "100%", height: "100%" }}
      />

      {phase === "error" && (
        <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-sm text-red-300 md:text-base">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                setPhase("idle");
                setError(null);
              }}
            >
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleClose}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// IDLE STAGE
// ============================================================

interface IdleStageProps {
  eligibleCount: number;
  onStart: () => void;
  disabled?: boolean;
}

function IdleStage({ eligibleCount, onStart, disabled }: IdleStageProps) {
  return (
    <div className="relative z-10 h-[calc(100vh-80px)]">
      <div className="absolute inset-x-0 top-0 bottom-[180px] flex items-center justify-center px-8 animate-fade-up md:bottom-[200px]">
        <Image
          src="/equipment/trilift.png"
          alt="triLift"
          width={600}
          height={1400}
          priority
          className="h-full max-h-[60vh] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          sizes="40vh"
        />
      </div>

      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-4 animate-fade-up md:bottom-10">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-bronze-400)]">
            Prêmio do sorteio
          </p>
          <p className="font-display text-xl leading-none text-white md:text-2xl">
            triLift<span className="text-[var(--color-bronze-500)]">®</span>
          </p>
          <p className="text-[11px] text-white/60">
            {eligibleCount} médico{eligibleCount === 1 ? "" : "s"} participando
          </p>
        </div>
        <Button
          variant="accent"
          size="xl"
          onClick={onStart}
          disabled={eligibleCount === 0 || disabled}
          className="min-w-[260px] md:min-w-[320px]"
        >
          Iniciar sorteio
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// SLOT MACHINE STAGE — internaliza RAF + medição
// ============================================================

interface SlotMachineStageProps {
  list: EligibleEntry[];
  winner: Winner | null;
  phase: Phase;
  onComplete: () => void;
  onClose: () => void;
  onReDraw: () => void;
  confettiCanvas: HTMLCanvasElement | null;
}

function SlotMachineStage({
  list,
  winner,
  phase,
  onComplete,
  onClose,
  onReDraw,
  confettiCanvas,
}: SlotMachineStageProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = React.useState(0);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // onComplete via ref — evita reiniciar o RAF quando pai re-renderiza
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Mede rowHeight SINCRONAMENTE antes do primeiro paint. useLayoutEffect
  // roda após commit DOM mas antes do browser pintar — evita o bug em que
  // o RAF começa com rowHeight = 0 (nomes não rolam, ficam no fundo).
  React.useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const h = el.clientHeight / ROWS_VISIBLE;
      if (h > 0) setRowHeight(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // RAF: SÓ inicia quando temos rowHeight > 0 e estamos em "rolling"
  React.useLayoutEffect(() => {
    if (phase !== "rolling" || rowHeight === 0) return;

    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
      const eased = slotMachineEase(progress);
      setScrollProgress(eased);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        playChime();
        celebrateWinner(confettiCanvas);
        onCompleteRef.current();
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [phase, rowHeight, confettiCanvas]);

  const currentRow = scrollProgress * WINNER_POSITION;
  const translateY = Math.round(rowHeight * (CENTER_ROW_INDEX - currentRow));
  // Blur mais suave (max 2.5px vs 4px antes) — nomes ficam legíveis mesmo
  // no início da rolagem. Evita dúvida sobre estar rodando de verdade.
  const blurPx = Math.max(0, (1 - scrollProgress) * 2.5);
  const ready = rowHeight > 0;

  return (
    <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col items-center justify-center gap-4 px-6 pb-4 md:gap-6 md:pb-8">
      {/* Grid 3-col: [ganhador à esquerda] [equipamento centralizado]
          [CRM à direita]. Equipamento mantém mesmo tamanho rolling/revealed —
          nome do ganhador fica na pill da tela dele, laterais complementam. */}
      <div
        className="grid w-full items-center gap-3 md:gap-6 lg:gap-10"
        style={{ gridTemplateColumns: "1fr auto 1fr" }}
      >
        {/* LEFT — Parabéns + nome do ganhador (revealed only) */}
        <div className="flex min-w-0 flex-col items-end justify-center gap-3 text-right md:gap-4">
          {phase === "revealed" && winner && (
            <div className="flex w-full flex-col items-end gap-3 animate-fade-up md:gap-4">
              <span
                aria-hidden="true"
                className="block h-px w-12 origin-center animate-rule-draw bg-[var(--color-bronze-500)] md:w-16"
              />
              <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-bronze-400)] md:text-[11px]">
                Parabéns,
              </p>
              <h2
                className="font-display font-semibold leading-[1.02]"
                style={{
                  // Clamp responsivo nos dois eixos — tela larga pega vw,
                  // tela alta/quadrada pega vh, cap em 3.25rem pra caber
                  // ao lado do equipamento sem atropelar.
                  fontSize: "clamp(1.25rem, min(3vw, 5.5vh), 3.25rem)",
                  letterSpacing: "-0.015em",
                  color: "var(--color-bronze-300)",
                  textShadow:
                    "0 0 40px rgba(225,198,163,0.35), 0 0 80px rgba(184,148,106,0.2)",
                  maxWidth: "100%",
                  wordBreak: "break-word",
                  textWrap: "balance",
                }}
              >
                {formatFullDoctorName(winner.full_name)}
              </h2>
            </div>
          )}
        </div>

        {/* CENTER — Equipamento (mesma altura em rolling + revealed) */}
        <div
          className="relative animate-scale-in"
          style={{
            height: "min(75vh, 900px)",
            aspectRatio: String(TRILIFT_ZOOM_ASPECT),
          }}
        >
          {/* Wrapper mascarado — o <Image> fica aqui pra que a máscara não
              atinja o overlay de nomes que vem depois.
              Gradient 3-stop cria fade MUITO suave dos cantos:
                - 18% raio: opaco (centro/equipamento)
                - 55% raio: 55% opaco (transição suave)
                - 100% raio: transparente (BG passa através) */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              maskImage:
                "radial-gradient(ellipse 62% 86% at 50% 50%, black 18%, rgba(0,0,0,0.55) 55%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 62% 86% at 50% 50%, black 18%, rgba(0,0,0,0.55) 55%, transparent 100%)",
            }}
          >
            <Image
              src="/equipment/trilift-zoom.png"
              alt="triLift"
              fill
              priority
              sizes="60vh"
              className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
            />
          </div>

          {/* Overlay — a tela real do triLift vira o "display" do sorteio.
              Efeito slot machine: trilha rola por cima/baixo, pill estacionário
              no centro mostra o nome atual.
              Border-radius acompanha os cantos arredondados reais do display
              do triLift (moldura rose-gold). overflow-hidden clipa children. */}
          <div
            ref={viewportRef}
            className="absolute overflow-hidden"
            style={{
              top: SCREEN_RECT.top,
              left: SCREEN_RECT.left,
              width: SCREEN_RECT.width,
              height: SCREEN_RECT.height,
              borderRadius: "clamp(8px, 1.4vh, 22px)",
            }}
          >
            {/* "Tela ligada" — background claro pra o texto ficar legível */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(251,249,245,0.97) 0%, rgba(243,237,227,0.96) 50%, rgba(234,223,207,0.97) 100%)",
              }}
            />

            {/* Trilha de nomes — fade só nas bordas superior/inferior.
                Nomes rolam VISIVELMENTE edge-to-edge em todos os momentos —
                garante veracidade visual do sorteio (usuário sempre vê os
                nomes passando, sem áreas 'brancas' que pareçam trava). */}
            <div
              className="absolute left-0 right-0 top-0 will-change-transform"
              style={{
                transform: `translate3d(0, ${translateY}px, 0)`,
                filter: phase === "rolling" ? `blur(${blurPx}px)` : "none",
                transition:
                  phase === "revealed" ? "filter 280ms ease-out" : "none",
                visibility: ready ? "visible" : "hidden",
                maskImage:
                  "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, transparent 0%, black 8%, black 92%, transparent 100%)",
              }}
            >
              {list.map((item, i) => {
                const label = formatFullDoctorName(item.full_name);
                return (
                  <div
                    key={`${item.id}-${i}`}
                    className="flex w-full items-center justify-center px-2"
                    style={{
                      height: ready ? `${rowHeight}px` : "0",
                    }}
                  >
                    <span
                      className="truncate font-display font-semibold uppercase tracking-tight text-[var(--color-navy-900)]"
                      style={{
                        fontSize: "clamp(0.7rem, min(1.55vh, 2.2vw), 1.4rem)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* PILL ESTACIONÁRIO no slot central — igual ao WinnerRow.
                Durante rolling, mostra o nome atual que está passando.
                Quando revealed, mostra o winner final. */}
            {ready && (
              <SelectionPill
                list={list}
                currentRow={currentRow}
                rowHeight={rowHeight}
                phase={phase}
                winner={winner}
              />
            )}
          </div>
        </div>

        {/* RIGHT — CRM do ganhador (revealed only) */}
        <div className="flex min-w-0 flex-col items-start justify-center gap-3 text-left md:gap-4">
          {phase === "revealed" && winner && (
            <div className="flex w-full flex-col items-start gap-3 animate-fade-up md:gap-4">
              <span
                aria-hidden="true"
                className="block h-px w-12 origin-center animate-rule-draw bg-[var(--color-bronze-500)] md:w-16"
              />
              <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--color-bronze-400)] md:text-[11px]">
                CRM
              </p>
              <p
                className="font-display font-semibold leading-[1.02]"
                style={{
                  fontSize: "clamp(1.15rem, min(2.4vw, 4.5vh), 2.75rem)",
                  letterSpacing: "-0.015em",
                  color: "var(--color-bronze-300)",
                  textShadow: "0 0 40px rgba(225,198,163,0.35)",
                  wordBreak: "break-word",
                }}
              >
                {winner.crm}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apurando resultado — inline durante rolling (no flex flow) */}
      {phase === "rolling" && (
        <p className="animate-pulse text-[11px] uppercase tracking-[0.32em] text-[var(--color-bronze-400)] md:text-xs">
          Apurando resultado…
        </p>
      )}

      {/* Ações + hint abaixo do equipamento quando revealed */}
      {phase === "revealed" && winner && (
        <div className="flex flex-col items-center gap-3 animate-fade-up md:gap-4">
          <div
            className="inline-flex items-center rounded-full bg-[var(--color-navy-900)]/85 px-5 py-2 backdrop-blur"
            style={{
              border: "1.5px solid rgba(184, 148, 106, 0.85)",
            }}
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-white md:text-[11px]">
              Sorteio realizado — Vencedor único
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button
              variant="accent"
              size="lg"
              onClick={onReDraw}
              className="min-w-[220px]"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
              Sortear novamente
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="min-w-[160px] border-white/30 bg-black/40 text-white backdrop-blur hover:bg-white/10"
            >
              Encerrar
            </Button>
          </div>

          <p className="max-w-md text-center text-[10px] uppercase tracking-[0.24em] text-white/50">
            Ganhador ausente? Sortear novamente exclui quem já foi sorteado.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SELECTION PILL — pill estacionário no slot central da tela do triLift.
// Durante rolling: mostra o nome atual que está passando pelo slot.
// Durante revealed: mostra o winner final. Mesma estética em ambos estados.
// ============================================================

interface SelectionPillProps {
  list: EligibleEntry[];
  currentRow: number;
  rowHeight: number;
  phase: Phase;
  winner: Winner | null;
}

function SelectionPill({
  list,
  currentRow,
  rowHeight,
  phase,
  winner,
}: SelectionPillProps) {
  // Nome atualmente no slot central (computed do currentRow).
  // Quando revealed, forçamos pro winner pra garantir consistência.
  const centerIdx = Math.min(
    Math.max(0, Math.round(currentRow)),
    list.length - 1,
  );
  const currentItem =
    phase === "revealed" && winner
      ? { id: winner.id, full_name: winner.full_name }
      : list[centerIdx];
  const label = currentItem ? formatFullDoctorName(currentItem.full_name) : "";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-[4%] right-[4%] flex items-center rounded-full px-3"
      style={{
        top: `${CENTER_ROW_INDEX * rowHeight}px`,
        height: `${rowHeight}px`,
        background: "linear-gradient(180deg, #FBF9F5 0%, #F3EDE3 100%)",
        boxShadow:
          "0 0 0 1.2px rgba(184,148,106,0.95), 0 0 22px 4px rgba(184,148,106,0.55), inset 0 0 0 1px rgba(255,255,255,0.6)",
      }}
    >
      {/* Glow radial atrás do pill */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-lg"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,148,106,0.55) 0%, transparent 70%)",
        }}
      />

      {/* Trophy à esquerda */}
      <TrophyIcon
        className="shrink-0 text-[var(--color-bronze-600)]"
        style={{
          width: "clamp(0.8rem, min(1.4vh, 2vw), 1.3rem)",
          height: "clamp(0.8rem, min(1.4vh, 2vw), 1.3rem)",
        }}
      />

      {/* Nome (muda conforme scroll — slot machine effect) */}
      <span
        className="flex-1 truncate pl-2 text-center font-display font-semibold uppercase tracking-tight text-[var(--color-navy-900)]"
        style={{
          fontSize: "clamp(0.7rem, min(1.55vh, 2.2vw), 1.4rem)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================================
// WINNER ROW (legacy — mantido caso precise usar em outro lugar)
// ============================================================

function WinnerRow({ label }: { label: string }) {
  return (
    <div className="relative flex w-full items-center justify-center px-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full blur-lg"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,148,106,0.55) 0%, transparent 70%)",
        }}
      />
      <div
        className="relative flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1"
        style={{
          background: "linear-gradient(180deg, #FBF9F5 0%, #F3EDE3 100%)",
          boxShadow:
            "0 0 0 1.2px rgba(184,148,106,0.95), 0 0 18px 2px rgba(184,148,106,0.55), inset 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        <TrophyIcon className="shrink-0 text-[var(--color-bronze-600)]" style={{ width: "clamp(0.9rem, 1.5vh, 1.35rem)", height: "clamp(0.9rem, 1.5vh, 1.35rem)" }} />
        <span
          className="truncate font-display font-semibold uppercase tracking-tight text-[var(--color-navy-900)]"
          style={{ fontSize: "clamp(0.8rem, 1.6vh, 1.45rem)" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function TrophyIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.15 18.75 13 20.24 13 22" />
      <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C11.85 18.75 11 20.24 11 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
