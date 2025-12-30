export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  // Require admin authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DATABASE_URL' }, { status: 500 });
  }

  const sql = neon(process.env.DATABASE_URL);
  const results: string[] = [];

  try {
    // Check if order_number column exists
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'order_number'
    `;
    
    if (checkColumn.length === 0) {
      // Add order_number column
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20)`;
      results.push('Added order_number column');
      
      // Generate order numbers for existing orders
      await sql`
        UPDATE orders 
        SET order_number = 'SB-' || LPAD(CAST(EXTRACT(EPOCH FROM created_at) AS INTEGER)::TEXT, 10, '0')
        WHERE order_number IS NULL
      `;
      results.push('Generated order numbers for existing orders');
      
      // Make it NOT NULL and UNIQUE
      await sql`ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL`;
      await sql`ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number)`;
      results.push('Added NOT NULL and UNIQUE constraints');
    } else {
      results.push('order_number column already exists');
    }

    // Check for other potentially missing columns
    const checkTrackingCarrier = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'tracking_carrier'
    `;
    
    if (checkTrackingCarrier.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier VARCHAR(50)`;
      results.push('Added tracking_carrier column');
    }

    const checkNotes = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'notes'
    `;
    
    if (checkNotes.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT`;
      results.push('Added notes column');
    }

    const checkStripePaymentIntentId = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
    `;
    
    if (checkStripePaymentIntentId.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255)`;
      results.push('Added stripe_payment_intent_id column');
    }

    const checkTrackingNumber = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'tracking_number'
    `;
    
    if (checkTrackingNumber.length === 0) {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)`;
      results.push('Added tracking_number column');
    }

    // Add SEO fields to products table
    const checkMetaTitle = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'meta_title'
    `;
    
    if (checkMetaTitle.length === 0) {
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(70)`;
      results.push('Added meta_title column to products');
    }

    const checkMetaDescription = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'meta_description'
    `;
    
    if (checkMetaDescription.length === 0) {
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160)`;
      results.push('Added meta_description column to products');
    }

    // List all columns in orders table
    const allColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      success: true,
      results,
      currentColumns: allColumns.map(c => c.column_name),
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 });
  }
}
