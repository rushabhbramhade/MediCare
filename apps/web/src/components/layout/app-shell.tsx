"use client";

import {
  Ambulance,
  FolderHeart,
  Hospital,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Sparkles,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DashboardLocation } from "@/components/dashboard/dashboard-location";
import { DashboardSearch } from "@/components/dashboard/dashboard-search";
import { Logo } from "@/components/shared/logo";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hospitals", label: "Hospitals", icon: Hospital },
  { href: "/doctors", label: "Doctors & Appointments", icon: Stethoscope },
  { href: "/icare", label: "iCare AI", icon: Sparkles },
  { href: "/medical-records", label: "Medical Records", icon: FolderHeart },
  { href: "/medicines", label: "Medicines & Pharmacies", icon: Pill },
  { href: "/ambulance", label: "Ambulance", icon: Ambulance },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-background lg:pl-72">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        id="patient-sidebar"
        aria-label="Medicare sections"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <div className="flex h-20 items-center justify-between px-4">
          <Logo href="/dashboard" subtitle="Healthcare India" />
          <button
            type="button"
            aria-label="Close navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-border bg-muted/40 p-3">
          <Link
            href="/profile"
            aria-current={isActive("/profile") ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive("/profile")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <UserRound aria-hidden="true" className="h-5 w-5 shrink-0" />
            Profile
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 lg:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="patient-sidebar"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="lg:hidden">
            <Logo href="/dashboard" />
          </div>

          <div className="min-w-0 flex-1 md:max-w-xs">
            <DashboardLocation />
          </div>

          <div className="hidden min-w-0 flex-1 lg:block">
            <DashboardSearch radiusKm={5} />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/profile"
              className="hidden min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                <UserRound aria-hidden="true" className="h-4 w-4" />
              </span>
              Account
            </Link>
          </div>
        </div>

        <div className="border-t border-border px-3 py-2 lg:hidden">
          <DashboardSearch radiusKm={5} />
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        {children}
      </main>

      <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
