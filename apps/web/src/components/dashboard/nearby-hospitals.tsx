"use client";

import type { DashboardHospital, DashboardOverviewResponse } from "@medicare/contracts";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  capacityStatusLabel,
  formatDistanceKm,
  hospitalAddress,
  resourceTypeLabel,
} from "@/lib/dashboard-format";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RADIUS_OPTIONS = [2, 5, 10];

const CAPACITY_STYLES: Record<DashboardHospital["capacityStatus"], string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-900",
  LIMITED: "border-amber-200 bg-amber-50 text-amber-900",
  FULL: "border-emergency/30 bg-emergency/10 text-emergency",
  STALE: "border-amber-200 bg-amber-50 text-amber-900",
  UNKNOWN: "border-border bg-muted text-muted-foreground",
};

function CapacityBadge({ status }: { status: DashboardHospital["capacityStatus"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        CAPACITY_STYLES[status],
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "AVAILABLE"
            ? "bg-emerald-600"
            : status === "FULL"
              ? "bg-emergency"
              : status === "LIMITED" || status === "STALE"
                ? "bg-amber-600"
                : "bg-muted-foreground",
        )}
      />
      {capacityStatusLabel(status)}
    </span>
  );
}

function HospitalCard({ hospital }: { hospital: DashboardHospital }) {
  // Show only the categories belonging to the report the status was computed from.
  const reportedAt = hospital.capacityReportedAt
    ? new Date(hospital.capacityReportedAt).getTime()
    : null;
  const reported = hospital.availability.filter(
    (item) =>
      item.status !== "UNKNOWN" &&
      reportedAt !== null &&
      new Date(item.reportedAt).getTime() === reportedAt,
  );
  const allReported = hospital.availability.filter((item) => item.status !== "UNKNOWN");
  const unknown = reported.length === 0 || hospital.capacityStatus === "UNKNOWN";

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Building2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold">{hospital.name}</h3>
            <p className="mt-0.5 flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{hospitalAddress(hospital)}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatDistanceKm(hospital.distanceKm)} away
              </span>
              <span aria-hidden="true">·</span>
              <span>Straight-line distance</span>
              {hospital.hasEmergency === true ? (
                <Badge variant="emergency">Emergency services</Badge>
              ) : hospital.hasEmergency === false ? (
                <Badge variant="outline">No emergency services listed</Badge>
              ) : (
                <Badge variant="outline">Emergency services unknown</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <CapacityBadge status={hospital.capacityStatus} />
          <span className="text-xs text-muted-foreground">
            {hospital.verificationStatus === "verified"
              ? "Verified hospital record"
              : "Hospital record may be stale"}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-muted/60 p-3">
        {unknown ? (
          <div>
            <p className="text-sm font-medium">Bed availability unknown</p>
            <p className="text-xs text-muted-foreground">
              No verified capacity report has been submitted for this hospital.
            </p>
          </div>
        ) : hospital.capacityStatus === "STALE" ? (
          <div>
            <p className="text-sm font-medium text-amber-900">Last hospital report is outdated</p>
            <p className="text-xs text-muted-foreground">
              Latest report: {hospital.capacityReportedAt ? formatDateTime(hospital.capacityReportedAt) : "unknown"}
              {hospital.capacitySource ? ` · ${hospital.capacitySource}` : ""}
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {reported.map((item) => (
              <div key={item.id}>
                <p className="text-xs text-muted-foreground">
                  {resourceTypeLabel(item.resourceType)}
                </p>
                <p className="text-sm font-semibold">
                  {item.quantity !== null
                    ? `${item.quantity} reported available`
                    : item.status === "FULL"
                      ? "Reported full"
                      : capacityStatusLabel(item.status)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {hospital.capacityReportedAt
          ? `Reported ${formatDateTime(hospital.capacityReportedAt)}`
          : "No capacity report"}
        {hospital.capacitySource ? ` · Source: ${hospital.capacitySource}` : ""}
        . Reported availability is not a confirmed reservation — call the hospital before travelling.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          Directions
        </a>
        {hospital.phone ? (
          <a
            href={`tel:${hospital.phone}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-input px-4 text-sm font-medium hover:bg-accent"
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            Call hospital
          </a>
        ) : null}
      </div>

      <details className="group mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          View details
          <ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Hospital type:</span>{" "}
            {hospital.hospitalType ?? "Not provided"}
          </p>
          <p>
            <span className="text-muted-foreground">Specialties:</span>{" "}
            {hospital.specialties.length > 0 ? hospital.specialties.join(", ") : "Not provided"}
          </p>
          <p>
            <span className="text-muted-foreground">Record source:</span> {hospital.source}
          </p>
          <p>
            <span className="text-muted-foreground">Record last synced:</span>{" "}
            {formatDateTime(hospital.lastSyncedAt)}
          </p>
          {allReported.length > 0 ? (
            <div>
              <span className="text-muted-foreground">All reported categories:</span>
              <ul className="mt-1 list-disc pl-5">
                {allReported.map((item) => (
                  <li key={item.id}>
                    {resourceTypeLabel(item.resourceType)}: {capacityStatusLabel(item.status)}
                    {item.quantity !== null ? ` (${item.quantity})` : ""} ·{" "}
                    {formatDateTime(item.reportedAt)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>
              <span className="text-muted-foreground">Capacity report:</span> none
            </p>
          )}
        </div>
      </details>
    </article>
  );
}

export function NearbyHospitalsSection({
  hospitals,
  radiusKm,
  onRadiusChange,
  isLoading,
  error,
  hasLocation,
  onRetry,
}: {
  hospitals: DashboardOverviewResponse["hospitals"];
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  isLoading: boolean;
  error: unknown;
  hasLocation: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="nearby-hospitals-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <Building2 aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h2 id="nearby-hospitals-heading" className="text-lg font-semibold">
              Nearby hospitals
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasLocation
                ? "Reported bed and ICU availability from connected providers."
                : "Share your location to see hospitals near you."}
            </p>
          </div>
        </div>
        <div
          className="inline-flex rounded-lg bg-muted p-1"
          role="radiogroup"
          aria-label="Search radius"
        >
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={radiusKm === option}
              disabled={!hasLocation}
              onClick={() => onRadiusChange(option)}
              className={cn(
                "min-h-8 rounded-md px-2.5 text-xs font-semibold transition-colors disabled:opacity-50",
                radiusKm === option
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option} km
            </button>
          ))}
        </div>
      </div>

      {!hasLocation ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <MapPin aria-hidden="true" className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Location not shared</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Location access may be disabled. Use the location control at the top of this page to
            allow access or enter coordinates. Medicare will not guess a city.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Finding nearby hospitals…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Unable to load nearby hospitals. Please try again.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : hospitals.source === null ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="font-medium">Live hospital data is not configured</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No licensed hospital provider is connected, so Medicare will not show invented
            hospitals, distances or bed counts. This section fills in when a provider is
            configured.
          </p>
        </div>
      ) : hospitals.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Building2 aria-hidden="true" className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No hospitals found in this area</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            No hospitals matched within {radiusKm} km. Try a wider radius or change your location.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {hospitals.total} hospital{hospitals.total === 1 ? "" : "s"} within {radiusKm} km
            </span>
            <span>Source: {hospitals.source}</span>
          </div>
          <ul className="space-y-3">
            {hospitals.items.map((hospital) => (
              <li key={hospital.id}>
                <HospitalCard hospital={hospital} />
              </li>
            ))}
          </ul>
          {hospitals.total > hospitals.items.length ? (
            <a
              href="/hospitals"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              See all hospitals <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : null}
        </>
      )}
    </section>
  );
}
