import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Fuse from "fuse.js";
import { Search, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ShopCard } from "@/components/ShopCard";
import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Shop, InventoryItem } from "@/lib/mockData";

export const Route = createFileRoute("/customer")({
  component: CustomerPage,
});

type DbShop = {
  id: string;
  name: string;
  category: string;
  village: string;
  whatsapp: string;
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

function toShopCardData(s: DbShop): { shop: Shop; items: InventoryItem[] } {
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
    distanceKm: 0, // distance not yet computed
    whatsapp: s.whatsapp,
    updatedAt: new Date(s.updated_at).getTime(),
    items,
  };
  return { shop, items };
}

function CustomerPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<{ shop: Shop; items: InventoryItem[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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
          "id, name, category, village, whatsapp, updated_at, inventory(id, name, aliases, price, unit, status, updated_at)",
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
    return shops.flatMap(({ shop, items }) =>
      items.map((item) => ({ shop, item, search: [item.name, ...(item.aliases ?? [])].join(" ") })),
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

  const filtered = useMemo(() => {
    if (!query.trim()) return shops;
    const matches = fuse.search(query.trim()).map((r) => r.item);
    const byShop = new Map<string, { shop: Shop; items: InventoryItem[] }>();
    for (const m of matches) {
      const cur = byShop.get(m.shop.id);
      if (cur) cur.items.push(m.item);
      else byShop.set(m.shop.id, { shop: m.shop, items: [m.item] });
    }
    return Array.from(byShop.values());
  }, [query, fuse, shops]);

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
          </div>
        </motion.div>

        <h2 className="mt-6 font-display text-xl font-bold">
          {query.trim() ? `Results for "${query.trim()}"` : t("nearbyShops")}
        </h2>

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-8 rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
            {query.trim()
              ? t("noResults")
              : "No shops yet. Shopkeepers will show up here once they register."}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {filtered.map(({ shop, items }) => (
              <ShopCard key={shop.id} shop={shop} matchedItems={items} query={query} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
