"use client";

import type { HealthResponse } from "@medicare/contracts";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ApiStatusCard({ initial }: { initial: HealthResponse | null }) {
  const query = useQuery({
    queryKey: ["api-health"],
    queryFn: () => api.health(),
    initialData: initial ?? undefined,
    retry: 1,
  });

  const state = query.data
    ? "online"
    : query.isError
      ? "offline"
      : query.isPending
        ? "checking"
        : "unknown";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Service status</CardTitle>
          <CardDescription>Connection from this browser to the Medicare API</CardDescription>
        </div>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <RefreshCw
            aria-hidden="true"
            className={cn("h-4 w-4", query.isFetching && "animate-spin")}
          />
          Refresh
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              state === "online" && "bg-emerald-600",
              state === "offline" && "bg-emergency",
              (state === "checking" || state === "unknown") && "bg-muted-foreground",
            )}
          />
          <span className="font-medium">
            {state === "online" && "API reachable"}
            {state === "offline" && "API unreachable"}
            {state === "checking" && "Checking…"}
            {state === "unknown" && "Status unknown"}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {state === "online"
            ? `Version ${query.data?.version ?? "unknown"}.`
            : "The web app is running. Database and Redis readiness are checked on the API."}
        </p>
      </CardContent>
    </Card>
  );
}
