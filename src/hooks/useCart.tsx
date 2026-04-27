import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CartLine = {
  shopId: string;
  shopName: string;
  whatsapp?: string; // populated when user reveals/orders
  itemId: string;
  itemName: string;
  unit: string;
  price: number;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  addOrIncrement: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (shopId: string, itemId: string, qty: number) => void;
  remove: (shopId: string, itemId: string) => void;
  clearShop: (shopId: string) => void;
  countForShop: (shopId: string) => number;
  linesForShop: (shopId: string) => CartLine[];
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "vf_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines]);

  const addOrIncrement = useCallback<CartCtx["addOrIncrement"]>((line) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.shopId === line.shopId && l.itemId === line.itemId);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + (line.qty ?? 1) };
        return next;
      }
      return [...prev, { ...line, qty: line.qty ?? 1 }];
    });
  }, []);

  const setQty = useCallback((shopId: string, itemId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.shopId === shopId && l.itemId === itemId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((shopId: string, itemId: string) => {
    setLines((prev) => prev.filter((l) => !(l.shopId === shopId && l.itemId === itemId)));
  }, []);

  const clearShop = useCallback((shopId: string) => {
    setLines((prev) => prev.filter((l) => l.shopId !== shopId));
  }, []);

  const countForShop = useCallback(
    (shopId: string) => lines.filter((l) => l.shopId === shopId).reduce((s, l) => s + l.qty, 0),
    [lines],
  );

  const linesForShop = useCallback(
    (shopId: string) => lines.filter((l) => l.shopId === shopId),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, addOrIncrement, setQty, remove, clearShop, countForShop, linesForShop }),
    [lines, addOrIncrement, setQty, remove, clearShop, countForShop, linesForShop],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
