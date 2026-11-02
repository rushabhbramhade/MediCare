import {
  Ambulance,
  ArrowRight,
  FolderHeart,
  Hospital,
  MapPin,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { EmergencyBanner } from "@/components/shared/emergency-banner";
import { StatusNote } from "@/components/shared/status-note";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    icon: Hospital,
    title: "Hospital finder",
    description:
      "Find nearby hospitals on a map. Availability will only be shown when a verified source reports it.",
  },
  {
    icon: Ambulance,
    title: "Emergency and ambulance",
    description:
      "Keep emergency numbers one tap away and reach a real ambulance service without digging through menus.",
  },
  {
    icon: Sparkles,
    title: "iCare AI",
    description:
      "Plain-language explanations of medical reports and calm symptom guidance — never a diagnosis.",
  },
  {
    icon: FolderHeart,
    title: "Health vault",
    description:
      "Keep reports and prescriptions in one private place, with consent-based sharing and audit trails.",
  },
  {
    icon: Stethoscope,
    title: "Doctors and appointments",
    description:
      "Search verified doctors and book through a provider integration, with credentials never invented.",
  },
  {
    icon: Pill,
    title: "Medicines and pharmacies",
    description:
      "Search medicines and see nearby pharmacy stock only when a licensed source is connected.",
  },
];

const steps = [
  {
    title: "Tell us where you are",
    description: "Share your location when you need nearby care. It stays in your browser session.",
  },
  {
    title: "See what is actually available",
    description: "Results carry their source and observation time — no invented hospitals or beds.",
  },
  {
    title: "Take the next step",
    description: "Call emergency services, book care, or keep a record for later.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-secondary/70 to-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
              Healthcare navigation for India
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Find the right care, without the guesswork.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              One calm place to find nearby care, reach emergency help, keep your medical records,
              and understand what your reports mean.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/hospitals" className={cn(buttonVariants({ size: "lg" }))}>
                <MapPin aria-hidden="true" className="h-4 w-4" />
                Find care near you
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Create an account
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Emergency?{" "}
              <a
                href="tel:112"
                className="font-semibold text-emergency underline-offset-4 hover:underline"
              >
                Call 112
              </a>{" "}
              — do not wait for an app.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-14 sm:px-6">
        <StatusNote variant="warning" title="Early build, stated plainly">
          The foundation is running: navigation, phone OTP sign-in, emergency information and a
          location map. Hospital, pharmacy and doctor data, record storage and iCare AI are not
          connected yet. Nothing on this page is live provider data.
        </StatusNote>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            What Medicare is being built to do
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Six connected jobs, designed around a person who is worried and in a hurry.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="leading-relaxed">{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <p className="max-w-2xl text-muted-foreground">
              The same three steps whether you are looking for care or keeping a record.
            </p>
          </div>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="space-y-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <EmergencyBanner />
      </section>
    </>
  );
}
