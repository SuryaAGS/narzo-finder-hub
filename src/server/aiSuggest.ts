import { createServerFn } from "@tanstack/react-start";

/**
 * AI Search Assistant — given a free-text "need" (e.g. "fever", "biryani night",
 * "cleaning the bathroom") and a list of inventory item names, returns the
 * subset of items that would help. Used by the customer search to bridge
 * intents and stocked products.
 *
 * Uses the Lovable AI Gateway (no user-supplied API key). Free during the
 * promo window; falls back gracefully on error.
 */
export const aiSuggestItems = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = input as { query?: unknown; itemNames?: unknown };
    const query = typeof i.query === "string" ? i.query.trim().slice(0, 200) : "";
    const itemNames = Array.isArray(i.itemNames)
      ? (i.itemNames as unknown[])
          .filter((x): x is string => typeof x === "string")
          .slice(0, 500)
      : [];
    if (!query) throw new Error("query required");
    return { query, itemNames };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { suggestions: [] as string[] };
    }
    if (data.itemNames.length === 0) {
      return { suggestions: [] as string[] };
    }

    const prompt = `A villager is searching for: "${data.query}".
From the inventory list below, return ONLY the item names that would directly help with this need (medicines for symptoms, ingredients for a dish, supplies for a task, etc.).
Return at most 8 names. Be liberal with relevant matches but reject unrelated items.

Inventory:
${data.itemNames.map((n) => `- ${n}`).join("\n")}`;

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You map user needs (symptoms, recipes, tasks) to relevant products from a store inventory. Reply only via the provided tool.",
            },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "suggest_items",
                description: "Return inventory item names that match the user's need.",
                parameters: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { type: "string" },
                      description: "Item names copied verbatim from the inventory list.",
                    },
                  },
                  required: ["items"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "suggest_items" } },
        }),
      });

      if (!resp.ok) {
        return { suggestions: [] as string[] };
      }

      const json = (await resp.json()) as {
        choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
      };
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return { suggestions: [] as string[] };
      const parsed = JSON.parse(args) as { items?: unknown };
      const items = Array.isArray(parsed.items)
        ? (parsed.items as unknown[]).filter((x): x is string => typeof x === "string")
        : [];

      // Defense: only return names that actually exist in the inventory.
      const allowed = new Set(data.itemNames.map((n) => n.toLowerCase()));
      const filtered = items.filter((n) => allowed.has(n.toLowerCase())).slice(0, 8);
      return { suggestions: filtered };
    } catch {
      return { suggestions: [] as string[] };
    }
  });
