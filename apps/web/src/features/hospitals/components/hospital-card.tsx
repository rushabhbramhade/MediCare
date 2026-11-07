"use client";

import type { HospitalSummary } from "@medicare/types";
import {
  Ambulance,
  Building2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/stores/location-store";
import {
  directionsUrl,
  emergencyBadge,
  hospitalAddress,
  hospitalTypeLabel,
  latestReport,
} from "../hospital-data";

function AvailabilityLine({
  label,
  view,
}: {
  label: string;
  view: ReturnType<typeof latestReport>;
}) {
  if (!view) {
    return (
      <span className="text-xs text-muted-foreground">{label}: not reported</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-1 text-xs font-medium",
        view.fresh ? "text-foreground" : "text-amber-900",
      )}
    >
      {label}: {view.label}
      {!view.fresh ? " (stale)" : ""}
    </span>
  );
}

export function HospitalCard({
  hospital,
  maxStalenessHours,
  selected,
  onSelect,
  origin,
}: {
  hospital: HospitalSummary;
  maxStalenessHours: number | null;
  selected: boolean;
  onSelect: () => void;
  origin: Coordinates | null;
}) {
  const emergency = emergencyBadge(hospital.hasEmergency);
  const ownership = hospitalTypeLabel(hospital.hospitalType);
  const general = latestReport(hospital, "general_bed", maxStalenessHours);
  const icu = latestReport(hospital, "icu_bed", maxStalenessHours);
  const hasAnyReport = general !== null || icu !== null;

  return (
    <article
      onClick={onSelect}
      className={cn(
        "cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-colors",
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold" title={hospital.name}>
            {hospital.name}
          </h3>
          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{hospitalAddress(hospital)}</span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-semibold">{hospital.distanceKm} km</span>
          <p className="text-[11px] text-muted-foreground">straight-line</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge
          variant={
            emergency.available ? "emergency" : emergency.known ? "outline" : "outline"
          }
        >
          <ShieldAlert aria-hidden="true" className="h-3 w-3" />
          {emergency.label}
        </Badge>
        {ownership ? <Badge variant="outline">{ownership}</Badge> : null}
        {hospital.isOpen24x7 === true ? (
          <Badge variant="outline">
            <Clock aria-hidden="true" className="h-3 w-3" />
            24×7 reported
          </Badge>
        ) : null}
        {hospital.hasAmbulance === true ? (
          <Badge variant="outline">
            <Ambulance aria-hidden="true" className="h-3 w-3" />
            Ambulance service reported
          </Badge>
        ) : null}
        {hospital.isStale ? <Badge variant="outline">Record may be stale</Badge> : null}
      </div>

      <div className="mt-3 space-y-1 rounded-lg bg-muted/50 p-2.5">
        {hasAnyReport ? (
          <>
            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 aria-hidden="true" className="h-3 w-3" />
              Reported availability
            </div>
            <div className="flex flex-col gap-0.5">
              <AvailabilityLine label="General beds" view={general} />
              <AvailabilityLine label="ICU beds" view={icu} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {[general?.report, icu?.report]
                .filter(Boolean)
                .map((report) => report!.source)
                .filter((source, index, all) => all.indexOf(source) === index)
                .join(", ")}
              {" · "}
              Latest report{" "}
              {formatDateTime(
                [general?.report, icu?.report]
                  .filter(Boolean)
                  .sort(
                    (a, b) =>
                      new Date(b!.reportedAt).getTime() - new Date(a!.reportedAt).getTime(),
                  )[0]!.reportedAt,
              )}
              . Not a confirmed reservation.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Availability not reported</p>
            <p className="text-[11px] text-muted-foreground">
              No hospital has reported bed or ICU capacity for this record.
            </p>
          </>
        )}
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
        >
          Details
        </button>
        <a
          href={directionsUrl(hospital, origin)}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "min-h-10")}
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          Directions
        </a>
        {hospital.phone ? (
          <a
            href={`tel:${hospital.phone}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            Call
          </a>
        ) : null}
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Source: {hospital.source}. Record updated {formatDateTime(hospital.lastSyncedAt)}.
      </p>
    </article>
  );
}
