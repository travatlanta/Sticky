export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productOptions, pricingTiers } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ message: "Invalid product ID" }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // Fetch options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId));

    // Fetch pricing tiers
    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, productId));

    return NextResponse.json({
      ...product,
      options,
      pricingTiers: tiers,
    });
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return NextResponse.json({ message: "Failed to fetch product" }, { status: 500 });
  }
}
