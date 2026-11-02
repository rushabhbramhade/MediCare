import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AmbulancePanel } from "@/features/ambulance/components/ambulance-panel";

export const metadata: Metadata = { title: "Ambulance" };

export default function AmbulancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambulance and emergency help"
        description="Reach a real emergency service. Medicare does not simulate dispatch."
      />
      <AmbulancePanel />
    </div>
  );
}
