"use client";

import { Pill, Search, SearchX } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MedicineSearchPanel() {
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
          <Label htmlFor="medicine-query">Medicine or ingredient</Label>
          <Input
            id="medicine-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. paracetamol"
            autoComplete="off"
          />
        </div>
        <Button type="submit" disabled={query.trim().length === 0}>
          <Search aria-hidden="true" className="h-4 w-4" />
          Search
        </Button>
      </form>

      <StatusNote variant="info" title="Medicine catalogue is not connected">
        Search is wired but there is no licensed medicine dataset behind it. Medicare does not
        provide dosing or interaction advice.
      </StatusNote>

      {searched ? (
        <EmptyState
          icon={SearchX}
          title="No results to show"
          description={`There is no catalogue to search yet, so nothing was found for “${query.trim()}”. Results will include a source attribution when data is connected.`}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          <Pill aria-hidden="true" className="h-5 w-5 shrink-0" />
          Search will show medicine information and nearby pharmacies once a licensed source is
          connected.
        </div>
      )}
    </div>
  );
}
