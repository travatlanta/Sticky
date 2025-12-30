"use client";

import dynamic from "next/dynamic";

const SEOClient = dynamic(() => import("./SEOClient"), { ssr: false });

export default function SEOPage() {
  return <SEOClient />;
}
