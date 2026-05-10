import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Mic,
  ScanLine,
  Plus,
  Sparkles,
  Square,
  Loader2,
  Store,
  MapPin,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppHeader } from "@/components/AppHeader";
import { POPULAR_BY_CATEGORY, CATEGORIES, timeAgo } from "@/lib/mockData";
import { t } from "@/lib/i18n";
import { parseVoiceCommand, type ParsedItem } from "@/lib/voiceParser";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { showFriendlyError } from "@/lib/friendlyError";
import { toast } from "sonner";

export const Route = createFileRoute("/shopkeeper")({
  component: ShopkeeperPage,
});

type DbItem = {
  id: string;
  name: string;
  aliases: string[];
  price: number;
  unit: string;
  status: "in" | "out";
  updated_at: string;
};

type DbShop = {
  id: string;
  name: string;
  category: string;
  village: string;
  latitude?: number | null;
  longitude?: number | null;
  is_open?: boolean;
};

function ShopkeeperPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<DbShop | null>(null);
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DbItem | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const deleteItem = async () => {
    if (!itemToDelete) return;
    setDeletingItem(true);
    try {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", itemToDelete.id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      toast.success(`"${itemToDelete.name}" deleted.`);
      setItemToDelete(null);
    } catch (e) {
      showFriendlyError(e, "Couldn't delete that item. Please try again.");
    } finally {
      setDeletingItem(false);
    }
  };

  const toggleShopStatus = async (next: boolean) => {
    if (!shop) return;
    setStatusSaving(true);
    const prev = shop.is_open ?? true;
    setShop({ ...shop, is_open: next });
    try {
      const { error } = await supabase
        .from("shops")
        .update({ is_open: next })
        .eq("id", shop.id);
      if (error) throw error;
      toast.success(next ? "Shop is now Open" : "Shop marked Temporarily Closed");
    } catch (e) {
      setShop({ ...shop, is_open: prev });
      showFriendlyError(e, "Couldn't update shop status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!shop || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("shops").delete().eq("id", shop.id);
      if (error) throw error;
      toast.success("Shop permanently deleted.");
      await supabase.auth.signOut();
      navigate({ to: "/login" });
    } catch (e) {
      showFriendlyError(e, "Couldn't delete your shop. Please try again.");
      setDeleting(false);
    }
  };

  const registerShopLocation = async () => {
    if (!shop) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("locationSaveFailed"));
      return;
    }
    setSavingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data, error } = await supabase
            .from("shops")
            .update({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
            .eq("id", shop.id)
            .select("id, name, category, village, latitude, longitude, is_open")
            .single();
          if (error) throw error;
          if (data) setShop(data as DbShop);
          toast.success(t("locationSaved"));
        } catch (e) {
          showFriendlyError(e, t("locationSaveFailed"));
        } finally {
          setSavingLoc(false);
        }
      },
      () => {
        toast.error(t("locationSaveFailed"));
        setSavingLoc(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Auth gate: signed-in users only. A null role is fine here — they may be
  // about to become a shopkeeper via the ShopSetup form (become_shopkeeper RPC).
  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/login" });
    else if (role === "customer") navigate({ to: "/customer" });
  }, [authLoading, user, role, navigate]);

  // Load shop + inventory (run for shopkeepers AND not-yet-assigned users
  // so the ShopSetup form appears for new merchants).
  useEffect(() => {
    if (!user || role === "customer") return;
    let mounted = true;
    (async () => {
      try {
        const { data: shops, error: shopsErr } = await supabase
          .from("shops")
          .select("id, name, category, village, latitude, longitude, is_open")
          .eq("owner_id", user.id)
          .limit(1);
        if (shopsErr) throw shopsErr;
        if (!mounted) return;
        const myShop = (shops?.[0] as DbShop | undefined) ?? null;
        setShop(myShop);
        if (myShop) {
          const { data: inv, error: invErr } = await supabase
            .from("inventory")
            .select("id, name, aliases, price, unit, status, updated_at")
            .eq("shop_id", myShop.id)
            .order("updated_at", { ascending: false });
          if (invErr) throw invErr;
          if (mounted) setItems((inv as unknown as DbItem[]) ?? []);
        }
      } catch (e) {
        showFriendlyError(e, "Couldn't load your shop. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, role]);

  const popular = useMemo(
    () => (shop ? (POPULAR_BY_CATEGORY[shop.category] ?? []) : []),
    [shop],
  );

  const findItem = (name: string) =>
    items.find((i) => i.name.toLowerCase() === name.toLowerCase());

  const upsertItem = async (
    name: string,
    fields: { price?: number; unit?: string; status?: "in" | "out" },
  ) => {
    if (!shop) return;
    const existing = findItem(name);
    try {
      if (existing) {
        const { data, error } = await supabase
          .from("inventory")
          .update({
            ...(fields.price !== undefined ? { price: fields.price } : {}),
            ...(fields.unit ? { unit: fields.unit } : {}),
            ...(fields.status ? { status: fields.status } : {}),
          })
          .eq("id", existing.id)
          .select("id, name, aliases, price, unit, status, updated_at")
          .single();
        if (error) throw error;
        if (data) {
          setItems((prev) => prev.map((i) => (i.id === existing.id ? (data as DbItem) : i)));
        }
      } else {
        const { data, error } = await supabase
          .from("inventory")
          .insert({
            shop_id: shop.id,
            name,
            aliases: [name.toLowerCase()],
            price: fields.price ?? 0,
            unit: fields.unit ?? "pc",
            status: fields.status ?? "in",
          })
          .select("id, name, aliases, price, unit, status, updated_at")
          .single();
        if (error) throw error;
        if (data) {
          setItems((prev) => [data as DbItem, ...prev]);
        }
      }
    } catch (e) {
      showFriendlyError(e, "Couldn't save that item. Please try again.");
    }
  };

  const toggleStock = (templateName: string, unit: string, defaultPrice: number) => {
    const existing = findItem(templateName);
    if (existing) {
      upsertItem(templateName, { status: existing.status === "in" ? "out" : "in" });
    } else {
      upsertItem(templateName, { price: defaultPrice, unit, status: "in" });
    }
  };

  const updatePrice = (id: string, price: number) => {
    supabase
      .from("inventory")
      .update({ price })
      .eq("id", id)
      .select("id, name, aliases, price, unit, status, updated_at")
      .single()
      .then(({ data, error }) => {
        if (error) {
          showFriendlyError(error, "Couldn't update price.");
          return;
        }
        if (data) setItems((prev) => prev.map((i) => (i.id === id ? (data as DbItem) : i)));
      });
  };

  const addParsed = (p: ParsedItem) =>
    upsertItem(p.name, { price: p.price, unit: p.unit, status: p.status ?? "in" });

  const inStockCount = items.filter((i) => i.status === "in").length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen">
        <AppHeader showLogout />
        <div className="flex items-center justify-center pt-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
        </div>
      </div>
    );
  }

  if (!shop) {
    return <ShopSetup onCreated={(s) => setShop(s)} />;
  }

  return (
    <div className="min-h-screen pb-28">
      <AppHeader title={t("inventory")} showLogout />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-warm p-5 text-primary-foreground shadow-warm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{shop.name}</p>
              <p className="font-display text-4xl font-black">
                {inStockCount}{" "}
                <span className="text-base font-bold opacity-80">
                  / {items.length} items
                </span>
              </p>
              <p className="mt-1 text-xs opacity-80">
                {shop.category} · {shop.village}
              </p>
            </div>
            <Sparkles className="h-10 w-10 opacity-60" />
          </div>
          <button
            type="button"
            onClick={registerShopLocation}
            disabled={savingLoc}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-background/15 px-4 py-3 text-sm font-bold text-primary-foreground backdrop-blur-sm ring-1 ring-primary-foreground/20 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {savingLoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {shop.latitude && shop.longitude
              ? t("updateShopLocation")
              : t("registerShopLocation")}
            {shop.latitude && shop.longitude && (
              <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-success" aria-hidden />
            )}
          </button>
        </motion.div>

        <section className="mt-6">
          <h2 className="font-display text-xl font-bold">{t("popularItems")}</h2>
          <p className="text-sm text-muted-foreground">{t("tapInStock")}</p>

          <ul className="mt-3 space-y-2">
            {popular.map((p) => {
              const existing = findItem(p.name);
              const inStock = existing?.status === "in";
              return (
                <li
                  key={p.name}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{p.name}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>₹</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        defaultValue={existing?.price ?? p.defaultPrice}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isFinite(v)) return;
                          if (existing) updatePrice(existing.id, v);
                        }}
                        className="w-16 rounded-md border border-border bg-background px-2 py-0.5 font-semibold text-foreground outline-none focus:border-primary"
                      />
                      <span>/ {p.unit}</span>
                      {existing && (
                        <span>· {timeAgo(new Date(existing.updated_at).getTime())}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStock(p.name, p.unit, p.defaultPrice)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold shadow-soft transition-all active:scale-[0.97] ${
                      inStock
                        ? "bg-secondary text-secondary-foreground"
                        : existing
                          ? "border border-destructive/20 bg-destructive/10 text-destructive"
                          : "border border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {inStock ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> {t("inStock")}
                      </>
                    ) : existing ? (
                      <>
                        <XCircle className="h-4 w-4" /> {t("outOfStock")}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Add
                      </>
                    )}
                  </button>
                  {existing && (
                    <button
                      type="button"
                      onClick={() => setItemToDelete(existing)}
                      aria-label={`Delete ${p.name}`}
                      className="flex shrink-0 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-destructive transition active:scale-95 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {items.filter((i) => !popular.some((p) => p.name === i.name)).length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Other items</h2>
            <ul className="mt-3 space-y-2">
              {items
                .filter((i) => !popular.some((p) => p.name === i.name))
                .map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{i.price} / {i.unit} · {timeAgo(new Date(i.updated_at).getTime())}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() =>
                          upsertItem(i.name, { status: i.status === "in" ? "out" : "in" })
                        }
                        className={`rounded-xl px-3 py-2 text-xs font-bold ${
                          i.status === "in"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {i.status === "in" ? t("inStock") : t("outOfStock")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(i)}
                        aria-label={`Delete ${i.name}`}
                        className="flex items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-2 text-destructive transition active:scale-95 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        )}
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold">Shop Status</h2>
              <p className="text-sm text-muted-foreground">
                {shop.is_open === false
                  ? "Customers see your shop as Temporarily Closed."
                  : "Your shop is visible and accepting orders."}
              </p>
            </div>
            <Switch
              checked={shop.is_open !== false}
              onCheckedChange={toggleShopStatus}
              disabled={statusSaving}
              aria-label="Toggle shop open/closed"
            />
          </div>
        </section>

        <section className="mt-12 rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold">Danger Zone</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Permanently delete your shop, inventory, and all listings. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteOpen(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 font-bold text-destructive-foreground shadow-soft active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" />
            Permanently Delete Shop
          </button>
        </section>
      </main>

      <Dialog open={deleteOpen} onOpenChange={(o) => !deleting && setDeleteOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently delete your shop?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your shop data, inventory, and listings will be
              deleted forever. Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-mono outline-none focus:border-destructive"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="rounded-2xl border border-border bg-card px-4 py-2.5 font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteShop}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-2.5 font-bold text-destructive-foreground disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete forever
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(o) => !deletingItem && !o && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{itemToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteItem();
              }}
              disabled={deletingItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <button
            onClick={() => setScanOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 font-bold shadow-soft active:scale-[0.98]"
          >
            <ScanLine className="h-5 w-5" />
            {t("scan")}
          </button>
          <button
            onClick={() => setVoiceOpen(true)}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-4 py-3 font-bold text-primary-foreground shadow-warm active:scale-[0.98]"
          >
            <Mic className="h-5 w-5" />
            {t("voiceAdd")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {voiceOpen && <VoiceModal onClose={() => setVoiceOpen(false)} onAdd={addParsed} />}
        {scanOpen && <ScanModal onClose={() => setScanOpen(false)} onAdd={addParsed} />}
      </AnimatePresence>
    </div>
  );
}

function ShopSetup({ onCreated }: { onCreated: (s: DbShop) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [village, setVillage] = useState("");
  const [landmark, setLandmark] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);

    // Best-effort geolocation capture so customers can find this shop by distance.
    const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 5 * 60 * 1000 },
      );
    });

    try {
      const fullWa = `91${whatsapp.replace(/\D/g, "")}`;
      const { data: shopId, error: rpcErr } = await supabase.rpc("become_shopkeeper", {
        _name: name.trim(),
        _category: category,
        _village: village.trim(),
        _whatsapp: fullWa,
        _latitude: coords?.lat ?? undefined,
        _longitude: coords?.lng ?? undefined,
      });

      if (rpcErr || !shopId) {
        throw rpcErr ?? new Error("Could not create shop");
      }

      // Save the optional landmark (RPC doesn't accept it).
      if (landmark.trim()) {
        await supabase
          .from("shops")
          .update({ landmark: landmark.trim() })
          .eq("id", shopId as string);
      }

      // Refetch the row so we have the canonical shape.
      const { data: row, error: rowErr } = await supabase
        .from("shops")
        .select("id, name, category, village, latitude, longitude, is_open")
        .eq("id", shopId as string)
        .maybeSingle();
      if (rowErr) throw rowErr;
      if (row) {
        toast.success("Shop created! Welcome aboard.");
        onCreated(row as DbShop);
        await supabase.auth.refreshSession();
      }
    } catch (e) {
      const msg = showFriendlyError(e, "Couldn't create your shop. Please try again.");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader title={t("setupShop")} showLogout />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary shadow-soft">
          <Store className="h-8 w-8 text-secondary-foreground" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-black text-balance">{t("setupShop")}</h2>
        <p className="mt-1 text-muted-foreground">
          Tell villagers about your shop. You can change this anytime.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field label={t("shopName")}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lakshmi Kirana"
              className="w-full bg-transparent px-4 py-3 text-lg outline-none"
            />
          </Field>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Category
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    c === category
                      ? "bg-foreground text-background shadow-soft"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("village")}>
            <input
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="Pothavaram"
              className="w-full bg-transparent px-4 py-3 text-lg outline-none"
            />
          </Field>

          <Field label={t("landmark")}>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder={t("landmarkPlaceholder")}
              className="w-full bg-transparent px-4 py-3 text-lg outline-none"
            />
          </Field>

          <Field label={t("whatsappNumber")}>
            <div className="flex items-center gap-2 px-3">
              <span className="rounded-xl bg-muted px-3 py-2 font-bold">+91</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full bg-transparent py-2 text-lg font-bold tracking-wider outline-none"
              />
            </div>
          </Field>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || whatsapp.length !== 10}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" />}
            {t("saveShop")} →
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-1 rounded-3xl border-2 border-border bg-card focus-within:border-primary">
        {children}
      </div>
    </div>
  );
}

function VoiceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: ParsedItem) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  const start = () => {
    setError(null);
    setTranscript("");
    setParsed(null);
    const w = window as unknown as {
      SpeechRecognition?: new () => unknown;
      webkitSpeechRecognition?: new () => unknown;
    };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition not supported on this browser. Try Chrome on Android.");
      return;
    }
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const rec: any = new (SpeechRecognition as any)();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setTranscript(text);
      const p = parseVoiceCommand(text);
      if (p) setParsed(p);
    };
    rec.onerror = (e: any) => setError(e.error || "Recognition error");
    rec.onend = () => setListening(false);
    rec.start();
    /* eslint-enable @typescript-eslint/no-explicit-any */
    recRef.current = rec;
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  useEffect(() => {
    start();
    return () => recRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = () => {
    if (parsed) onAdd(parsed);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-4xl bg-card p-6 shadow-warm sm:rounded-4xl"
      >
        <div className="flex flex-col items-center text-center">
          <motion.button
            onClick={listening ? stop : start}
            animate={listening ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`flex h-24 w-24 items-center justify-center rounded-full shadow-warm ${
              listening ? "bg-destructive" : "bg-gradient-warm"
            }`}
          >
            {listening ? (
              <Square className="h-10 w-10 text-primary-foreground" fill="currentColor" />
            ) : (
              <Mic className="h-10 w-10 text-primary-foreground" />
            )}
          </motion.button>
          <p className="mt-4 font-display text-xl font-bold">
            {listening ? t("listening") : "Tap to speak"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try: "Add 10 kg rice for 60 rupees"
          </p>
        </div>

        {transcript && (
          <div className="mt-5 rounded-2xl bg-muted px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">You said</p>
            <p className="mt-1 font-semibold">{transcript}</p>
          </div>
        )}

        {parsed && (
          <div className="mt-3 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wider text-primary">Parsed</p>
            <p className="mt-1 font-display text-lg font-bold">{parsed.name}</p>
            <p className="text-sm text-muted-foreground">
              {parsed.price ? `₹${parsed.price}` : "no price"}
              {parsed.unit ? ` / ${parsed.unit}` : ""} ·{" "}
              {parsed.status === "out" ? t("outOfStock") : t("inStock")}
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border bg-card py-3 font-bold"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!parsed}
            className="flex-1 rounded-2xl bg-gradient-warm py-3 font-bold text-primary-foreground shadow-warm disabled:opacity-40"
          >
            Add to inventory
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScanModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: ParsedItem) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let detector: any = null;
    let raf = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setLoading(false);
        const w = window as any;
        if ("BarcodeDetector" in w) {
          detector = new w.BarcodeDetector({
            formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
          });
          const tick = async () => {
            if (!videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length > 0) {
                setDetected(codes[0].rawValue);
                return;
              }
            } catch {
              /* ignore frame errors */
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          setError(
            "Live barcode scanning isn't supported on this browser. Type the barcode manually below.",
          );
        }
      } catch (e: any) {
        setLoading(false);
        setError(e?.message || "Camera permission denied");
      }
    })();
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const code = detected || manual;

  const submit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      price: price ? parseFloat(price) : undefined,
      unit: "pc",
      status: "in",
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-4xl bg-card p-6 shadow-warm sm:rounded-4xl"
      >
        <h2 className="font-display text-xl font-bold">Scan barcode</h2>

        <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-foreground">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-primary-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary shadow-warm" />
        </div>

        {error && <p className="mt-3 text-sm text-muted-foreground">{error}</p>}

        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Barcode
          </label>
          <input
            value={code}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Detected or type manually"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 font-mono outline-none focus:border-primary"
          />

          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Item name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Parle-G Biscuit"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />

          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Price (₹)
          </label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="10"
            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border bg-card py-3 font-bold"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 rounded-2xl bg-gradient-warm py-3 font-bold text-primary-foreground shadow-warm disabled:opacity-40"
          >
            Save item
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
