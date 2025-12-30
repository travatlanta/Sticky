import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, users } from "@/shared/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user[0]?.isAdmin === true;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await req.json();
    const { metaTitle, metaDescription } = body;

    await db.update(products)
      .set({
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product SEO update error:", error);
    return NextResponse.json({ error: "Failed to update product SEO" }, { status: 500 });
  }
}
