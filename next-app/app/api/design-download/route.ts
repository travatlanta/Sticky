import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // Handle base64 data URLs directly
    if (imageUrl.startsWith('data:')) {
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

    // For regular URLs, fetch and return
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(new Uint8Array(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Design download error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
