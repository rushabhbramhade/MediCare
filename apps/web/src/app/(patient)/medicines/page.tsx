import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MedicineSearchPanel } from "@/features/medicines/components/medicine-search-panel";

export const metadata: Metadata = { title: "Medicines" };

export default function MedicinesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicines"
        description="Search medicine information and find a nearby pharmacy when licensed data is connected."
      />
      <MedicineSearchPanel />
    </div>
  );
}
