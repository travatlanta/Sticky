export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: "File size must be under 2MB" }, { status: 400 });
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    
    const blob = await put(filename, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Upload failed" }, { status: 500 });
  }
}
