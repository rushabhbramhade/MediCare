import { create } from "zustand";

export type LocationStatus = "idle" | "locating" | "granted" | "denied" | "unavailable" | "error";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: Coordinates | null;
  status: LocationStatus;
  error: string | null;
  setLocating: () => void;
  setCoords: (coords: Coordinates) => void;
  setError: (status: LocationStatus, message: string) => void;
  reset: () => void;
}

/** Client-only location state, shared by the map and future provider search. */
export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  status: "idle",
  error: null,
  setLocating: () => set({ status: "locating", error: null }),
  setCoords: (coords) => set({ coords, status: "granted", error: null }),
  setError: (status, error) => set({ status, error }),
  reset: () => set({ coords: null, status: "idle", error: null }),
}));
