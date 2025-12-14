'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Save, ShoppingCart, Upload, Type,
  Undo, Redo, ZoomIn, ZoomOut, Trash2, Square,
  Circle, Info, X, MoreVertical, Layers, FileImage, Sparkles,
  Paintbrush, Palette, PenTool, Eraser, Wand2, Sun,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  HelpCircle, CheckCircle, Image, FileType, Droplets, MousePointer,
  Move, RotateCcw, ChevronLeft, ChevronRight
} from "lucide-react";

declare global {
  interface Window {
    fabric: any;
  }
}

/* =========================
   UNIFIED DESIGN ASSET TYPE
   ========================= */
interface DesignAsset {
  name: string;
  path: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export default function Editor() {
  const params = useParams();
  const designId = params.designId as string;
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any>(null);

  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showAssets, setShowAssets] = useState(false);
  const [assetsCategory, setAssetsCategory] = useState<"shapes" | "badges" | "icons" | "decorative">("shapes");

  /* =========================
     DESIGN ASSETS (TYPED)
     ========================= */
  const designAssets: Record<typeof assetsCategory, DesignAsset[]> = {
    shapes: [
      { name: "Star", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", fill: "#f59e0b" },
      { name: "Arrow Right", path: "M5 12h14M12 5l7 7-7 7", fill: "none", stroke: "#374151", strokeWidth: 2 },
    ],
    badges: [
      { name: "Circle Badge", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", fill: "#ee7518" },
    ],
    icons: [
      { name: "Checkmark", path: "M20 6L9 17l-5-5", fill: "none", stroke: "#22c55e", strokeWidth: 3 },
    ],
    decorative: [
      { name: "Wave", path: "M2 12c2-2 4-4 6-2s4 4 6 2 4-4 6-2 4 4 6 2", fill: "none", stroke: "#3b82f6", strokeWidth: 2 },
    ],
  };

  return (
    <div className="p-4">
      <Button onClick={() => setShowAssets(true)}>Assets</Button>

      {showAssets && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {designAssets[assetsCategory].map((asset, idx) => (
            <button key={idx} className="p-2 border rounded">
              <svg viewBox="0 0 24 24" className="w-8 h-8">
                <path
                  d={asset.path}
                  fill={asset.fill ?? "none"}
                  stroke={asset.stroke ?? "none"}
                  strokeWidth={asset.strokeWidth ?? 0}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="text-xs text-center">{asset.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
