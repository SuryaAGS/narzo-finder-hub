import { useEffect, useState } from "react";

export type Coords = { lat: number; lng: number };

export type GeoState = {
  coords: Coords | null;
  error: string | null;
  loading: boolean;
  request: () => void;
};

const STORAGE_KEY = "vf_last_coords";

export function useGeolocation(autoRequest = true): GeoState {
  const [coords, setCoords] = useState<Coords | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? (JSON.parse(cached) as Coords) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location not supported on this device.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
        } catch {
          /* ignore */
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Could not get location");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  useEffect(() => {
    if (autoRequest && !coords) request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRequest]);

  return { coords, error, loading, request };
}

// Haversine distance in kilometers
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
