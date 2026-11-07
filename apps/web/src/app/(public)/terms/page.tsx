import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 5 November 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">What Medicare is</h2>
          <p>
            Medicare helps you find healthcare services, manage appointments and records, and
            understand health information with iCare AI. Medicare is not a hospital, clinic or
            medical provider.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Not medical advice</h2>
          <p>
            iCare AI provides plain-language information, not a diagnosis or a substitute for
            professional medical care. For an emergency, call 112 or go to the nearest emergency
            department.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Your account</h2>
          <p>
            Keep the mobile number on your account current and do not share verification codes.
            You are responsible for activity carried out through your verified session.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Early-stage product</h2>
          <p>
            Features and availability may change as Medicare develops. These terms will be updated
            alongside the service.
          </p>
        </section>
      </div>
    </div>
  );
}
