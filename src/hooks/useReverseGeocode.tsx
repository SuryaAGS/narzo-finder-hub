import { useEffect, useState } from "react";
import type { Coords } from "./useGeolocation";

const CACHE_KEY = "vf_geocode_cache";

type Cached = { lat: number; lng: number; area: string; ts: number };

function readCache(): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(c: Cached) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

/** Returns a short, human-readable area name for given coords (free OSM Nominatim). */
export function useReverseGeocode(coords: Coords | null): {
  area: string | null;
  loading: boolean;
} {
  const [area, setArea] = useState<string | null>(() => {
    const c = readCache();
    return c?.area ?? null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) return;
    const cached = readCache();
    // Reuse cache if within ~300m and < 24h old
    if (cached) {
      const close =
        Math.abs(cached.lat - coords.lat) < 0.003 &&
        Math.abs(cached.lng - coords.lng) < 0.003 &&
        Date.now() - cached.ts < 24 * 60 * 60 * 1000;
      if (close) {
        setArea(cached.area);
        return;
      }
    }
    const ctrl = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&zoom=14&addressdetails=1`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("reverse geocode failed");
        const data = await res.json();
        const a = data.address ?? {};
        const name: string =
          a.village ||
          a.hamlet ||
          a.suburb ||
          a.town ||
          a.city ||
          a.county ||
          a.state_district ||
          a.state ||
          data.name ||
          "Your location";
        setArea(name);
        writeCache({ lat: coords.lat, lng: coords.lng, area: name, ts: Date.now() });
      } catch {
        /* keep prior area */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [coords?.lat, coords?.lng]);

  return { area, loading };
}
