import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/30">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/emergency" className="text-sm font-medium text-emergency hover:underline">
          Emergency? Call 112
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
        Medicare does not replace professional medical advice.
      </footer>
    </div>
  );
}
