import { NextResponse } from "next/server";
import crypto from "crypto";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

type UploadBody = {
  dataUrl?: string;
  filenamePrefix?: string;
};

function sanitizePrefix(input: string): string {
  return input.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 80) || "preview";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as UploadBody;
    const dataUrl = body.dataUrl;
    const filenamePrefix = sanitizePrefix(body.filenamePrefix ?? "preview");

    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
    }

    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid dataUrl format" }, { status: 400 });
    }

    const contentType = match[1];
    const b64 = match[2];

    const buffer = Buffer.from(b64, "base64");
    if (!buffer.length) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const extRaw = contentType.split("/")[1] || "png";
    const ext = extRaw === "jpeg" ? "jpg" : extRaw;

    const filename = `${filenamePrefix}-${crypto.randomUUID()}.${ext}`;
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("/api/blob-upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
