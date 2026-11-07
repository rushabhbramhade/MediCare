"use client";

import { MessageSquare, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useRef } from "react";

interface AuthPhoneInputProps {
  formError: string | null;
  form: ReturnType<typeof useForm<{ phone: string }>>;
  className?: string;
}

export function AuthPhoneInput({ formError, form, className }: AuthPhoneInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { control, setValue, getValues, formState } = form;

  const phoneValue = getValues("phone") ?? "";
  const showClear = phoneValue.length > 0;
  const errorMessage = formError ?? formState.errors.phone?.message;

  function handleClear() {
    setValue("phone", "");
    inputRef.current?.focus();
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="phone" className=" text-sm text-foreground">
            Mobile Number
          </label>
          <span className=" text-xs text-muted-foreground">+91 · India</span>
        </div>

        <div
          className={[
            "flex items-center bg-card rounded-xl shadow-sm transition-shadow duration-200 border",
            errorMessage ? "border-destructive" : "border-input",
            errorMessage
              ? "focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
              : "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          ].join(" ")}
        >
          <div className="flex items-center gap-1.5 px-3.5 py-3 bg-muted rounded-l-xl text-foreground select-none">
            <span className="text-base leading-none">🇮🇳</span>
            <span className=" text-sm font-semibold text-foreground">
              +91
            </span>
          </div>
          <div className="relative flex-1">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => {
                const { ref, ...fieldProps } = field;
                // ref is handled by inputRef; RHF's field.ref is not needed here.
                void ref;
                return (
                  <input
                    ref={inputRef}
                    {...fieldProps}
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="Enter your 10-digit mobile number"
                    onChange={(event) => {
                      field.onChange(event.target.value.replace(/\D/g, "").slice(0, 10));
                    }}
                    className="w-full bg-transparent px-4 py-3.5  text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                );
              }}
            />
            {showClear && (
              <button
                aria-label="Clear input"
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <p id="phone-error" role="alert" className="text-sm text-destructive mt-1">
            {errorMessage}
          </p>
        )}

        <p className=" text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
          <MessageSquare aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
          We&apos;ll send a 6-digit one-time password (OTP) via SMS to verify.
        </p>
      </div>
    </div>
  );
}
