import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { productOptions } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const optionNames = ['Vinyl', 'Foil', 'Holographic', 'Gloss', 'Varnish', 'Emboss'];
    
    const pricesByName: Record<string, { count: number; minPrice: string; maxPrice: string; mostCommonPrice: string }> = {};
    
    for (const name of optionNames) {
      const options = await db
        .select({
          priceModifier: productOptions.priceModifier,
        })
        .from(productOptions)
        .where(eq(productOptions.name, name));
      
      if (options.length > 0) {
        const prices = options.map(o => parseFloat(o.priceModifier || '0'));
        const priceCount: Record<string, number> = {};
        prices.forEach(p => {
          const key = p.toFixed(2);
          priceCount[key] = (priceCount[key] || 0) + 1;
        });
        const mostCommon = Object.entries(priceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '0.00';
        
        pricesByName[name] = {
          count: options.length,
          minPrice: Math.min(...prices).toFixed(2),
          maxPrice: Math.max(...prices).toFixed(2),
          mostCommonPrice: mostCommon,
        };
      } else {
        pricesByName[name] = {
          count: 0,
          minPrice: '0.00',
          maxPrice: '0.00',
          mostCommonPrice: '0.00',
        };
      }
    }
    
    return NextResponse.json({ options: pricesByName });
  } catch (error) {
    console.error('Error fetching option prices:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optionName, newPrice, preview } = body;
    
    if (!optionName || newPrice === undefined || newPrice === null) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const validOptions = ['Vinyl', 'Foil', 'Holographic', 'Gloss', 'Varnish', 'Emboss'];
    if (!validOptions.includes(optionName)) {
      return NextResponse.json({ message: 'Invalid option name' }, { status: 400 });
    }

    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      return NextResponse.json({ message: 'Invalid price value' }, { status: 400 });
    }

    const existingOptions = await db
      .select({
        id: productOptions.id,
        productId: productOptions.productId,
        name: productOptions.name,
        priceModifier: productOptions.priceModifier,
      })
      .from(productOptions)
      .where(eq(productOptions.name, optionName));

    if (preview) {
      return NextResponse.json({
        optionName,
        currentCount: existingOptions.length,
        newPrice: priceValue.toFixed(2),
        affected: existingOptions.map(o => ({
          id: o.id,
          productId: o.productId,
          oldPrice: o.priceModifier,
          newPrice: priceValue.toFixed(2),
        })),
      });
    }

    const result = await db
      .update(productOptions)
      .set({ priceModifier: priceValue.toFixed(2) })
      .where(eq(productOptions.name, optionName));

    return NextResponse.json({
      message: `Updated ${existingOptions.length} "${optionName}" options to $${priceValue.toFixed(2)}`,
      updatedCount: existingOptions.length,
    });
  } catch (error) {
    console.error('Error updating option prices:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update tier-specific option pricing for all products
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optionName, priceModifier, tier2PriceModifier, tier3PriceModifier, tier4PriceModifier } = body;
    
    if (!optionName) {
      return NextResponse.json({ message: 'Missing option name' }, { status: 400 });
    }

    const validOptions = ['Vinyl', 'Foil', 'Holographic', 'Gloss', 'Varnish', 'Emboss'];
    if (!validOptions.includes(optionName)) {
      return NextResponse.json({ message: 'Invalid option name' }, { status: 400 });
    }

    // Build update data
    const updateData: Record<string, string | null> = {};
    
    if (priceModifier !== undefined && priceModifier !== null && priceModifier !== '') {
      const price = parseFloat(priceModifier);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ message: 'Invalid tier 1 price' }, { status: 400 });
      }
      updateData.priceModifier = price.toFixed(2);
    }
    
    if (tier2PriceModifier !== undefined && tier2PriceModifier !== null && tier2PriceModifier !== '') {
      const price = parseFloat(tier2PriceModifier);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ message: 'Invalid tier 2 price' }, { status: 400 });
      }
      updateData.tier2PriceModifier = price.toFixed(4);
    }
    
    if (tier3PriceModifier !== undefined && tier3PriceModifier !== null && tier3PriceModifier !== '') {
      const price = parseFloat(tier3PriceModifier);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ message: 'Invalid tier 3 price' }, { status: 400 });
      }
      updateData.tier3PriceModifier = price.toFixed(4);
    }
    
    if (tier4PriceModifier !== undefined && tier4PriceModifier !== null && tier4PriceModifier !== '') {
      const price = parseFloat(tier4PriceModifier);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ message: 'Invalid tier 4 price' }, { status: 400 });
      }
      updateData.tier4PriceModifier = price.toFixed(4);
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No price values provided' }, { status: 400 });
    }

    // Count affected options
    const existingOptions = await db
      .select({ id: productOptions.id })
      .from(productOptions)
      .where(eq(productOptions.name, optionName));

    // Update all options with this name
    await db
      .update(productOptions)
      .set(updateData)
      .where(eq(productOptions.name, optionName));

    const tierUpdates = Object.keys(updateData).map(k => {
      if (k === 'priceModifier') return 'Tier 1';
      if (k === 'tier2PriceModifier') return 'Tier 2';
      if (k === 'tier3PriceModifier') return 'Tier 3';
      if (k === 'tier4PriceModifier') return 'Tier 4';
      return k;
    });

    return NextResponse.json({
      message: `Updated ${existingOptions.length} "${optionName}" options (${tierUpdates.join(', ')})`,
      updatedCount: existingOptions.length,
    });
  } catch (error) {
    console.error('Error updating option tier prices:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
