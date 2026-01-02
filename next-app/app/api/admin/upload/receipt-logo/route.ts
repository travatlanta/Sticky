import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (typeof (file as any).size === 'number' && file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Max size is 2MB.' },
        { status: 400 }
      );
    }

    const contentType = ((file as any).type || '') as string;
    if (contentType && !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PNG, JPG, or WebP.' },
        { status: 400 }
      );
    }

    const safeName = sanitizeFilename(file.name || 'receipt-logo');
    const key = `receipt-logos/${Date.now()}-${safeName}`;

    const blob = await put(key, file, { access: 'public' });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Receipt logo upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
