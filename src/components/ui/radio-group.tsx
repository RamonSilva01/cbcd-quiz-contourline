"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-3", className)}
    {...props}
  />
));
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/**
 * RadioCard — cada alternativa do quiz é um card completo, não um círculo tradicional.
 * A letra (A/B/C/D) vira um badge que preenche em bronze quando selecionado.
 */
interface RadioCardProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  letter: string;
  label: string;
}

export const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardProps
>(({ className, letter, label, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "group flex min-h-[4.5rem] w-full items-center gap-5 rounded-[var(--radius-md)] border bg-white px-5 py-4 text-left",
      "border-[var(--border)] shadow-[var(--shadow-clinical)]",
      "transition-all duration-[220ms] ease-[var(--ease-clinical)]",
      "hover:border-[var(--color-navy-300)] hover:-translate-y-[1px]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
      "data-[state=checked]:border-[var(--color-bronze-500)] data-[state=checked]:ring-1 data-[state=checked]:ring-[var(--color-bronze-500)]",
      "disabled:cursor-not-allowed disabled:opacity-50 kiosk-lock",
      className,
    )}
    {...props}
  >
    <span
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
        "border-[var(--color-navy-900)] text-[var(--color-navy-900)]",
        "transition-colors duration-[220ms]",
        "group-data-[state=checked]:border-[var(--color-bronze-500)] group-data-[state=checked]:bg-[var(--color-bronze-500)] group-data-[state=checked]:text-white",
      )}
    >
      {letter}
    </span>
    <span className="flex-1 text-base leading-snug text-[var(--color-navy-900)]">
      {label}
    </span>
  </RadioGroupPrimitive.Item>
));
RadioCard.displayName = "RadioCard";
