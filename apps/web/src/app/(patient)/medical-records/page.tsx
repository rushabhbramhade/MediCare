import type { Metadata } from "next";
import { FolderHeart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusNote } from "@/components/shared/status-note";
import { RecordUploadPanel } from "@/features/medical-records/components/record-upload-panel";

export const metadata: Metadata = { title: "Medical records" };

export default function MedicalRecordsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Health vault"
        description="Keep reports, prescriptions and discharge summaries in one private place."
      />

      <StatusNote variant="warning" title="Private storage is not configured">
        You can check a file against the upload rules below, but nothing is uploaded or stored in
        this build.
      </StatusNote>

      <RecordUploadPanel />

      <EmptyState
        icon={FolderHeart}
        title="No records yet"
        description="When private storage is connected, your documents will appear here with who can access them and for how long."
      />
    </div>
  );
}
