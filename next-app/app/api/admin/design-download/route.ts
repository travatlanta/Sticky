import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user[0]?.isAdmin === true;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');
    const format = url.searchParams.get('format') || 'pdf';
    const filename = url.searchParams.get('filename') || 'design';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const contentType = response.headers.get('content-type') || '';
    const sourceExtension = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
    const isPdfSource = contentType.includes('pdf') || sourceExtension === 'pdf';

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    if (format === 'original' || (isPdfSource && format === 'pdf')) {
      const ext = isPdfSource ? 'pdf' : sourceExtension || 'png';
      const mimeType = isPdfSource ? 'application/pdf' : contentType || 'application/octet-stream';
      const sanitizedFilename = filename.replace(/[^a-z0-9_-]/gi, '_');
      
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.${ext}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (isPdfSource) {
      return NextResponse.json(
        { error: 'Cannot convert PDF to other formats. Use original format.' },
        { status: 400 }
      );
    }

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const sanitizedFilename = filename.replace(/[^a-z0-9_-]/gi, '_');

    if (format === 'pdf') {
      // For PDF, return a high-quality PNG with metadata
      // PDF generation is done client-side using jspdf for Vercel compatibility
      // Ensure alpha channel is preserved for die-cut products
      const pngBuffer = await image
        .ensureAlpha()
        .png({ compressionLevel: 0 })
        .toBuffer();
      
      // Return JSON with image data for client-side PDF generation
      return NextResponse.json({
        type: 'pdf-data',
        imageBase64: pngBuffer.toString('base64'),
        width: metadata.width || 300,
        height: metadata.height || 300,
        filename: sanitizedFilename,
      });
    }

    if (format === 'png') {
      const pngBuffer = await image
        .png({
          compressionLevel: 9,
          force: true,
        })
        .toBuffer();

      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.png"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'tiff') {
      const tiffBuffer = await image
        .tiff({
          compression: 'lzw',
          quality: 100,
        })
        .toBuffer();

      return new NextResponse(new Uint8Array(tiffBuffer), {
        headers: {
          'Content-Type': 'image/tiff',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.tiff"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'jpg' || format === 'jpeg') {
      const jpgBuffer = await image
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({
          quality: 95,
          progressive: false,
        })
        .toBuffer();

      return new NextResponse(new Uint8Array(jpgBuffer), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.jpg"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Design download error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
