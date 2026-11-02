import { Ambulance, Phone } from "lucide-react";
import { StatusNote } from "@/components/shared/status-note";

export function AmbulancePanel() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="tel:112"
          className="flex items-center gap-4 rounded-xl bg-emergency p-5 text-emergency-foreground hover:opacity-90"
        >
          <Phone aria-hidden="true" className="h-6 w-6" />
          <span>
            <span className="block text-lg font-semibold">Call 112</span>
            <span className="block text-sm opacity-90">National emergency number</span>
          </span>
        </a>
        <a
          href="tel:108"
          className="flex items-center gap-4 rounded-xl border border-emergency/30 bg-card p-5 hover:bg-emergency/5"
        >
          <Ambulance aria-hidden="true" className="h-6 w-6 text-emergency" />
          <span>
            <span className="block text-lg font-semibold">Call 108</span>
            <span className="block text-sm text-muted-foreground">
              Ambulance service where available
            </span>
          </span>
        </a>
      </div>

      <StatusNote variant="warning" title="In-app ambulance requests are not connected">
        Medicare does not dispatch ambulances in this build, and it will never show a simulated
        dispatch. Calling 112 or your local ambulance service is the reliable path.
      </StatusNote>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">What to tell the dispatcher</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Your exact location and the nearest landmark.</li>
          <li>What happened and how many people need help.</li>
          <li>A phone number the responder can call back.</li>
          <li>
            Follow the dispatcher&apos;s instructions; they can guide you while help is coming.
          </li>
        </ul>
      </div>
    </div>
  );
}
