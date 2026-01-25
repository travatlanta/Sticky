import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any).isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ message: "Invalid order ID" }, { status: 400 });
    }

    const orderResult = await db.execute(sql`
      SELECT id, order_number FROM orders WHERE id = ${orderId}
    `);
    
    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;

    const itemsResult = await db.execute(sql`
      SELECT oi.id, oi.design_id, d.name as design_name
      FROM order_items oi
      LEFT JOIN designs d ON oi.design_id = d.id
      WHERE oi.order_id = ${orderId}
    `);

    for (const item of itemsResult.rows as any[]) {
      if (item.design_id && item.design_name) {
        let newName = item.design_name;
        
        if (!newName.includes('[FLAGGED]')) {
          if (newName.includes('[CUSTOMER_UPLOAD]')) {
            newName = newName.replace('[CUSTOMER_UPLOAD]', '[FLAGGED]');
          } else {
            newName = `[FLAGGED] ${newName}`;
          }
        }
        
        if (newName.includes('[APPROVED]')) {
          newName = newName.replace('[APPROVED]', '');
        }

        await db.execute(sql`
          UPDATE designs SET name = ${newName.trim()}, updated_at = NOW()
          WHERE id = ${item.design_id}
        `);
      }
    }

    return NextResponse.json({ 
      message: "Issue flagged successfully. Customer will be asked to approve artwork." 
    });
  } catch (error) {
    console.error("Error flagging issue:", error);
    return NextResponse.json(
      { message: "Failed to flag issue" },
      { status: 500 }
    );
  }
}
