export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { products, pricingTiers, productOptions, categories } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        categoryId: products.categoryId,
        basePrice: products.basePrice,
        isActive: products.isActive,
        useGlobalTiers: products.useGlobalTiers,
      })
      .from(products)
      .orderBy(asc(products.name));

    const allTiers = await db.select().from(pricingTiers);
    const allOptions = await db.select().from(productOptions);
    const allCategories = await db.select().from(categories);

    const productPricingData = allProducts.map((product) => {
      const productTiers = allTiers
        .filter((t) => t.productId === product.id)
        .sort((a, b) => a.minQuantity - b.minQuantity);
      
      const productMaterials = allOptions.filter(
        (o) => o.productId === product.id && o.optionType === 'material'
      );
      const productFinishes = allOptions.filter(
        (o) => o.productId === product.id && o.optionType === 'coating'
      );

      const category = allCategories.find((c) => c.id === product.categoryId);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        categoryName: category?.name || 'Uncategorized',
        basePrice: product.basePrice,
        isActive: product.isActive,
        useGlobalTiers: product.useGlobalTiers ?? true,
        tiers: productTiers.map((t) => ({
          id: t.id,
          minQuantity: t.minQuantity,
          maxQuantity: t.maxQuantity,
          pricePerUnit: t.pricePerUnit,
        })),
        materials: productMaterials.map((m) => ({
          id: m.id,
          name: m.name,
          priceModifier: m.priceModifier,
        })),
        finishes: productFinishes.map((f) => ({
          id: f.id,
          name: f.name,
          priceModifier: f.priceModifier,
        })),
      };
    });

    return NextResponse.json({ products: productPricingData });
  } catch (error) {
    console.error('Error fetching product pricing data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, field, value, tierId, optionId } = body;

    if (!productId) {
      return NextResponse.json({ message: 'Product ID required' }, { status: 400 });
    }

    if (field === 'basePrice') {
      await db
        .update(products)
        .set({ basePrice: parseFloat(value).toFixed(2) })
        .where(eq(products.id, productId));
    } else if (field === 'useGlobalTiers') {
      await db
        .update(products)
        .set({ useGlobalTiers: value === true || value === 'true' })
        .where(eq(products.id, productId));
    } else if (field === 'tierPrice' && tierId) {
      await db
        .update(pricingTiers)
        .set({ pricePerUnit: parseFloat(value).toFixed(4) })
        .where(eq(pricingTiers.id, tierId));
    } else if (field === 'optionPrice' && optionId) {
      await db
        .update(productOptions)
        .set({ priceModifier: parseFloat(value).toFixed(2) })
        .where(eq(productOptions.id, optionId));
    } else {
      return NextResponse.json({ message: 'Invalid field' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating product pricing:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
