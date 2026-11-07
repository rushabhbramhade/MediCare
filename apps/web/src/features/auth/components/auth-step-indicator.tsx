"use client";

const STEPS = [
  { label: "Mobile Verification", value: "phone" },
  { label: "Profile Details", value: "profile" },
];

export function AuthStepIndicator({ currentStep }: { currentStep: string }) {
  const currentIndex = Math.max(
    0,
    STEPS.findIndex((step) => step.value === currentStep),
  );

  return (
    <div className="mb-6 rounded-xl bg-muted p-3">
      <p className="mb-2 px-1  text-xs text-muted-foreground">
        Step {currentIndex + 1} of {STEPS.length}:{" "}
        <span className="font-semibold text-primary">{STEPS[currentIndex]?.label}</span>
      </p>
      <ol className="flex gap-1">
        {STEPS.map((step, index) => (
          <li
            key={step.value}
            aria-current={index === currentIndex ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full ${
              index <= currentIndex ? "bg-primary" : "bg-muted"
            }`}
          >
            <span className="sr-only">{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
