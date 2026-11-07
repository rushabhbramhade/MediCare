"use client";

import {
  Activity,
  Ambulance,
  Building2,
  Clock,
  FlaskConical,
  Landmark,
  MapPin,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activeFilterCount,
  DEFAULT_HOSPITAL_FILTERS,
  isFilterActive,
  toggleFilter,
  type HospitalFilterKey,
  type HospitalFilters,
} from "../hospital-filters";

const CHIPS: Array<{ key: HospitalFilterKey; label: string; icon: typeof MapPin }> = [
  { key: "emergencyOnly", label: "Emergency / ER", icon: ShieldAlert },
  { key: "availableBeds", label: "Available beds", icon: Building2 },
  { key: "icuAvailable", label: "ICU beds", icon: Activity },
  { key: "ambulanceAvailable", label: "Ambulance", icon: Ambulance },
  { key: "open24x7", label: "24×7 open", icon: Clock },
  { key: "government", label: "Government", icon: Landmark },
  { key: "private", label: "Private", icon: Building2 },
  { key: "nearby", label: "Nearby (< 5 km)", icon: MapPin },
];

const UNAVAILABLE_CHIPS = [
  { label: "Pharmacies", icon: Pill },
  { label: "Blood banks", icon: Activity },
  { label: "Diagnostics", icon: FlaskConical },
];

export function HospitalFilterChips({
  filters,
  onChange,
}: {
  filters: HospitalFilters;
  onChange: (filters: HospitalFilters) => void;
}) {
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [specialtyDraft, setSpecialtyDraft] = useState(filters.specialty);
  const count = activeFilterCount(filters);

  const chipClass = (active: boolean) =>
    `inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground hover:bg-accent"
    }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_HOSPITAL_FILTERS)}
          aria-pressed={count === 0}
          className={chipClass(count === 0)}
        >
          <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
          All hospitals
        </button>

        {CHIPS.map(({ key, label, icon: Icon }) => {
          const active = isFilterActive(filters, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(toggleFilter(filters, key))}
              aria-pressed={active}
              className={chipClass(active)}
            >
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setSpecialtyDraft(filters.specialty);
            setSpecialtyOpen((value) => !value);
          }}
          aria-expanded={specialtyOpen}
          aria-pressed={filters.specialty !== ""}
          className={chipClass(filters.specialty !== "")}
        >
          <Stethoscope aria-hidden="true" className="h-3.5 w-3.5" />
          {filters.specialty || "Specialty"}
          <Sparkles aria-hidden="true" className="h-3 w-3 opacity-60" />
        </button>

        {UNAVAILABLE_CHIPS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            title={`${label} are not connected to a data source yet. Medicare will not invent results.`}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-dashed border-border bg-muted px-3 text-xs font-medium text-muted-foreground opacity-70"
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}

        {count > 0 ? (
          <button
            type="button"
            onClick={() => {
              setSpecialtyDraft("");
              onChange(DEFAULT_HOSPITAL_FILTERS);
            }}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-primary hover:underline"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>

      {specialtyOpen ? (
        <form
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2"
          onSubmit={(event) => {
            event.preventDefault();
            onChange({ ...filters, specialty: specialtyDraft.trim() });
            setSpecialtyOpen(false);
          }}
        >
          <Input
            aria-label="Specialty"
            value={specialtyDraft}
            onChange={(event) => setSpecialtyDraft(event.target.value)}
            placeholder="e.g. cardiology"
            className="h-9 flex-1"
            autoFocus
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSpecialtyDraft("");
              onChange({ ...filters, specialty: "" });
              setSpecialtyOpen(false);
            }}
          >
            Clear
          </Button>
        </form>
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Pharmacies, blood banks and diagnostics appear disabled because no data source is
        connected. Filters only match reported data.
      </p>
    </div>
  );
}
