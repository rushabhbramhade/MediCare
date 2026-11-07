"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { applyOtpInput, OTP_LENGTH } from "../otp";

export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
  autoFocus,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? "");

  function apply(index: number, raw: string) {
    const next = applyOtpInput(digits, index, raw);
    onChange(next.value);
    refs.current[next.focusIndex]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    apply(index, event.clipboardData.getData("text"));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      onChange(next);
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div role="group" aria-label="Six-digit verification code" className="grid grid-cols-6 gap-1.5 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChange={(event) => apply(index, event.target.value)}
          onPaste={(event) => handlePaste(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={(event) => event.currentTarget.select()}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border bg-card text-center text-xl font-semibold text-navy shadow-sm outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/25",
            invalid ? "border-destructive text-destructive" : "border-input",
            disabled && "opacity-60",
          )}
        />
      ))}
    </div>
  );
}
