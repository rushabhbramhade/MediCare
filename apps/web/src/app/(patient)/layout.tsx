import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionSummary } from "@/lib/session";

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const session = await getSessionSummary();
  if (!session) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
