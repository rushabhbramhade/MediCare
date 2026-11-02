import type { Metadata } from "next";
import { Ambulance, MapPin, Phone, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StatusNote } from "@/components/shared/status-note";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emergency help",
  description: "Emergency numbers and what to do while help is on the way.",
};

export default function EmergencyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Emergency help"
        description="If someone is in danger, call emergency services now. Do not wait for an app to decide."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="tel:112"
          className="flex items-center gap-4 rounded-xl bg-emergency p-6 text-emergency-foreground hover:opacity-90"
        >
          <Phone aria-hidden="true" className="h-7 w-7" />
          <span>
            <span className="block text-2xl font-semibold">Call 112</span>
            <span className="block text-sm opacity-90">National emergency number</span>
          </span>
        </a>
        <a
          href="tel:108"
          className="flex items-center gap-4 rounded-xl border border-emergency/30 bg-card p-6 hover:bg-emergency/5"
        >
          <Ambulance aria-hidden="true" className="h-7 w-7 text-emergency" />
          <span>
            <span className="block text-2xl font-semibold">Call 108</span>
            <span className="block text-sm text-muted-foreground">
              Ambulance service where available
            </span>
          </span>
        </a>
      </div>

      <StatusNote variant="warning" title="Ambulance availability varies">
        108 operates in many states but not everywhere. If it does not connect, call 112 and follow
        the dispatcher.
      </StatusNote>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert aria-hidden="true" className="h-5 w-5 text-emergency" />
          While you wait for help
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Make the area safe for yourself and the person who needs help, if you can.</li>
          <li>Stay on the line and follow the dispatcher&apos;s instructions.</li>
          <li>Share your exact location and the nearest landmark.</li>
          <li>Unlock the door or send someone to meet the ambulance.</li>
          <li>Do not drive yourself if you are unwell or injured.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Find a nearby hospital</h2>
        <p className="text-sm text-muted-foreground">
          The hospital finder can show your area on a map. Verified hospital and bed data is not
          connected in this build.
        </p>
        <Link href="/hospitals" className={cn(buttonVariants({ variant: "outline" }))}>
          <MapPin aria-hidden="true" className="h-4 w-4" />
          Open hospital finder
        </Link>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This page is general guidance, not medical advice. Follow the instructions of emergency
        dispatchers and qualified clinicians.
      </p>
    </div>
  );
}
