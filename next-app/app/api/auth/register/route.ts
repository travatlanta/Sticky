export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase for consistent matching
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
      })
      .returning();

    // Link any existing orders with this email to the new user account
    // This ensures admin-created orders are immediately visible after registration
    try {
      const linkedOrders = await db.execute(sql`
        UPDATE orders 
        SET user_id = ${newUser.id}
        WHERE user_id IS NULL 
          AND LOWER(customer_email) = ${normalizedEmail}
        RETURNING id, order_number
      `);
      
      if (linkedOrders.rows && linkedOrders.rows.length > 0) {
        console.log(`[Registration] Linked ${linkedOrders.rows.length} existing orders to new user ${newUser.id}:`, 
          linkedOrders.rows.map((r: any) => r.order_number));
      }
      
      // Also check notes field for email matches (backup matching)
      const linkedByNotes = await db.execute(sql`
        UPDATE orders 
        SET user_id = ${newUser.id}
        WHERE user_id IS NULL 
          AND notes ILIKE ${'%Email: ' + normalizedEmail + '%'}
        RETURNING id, order_number
      `);
      
      if (linkedByNotes.rows && linkedByNotes.rows.length > 0) {
        console.log(`[Registration] Linked ${linkedByNotes.rows.length} orders via notes to new user ${newUser.id}:`, 
          linkedByNotes.rows.map((r: any) => r.order_number));
      }
    } catch (linkError) {
      console.error('[Registration] Failed to link existing orders:', linkError);
      // Don't fail registration if order linking fails
    }

    return NextResponse.json({
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
