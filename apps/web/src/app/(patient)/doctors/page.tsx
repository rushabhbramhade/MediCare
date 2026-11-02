import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { DoctorSearchPanel } from "@/features/doctors/components/doctor-search-panel";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        description="Find verified doctors and book an appointment through a provider integration."
      />
      <DoctorSearchPanel />
    </div>
  );
}
