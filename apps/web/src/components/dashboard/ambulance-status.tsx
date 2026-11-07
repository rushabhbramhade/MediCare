"use client";

import type { DashboardOverviewResponse } from "@medicare/contracts";
import { Ambulance, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AmbulanceStatusSection({
  overview,
}: {
  overview: DashboardOverviewResponse | undefined;
}) {
  const active = overview?.activeAmbulanceRequest;

  return (
    <section
      aria-labelledby="ambulance-status-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emergency/10 text-emergency">
            <Ambulance aria-hidden="true" className="h-4 w-4" />
          </span>
          <h2 id="ambulance-status-heading" className="font-semibold">
            Ambulance
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            active?.connected
              ? "border-emergency/30 bg-emergency/10 text-emergency"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {active?.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-medium">No active ambulance request</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {active?.connected
            ? "When an operator accepts your request, its status and location will appear here."
            : "Live dispatch and tracking are not connected in this build. Medicare will not show a simulated ambulance."}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/ambulance"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Ambulance aria-hidden="true" className="h-4 w-4" />
          Assistance
        </Link>
        <a
          href="tel:108"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-input px-3 text-sm font-medium hover:bg-accent"
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
          Call 108
        </a>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        108 is a state ambulance service and does not operate everywhere. If it does not connect,
        call 112.
      </p>
    </section>
  );
}
