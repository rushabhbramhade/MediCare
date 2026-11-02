import { HeartPulse } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulse aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="text-lg">Medicare</span>
    </Link>
  );
}
