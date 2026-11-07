"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiClientError } from "@medicare/api-client";
import type { DashboardOverviewResponse } from "@medicare/contracts";
import Link from "next/link";
import { useState } from "react";
import { AmbulanceStatusSection } from "@/components/dashboard/ambulance-status";
import { EmergencySection } from "@/components/dashboard/emergency-section";
import { HealthSummarySection } from "@/components/dashboard/health-summary";
import { NearbyHospitalsSection } from "@/components/dashboard/nearby-hospitals";
import { QuickActionCards } from "@/components/dashboard/quick-action-cards";
import { StatusNote } from "@/components/shared/status-note";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getBrowserApiClient } from "@/lib/api-browser";
import { displayName, greetingForHour } from "@/lib/dashboard-format";
import { formatPhoneDisplay } from "@/lib/format";

const EMPTY_HOSPITALS: DashboardOverviewResponse["hospitals"] = {
  items: [],
  total: 0,
  radiusKm: 5,
  source: null,
};

export function DashboardClient() {
  const { coords } = useGeolocation();
  const [radiusKm, setRadiusKm] = useState(5);
  const greeting = greetingForHour(new Date().getHours());

  const overview = useQuery({
    queryKey: ["dashboard-overview", coords?.latitude, coords?.longitude, radiusKm],
    retry: 1,
    staleTime: 60_000,
    queryFn: () =>
      getBrowserApiClient().dashboard.overview({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        radiusKm,
      }),
  });

  const profile = overview.data?.profile ?? null;
  const hasLocation = coords !== null;
  const sessionExpired =
    overview.error instanceof ApiClientError && overview.error.status === 401;
  const firstName = displayName(profile?.fullName);

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1
              suppressHydrationWarning
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Emergency help, nearby hospitals and your health summary in one place.
            </p>
          </div>

          {profile ? (
            <p className="shrink-0 text-xs text-muted-foreground sm:pt-1">
              {[
                profile.phone ? formatPhoneDisplay(profile.phone) : null,
                profile.fullName,
                "Patient",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : overview.isLoading ? (
            <p className="shrink-0 text-xs text-muted-foreground sm:pt-1">
              Loading your profile…
            </p>
          ) : (
            <p className="shrink-0 text-xs text-muted-foreground sm:pt-1">
              Profile incomplete.{" "}
              <Link className="font-medium text-primary hover:underline" href="/profile">
                Complete your profile
              </Link>
            </p>
          )}
        </div>
      </section>

      {sessionExpired ? (
        <StatusNote variant="warning" title="Your session expired">
          <Link className="font-medium underline underline-offset-4" href="/login">
            Sign in again
          </Link>{" "}
          to load your dashboard.
        </StatusNote>
      ) : overview.isError && !overview.data ? (
        <StatusNote variant="warning" title="Unable to load your dashboard">
          The Medicare API did not respond. Please check your connection and{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            onClick={() => void overview.refetch()}
          >
            try again
          </button>
          .
        </StatusNote>
      ) : null}

      <EmergencySection numbers={overview.data?.emergencyNumbers ?? null} />

      <QuickActionCards />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <NearbyHospitalsSection
            hospitals={overview.data?.hospitals ?? EMPTY_HOSPITALS}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            isLoading={overview.isLoading || (overview.isFetching && hasLocation)}
            error={overview.error}
            hasLocation={hasLocation}
            onRetry={() => void overview.refetch()}
          />
        </div>
        <div className="space-y-4 lg:col-span-5">
          <AmbulanceStatusSection overview={overview.data} />
          <HealthSummarySection overview={overview.data} isLoading={overview.isLoading} />
        </div>
      </div>

      <p className="pb-2 text-xs text-muted-foreground">
        Medicare shows only data from connected sources. Unknown bed availability, unlinked health
        records and unavailable services are labelled honestly.
      </p>
    </div>
  );
}
