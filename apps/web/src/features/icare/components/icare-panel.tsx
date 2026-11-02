"use client";

import { AlertTriangle, Lock, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function IcarePanel() {
  const [question, setQuestion] = useState("");

  return (
    <div className="space-y-5">
      <StatusNote variant="warning" title="iCare is not connected in this build">
        The AI service exists, but no AI provider is configured and the gateway is not wired up.
        This page will not produce medical guidance until that work is complete and reviewed.
      </StatusNote>

      <form
        className="space-y-3 rounded-xl border border-border bg-card p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <Label htmlFor="icare-question">What would you like help understanding?</Label>
        <Textarea
          id="icare-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="For example: What does a high HbA1c result mean?"
          aria-describedby="icare-hint"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p id="icare-hint" className="text-xs text-muted-foreground">
            Do not use iCare for emergency symptoms. Call 112.
          </p>
          <Button type="submit" disabled>
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Ask iCare (not connected)
          </Button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <SafetyCard icon={AlertTriangle} title="Never a diagnosis">
          iCare explains information in plain language. It does not diagnose conditions or replace a
          clinician.
        </SafetyCard>
        <SafetyCard icon={Lock} title="Records need consent">
          Your medical records are never used for AI answers without an explicit, revocable consent
          grant.
        </SafetyCard>
        <SafetyCard icon={Sparkles} title="Built to escalate">
          Emergency red flags are designed to interrupt the conversation and point you to emergency
          help.
        </SafetyCard>
      </div>
    </div>
  );
}

function SafetyCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof AlertTriangle;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon aria-hidden="true" className="mb-2 h-5 w-5 text-primary" />
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
