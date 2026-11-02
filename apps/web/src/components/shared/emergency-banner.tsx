import { Phone } from "lucide-react";
import Link from "next/link";

export function EmergencyBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emergency/30 bg-emergency/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emergency text-emergency-foreground">
          <Phone aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">In an emergency, call 112</p>
          <p className="text-sm text-muted-foreground">
            For an ambulance, call 108 where the service operates.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="tel:112"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emergency px-5 text-sm font-medium text-emergency-foreground hover:opacity-90"
        >
          Call 112
        </Link>
        <Link
          href="/emergency"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-emergency/40 px-5 text-sm font-medium hover:bg-emergency/10"
        >
          Emergency help
        </Link>
      </div>
    </div>
  );
}
