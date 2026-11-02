import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { HospitalFinder } from "@/features/hospitals/components/hospital-finder";

export const metadata: Metadata = { title: "Hospitals" };

export default function HospitalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospitals near you"
        description="Share your location to see the area on a map. Hospital and bed data will only appear when a verified source is connected."
      />
      <HospitalFinder />
    </div>
  );
}
