export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 32) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    const body = await request.json();
    const { password, firstName, lastName } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.paymentLinkToken, token))
      .limit(1);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending_payment") {
      return NextResponse.json(
        { message: "This order is no longer available for registration" },
        { status: 400 }
      );
    }

    if (order.userId) {
      return NextResponse.json(
        { message: "This order is already linked to an account. Please log in." },
        { status: 400 }
      );
    }

    if (!order.customerEmail) {
      return NextResponse.json(
        { message: "Order has no associated email" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, order.customerEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nameParts = order.customerName?.split(" ") || [];
    const derivedFirstName = firstName || nameParts[0] || "";
    const derivedLastName = lastName || nameParts.slice(1).join(" ") || "";

    const [newUser] = await db
      .insert(users)
      .values({
        email: order.customerEmail,
        passwordHash,
        firstName: derivedFirstName,
        lastName: derivedLastName,
        phone: order.customerPhone || null,
      })
      .returning();

    await db
      .update(orders)
      .set({ userId: newUser.id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      email: order.customerEmail,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { message: "Failed to create account" },
      { status: 500 }
    );
  }
}
