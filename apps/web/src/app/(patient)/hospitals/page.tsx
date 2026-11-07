import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HospitalWorkspace } from "@/features/hospitals/components/hospital-workspace";
import { OsmDiscoveryPanel } from "@/features/hospitals/components/osm-discovery-panel";

export const metadata: Metadata = { title: "Hospitals" };

export default function HospitalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospitals near you"
        description="Search verified hospital records, compare reported availability and open directions. Bed counts appear only when a hospital has reported them."
      />
      <HospitalWorkspace />
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          OpenStreetMap discovery (unverified)
        </summary>
        <div className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            OpenStreetMap can suggest hospitals and pharmacies near a point. These are
            directory features, not verified hospital records: emergency capability and
            bed availability are unknown.
          </p>
          <OsmDiscoveryPanel
            featureType="hospital"
            title="OpenStreetMap hospitals"
            description="Search OpenStreetMap for hospital features near a point. Results are unverified."
          />
        </div>
      </details>
    </div>
  );
}
