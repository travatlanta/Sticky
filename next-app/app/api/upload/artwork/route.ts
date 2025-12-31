export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Allowed MIME types for artwork uploads
    // Includes standard image formats, PDF, and professional design formats (EPS, CDR)
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml', 
      'application/pdf',
      // EPS formats
      'application/postscript',
      'application/eps',
      'application/x-eps',
      'image/eps',
      'image/x-eps',
      // CDR (CorelDRAW) formats
      'application/vnd.corel-draw',
      'application/cdr',
      'application/x-cdr',
      'image/x-coreldraw',
      // AI (Adobe Illustrator) format
      'application/illustrator',
      'application/vnd.adobe.illustrator',
      // PSD (Photoshop) format
      'image/vnd.adobe.photoshop',
      'application/x-photoshop',
    ];
    
    // Also check by file extension for formats that may not have correct MIME type
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.eps', '.cdr', '.ai', '.psd'];
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
      return NextResponse.json({ message: 'Invalid file type. Accepted formats: JPG, PNG, GIF, WebP, SVG, PDF, EPS, CDR, AI, PSD' }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'File too large (max 50MB)' }, { status: 400 });
    }

    const filename = `artwork/${session.user.id}/${Date.now()}-${file.name}`;
    
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
    });
  } catch (error) {
    console.error('Error uploading artwork:', error);
    return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 });
  }
}
