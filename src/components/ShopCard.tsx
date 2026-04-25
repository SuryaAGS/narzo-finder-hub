import { motion } from "framer-motion";
import { MapPin, Clock, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Shop, InventoryItem } from "@/lib/mockData";
import { timeAgo } from "@/lib/mockData";
import { t } from "@/lib/i18n";

type Props = {
  shop: Shop;
  matchedItems: InventoryItem[];
  query?: string;
};

export function ShopCard({ shop, matchedItems, query }: Props) {
  const waMessage = encodeURIComponent(
    `Hi! I'm checking VillageFinder. Do you have ${
      query || matchedItems[0]?.name || "this item"
    } in stock at ${shop.name}? — Thank you!`,
  );
  const waUrl = `https://wa.me/${shop.whatsapp}?text=${waMessage}`;

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
            {shop.distanceKm > 0 && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {shop.distanceKm} km {t("distanceAway")}
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

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-base font-bold text-secondary-foreground shadow-soft transition-transform active:scale-[0.98]"
      >
        <MessageCircle className="h-5 w-5" />
        {t("orderWhatsApp")}
      </a>
    </motion.article>
  );
}
