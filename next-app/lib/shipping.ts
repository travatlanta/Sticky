import fs from "fs/promises";
import path from "path";

export interface ShippingSettings {
  shippingCost: number;
  freeShipping: boolean;
  automaticShipping: boolean;
}

export interface ShippingAddressForQuote {
  state?: string;
  zip?: string;
}

export interface ShippingItemForQuote {
  quantity: number;
  shippingType?: "free" | "flat" | "calculated" | null;
  flatShippingPrice?: string | null;
}

/**
 * Reads global shipping settings from next-app/config/shipping.json.
 * Falls back to sensible defaults if the file is missing or invalid.
 */
export async function readShippingSettings(): Promise<ShippingSettings> {
  const configPath = path.resolve(process.cwd(), "next-app", "config", "shipping.json");
  try {
    const data = await fs.readFile(configPath, "utf-8");
    const json = JSON.parse(data);
    const shippingCost = typeof json.shippingCost === "number" ? json.shippingCost : 15;
    const freeShipping = typeof json.freeShipping === "boolean" ? json.freeShipping : false;
    const automaticShipping = typeof json.automaticShipping === "boolean" ? json.automaticShipping : false;
    return { shippingCost, freeShipping, automaticShipping };
  } catch {
    return { shippingCost: 15, freeShipping: false, automaticShipping: false };
  }
}

/**
 * Computes shipping cost using:
 * - global shipping settings (base cost, freeShipping toggle, automaticShipping toggle)
 * - per-product shipping configuration (free / flat / calculated)
 * - destination-based multiplier (currently based on state)
 */
export async function computeShippingQuote(
  items: ShippingItemForQuote[],
  address: ShippingAddressForQuote
): Promise<{ shippingCost: number; locationMultiplier: number }> {
  const settings = await readShippingSettings();

  if (settings.freeShipping) {
    return { shippingCost: 0, locationMultiplier: 1 };
  }

  const base = settings.shippingCost ?? 15;

  let flatPart = 0;
  let calculatedQty = 0;

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    const shippingType = item.shippingType || "calculated";

    if (shippingType === "free") continue;

    if (shippingType === "flat") {
      const flat = parseFloat(item.flatShippingPrice || "0");
      if (!isNaN(flat) && flat > 0) {
        flatPart += flat * Math.max(1, qty);
      }
      continue;
    }

    // calculated
    calculatedQty += Math.max(1, qty);
  }

  const calculatedPart =
    calculatedQty === 0
      ? 0
      : settings.automaticShipping
        ? base * calculatedQty
        : base;

  let total = flatPart + calculatedPart;

  // Destination multiplier (simple, but truly address-based)
  const state = (address.state || "").trim().toUpperCase();
  let locationMultiplier = 1;

  if (state === "AK" || state === "HI") locationMultiplier = 1.5;

  total = total * locationMultiplier;

  // Round to 2 decimals
  const shippingCost = Math.round(total * 100) / 100;

  return { shippingCost, locationMultiplier };
}
