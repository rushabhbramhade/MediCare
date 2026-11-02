import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegister } from "@/components/shared/pwa-register";
import { QueryProvider } from "@/components/shared/query-provider";
import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Medicare — find care, keep records, understand results",
    template: "%s · Medicare",
  },
  description:
    "Medicare helps you find nearby care, reach emergency services, keep medical records and understand your reports with iCare AI.",
  applicationName: "Medicare",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Medicare", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <QueryProvider>
          <PwaRegister />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
