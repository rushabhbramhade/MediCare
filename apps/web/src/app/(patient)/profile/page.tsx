import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatusNote } from "@/components/shared/status-note";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOutAction } from "@/features/auth/actions";
import { formatPhoneDisplay } from "@/lib/format";
import { getSessionSummary } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSessionSummary();
  if (!session) redirect("/login");

  const rows = [
    { label: "Mobile", value: formatPhoneDisplay(session.phone) },
    { label: "Email", value: session.email ?? "Not provided" },
    { label: "Role", value: session.role },
    { label: "Account ID", value: session.id },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="The account details Medicare received from Supabase Auth."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-muted-foreground">{row.label}</dt>
                <dd className="break-all text-sm sm:col-span-2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <StatusNote variant="info" title="Profile editing is not enabled">
        Adding your name, date of birth, emergency contacts and consent preferences is the next
        patient-module milestone.
      </StatusNote>

      <form action={signOutAction}>
        <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
          Sign out
        </button>
      </form>
    </div>
  );
}
