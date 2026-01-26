import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  dataUrl?: string;
  pathname?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const dataUrl = body?.dataUrl;
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid dataUrl format" }, { status: 400 });
    }

    const contentType = match[1];
    const b64 = match[2];

    const buf = Buffer.from(b64, "base64");

    const pathname =
      typeof body?.pathname === "string" && body.pathname.trim()
        ? body.pathname.trim().replace(/^\/+/, "")
        : `previews/preview-${Date.now()}.png`;

    const blob = await put(pathname, buf, {
      access: "public",
      contentType,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[blob-upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
