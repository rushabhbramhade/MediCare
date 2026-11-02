import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Medicare is an early-stage project. It does not replace professional medical advice.</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/emergency"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Emergency help
          </Link>
          <span>In an emergency, call 112.</span>
        </div>
      </div>
    </footer>
  );
}
