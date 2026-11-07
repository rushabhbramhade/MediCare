"use client";

import Link from "next/link";

export function AuthBrand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 p-2 text-primary">
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      </span>
      <div className="flex flex-col">
        <span className=" text-lg text-primary tracking-tight leading-none">
          Medicare
        </span>
        <span className=" text-xs text-muted-foreground font-medium">
          Healthcare Platform
        </span>
      </div>
    </Link>
  );
}
