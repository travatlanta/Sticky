import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/shared/schema";
import { eq } from "drizzle-orm";

interface ShippingAddress {
  name: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const isAdmin = (session.user as any).isAdmin === true;
    const isOwner = order.userId === session.user.id;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Not authorized to update this order" }, { status: 403 });
    }

    const paidStatuses = ['paid', 'in_production', 'printed', 'shipped', 'delivered'];
    if (order.status && paidStatuses.includes(order.status)) {
      return NextResponse.json({ message: "Cannot update shipping address after payment" }, { status: 400 });
    }

    const body = await request.json() as ShippingAddress;

    if (!body.name || !body.street || !body.city || !body.state || !body.zip) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const shippingAddress = {
      name: body.name.trim(),
      street: body.street.trim(),
      street2: body.street2?.trim() || "",
      city: body.city.trim(),
      state: body.state.trim().toUpperCase(),
      zip: body.zip.trim(),
      country: body.country?.trim() || "USA",
      phone: body.phone?.trim() || "",
    };

    await db
      .update(orders)
      .set({ shippingAddress })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ 
      message: "Shipping address updated successfully",
      shippingAddress 
    });
  } catch (error) {
    console.error("Error updating shipping address:", error);
    return NextResponse.json(
      { message: "Failed to update shipping address" },
      { status: 500 }
    );
  }
}
