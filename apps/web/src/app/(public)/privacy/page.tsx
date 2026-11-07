import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated 5 November 2026.</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">What Medicare collects</h2>
          <p>
            Your mobile number, the profile details you choose to add (name, optional date of birth
            and preferred language), and the medical records you upload. Sign-in uses a one-time
            code sent by SMS. Medicare does not store a password.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">How it is used</h2>
          <p>
            To verify your identity, show your profile, connect you with healthcare services you
            request, and provide iCare AI explanations of information you share. Your medical
            records are not displayed publicly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Your choices</h2>
          <p>
            You can update your profile details in the app and sign out at any time. Optional
            profile fields can be left blank. You can choose not to upload a medical record.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Early-stage product</h2>
          <p>
            Medicare is an early-stage product. This policy will be updated as the service and its
            data practices develop.
          </p>
        </section>
      </div>
    </div>
  );
}
