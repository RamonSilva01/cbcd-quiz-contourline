"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[220ms] ease-[var(--ease-clinical)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 kiosk-lock",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--color-navy-700)] active:bg-[var(--color-navy-950)]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--color-bronze-600)] active:bg-[var(--color-bronze-700)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:border-[var(--color-navy-900)] hover:bg-[var(--color-bone-50)]",
        ghost:
          "bg-transparent text-[var(--foreground)] hover:bg-[var(--color-bone-200)]",
        destructive:
          "bg-[var(--destructive)] text-[var(--color-bone-50)] hover:opacity-90",
      },
      size: {
        sm: "h-10 px-4 text-xs tracking-wide uppercase",
        md: "h-12 px-6 text-sm tracking-wide uppercase",
        lg: "h-14 px-8 text-sm tracking-[0.08em] uppercase",
        xl: "h-16 px-10 text-base tracking-[0.08em] uppercase",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
