"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-14 w-full rounded-[var(--radius-md)] border border-[var(--input)] bg-white px-4 text-base text-[var(--foreground)] placeholder:text-[var(--color-clinical-400)]",
          "transition-colors duration-[180ms] ease-[var(--ease-clinical)]",
          "hover:border-[var(--color-navy-300)]",
          "focus:outline-none focus:border-[var(--color-navy-900)] focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--background)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-[var(--destructive)] aria-[invalid=true]:ring-[var(--destructive)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
