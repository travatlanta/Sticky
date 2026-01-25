export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Parse customer info from notes field (production schema doesn't have dedicated columns)
// Must match the format used in by-token route.ts: "Customer:", "Email:", "Phone:"
function parseNotesForCustomerInfo(notes: string | null): { 
  name: string | null; 
  email: string | null; 
  phone: string | null;
} {
  if (!notes) return { name: null, email: null, phone: null };
  
  let name: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;
  
  // Try both formats: "Customer:" and "Customer Name:"
  const nameMatch = notes.match(/Customer:\s*(.+?)(?:\n|$)/i) || notes.match(/Customer Name:\s*([^\n]+)/i);
  if (nameMatch) name = nameMatch[1].trim();
  
  // Try both formats: "Email:" and "Customer Email:"
  const emailMatch = notes.match(/Email:\s*(.+?)(?:\n|$)/i) || notes.match(/Customer Email:\s*([^\n]+)/i);
  if (emailMatch) email = emailMatch[1].trim();
  
  // Try both formats: "Phone:" and "Customer Phone:"
  const phoneMatch = notes.match(/Phone:\s*(.+?)(?:\n|$)/i) || notes.match(/Customer Phone:\s*([^\n]+)/i);
  if (phoneMatch) phone = phoneMatch[1].trim();
  
  return { name, email, phone };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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

    // Find order by token in notes (production schema doesn't have paymentLinkToken column)
    const orderResult = await db.execute(sql`
      SELECT id, status, user_id, notes
      FROM orders 
      WHERE notes LIKE ${'%Payment Link: ' + token + '%'}
      LIMIT 1
    `);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = orderResult.rows[0] as any;
    const customerInfo = parseNotesForCustomerInfo(order.notes);

    // Allow registration for orders in pending states (not just pending_payment)
    const allowedStatuses = ["pending_payment", "pending", "awaiting_artwork", "processing"];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { message: `This order cannot be used for registration (status: ${order.status}). Please contact support.` },
        { status: 400 }
      );
    }

    if (order.user_id) {
      return NextResponse.json(
        { message: "This order is already linked to an account. Please log in." },
        { status: 400 }
      );
    }

    if (!customerInfo.email) {
      return NextResponse.json(
        { message: "Order has no associated email" },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, customerInfo.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please log in." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nameParts = customerInfo.name?.split(" ") || [];
    const derivedFirstName = firstName || nameParts[0] || "";
    const derivedLastName = lastName || nameParts.slice(1).join(" ") || "";

    const [newUser] = await db
      .insert(users)
      .values({
        email: customerInfo.email,
        passwordHash,
        firstName: derivedFirstName,
        lastName: derivedLastName,
        phone: customerInfo.phone || null,
      })
      .returning();

    // Update order with user ID
    await db.execute(sql`
      UPDATE orders SET user_id = ${newUser.id}
      WHERE id = ${order.id}
    `);

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      email: customerInfo.email,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { message: "Failed to create account" },
      { status: 500 }
    );
  }
}
