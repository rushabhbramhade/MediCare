"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthBrand } from "@/features/auth/components/auth-brand";
import { AuthFeaturePanel } from "@/features/auth/components/auth-feature-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10"
      >
        <div className="grid w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_24px_60px_-28px_rgba(23,43,77,0.35)] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="flex min-w-0 flex-col p-6 sm:p-10 lg:min-h-[660px] lg:p-12">
            <AuthBrand />
            <div className="mt-8 flex flex-1 flex-col sm:mt-10">{children}</div>
          </section>
          <AuthFeaturePanel />
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="underline-offset-4 hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline-offset-4 hover:text-primary hover:underline">
            Terms of Service
          </Link>
          <Link href="/emergency" className="underline-offset-4 hover:text-primary hover:underline">
            Emergency? Call 112
          </Link>
        </div>
        <p>Medicare does not replace professional medical advice.</p>
      </footer>
    </div>
  );
}
