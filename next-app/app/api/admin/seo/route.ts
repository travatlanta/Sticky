import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteSettings, products, users } from "@/shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user[0]?.isAdmin === true;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const settings = await db.select().from(siteSettings);
    const allProducts = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      thumbnailUrl: products.thumbnailUrl,
      metaTitle: products.metaTitle,
      metaDescription: products.metaDescription,
      isActive: products.isActive,
    }).from(products);

    const seoSettings: Record<string, any> = {};
    settings.forEach(s => {
      seoSettings[s.key] = s.value;
    });

    return NextResponse.json({
      settings: seoSettings,
      products: allProducts,
    });
  } catch (error) {
    console.error("SEO fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch SEO data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);

    if (existing.length > 0) {
      await db.update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SEO save error:", error);
    return NextResponse.json({ error: "Failed to save SEO settings" }, { status: 500 });
  }
}
