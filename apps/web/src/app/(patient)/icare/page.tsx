import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { IcarePanel } from "@/features/icare/components/icare-panel";

export const metadata: Metadata = { title: "iCare AI" };

export default function IcarePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="iCare AI"
        description="Plain-language help with reports and symptoms — built to explain, never to diagnose."
      />
      <IcarePanel />
    </div>
  );
}
