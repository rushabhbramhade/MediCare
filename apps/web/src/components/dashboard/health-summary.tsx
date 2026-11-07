"use client";

import type { DashboardOverviewResponse } from "@medicare/contracts";
import { CalendarDays, FileText, HeartPulse, Pill } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Overview = DashboardOverviewResponse;

function SectionRow({
  icon: Icon,
  title,
  connected,
  emptyText,
  disconnectedText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  connected: boolean;
  emptyText: string;
  disconnectedText: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {connected ? emptyText : disconnectedText}
        </p>
      </div>
    </div>
  );
}

export function HealthSummarySection({
  overview,
  isLoading,
}: {
  overview: Overview | undefined;
  isLoading: boolean;
}) {
  const appointments = overview?.upcomingAppointments;
  const records = overview?.recentMedicalRecords;
  const medications = overview?.medicationSummary;

  return (
    <section
      aria-labelledby="health-summary-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
            <HeartPulse aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 id="health-summary-heading" className="font-semibold">
            Health summary
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">ABHA not connected</span>
      </div>

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your health summary…</p>
        ) : (
          <>
            <SectionRow
              icon={CalendarDays}
              title="Upcoming appointment"
              connected={appointments?.connected === true}
              emptyText="No upcoming appointments."
              disconnectedText="Appointment booking is not connected yet."
            />
            <SectionRow
              icon={FileText}
              title="Recent medical record"
              connected={records?.connected === true}
              emptyText="No medical records uploaded yet."
              disconnectedText="Medical record storage is not connected yet."
            />
            <SectionRow
              icon={Pill}
              title="Medication"
              connected={medications?.connected === true}
              emptyText="No medications on record."
              disconnectedText="Medication tracking is not connected yet."
            />
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/medical-records" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Medical records
        </Link>
        <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Profile
        </Link>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Your health summary will appear here when you add medical records or connect supported
        services. ABHA linking is not implemented in this build.
      </p>
    </section>
  );
}
