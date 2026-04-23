import Image from "next/image";
import { cn } from "@/lib/utils";

interface ContourlineMarkProps {
  variant?: "full" | "symbol";
  tone?: "navy" | "white";
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Marca Contourline — versão completa (símbolo + wordmark) ou apenas símbolo.
 * Usa os PNGs oficiais em /public/logos. Tokens de tamanho via width/height.
 */
export function ContourlineMark({
  variant = "full",
  tone = "navy",
  className,
  width = 180,
  height = 40,
  priority = false,
}: ContourlineMarkProps) {
  const src =
    variant === "symbol"
      ? "/logos/contourline-symbol.png"
      : tone === "white"
      ? "/logos/contourline-white.png"
      : "/logos/contourline-navy.png";

  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt="Contourline"
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
