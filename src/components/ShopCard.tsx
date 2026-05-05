import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Plus,
  Minus,
  Landmark as LandmarkIcon,
  Star,
  Navigation,
} from "lucide-react";
import type { Shop, InventoryItem } from "@/lib/mockData";
import { timeAgo } from "@/lib/mockData";
import { t, getLang } from "@/lib/i18n";
import { localizeItem } from "@/lib/inventoryI18n";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/friendlyError";
import { useCart } from "@/hooks/useCart";

type Props = {
  shop: Shop & { landmark?: string | null; isOpen?: boolean };
  matchedItems: InventoryItem[];
  query?: string;
  distanceKm?: number | null;
  shopCoords?: { lat: number; lng: number } | null;
};

function maskNumber(num: string) {
  if (!num) return "•••• •••• ••";
  const digits = num.replace(/\D/g, "");
  if (digits.length <= 4) return "•".repeat(digits.length);
  return `${digits.slice(0, 2)} •••• ${digits.slice(-2)}`;
}

export function ShopCard({ shop, matchedItems, query, distanceKm, shopCoords }: Props) {
  const lang = getLang();
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const cart = useCart();
  const cartLines = cart.linesForShop(shop.id);
  const cartCount = cart.countForShop(shop.id);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("shop_ratings")
        .select("rating")
        .eq("shop_id", shop.id);
      if (!active || error || !data || data.length === 0) return;
      const sum = data.reduce((s, r) => s + (r.rating ?? 0), 0);
      setRatingAvg(sum / data.length);
      setRatingCount(data.length);
    })();
    return () => {
      active = false;
    };
  }, [shop.id]);

  const reveal = async (): Promise<string | null> => {
    if (whatsapp) return whatsapp;
    setRevealing(true);
    setRevealError(null);
    try {
      const { data, error } = await supabase.rpc("get_shop_whatsapp", {
        _shop_id: shop.id,
      });
      if (error) throw error;
      if (!data) {
        setRevealError("Sign in to contact this shop");
        return null;
      }
      setWhatsapp(data as string);
      return data as string;
    } catch (e) {
      setRevealError(friendlyError(e, "Couldn't reveal the contact. Please try again."));
      return null;
    } finally {
      setRevealing(false);
    }
  };

  const buildBundleMessage = () => {
    const lines = cartLines.length
      ? cartLines.map((l) => `• ${l.itemName} × ${l.qty} (${l.unit}) — ₹${l.price * l.qty}`)
      : [`• ${query || matchedItems[0]?.name || "this item"}`];
    const total = cartLines.reduce((s, l) => s + l.price * l.qty, 0);
    return [
      `Hi ${shop.name}! I'd like to order from VillageFinder:`,
      "",
      ...lines,
      cartLines.length ? `\nTotal: ₹${total}` : "",
      "",
      "Please confirm availability. Thank you!",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const sendOrder = async () => {
    const num = await reveal();
    if (!num) return;
    const url = `https://wa.me/${num.replace(/\D/g, "")}?text=${encodeURIComponent(
      buildBundleMessage(),
    )}`;
    if (cartLines.length) cart.clearShop(shop.id);
    // Instant hand-off to native WhatsApp app (no new tab, no blocker).
    window.location.assign(url);
  };

  const distance = distanceKm ?? (shop.distanceKm > 0 ? shop.distanceKm : null);

  const isClosed = shop.isOpen === false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${isClosed ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold leading-tight">{shop.name}</h3>
          <p className="text-sm text-muted-foreground">
            {shop.category}
            {shop.village ? ` · ${shop.village}` : ""}
          </p>
          {isClosed && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
              <XCircle className="h-3 w-3" /> Temporarily Closed
            </p>
          )}
          {shop.landmark && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
              <LandmarkIcon className="h-3 w-3" />
              {shop.landmark}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {ratingAvg !== null && (
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {ratingAvg.toFixed(1)}
                <span className="font-normal text-muted-foreground">({ratingCount})</span>
              </span>
            )}
            {distance !== null && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}{" "}
                {t("distanceAway")}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("lastUpdated")} {timeAgo(shop.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {matchedItems.length > 0 && (
        <ul className="mt-4 space-y-2">
          {matchedItems.slice(0, 5).map((item) => {
            const inCartLine = cartLines.find((l) => l.itemId === item.id);
            const localName = localizeItem(item.name, lang);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{localName}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{item.price} / {item.unit} · {timeAgo(item.updatedAt)}
                  </p>
                </div>
                {item.status === "in" ? (
                  inCartLine ? (
                    <div className="flex items-center gap-1 rounded-full bg-card px-1 py-1 shadow-soft">
                      <button
                        type="button"
                        onClick={() => cart.setQty(shop.id, item.id, inCartLine.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                        aria-label="Decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-bold">
                        {inCartLine.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.setQty(shop.id, item.id, inCartLine.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                        aria-label="Increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        cart.addOrIncrement({
                          shopId: shop.id,
                          shopName: shop.name,
                          itemId: item.id,
                          itemName: item.name,
                          unit: item.unit,
                          price: item.price,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success hover:bg-success/25"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("inStock")} · <Plus className="h-3 w-3" />
                    </button>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    {t("outOfStock")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Masked phone preview */}
      <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-muted/40 px-4 py-2 text-sm">
        <span className="font-mono text-muted-foreground">
          {whatsapp ? `+${whatsapp}` : `+${maskNumber(shop.whatsapp || "0000000000")}`}
        </span>
        {!whatsapp && (
          <button
            type="button"
            onClick={() => reveal()}
            disabled={revealing}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            {revealing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {t("showContact")}
          </button>
        )}
      </div>
      {revealError && <p className="mt-1 text-xs text-destructive">{revealError}</p>}

      {/* Address + directions */}
      {(shop.village || shop.landmark || shopCoords) && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {[shop.landmark, shop.village].filter(Boolean).join(", ") || "Address"}
            </p>
            {distance !== null && (
              <p className="text-xs text-muted-foreground">
                {distance < 1
                  ? `${Math.round(distance * 1000)} m ${t("distanceAway")}`
                  : `${distance.toFixed(1)} km ${t("distanceAway")}`}
              </p>
            )}
          </div>
          <a
            href={
              shopCoords
                ? `https://www.google.com/maps/dir/?api=1&destination=${shopCoords.lat},${shopCoords.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [shop.name, shop.landmark, shop.village].filter(Boolean).join(" "),
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-soft active:scale-95"
          >
            <Navigation className="h-3.5 w-3.5" />
            {t("getDirections")}
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={sendOrder}
        disabled={isClosed}
        className="bg-whatsapp mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold shadow-soft transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MessageCircle className="h-5 w-5" />
        {isClosed
          ? "Shop Closed"
          : cartCount > 0
            ? `${t("sendOrderWa")} (${cartCount})`
            : t("orderWhatsApp")}
      </button>
    </motion.article>
  );
}
