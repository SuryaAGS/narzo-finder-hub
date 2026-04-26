import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Fuse from "fuse.js";
import { Search, Loader2, Mic, Square, MapPin } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ShopCard } from "@/components/ShopCard";
import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Shop, InventoryItem } from "@/lib/mockData";
import { useGeolocation, distanceKm, type Coords } from "@/hooks/useGeolocation";

export const Route = createFileRoute("/customer")({
  component: CustomerPage,
});

type DbShop = {
  id: string;
  name: string;
  category: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  inventory: {
    id: string;
    name: string;
    aliases: string[];
    price: number | string;
    unit: string;
    status: "in" | "out";
    updated_at: string;
  }[];
};

function toShopCardData(s: DbShop): {
  shop: Shop;
  items: InventoryItem[];
  coords: Coords | null;
} {
  const items: InventoryItem[] = s.inventory.map((i) => ({
    id: i.id,
    name: i.name,
    aliases: i.aliases ?? [],
    price: Number(i.price) || 0,
    unit: i.unit,
    status: i.status,
    updatedAt: new Date(i.updated_at).getTime(),
  }));
  const shop: Shop = {
    id: s.id,
    name: s.name,
    owner: "",
    category: s.category,
    village: s.village,
    distanceKm: 0,
    whatsapp: "", // hidden — fetched on demand via RPC
    updatedAt: new Date(s.updated_at).getTime(),
    items,
  };
  const coords =
    s.latitude !== null && s.longitude !== null
      ? { lat: s.latitude, lng: s.longitude }
      : null;
  return { shop, items, coords };
}

type SortMode = "nearest" | "recent";

function CustomerPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<
    { shop: Shop; items: InventoryItem[]; coords: Coords | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const geo = useGeolocation(false);

  // Auth gate — only let signed-in customers in.
  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/login" });
    else if (role === "shopkeeper") navigate({ to: "/merchant" });
    else if (!role) navigate({ to: "/role" });
  }, [authLoading, user, role, navigate]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("shops")
        .select(
          "id, name, category, village, latitude, longitude, updated_at, inventory(id, name, aliases, price, unit, status, updated_at)",
        )
        .order("updated_at", { ascending: false });
      if (!mounted) return;
      if (!error && data) {
        setShops((data as unknown as DbShop[]).map(toShopCardData));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Build a fuzzy index over all items across all shops.
  const indexed = useMemo(() => {
    return shops.flatMap(({ shop, items, coords }) =>
      items.map((item) => ({
        shop,
        item,
        coords,
        search: [item.name, ...(item.aliases ?? [])].join(" "),
      })),
    );
  }, [shops]);

  const fuse = useMemo(
    () =>
      new Fuse(indexed, {
        keys: ["search"],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [indexed],
  );

  const withDistance = useMemo(() => {
    const list = query.trim()
      ? (() => {
          const matches = fuse.search(query.trim()).map((r) => r.item);
          const byShop = new Map<
            string,
            { shop: Shop; items: InventoryItem[]; coords: Coords | null }
          >();
          for (const m of matches) {
            const cur = byShop.get(m.shop.id);
            if (cur) cur.items.push(m.item);
            else byShop.set(m.shop.id, { shop: m.shop, items: [m.item], coords: m.coords });
          }
          return Array.from(byShop.values());
        })()
      : shops;

    return list.map((s) => ({
      ...s,
      distance: geo.coords && s.coords ? distanceKm(geo.coords, s.coords) : null,
    }));
  }, [query, fuse, shops, geo.coords]);

  const sorted = useMemo(() => {
    const arr = [...withDistance];
    if (sortMode === "nearest" && geo.coords) {
      arr.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    return arr;
  }, [withDistance, sortMode, geo.coords]);

  // Web Speech API → search bar
  const recRef = useRef<{ stop: () => void } | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const startVoice = () => {
    setVoiceError(null);
    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice not supported on this browser. Try Chrome on Android.");
      return;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rec: any = new (SR as any)();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      setQuery(text);
    };
    rec.onerror = (e: any) => setVoiceError(e?.error || "Recognition error");
    rec.onend = () => setListening(false);
    rec.start();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    recRef.current = rec;
    setListening(true);
  };

  const stopVoice = () => {
    recRef.current?.stop();
    setListening(false);
  };

  useEffect(() => () => recRef.current?.stop(), []);

  return (
    <div className="min-h-screen pb-10">
      <AppHeader title={t("appName")} showLogout />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-border bg-card p-2 shadow-soft focus-within:border-primary"
        >
          <div className="flex items-center gap-2 px-3 py-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              inputMode="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent py-2 text-lg outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              aria-label={listening ? "Stop listening" : t("voiceSearch")}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-soft transition-all active:scale-95 ${
                listening
                  ? "animate-pulse bg-destructive text-primary-foreground"
                  : "bg-gradient-warm text-primary-foreground"
              }`}
            >
              {listening ? (
                <Square className="h-4 w-4" fill="currentColor" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
        </motion.div>

        {voiceError && (
          <p className="mt-2 text-xs text-destructive">{voiceError}</p>
        )}

        {/* Location + sort row */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {!geo.coords ? (
            <button
              type="button"
              onClick={geo.request}
              disabled={geo.loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-semibold shadow-soft active:scale-95 disabled:opacity-60"
            >
              {geo.loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MapPin className="h-3.5 w-3.5" />
              )}
              {t("enableLocation")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSortMode("nearest")}
                className={`rounded-full px-3 py-1.5 font-semibold transition-all ${
                  sortMode === "nearest"
                    ? "bg-foreground text-background shadow-soft"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {t("sortNearest")}
              </button>
              <button
                type="button"
                onClick={() => setSortMode("recent")}
                className={`rounded-full px-3 py-1.5 font-semibold transition-all ${
                  sortMode === "recent"
                    ? "bg-foreground text-background shadow-soft"
                    : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {t("sortRecent")}
              </button>
            </>
          )}
          {geo.error && (
            <span className="text-xs text-muted-foreground">{geo.error}</span>
          )}
        </div>

        <h2 className="mt-6 font-display text-xl font-bold">
          {query.trim() ? `Results for "${query.trim()}"` : t("nearbyShops")}
        </h2>

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
          </div>
        ) : sorted.length === 0 ? (
          <p className="mt-8 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
            {query.trim()
              ? t("noResults")
              : "No shops yet. Shopkeepers will show up here once they register."}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {sorted.map(({ shop, items, distance }) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                matchedItems={items}
                query={query}
                distanceKm={distance}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
