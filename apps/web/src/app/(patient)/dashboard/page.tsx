import type { Metadata } from "next";
import {
  Ambulance,
  ArrowRight,
  FolderHeart,
  Hospital,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApiStatusCard } from "@/components/shared/api-status-card";
import { EmergencyBanner } from "@/components/shared/emergency-banner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusNote } from "@/components/shared/status-note";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatPhoneDisplay } from "@/lib/format";
import { getSessionSummary } from "@/lib/session";
import { getApiHealth } from "@/services/health";

export const metadata: Metadata = { title: "Home" };

const quickLinks = [
  { href: "/hospitals", label: "Hospitals", description: "See your area on a map", icon: Hospital },
  { href: "/icare", label: "iCare AI", description: "Understand a report", icon: Sparkles },
  {
    href: "/medical-records",
    label: "Records",
    description: "Keep documents together",
    icon: FolderHeart,
  },
  { href: "/doctors", label: "Doctors", description: "Find and book care", icon: Stethoscope },
  { href: "/medicines", label: "Medicines", description: "Search medicines", icon: Pill },
  { href: "/ambulance", label: "Ambulance", description: "Emergency numbers", icon: Ambulance },
];

export default async function DashboardPage() {
  const [session, health] = await Promise.all([getSessionSummary(), getApiHealth()]);
  if (!session) redirect("/login");

  const contact = session.phone
    ? formatPhoneDisplay(session.phone)
    : (session.email ?? "your account");

  return (
    <div className="space-y-6">
      <PageHeader title="Namaste" description={`Signed in as ${contact}.`} />

      <EmergencyBanner />

      <div className="grid gap-4 md:grid-cols-2">
        <ApiStatusCard initial={health} />
        <Card>
          <CardContent className="space-y-2 p-5">
            <CardTitle className="text-base">Your role</CardTitle>
            <p className="text-sm capitalize text-muted-foreground">{session.role}</p>
            <p className="text-sm text-muted-foreground">
              Roles are set by Medicare administrators. Profile and consent management are not
              enabled yet.
            </p>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="quick-actions" className="space-y-3">
        <h2 id="quick-actions" className="text-lg font-semibold">
          Where do you want to go?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>

      <StatusNote variant="warning" title="This is an early build">
        Sign-in, emergency information and the location map work. Provider data, record storage and
        iCare AI are not connected, so those screens say so instead of showing invented data.
      </StatusNote>
    </div>
  );
}
