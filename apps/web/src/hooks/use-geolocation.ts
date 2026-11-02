"use client";

import { useCallback } from "react";
import { useLocationStore } from "@/stores/location-store";

export function useGeolocation() {
  const coords = useLocationStore((state) => state.coords);
  const status = useLocationStore((state) => state.status);
  const error = useLocationStore((state) => state.error);
  const setLocating = useLocationStore((state) => state.setLocating);
  const setCoords = useLocationStore((state) => state.setCoords);
  const setError = useLocationStore((state) => state.setError);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("unavailable", "This browser cannot share your location.");
      return;
    }

    setLocating();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setError(
            "denied",
            "Location permission was denied. You can allow it in your browser settings.",
          );
          return;
        }
        setError("error", "We could not get your location. Please try again.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [setCoords, setError, setLocating]);

  return { coords, status, error, requestLocation };
}
