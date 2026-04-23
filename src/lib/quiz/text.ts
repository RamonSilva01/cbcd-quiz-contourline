/**
 * Partículas comuns de nomes brasileiros/ibéricos que ficam em lowercase
 * quando estão no meio do nome (mas são capitalizadas no início).
 */
const NAME_LOWERCASE_PARTICLES = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "di",
  "du",
  "del",
  "della",
  "van",
  "von",
]);

/**
 * Converte um nome para Title Case respeitando:
 *   - Partículas do português ("Maria da Silva", "João de Oliveira")
 *   - Acentos (usa Intl pt-BR)
 *   - Apóstrofos ("João D'Ávila")
 *   - Hífens ("Maria-Clara")
 *   - Espaços de edição no final/início (não colapsa enquanto o usuário digita)
 *
 * Exemplos:
 *   "maria carvalho"        → "Maria Carvalho"
 *   "MARIA DE OLIVEIRA"     → "Maria de Oliveira"
 *   "joão d'ávila"          → "João D'Ávila"
 *   "ana-clara dos santos"  → "Ana-Clara dos Santos"
 *   "maria "                → "Maria "   (preserva espaço em edição)
 */
export function toTitleCaseName(input: string): string {
  if (!input) return "";
  const hasTrailing = /\s$/.test(input);
  const hasLeading = /^\s/.test(input);
  const lower = input.toLocaleLowerCase("pt-BR");
  const words = lower.split(/\s+/).filter(Boolean);

  const result = words
    .map((word, idx) => {
      if (idx > 0 && NAME_LOWERCASE_PARTICLES.has(word)) return word;
      // Divide em sub-partes por apóstrofo ou hífen, preservando os separadores
      return word
        .split(/(['\-])/)
        .map((part) => {
          if (!part || part === "'" || part === "-") return part;
          return (
            part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1)
          );
        })
        .join("");
    })
    .join(" ");

  return (hasLeading ? " " : "") + result + (hasTrailing ? " " : "");
}
