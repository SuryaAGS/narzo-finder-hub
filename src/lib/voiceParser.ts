// Lightweight rule-based parser for voice commands like:
//   "Add 10 kg Rice for 60 rupees"
//   "Sona Masuri rice 60 rupees per kg"
//   "Toor dal 130 per kg out of stock"

export type ParsedItem = {
  name: string;
  quantity?: number;
  unit?: string;
  price?: number;
  status?: "in" | "out";
};

const UNITS = ["kg", "g", "gram", "grams", "l", "liter", "litre", "ml", "pc", "piece", "pack", "sachet", "bunch", "strip"];

export function parseVoiceCommand(input: string): ParsedItem | null {
  if (!input.trim()) return null;
  let s = " " + input.toLowerCase().replace(/[,.]/g, " ") + " ";

  // status
  let status: "in" | "out" | undefined;
  if (/\bout of stock\b|\bnot available\b|\bkhatam\b|\baipoindi\b/.test(s)) status = "out";
  else if (/\bin stock\b|\bavailable\b|\bunnayi\b|\bhai\b/.test(s)) status = "in";

  // price
  let price: number | undefined;
  const priceMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs|\/-|inr)/);
  const forMatch = s.match(/for\s+(\d+(?:\.\d+)?)/);
  if (priceMatch) price = parseFloat(priceMatch[1]);
  else if (forMatch) price = parseFloat(forMatch[1]);

  // quantity + unit
  let quantity: number | undefined;
  let unit: string | undefined;
  const qtyUnitRe = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNITS.join("|")})\\b`);
  const qm = s.match(qtyUnitRe);
  if (qm) {
    quantity = parseFloat(qm[1]);
    unit = qm[2].replace(/^(gram|grams)$/, "g").replace(/^(liter|litre)$/, "L").replace(/^(piece)$/, "pc");
    if (unit === "l") unit = "L";
  }

  // strip recognized chunks then take remainder as name
  s = s
    .replace(/\badd\b|\bnew\b/g, " ")
    .replace(priceMatch?.[0] || "__NONE__", " ")
    .replace(forMatch?.[0] || "__NONE__", " ")
    .replace(qtyUnitRe, " ")
    .replace(/\b(rupees?|rs|inr|per|each|of|stock|in|out|not|available|khatam|aipoindi|unnayi|hai)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const name = s.replace(/^\w/, (c) => c.toUpperCase());
  if (!name) return null;
  return { name, quantity, unit, price, status };
}
