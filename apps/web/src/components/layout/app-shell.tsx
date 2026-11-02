"use client";

import {
  Ambulance,
  FolderHeart,
  Hospital,
  LayoutDashboard,
  LogOut,
  Pill,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/logo";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/hospitals", label: "Hospitals", icon: Hospital },
  { href: "/icare", label: "iCare AI", icon: Sparkles },
  { href: "/medical-records", label: "Records", icon: FolderHeart },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/ambulance", label: "Ambulance", icon: Ambulance },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
        <nav aria-label="Medicare sections" className="mx-auto w-full max-w-6xl px-4 pb-2 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto pb-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Medicare does not replace professional medical advice.</p>
          <p>
            Emergency?{" "}
            <a
              className="font-medium text-emergency underline-offset-4 hover:underline"
              href="tel:112"
            >
              Call 112
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
