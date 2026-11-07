"use client";

import { Ambulance, ArrowRight, CalendarClock, Hospital, Stethoscope } from "lucide-react";
import Link from "next/link";

interface QuickAction {
  href: string | null;
  label: string;
  description: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  note?: string;
}

const actions: QuickAction[] = [
  {
    href: "/hospitals",
    label: "Find hospitals",
    description: "Search nearby hospitals and check reported bed availability.",
    action: "Explore",
    icon: Hospital,
  },
  {
    href: "/doctors",
    label: "Find doctors",
    description: "Doctor listings appear only when a verified provider is connected.",
    action: "Open doctors",
    icon: Stethoscope,
    note: "No verified doctor provider configured",
  },
  {
    href: "/ambulance",
    label: "Ambulance",
    description: "Emergency numbers and what to tell a dispatcher.",
    action: "Open assistance",
    icon: Ambulance,
  },
  {
    href: null,
    label: "Appointments",
    description: "Upcoming visits appear here when appointment booking is connected.",
    action: "Not connected",
    icon: CalendarClock,
    note: "Appointment service not connected",
  },
];

export function QuickActionCards() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="sr-only">
        Quick actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((card) => {
          const content = (
            <>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-transform group-hover:scale-105">
                  <card.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold transition-colors group-hover:text-primary">
                    {card.label}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{card.description}</p>
                </div>
              </div>
              <span className="mt-4 flex items-center justify-between gap-2 text-xs font-semibold text-primary">
                {card.action}
                {card.href ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                ) : null}
              </span>
            </>
          );

          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              aria-disabled="true"
              className="group flex flex-col justify-between rounded-xl border border-dashed border-border bg-card p-4 text-muted-foreground"
            >
              {content}
              {card.note ? (
                <span className="mt-2 text-xs text-muted-foreground">{card.note}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
