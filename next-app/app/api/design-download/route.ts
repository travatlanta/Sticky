import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sharp from 'sharp';
import jsPDF from 'jspdf';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'original';
    
    const imageUrl = url.searchParams.get('url');
    const filename = url.searchParams.get('filename') || 'artwork';
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }
    
    // Security: Only allow URLs from our Vercel Blob storage
    const allowedHosts = [
      'vercel-blob.com',
      'blob.vercel-storage.com',
      'public.blob.vercel-storage.com'
    ];
    
    let isAllowedUrl = false;
    try {
      const parsedUrl = new URL(imageUrl);
      isAllowedUrl = allowedHosts.some(host => parsedUrl.hostname.endsWith(host));
    } catch {
      // data: URLs are allowed for previews
      isAllowedUrl = imageUrl.startsWith('data:');
    }
    
    if (!isAllowedUrl) {
      return NextResponse.json({ error: 'Invalid image URL - only storage URLs allowed' }, { status: 400 });
    }
    
    // Preview images are public (needed for order pages with payment links)
    // Only require auth for actual downloads (non-preview formats)
    if (format !== 'preview') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized - login required to download' }, { status: 401 });
      }
    }

    // Handle base64 data URLs directly (only for preview, not conversion)
    if (imageUrl.startsWith('data:') && format === 'preview') {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const contentType = response.headers.get('content-type') || '';
    const sourceExtension = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
    const isPdfSource = contentType.includes('pdf') || sourceExtension === 'pdf';
    const isVectorFormat = ['eps', 'cdr', 'ai'].includes(sourceExtension);
    const isDesignFormat = ['psd'].includes(sourceExtension);
    const isSpecialFormat = isVectorFormat || isDesignFormat || isPdfSource;

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const sanitizedFilename = filename.replace(/[^a-z0-9_-]/gi, '_');

    // Preview mode - return resized image for inline display
    if (format === 'preview') {
      if (isSpecialFormat) {
        return new NextResponse(new Uint8Array(imageBuffer), {
          headers: {
            'Content-Type': contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      
      const image = sharp(imageBuffer);
      const previewBuffer = await image
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 6 })
        .toBuffer();
      
      return new NextResponse(new Uint8Array(previewBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Original format - download as-is
    if (format === 'original' || isSpecialFormat) {
      const ext = sourceExtension || 'png';
      let mimeType = contentType || 'application/octet-stream';
      if (sourceExtension === 'eps') mimeType = 'application/postscript';
      if (sourceExtension === 'cdr') mimeType = 'application/vnd.corel-draw';
      if (sourceExtension === 'ai') mimeType = 'application/illustrator';
      if (sourceExtension === 'psd') mimeType = 'image/vnd.adobe.photoshop';
      if (isPdfSource) mimeType = 'application/pdf';
      
      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.${ext}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // For convertible formats (PNG, JPG, JPEG, TIFF, PDF)
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (format === 'png') {
      const pngBuffer = await image
        .ensureAlpha()
        .png({ compressionLevel: 9 })
        .toBuffer();

      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.png"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'jpg' || format === 'jpeg') {
      const jpgBuffer = await image
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 95 })
        .toBuffer();

      return new NextResponse(new Uint8Array(jpgBuffer), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.jpg"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'tiff') {
      const tiffBuffer = await image
        .ensureAlpha()
        .tiff({ compression: 'lzw', quality: 100 })
        .toBuffer();

      return new NextResponse(new Uint8Array(tiffBuffer), {
        headers: {
          'Content-Type': 'image/tiff',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.tiff"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'pdf') {
      // Generate PDF with the image embedded at 300 DPI
      const pngBuffer = await image
        .ensureAlpha()
        .png({ compressionLevel: 0 })
        .toBuffer();
      
      const width = metadata.width || 300;
      const height = metadata.height || 300;
      
      // Calculate PDF dimensions at 300 DPI (points = pixels * 72 / 300)
      const widthPt = width * 72 / 300;
      const heightPt = height * 72 / 300;
      
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [widthPt, heightPt],
      });
      
      const imgData = `data:image/png;base64,${pngBuffer.toString('base64')}`;
      pdf.addImage(imgData, 'PNG', 0, 0, widthPt, heightPt);
      
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Design download error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
