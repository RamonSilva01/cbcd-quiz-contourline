"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";

/**
 * Formata número brasileiro enquanto o usuário digita:
 *   "11" → "(11"
 *   "1199" → "(11) 99"
 *   "11999991" → "(11) 9999-1"
 *   "11999991234" → "(11) 99999-1234"
 */
export function formatBRPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(
  function PhoneInput({ onChange, ...props }, ref) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = formatBRPhone(e.target.value);
      onChange?.(e);
    };
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        maxLength={16}
        {...props}
        onChange={handleChange}
      />
    );
  },
);
