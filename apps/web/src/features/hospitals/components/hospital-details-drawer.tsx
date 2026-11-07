"use client";

import type { HospitalSummary, ResourceType } from "@medicare/types";
import {
  Ambulance,
  Building2,
  Clock,
  MapPin,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/stores/location-store";
import {
  RESOURCE_LABELS,
  directionsUrl,
  emergencyBadge,
  hospitalAddress,
  hospitalTypeLabel,
  latestReport,
} from "../hospital-data";

const RESOURCE_ORDER: ResourceType[] = [
  "general_bed",
  "icu_bed",
  "oxygen",
  "ventilator",
  "ambulance",
];

export function HospitalDetailsDrawer({
  hospital,
  maxStalenessHours,
  origin,
  onClose,
}: {
  hospital: HospitalSummary;
  maxStalenessHours: number | null;
  origin: Coordinates | null;
  onClose: () => void;
}) {
  const emergency = emergencyBadge(hospital.hasEmergency);
  const ownership = hospitalTypeLabel(hospital.hospitalType);

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="hospital-details-title"
      className="absolute inset-x-3 bottom-3 z-[1000] flex max-h-[78%] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl max-lg:fixed max-lg:bottom-3 lg:left-auto lg:w-[400px]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="hospital-details-title" className="text-base font-semibold">
              {hospital.name}
            </h2>
            {hospital.isStale ? <Badge variant="outline">May be stale</Badge> : null}
          </div>
          <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{hospitalAddress(hospital)}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hospital.distanceKm} km straight-line from your search point
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hospital details"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={emergency.available ? "emergency" : "outline"}>
            {emergency.label}
          </Badge>
          {ownership ? (
            <Badge variant="outline">
              <Building2 aria-hidden="true" className="h-3 w-3" />
              {ownership}
            </Badge>
          ) : null}
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
        </div>

        <section aria-labelledby="availability-heading">
          <h3 id="availability-heading" className="text-sm font-semibold">
            Operational availability
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Only values reported by a hospital source are shown. Missing values stay
            “not reported”. A report is not a confirmed reservation.
          </p>
          <dl className="mt-2 divide-y divide-border rounded-lg border border-border">
            {RESOURCE_ORDER.map((resourceType) => {
              const view = latestReport(hospital, resourceType, maxStalenessHours);
              return (
                <div key={resourceType} className="px-3 py-2">
                  <dt className="text-xs font-medium text-muted-foreground">
                    {RESOURCE_LABELS[resourceType]}
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {view ? (
                      <>
                        <span
                          className={cn(
                            "font-medium",
                            view.fresh ? "text-foreground" : "text-amber-900",
                          )}
                        >
                          {view.label}
                          {view.fresh ? "" : " · stale"}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          Source: {view.report.source} · Reported{" "}
                          {formatDateTime(view.report.reportedAt)}
                          {view.report.verificationStatus === "verified"
                            ? " · verified"
                            : ""}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not reported</span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section aria-labelledby="record-heading">
          <h3 id="record-heading" className="text-sm font-semibold">
            Directory record
          </h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Opening hours</dt>
              <dd className="text-right">
                {hospital.openingHours ??
                  (hospital.isOpen24x7 === true
                    ? "Reported open 24×7"
                    : "Not reported")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Emergency department</dt>
              <dd className="text-right">{emergency.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ambulance service</dt>
              <dd className="text-right">
                {hospital.hasAmbulance === true
                  ? "Reported available"
                  : hospital.hasAmbulance === false
                    ? "Not listed"
                    : "Not reported"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Specialties</dt>
              <dd className="max-w-[60%] text-right">
                {hospital.specialties.length > 0
                  ? hospital.specialties.join(", ")
                  : "Not reported"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-right">{hospital.phone ?? "Not reported"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Directory source</dt>
              <dd className="text-right">{hospital.source}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Record updated</dt>
              <dd className="text-right">{formatDateTime(hospital.lastSyncedAt)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Medicare does not display ratings, on-duty doctor names or live ambulance
            tracking unless a verified source provides them.
          </p>
        </section>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border p-3">
        <a
          href={directionsUrl(hospital, origin)}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "default" }), "flex-1")}
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          Start directions
        </a>
        {hospital.phone ? (
          <a
            href={`tel:${hospital.phone}`}
            className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
            Call hospital
          </a>
        ) : (
          <span className="flex-1 rounded-lg border border-dashed border-border px-3 py-2 text-center text-xs text-muted-foreground">
            No verified phone number
          </span>
        )}
      </div>
    </section>
  );
}
