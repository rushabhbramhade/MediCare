import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12"
    >
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-muted-foreground">
          Medicare needs a connection for care services. If this is an emergency, call 112.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Try again
      </Link>
    </main>
  );
}
