import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import type { Shop, InventoryItem } from "@/lib/mockData";
import { timeAgo } from "@/lib/mockData";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  shop: Shop;
  matchedItems: InventoryItem[];
  query?: string;
  /** Optional distance in km computed from user geolocation. */
  distanceKm?: number | null;
};

function maskNumber(num: string) {
  if (!num) return "•••• •••• ••";
  const digits = num.replace(/\D/g, "");
  if (digits.length <= 4) return "•".repeat(digits.length);
  return `${digits.slice(0, 2)} •••• ${digits.slice(-2)}`;
}

export function ShopCard({ shop, matchedItems, query, distanceKm }: Props) {
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  const reveal = async () => {
    if (whatsapp || revealing) return;
    setRevealing(true);
    setRevealError(null);
    const { data, error } = await supabase.rpc("get_shop_whatsapp", {
      _shop_id: shop.id,
    });
    setRevealing(false);
    if (error || !data) {
      setRevealError("Sign in to contact this shop");
      return;
    }
    setWhatsapp(data as string);
  };

  const buildWaUrl = (number: string) => {
    const digits = number.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Hi! I'm checking VillageFinder. Do you have ${
        query || matchedItems[0]?.name || "this item"
      } in stock at ${shop.name}? — Thank you!`,
    );
    return `https://wa.me/${digits}?text=${msg}`;
  };

  const handleContactClick = async (e: React.MouseEvent) => {
    if (whatsapp) return; // let the link follow
    e.preventDefault();
    await reveal();
  };

  const distance = distanceKm ?? (shop.distanceKm > 0 ? shop.distanceKm : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold leading-tight">{shop.name}</h3>
          <p className="text-sm text-muted-foreground">
            {shop.category}
            {shop.village ? ` · ${shop.village}` : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
          {matchedItems.slice(0, 3).map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  ₹{item.price} / {item.unit} · {timeAgo(item.updatedAt)}
                </p>
              </div>
              {item.status === "in" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("inStock")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  {t("outOfStock")}
                </span>
              )}
            </li>
          ))}
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
            onClick={reveal}
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
      {revealError && (
        <p className="mt-1 text-xs text-destructive">{revealError}</p>
      )}

      <a
        href={whatsapp ? buildWaUrl(whatsapp) : "#"}
        onClick={handleContactClick}
        target={whatsapp ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-base font-bold text-secondary-foreground shadow-soft transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="h-5 w-5" />
        {t("orderWhatsApp")}
      </a>
    </motion.article>
  );
}
