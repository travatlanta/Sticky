import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the shipping configuration file. We resolve the path
// relative to the repository root. The config file lives at
// `next-app/config/shipping.json`. Using `path.resolve` ensures we
// consistently locate the file regardless of where the API is executed.
const configPath = path.resolve(process.cwd(), 'next-app', 'config', 'shipping.json');

/**
 * GET handler returns the current shipping configuration. If the file
 * cannot be read or parsed, a sensible default is returned.
 */
export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const json = JSON.parse(data);
    // Ensure the response contains expected keys
    // Validate the presence and types of expected keys. If missing, fill
    // in sensible defaults to avoid runtime errors on the client.
    const shippingCost = typeof json.shippingCost === 'number' ? json.shippingCost : 15;
    const freeShipping = typeof json.freeShipping === 'boolean' ? json.freeShipping : false;
    const automaticShipping = typeof json.automaticShipping === 'boolean' ? json.automaticShipping : false;
    return NextResponse.json({ shippingCost, freeShipping, automaticShipping });
  } catch (error) {
    // On error (file not found or invalid JSON) return default shipping settings
    return NextResponse.json({ shippingCost: 15, freeShipping: false, automaticShipping: false });
  }
}

/**
 * POST handler updates the shipping configuration. It expects a JSON
 * payload with `shippingCost` (number) and `freeShipping` (boolean).
 * Invalid inputs result in a 400 response. On success the new
 * configuration is persisted to disk and returned.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { shippingCost, freeShipping, automaticShipping } = body;
    // Coerce types and validate
    shippingCost = Number(shippingCost);
    if (isNaN(shippingCost) || shippingCost < 0) {
      return NextResponse.json({ error: 'shippingCost must be a non‑negative number' }, { status: 400 });
    }
    freeShipping = Boolean(freeShipping);
    automaticShipping = Boolean(automaticShipping);
    const newConfig = { shippingCost, freeShipping, automaticShipping };
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    return NextResponse.json(newConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}