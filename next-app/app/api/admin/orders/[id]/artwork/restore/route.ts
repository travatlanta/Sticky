export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    // Await params for Next.js 14 compatibility
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const orderRows = await sql`
      SELECT id, "orderNumber", "userId", "adminDesignId"
      FROM orders
      WHERE id = ${orderId}
    `;

    if (orderRows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];

    if (!order.adminDesignId) {
      return NextResponse.json({ message: "No admin revision to restore from" }, { status: 400 });
    }

    await sql`
      UPDATE orders
      SET "adminDesignId" = NULL
      WHERE id = ${orderId}
    `;

    if (order.userId) {
      await sql`
        INSERT INTO notifications ("userId", type, title, message, "orderId", "linkUrl")
        VALUES (
          ${order.userId},
          'order_updated',
          'Original Artwork Restored',
          ${'Your original artwork for order #' + order.orderNumber + ' has been restored.'},
          ${orderId},
          ${'/orders/' + orderId + '/artwork'}
        )
      `;
    }

    return NextResponse.json({ 
      success: true,
      message: "Original artwork restored successfully"
    });
  } catch (error) {
    console.error("Error restoring original artwork:", error);
    return NextResponse.json({ message: "Failed to restore original artwork" }, { status: 500 });
  }
}
