import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { POPULAR_BY_CATEGORY, CATEGORIES, timeAgo, type InventoryItem } from "@/lib/mockData";
import { t } from "@/lib/i18n";
import { parseVoiceCommand, type ParsedItem } from "@/lib/voiceParser";

export const Route = createFileRoute("/shopkeeper")({
  component: ShopkeeperPage,
});

type LocalItem = InventoryItem;

const STORAGE_KEY = "vf_shop_inventory";
const CAT_KEY = "vf_shop_category";

function loadInventory(): LocalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalItem[]) : [];
  } catch {
    return [];
  }
}

function saveInventory(items: LocalItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function ShopkeeperPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    setCategory(localStorage.getItem(CAT_KEY) || CATEGORIES[0]);
    setItems(loadInventory());
  }, []);

  useEffect(() => {
    saveInventory(items);
  }, [items]);

  const popular = useMemo(() => POPULAR_BY_CATEGORY[category] ?? [], [category]);

  const findItem = (name: string) =>
    items.find((i) => i.name.toLowerCase() === name.toLowerCase());

  const toggleStock = (templateName: string, unit: string, defaultPrice: number) => {
    const existing = findItem(templateName);
    const now = Date.now();
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === existing.id
            ? { ...i, status: i.status === "in" ? "out" : "in", updatedAt: now }
            : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: templateName,
          aliases: [templateName.toLowerCase()],
          price: defaultPrice,
          unit,
          status: "in",
          updatedAt: now,
        },
      ]);
    }
  };

  const updatePrice = (id: string, price: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, price, updatedAt: Date.now() } : i)),
    );
  };

  const addParsed = (p: ParsedItem) => {
    const existing = findItem(p.name);
    const now = Date.now();
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === existing.id
            ? {
                ...i,
                price: p.price ?? i.price,
                unit: p.unit ?? i.unit,
                status: p.status ?? "in",
                updatedAt: now,
              }
            : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: p.name,
          aliases: [p.name.toLowerCase()],
          price: p.price ?? 0,
          unit: p.unit ?? "pc",
          status: p.status ?? "in",
          updatedAt: now,
        },
      ]);
    }
  };

  const inStockCount = items.filter((i) => i.status === "in").length;

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
              <p className="text-sm opacity-90">Today's stock</p>
              <p className="font-display text-4xl font-black">
                {inStockCount}{" "}
                <span className="text-base font-bold opacity-80">
                  / {items.length} items
                </span>
              </p>
            </div>
            <Sparkles className="h-10 w-10 opacity-60" />
          </div>
        </motion.div>

        <div className="mt-6">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Shop category
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  localStorage.setItem(CAT_KEY, c);
                }}
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
                      {existing && <span>· {timeAgo(existing.updatedAt)}</span>}
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
                        ₹{i.price} / {i.unit} · {timeAgo(i.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((it) =>
                            it.id === i.id
                              ? {
                                  ...it,
                                  status: it.status === "in" ? "out" : "in",
                                  updatedAt: Date.now(),
                                }
                              : it,
                          ),
                        )
                      }
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${
                        i.status === "in"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {i.status === "in" ? t("inStock") : t("outOfStock")}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </main>

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
  const recRef = useRef<any>(null);

  const start = () => {
    setError(null);
    setTranscript("");
    setParsed(null);
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition not supported on this browser. Try Chrome on Android.");
      return;
    }
    const rec = new SpeechRecognition();
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

        {error && <p className="mt-3 text-sm text-warning-foreground">{error}</p>}

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
