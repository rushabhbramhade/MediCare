"use client";

import { Search, SearchX, Stethoscope } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DoctorSearchPanel() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length > 0) setSearched(true);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full space-y-2">
          <Label htmlFor="doctor-query">Doctor, specialty or hospital</Label>
          <Input
            id="doctor-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. cardiologist"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={query.trim().length === 0}>
          <Search aria-hidden="true" className="h-4 w-4" />
          Search
        </Button>
      </form>

      <StatusNote variant="info" title="Doctor directory and booking are not connected">
        No credentials, reviews or appointment slots are shown because Medicare has no verified
        provider source yet. Nothing here is invented.
      </StatusNote>

      {searched ? (
        <EmptyState
          icon={SearchX}
          title="No doctors to show"
          description={`There is no verified directory to search yet, so nothing was found for “${query.trim()}”.`}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          <Stethoscope aria-hidden="true" className="h-5 w-5 shrink-0" />
          Doctor search and appointment booking will appear here once a provider integration is
          signed.
        </div>
      )}
    </div>
  );
}
