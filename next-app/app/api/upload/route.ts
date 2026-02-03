export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    console.log(`Upload attempt: name=${file.name}, type=${file.type}, size=${file.size}`);

    if (!file.type.startsWith("image/") && !ALLOWED_TYPES.includes(file.type)) {
      console.log(`Rejected file type: ${file.type}`);
      return NextResponse.json({ message: `File type not allowed: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG` }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      console.log(`File too large: ${file.size} bytes`);
      return NextResponse.json({ message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 2MB limit` }, { status: 400 });
    }

    if (file.size === 0) {
      console.log('Empty file received');
      return NextResponse.json({ message: "File is empty" }, { status: 400 });
    }

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || 'png');
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    
    console.log(`Uploading to Vercel Blob: ${filename}`);
    
    const blob = await put(filename, file, {
      access: "public",
    });

    console.log(`Upload successful: ${blob.url}`);
    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error?.message || error);
    return NextResponse.json({ 
      message: error?.message || "Upload failed. Please try again." 
    }, { status: 500 });
  }
}
