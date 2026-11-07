"use client";

import type { AmbulanceEmergencyResponse } from "@medicare/contracts";
import { AlertTriangle, Ambulance, Phone, Share2, Siren } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";

export function EmergencySection({
  numbers,
}: {
  numbers: AmbulanceEmergencyResponse | null;
}) {
  const { coords, status, error, requestLocation } = useGeolocation();
  const [explained, setExplained] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const national = numbers?.numbers.find((item) => item.type === "national");
  const ambulance = numbers?.numbers.find((item) => item.type === "state");

  async function shareLocation() {
    if (!coords) return;
    const url = `https://www.google.com/maps/?q=${coords.latitude},${coords.longitude}`;
    setShareNote(null);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "My location — Medicare",
          text: "Here is my current location for emergency assistance.",
          url,
        });
        return;
      } catch {
        // Sharing was cancelled; fall through to opening the map.
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setShareNote("Opened the coordinates in a new tab so you can share them.");
  }

  return (
    <section
      aria-labelledby="emergency-heading"
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emergency/10 text-emergency">
          <Siren aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="emergency-heading" className="text-lg font-semibold">
              Emergency response hotline
            </h2>
            <span className="rounded-full bg-emergency/10 px-2 py-0.5 text-xs font-medium text-emergency">
              National emergency services
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Call first responders directly. Medicare does not dispatch or track ambulances.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
        <a
          href="tel:112"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Phone aria-hidden="true" className="h-4 w-4 text-emergency" />
          <span>
            National <strong>112</strong>
          </span>
        </a>
        <a
          href="tel:108"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Ambulance aria-hidden="true" className="h-4 w-4 text-emergency" />
          <span>
            Ambulance <strong>108</strong>
          </span>
        </a>
        <Button
          className="min-h-11 bg-emergency text-emergency-foreground shadow-sm hover:bg-emergency/90"
          onClick={() => setExplained(true)}
          aria-expanded={explained}
          aria-controls="sos-panel"
        >
          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
          SOS priority
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        112 is India&apos;s national emergency number. 108 is a state ambulance service and does not
        operate everywhere; if it does not connect, call 112.
        {national ? ` ${national.description}.` : ""}
        {ambulance ? ` ${ambulance.description}.` : ""}
      </p>

      {explained ? (
        <div id="sos-panel" className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm font-medium">What SOS priority does</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Asks your browser for your current location.</li>
            <li>Shows the exact coordinates available to Medicare.</li>
            <li>Offers a call button for 112.</li>
            <li>Lets you share the coordinates with your device&apos;s share sheet.</li>
          </ol>
          <p className="mt-2 text-sm text-muted-foreground">
            It does not notify a hospital, book an ambulance, or send your location to an operator.
            Calling 112 is the emergency action.
          </p>

          {!coords ? (
            <Button
              className="mt-3"
              onClick={requestLocation}
              disabled={status === "locating"}
            >
              {status === "locating" ? "Requesting location…" : "Allow location and continue"}
            </Button>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location available to Medicare
                </p>
                <p className="mt-1 font-mono text-sm">
                  {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="tel:112"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emergency px-4 text-sm font-medium text-emergency-foreground hover:opacity-90"
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  Call 112 now
                </a>
                <Button variant="outline" onClick={shareLocation}>
                  <Share2 aria-hidden="true" className="h-4 w-4" />
                  Share location
                </Button>
                <Button variant="ghost" onClick={() => setExplained(false)}>
                  Close
                </Button>
              </div>
              {shareNote ? <p className="text-xs text-muted-foreground">{shareNote}</p> : null}
            </div>
          )}

          {error ? (
            <p role="status" className="mt-3 text-sm text-amber-900">
              {error} You can still call 112. Use the location control at the top of the
              dashboard to enter coordinates manually.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted-foreground">
        Need ambulance information without an emergency?{" "}
        <Link href="/ambulance" className="font-medium text-primary hover:underline">
          Open ambulance assistance
        </Link>
        .
      </p>
    </section>
  );
}
