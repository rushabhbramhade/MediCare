import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-6 py-12"
    >
      <Logo />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you were looking for does not exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Go to Medicare
      </Link>
    </main>
  );
}
