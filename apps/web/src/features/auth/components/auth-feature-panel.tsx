"use client";

import {
  Ambulance,
  Building2,
  Sparkles,
  FolderLock,
  MapPin,
  type LucideIcon,
} from "lucide-react";

const FEATURES: Array<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Building2,
    title: "Hospital & Care Discovery",
    description: "Find hospitals and care services near you.",
  },
  {
    icon: Ambulance,
    title: "Ambulance & Emergency",
    description: "Call 112 or 108 for emergency assistance.",
  },
  {
    icon: Sparkles,
    title: "iCare AI Clinical Assistant",
    description: "Understand symptoms and medical reports in plain language.",
  },
  {
    icon: FolderLock,
    title: "Digital Health Locker",
    description: "Securely store and manage your medical records.",
  },
];

const BENEFITS = [
  "Find healthcare services near you",
  "Manage your medical records with your consent",
  "Get intelligent healthcare assistance with iCare AI",
];

export function AuthFeaturePanel() {
  return (
    <aside className="relative isolate hidden flex-col justify-between overflow-hidden border-l border-border bg-muted/40 p-10 lg:flex lg:p-[44px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/25 blur-3xl"
      />

      <div className="relative z-10">
        <h2 className=" text-2xl text-foreground font-bold tracking-tight mb-2">
          Healthcare made simpler.
        </h2>
        <p className=" text-sm text-muted-foreground leading-relaxed mb-6">
          Find nearby hospitals, connect with doctors, get emergency assistance, understand your
          medical reports, and manage your healthcare in one place.
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-3.5 rounded-xl bg-muted hover:bg-muted/50 transition-colors flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Icon aria-hidden="true" className="h-[20px] w-[20px] text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className=" text-sm font-semibold text-foreground">
                  {title}
                </div>
                <div className=" text-sm text-muted-foreground text-[13px] leading-snug">
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-t-0 space-y-2">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit}
            className="flex items-center gap-2.5 text-[13px] text-muted-foreground "
          >
            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
