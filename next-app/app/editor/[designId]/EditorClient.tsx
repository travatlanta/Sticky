"use client";


import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, ShoppingCart, Upload, Type, 
  Undo, Redo, ZoomIn, ZoomOut, Trash2, Square,
  Circle, Info, X, MoreVertical, Layers, FileImage, Sparkles,
  Paintbrush, Palette, PenTool, Eraser, Wand2, Sun
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
  interface Window {
    fabric: any;
  }
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
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [showCustomShapeModal, setShowCustomShapeModal] = useState(false);
  const [customShapeUploaded, setCustomShapeUploaded] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [assetsCategory, setAssetsCategory] = useState("shapes");
  const [showDrawing, setShowDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [showEffects, setShowEffects] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState("#ffffff");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialScaleRef = useRef<number>(1);

  const { data: design, isLoading } = useQuery<any>({
    queryKey: ["/api/designs", designId],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${designId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId,
  });

  const { data: product } = useQuery<any>({
    queryKey: ["/api/products", design?.productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${design?.productId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!design?.productId,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<Array<{
    id: number;
    name: string;
    description: string | null;
    previewImage: string | null;
    canvasJson: any;
  }>>({
    queryKey: ["/api/products", design?.productId, "templates"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${design?.productId}/templates`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!design?.productId,
  });

  const saveMutation = useMutation({
    mutationFn: async (canvasJson: any) => {
      const res = await fetch(`/api/designs/${designId}/autosave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasJson }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
  });

  const loadFabric = useCallback(() => {
    if (window.fabric) {
      initCanvas();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js";
    script.onload = () => initCanvas();
    document.head.appendChild(script);
  }, [design, product]);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !window.fabric) return;

    const templateWidth = (product as any)?.templateWidth || 300;
    const templateHeight = (product as any)?.templateHeight || 300;
    const dpi = 300;
    
    const containerWidth = canvasContainerRef.current?.clientWidth || 500;
    const containerHeight = canvasContainerRef.current?.clientHeight || 500;
    
    // Calculate scale to fill about 80% of the available container
    const padding = 40;
    const availableWidth = containerWidth - padding;
    const availableHeight = containerHeight - padding;
    
    const scaleX = availableWidth / templateWidth;
    const scaleY = availableHeight / templateHeight;
    // Use the smaller scale to fit in container, but set reasonable min/max
    const initialScale = Math.max(Math.min(scaleX, scaleY, 2), 0.3);
    initialScaleRef.current = initialScale;
    
    const displayWidth = templateWidth * initialScale;
    const displayHeight = templateHeight * initialScale;

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: displayWidth,
      height: displayHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    canvas.setZoom(initialScale);
    setZoom(initialScale);
    fabricCanvasRef.current = canvas;

    // Print industry standard guide positions:
    // - Canvas includes bleed area on all sides
    // - TRIM LINE (red): where paper gets cut, at bleed distance from canvas edge
    // - SAFE ZONE (green): where important content should stay, inside the trim line
    const bleedInches = parseFloat((product as any)?.bleedSize) || 0.125; // outer bleed area
    const safeMarginInches = parseFloat((product as any)?.safeZoneSize) || 0.125; // margin inside trim line
    
    // Trim line position: at bleed boundary (where paper will be cut)
    const trimLinePixels = bleedInches * dpi * initialScale;
    // Safe zone position: inside trim line by safe margin amount
    const safeZonePixels = (bleedInches + safeMarginInches) * dpi * initialScale;
    
    // Red TRIM LINE - shows where paper will be cut
    const trimRect = new window.fabric.Rect({
      left: trimLinePixels,
      top: trimLinePixels,
      width: displayWidth - trimLinePixels * 2,
      height: displayHeight - trimLinePixels * 2,
      fill: "transparent",
      stroke: "#ef4444",
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      name: "bleedGuide", // Keep name for compatibility
      excludeFromExport: true,
    });

    // Green SAFE ZONE - keep important content inside this area
    const safeRect = new window.fabric.Rect({
      left: safeZonePixels,
      top: safeZonePixels,
      width: displayWidth - safeZonePixels * 2,
      height: displayHeight - safeZonePixels * 2,
      fill: "transparent",
      stroke: "#22c55e",
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      name: "safeGuide",
      excludeFromExport: true,
    });

    canvas.add(trimRect, safeRect);

    if ((design as any)?.canvasJson) {
      canvas.loadFromJSON((design as any).canvasJson, () => {
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
        // Sync canvas background state with loaded design
        if (canvas.backgroundColor) {
          setCanvasBackground(canvas.backgroundColor as string);
        }
        canvas.renderAll();
      });
    } else {
      canvas.bringToFront(trimRect);
      canvas.bringToFront(safeRect);
    }

    canvas.on("object:modified", () => {
      saveState();
      scheduleAutoSave();
    });

    canvas.on("object:added", (e: any) => {
      if (e.target?.name !== "bleedGuide" && e.target?.name !== "safeGuide") {
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
      }
      saveState();
      scheduleAutoSave();
    });

    canvas.on("selection:created", (e: any) => {
      setActiveObject(e.selected?.[0] || null);
    });

    canvas.on("selection:updated", (e: any) => {
      setActiveObject(e.selected?.[0] || null);
    });

    canvas.on("selection:cleared", () => {
      setActiveObject(null);
    });

    setIsCanvasReady(true);
  }, [design, product]);

  const saveState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    setUndoStack((prev) => [...prev.slice(-49), json]);
    setRedoStack([]);
  }, []);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (fabricCanvasRef.current) {
        const json = fabricCanvasRef.current.toJSON();
        saveMutation.mutate(json);
      }
    }, 15000);
  }, [saveMutation]);

  useEffect(() => {
    if (design && product) {
      loadFabric();
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [design, product, loadFabric]);

  useEffect(() => {
    if (product && (product as any).supportsCustomShape && !(design as any)?.customShapeUrl && !customShapeUploaded) {
      setShowCustomShapeModal(true);
    }
  }, [product, design, customShapeUploaded]);

  const handleUndo = () => {
    if (undoStack.length === 0 || !fabricCanvasRef.current) return;
    const currentState = JSON.stringify(fabricCanvasRef.current.toJSON());
    setRedoStack((prev) => [...prev, currentState]);
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    fabricCanvasRef.current.loadFromJSON(prevState, () => {
      fabricCanvasRef.current.renderAll();
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !fabricCanvasRef.current) return;
    const currentState = JSON.stringify(fabricCanvasRef.current.toJSON());
    setUndoStack((prev) => [...prev, currentState]);
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    fabricCanvasRef.current.loadFromJSON(nextState, () => {
      fabricCanvasRef.current.renderAll();
    });
  };

  const handleAddText = () => {
    if (!fabricCanvasRef.current) return;
    const text = new window.fabric.IText("Tap to edit", {
      left: fabricCanvasRef.current.width / 2 - 60,
      top: fabricCanvasRef.current.height / 2 - 15,
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Arial",
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    toast({ title: "Text added", description: "Double-tap to edit" });
  };

  const handleAddRect = () => {
    if (!fabricCanvasRef.current) return;
    const rect = new window.fabric.Rect({
      left: fabricCanvasRef.current.width / 2 - 40,
      top: fabricCanvasRef.current.height / 2 - 40,
      width: 80,
      height: 80,
      fill: "#ee7518",
      rx: 8,
      ry: 8,
    });
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  const handleAddCircle = () => {
    if (!fabricCanvasRef.current) return;
    const circle = new window.fabric.Circle({
      left: fabricCanvasRef.current.width / 2 - 35,
      top: fabricCanvasRef.current.height / 2 - 35,
      radius: 35,
      fill: "#3b82f6",
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
  };

  const designAssets = {
    shapes: [
      { name: "Star", path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", fill: "#f59e0b" },
      { name: "Heart", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", fill: "#ef4444" },
      { name: "Diamond", path: "M12 2L2 12l10 10 10-10L12 2z", fill: "#8b5cf6" },
      { name: "Triangle", path: "M12 2L2 22h20L12 2z", fill: "#10b981" },
      { name: "Pentagon", path: "M12 2l9.51 6.91-3.63 11.18H6.12L2.49 8.91 12 2z", fill: "#3b82f6" },
      { name: "Hexagon", path: "M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z", fill: "#ec4899" },
      { name: "Octagon", path: "M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z", fill: "#14b8a6" },
      { name: "Arrow Right", path: "M5 12h14M12 5l7 7-7 7", fill: "none", stroke: "#374151", strokeWidth: 2 },
      { name: "Arrow Up", path: "M12 19V5M5 12l7-7 7 7", fill: "none", stroke: "#374151", strokeWidth: 2 },
      { name: "Curved Arrow", path: "M3 12a9 9 0 1 0 9-9M12 3l-4 4 4 4", fill: "none", stroke: "#374151", strokeWidth: 2 },
    ],
    badges: [
      { name: "Circle Badge", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", fill: "#ee7518" },
      { name: "Starburst", path: "M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2 2-5z", fill: "#f59e0b" },
      { name: "Shield", path: "M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z", fill: "#3b82f6" },
      { name: "Ribbon", path: "M4 2h16l-2 5 2 5H4l2-5-2-5z", fill: "#ef4444" },
      { name: "Certificate", path: "M4 4h16v12H4V4zM2 18l4-2v6l6-3 6 3v-6l4 2", fill: "#10b981" },
      { name: "Seal", path: "M12 2l1.5 4 4-.5-2 3.5 3 2.5-3.5 1.5.5 4-4-2L12 17l-1.5-4-4 2 .5-4-3.5-1.5 3-2.5-2-3.5 4 .5L12 2z", fill: "#8b5cf6" },
    ],
    icons: [
      { name: "Checkmark", path: "M20 6L9 17l-5-5", fill: "none", stroke: "#22c55e", strokeWidth: 3 },
      { name: "X Mark", path: "M18 6L6 18M6 6l12 12", fill: "none", stroke: "#ef4444", strokeWidth: 3 },
      { name: "Plus", path: "M12 5v14M5 12h14", fill: "none", stroke: "#3b82f6", strokeWidth: 2 },
      { name: "Phone", path: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z", fill: "#374151" },
      { name: "Email", path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6", fill: "none", stroke: "#374151", strokeWidth: 2 },
      { name: "Location", path: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a2 2 0 100-4 2 2 0 000 4z", fill: "#ef4444" },
      { name: "Globe", path: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z", fill: "none", stroke: "#3b82f6", strokeWidth: 2 },
      { name: "Calendar", path: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18", fill: "none", stroke: "#374151", strokeWidth: 2 },
    ],
    decorative: [
      { name: "Wave", path: "M2 12c2-2 4-4 6-2s4 4 6 2 4-4 6-2 4 4 6 2", fill: "none", stroke: "#3b82f6", strokeWidth: 2 },
      { name: "Zigzag", path: "M2 12l4-4 4 8 4-8 4 8 4-8 4 4", fill: "none", stroke: "#f59e0b", strokeWidth: 2 },
      { name: "Burst", path: "M12 3l1.5 6 6.5-1.5-4 5.5 5.5 4-6.5-1.5L12 21l-3-5.5L2.5 17l5.5-4-4-5.5L10.5 9 12 3z", fill: "#8b5cf6" },
      { name: "Sparkle", path: "M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13", fill: "none", stroke: "#f59e0b", strokeWidth: 2 },
      { name: "Ring", path: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a6 6 0 100 12 6 6 0 000-12z", fill: "#ee7518" },
      { name: "Swirl", path: "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12a10 10 0 005 8.66", fill: "none", stroke: "#ec4899", strokeWidth: 2 },
      { name: "Dots", path: "M12 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 18a1.5 1.5 0 110 3 1.5 1.5 0 010-3z", fill: "#374151" },
      { name: "Lines", path: "M3 6h18M3 12h18M3 18h18", fill: "none", stroke: "#374151", strokeWidth: 2 },
    ],
  };

  const handleAddAsset = (asset: { name: string; path: string; fill?: string; stroke?: string; strokeWidth?: number }) => {
    if (!fabricCanvasRef.current || !window.fabric) return;
    
    const canvas = fabricCanvasRef.current;
    const targetSize = Math.min(canvas.width, canvas.height) * 0.2;
    
    const pathObj = new window.fabric.Path(asset.path, {
      fill: asset.fill === "none" ? "transparent" : (asset.fill || "transparent"),
      stroke: asset.stroke || null,
      strokeWidth: asset.strokeWidth || 0,
      strokeUniform: true,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    
    const bounds = pathObj.getBoundingRect();
    const maxDim = Math.max(bounds.width, bounds.height);
    const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
    
    pathObj.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      left: canvas.width / 2 - (bounds.width * scaleFactor) / 2,
      top: canvas.height / 2 - (bounds.height * scaleFactor) / 2,
    });
    
    canvas.add(pathObj);
    canvas.setActiveObject(pathObj);
    canvas.renderAll();
    setShowAssets(false);
    toast({ title: `${asset.name} added` });
  };

  const handleToggleDrawingMode = (enable: boolean) => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    
    canvas.isDrawingMode = enable;
    setIsDrawingMode(enable);
    
    if (enable) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.strokeLineCap = "round";
      canvas.freeDrawingBrush.strokeLineJoin = "round";
    }
  };

  const handleBrushColorChange = (color: string) => {
    setBrushColor(color);
    if (fabricCanvasRef.current && isDrawingMode) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (fabricCanvasRef.current && isDrawingMode) {
      fabricCanvasRef.current.freeDrawingBrush.width = size;
    }
  };

  const handleCanvasBackgroundChange = (color: string) => {
    setCanvasBackground(color);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = color;
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleApplyBorder = (strokeWidth: number, strokeColor: string) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.set) {
      activeObj.set({
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeUniform: true,
      });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
      toast({ title: "Border applied" });
    } else {
      toast({ title: "Select an object first", description: "Click on a shape or image to add a border" });
    }
  };

  const handleApplyOpacity = (opacity: number) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.set) {
      activeObj.set({ opacity: opacity / 100 });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleApplyShadow = (enabled: boolean) => {
    if (!fabricCanvasRef.current || !window.fabric) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.set) {
      if (enabled) {
        activeObj.set({
          shadow: new window.fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 10,
            offsetX: 5,
            offsetY: 5,
          })
        });
      } else {
        activeObj.set({ shadow: null });
      }
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
      toast({ title: enabled ? "Shadow added" : "Shadow removed" });
    }
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload/artwork', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadRes.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadRes.json();

        if (file.type === 'application/pdf') {
          toast({
            title: "PDF uploaded",
            description: "Your PDF will be used for printing.",
          });
          return;
        }

        window.fabric.Image.fromURL(uploadData.url, (img: any) => {
          const maxSize = Math.min(fabricCanvasRef.current.width, fabricCanvasRef.current.height) * 0.6;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          img.scale(scale);
          img.set({
            left: (fabricCanvasRef.current.width - img.width * scale) / 2,
            top: (fabricCanvasRef.current.height - img.height * scale) / 2,
          });
          fabricCanvasRef.current.add(img);
          fabricCanvasRef.current.setActiveObject(img);
          fabricCanvasRef.current.renderAll();
        }, { crossOrigin: 'anonymous' });

        toast({ title: "Image added" });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleCustomShapeUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svg,.png,.jpg,.jpeg";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload/artwork', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadRes.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadRes.json();

        await fetch(`/api/designs/${designId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customShapeUrl: uploadData.url }),
          credentials: 'include',
        });

        if (fabricCanvasRef.current && window.fabric) {
          window.fabric.Image.fromURL(uploadData.url, (img: any) => {
            const canvas = fabricCanvasRef.current;
            const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
            const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
            img.scale(scale);
            img.set({
              left: (canvas.width - img.width * scale) / 2,
              top: (canvas.height - img.height * scale) / 2,
              opacity: 0.3,
              selectable: false,
              evented: false,
              name: "customShapeOutline",
            });
            canvas.add(img);
            canvas.sendToBack(img);
            canvas.renderAll();
          }, { crossOrigin: 'anonymous' });
        }

        setCustomShapeUploaded(true);
        setShowCustomShapeModal(false);
        toast({
          title: "Custom shape uploaded",
          description: "Your custom die-cut shape has been set as the outline.",
        });
      } catch (error) {
        console.error('Shape upload error:', error);
        toast({
          title: "Upload failed",
          description: "Please try again with a valid image file.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleDelete = () => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.name !== "bleedGuide" && activeObj.name !== "safeGuide") {
      fabricCanvasRef.current.remove(activeObj);
      fabricCanvasRef.current.renderAll();
      setActiveObject(null);
      toast({ title: "Deleted" });
    }
  };

  const handleFitToScreen = () => {
    if (!fabricCanvasRef.current || !canvasContainerRef.current) return;
    
    const templateWidth = (product as any)?.templateWidth || 300;
    const templateHeight = (product as any)?.templateHeight || 300;
    const containerWidth = canvasContainerRef.current.clientWidth;
    const containerHeight = canvasContainerRef.current.clientHeight;
    
    const padding = 40;
    const scaleX = (containerWidth - padding) / templateWidth;
    const scaleY = (containerHeight - padding) / templateHeight;
    const fitScale = Math.min(scaleX, scaleY);
    
    handleZoom(fitScale - zoom);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.2, Math.min(3, zoom + delta));
    setZoom(newZoom);
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      const templateWidth = (product as any)?.templateWidth || 300;
      const templateHeight = (product as any)?.templateHeight || 300;
      const dpi = 300;
      
      const newWidth = templateWidth * newZoom;
      const newHeight = templateHeight * newZoom;
      
      canvas.setZoom(newZoom);
      canvas.setWidth(newWidth);
      canvas.setHeight(newHeight);
      
      // Print industry standard: trim line at bleed boundary, safe zone inside trim
      const bleedInches = parseFloat((product as any)?.bleedSize) || 0.125;
      const safeMarginInches = parseFloat((product as any)?.safeZoneSize) || 0.125;
      const trimLinePixels = bleedInches * dpi * newZoom;
      const safeZonePixels = (bleedInches + safeMarginInches) * dpi * newZoom;
      
      const objects = canvas.getObjects();
      const trimGuide = objects.find((o: any) => o.name === "bleedGuide");
      const safeGuide = objects.find((o: any) => o.name === "safeGuide");
      
      if (trimGuide) {
        trimGuide.set({
          left: trimLinePixels,
          top: trimLinePixels,
          width: newWidth - trimLinePixels * 2,
          height: newHeight - trimLinePixels * 2,
        });
        canvas.bringToFront(trimGuide);
      }
      
      if (safeGuide) {
        safeGuide.set({
          left: safeZonePixels,
          top: safeZonePixels,
          width: newWidth - safeZonePixels * 2,
          height: newHeight - safeZonePixels * 2,
        });
        canvas.bringToFront(safeGuide);
      }
      
      canvas.renderAll();
    }
  };

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    await saveMutation.mutateAsync(json);
    toast({ title: "Saved!" });
  };

  const handleAddToCart = async () => {
    await handleSave();
    
    try {
      let highResExportUrl = null;
      if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        const templateWidth = (product as any)?.templateWidth || 400;
        const templateHeight = (product as any)?.templateHeight || 400;
        
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        const customShape = objects.find((o: any) => o.name === "customShapeOutline");
        
        if (bleedGuide) canvas.remove(bleedGuide);
        if (safeGuide) canvas.remove(safeGuide);
        if (customShape) canvas.remove(customShape);
        
        // Calculate multiplier to achieve 300 DPI at the template's original dimensions
        // The canvas is scaled by initialScale, so we divide by it to get consistent output
        // regardless of current zoom level during editing
        const baseDpiMultiplier = 300 / 72; // ~4.17x for 300 DPI from 72 DPI base
        const multiplier = baseDpiMultiplier / initialScaleRef.current;
        const dataUrl = canvas.toDataURL({
          format: 'png',
          multiplier: multiplier,
          quality: 1,
        });
        
        if (bleedGuide) canvas.add(bleedGuide);
        if (safeGuide) canvas.add(safeGuide);
        if (customShape) { canvas.add(customShape); canvas.sendToBack(customShape); }
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
        canvas.renderAll();
        
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, `design-${designId}-highres.png`);
        
        const uploadRes = await fetch('/api/upload/artwork', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          highResExportUrl = uploadData.url;
          
          await fetch(`/api/designs/${designId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ highResExportUrl }),
            credentials: 'include',
          });
        }
      }
      
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: (design as any)?.productId,
          designId: parseInt(designId!),
          quantity: 100,
          selectedOptions: (design as any)?.selectedOptions,
          unitPrice: (product as any)?.basePrice,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      toast({ title: "Added to cart!" });
      router.push("/cart");
    } catch (error) {
      console.error('Add to cart error:', error);
      toast({
        title: "Error",
        description: "Failed to add to cart.",
        variant: "destructive",
      });
    }
  };

  const handleApplyTemplate = (template: { id: number; name: string; canvasJson: any }) => {
    if (!fabricCanvasRef.current || !window.fabric) return;

    const canvas = fabricCanvasRef.current;
    
    try {
      const templateData = typeof template.canvasJson === 'string' 
        ? JSON.parse(template.canvasJson) 
        : template.canvasJson;

      const json = JSON.stringify(canvas.toJSON());
      setUndoStack((prev) => [...prev.slice(-49), json]);
      setRedoStack([]);

      const guides: Array<{name: string, props: any}> = [];
      canvas.getObjects().forEach((obj: any) => {
        if (obj.name === 'bleedGuide' || obj.name === 'safeGuide') {
          guides.push({
            name: obj.name,
            props: {
              left: obj.left,
              top: obj.top,
              width: obj.width,
              height: obj.height,
              fill: obj.fill,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth,
              strokeDashArray: obj.strokeDashArray,
              selectable: obj.selectable,
              evented: obj.evented,
            }
          });
        }
      });

      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      
      guides.forEach((guide) => {
        const rect = new window.fabric.Rect({
          ...guide.props,
          name: guide.name,
        });
        canvas.add(rect);
      });

      if (templateData.objects && Array.isArray(templateData.objects)) {
        const objectsToLoad = templateData.objects.filter((objData: any) => 
          objData.name !== 'bleedGuide' && objData.name !== 'safeGuide'
        );

        if (objectsToLoad.length > 0) {
          window.fabric.util.enlivenObjects(objectsToLoad, (enlivenedObjects: any[]) => {
            enlivenedObjects.forEach((obj: any) => {
              canvas.add(obj);
            });
            canvas.renderAll();
          });
        }
      }

      canvas.renderAll();
      setShowTemplates(false);
      toast({ title: `Template "${template.name}" applied!` });
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Error",
        description: "Failed to apply template.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100">
      <div className="bg-white border-b px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="font-heading font-bold text-sm md:text-lg text-gray-900 truncate">
            {(design as any)?.name || "Untitled"}
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 border-l pl-2 ml-1">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.25)} data-testid="button-zoom-out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(0.25)} data-testid="button-zoom-in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            data-testid="button-help"
          >
            <Info className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-more">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleZoom(0.25)}>
                <ZoomIn className="h-4 w-4 mr-2" /> Zoom In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoom(-0.25)}>
                <ZoomOut className="h-4 w-4 mr-2" /> Zoom Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main 
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-auto"
      >
        <div className="relative">
          <div className="bg-white rounded-lg shadow-lg p-2 md:p-6">
            <canvas ref={canvasRef} className="block touch-none" data-testid="design-canvas" />
          </div>
          
          <div className="flex absolute -bottom-7 left-0 right-0 items-center justify-center gap-4 md:gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-red-500 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-gray-600 font-medium">Trim Line</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-green-500 rounded" style={{ borderStyle: 'dashed' }} />
              <span className="text-gray-600 font-medium">Safe Zone</span>
            </div>
          </div>
        </div>
      </main>

      <div className="bg-white border-t px-2 py-2 md:hidden">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpload}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-upload"
            >
              <Upload className="h-5 w-5" />
              <span className="text-[10px]">Upload</span>
            </Button>

            {templates && templates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(true)}
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
                data-testid="button-templates"
              >
                <FileImage className="h-5 w-5" />
                <span className="text-[10px]">Templates</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddText}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-add-text"
            >
              <Type className="h-5 w-5" />
              <span className="text-[10px]">Text</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRect}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-add-rect"
            >
              <Square className="h-5 w-5" />
              <span className="text-[10px]">Shape</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddCircle}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-add-circle"
            >
              <Circle className="h-5 w-5" />
              <span className="text-[10px]">Circle</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAssets(true)}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-assets"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[10px]">Assets</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDrawing(true)}
              className={`flex flex-col items-center gap-0.5 h-auto py-2 px-3 ${isDrawingMode ? 'text-orange-500 bg-orange-50' : ''}`}
              data-testid="button-draw"
            >
              <Paintbrush className="h-5 w-5" />
              <span className="text-[10px]">Draw</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEffects(true)}
              className="flex flex-col items-center gap-0.5 h-auto py-2 px-3"
              data-testid="button-effects"
            >
              <Wand2 className="h-5 w-5" />
              <span className="text-[10px]">Effects</span>
            </Button>

            {activeObject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="flex flex-col items-center gap-0.5 h-auto py-2 px-3 text-red-500"
                data-testid="button-delete"
              >
                <Trash2 className="h-5 w-5" />
                <span className="text-[10px]">Delete</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} data-testid="button-save">
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddToCart} className="bg-orange-500 hover:bg-orange-600" data-testid="button-add-to-cart">
              <ShoppingCart className="h-4 w-4 mr-1" />
              <span className="text-xs">Cart</span>
            </Button>
          </div>
        </div>
      </div>

      <aside className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 bg-white border rounded-r-xl shadow-lg flex-col items-center py-3 px-2 gap-1 z-10">
        <Button variant="ghost" size="icon" onClick={handleUpload} title="Upload" data-testid="button-upload-desktop">
          <Upload className="h-5 w-5" />
        </Button>
        {templates && templates.length > 0 && (
          <Button variant="ghost" size="icon" onClick={() => setShowTemplates(true)} title="Templates" data-testid="button-templates-desktop">
            <FileImage className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleAddText} title="Add Text" data-testid="button-text-desktop">
          <Type className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleAddRect} title="Rectangle" data-testid="button-rect-desktop">
          <Square className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleAddCircle} title="Circle" data-testid="button-circle-desktop">
          <Circle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowAssets(true)} title="Assets" data-testid="button-assets-desktop">
          <Sparkles className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowDrawing(true)} 
          title="Draw" 
          data-testid="button-draw-desktop"
          className={isDrawingMode ? 'text-orange-500 bg-orange-50' : ''}
        >
          <Paintbrush className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowEffects(true)} title="Effects" data-testid="button-effects-desktop">
          <Wand2 className="h-5 w-5" />
        </Button>
        <div className="border-t w-full my-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={!activeObject}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          title="Delete"
          data-testid="button-delete-desktop"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </aside>

      <div className="hidden md:flex fixed bottom-6 right-6 gap-3 z-10">
        <Button variant="outline" size="lg" onClick={handleSave} data-testid="button-save-desktop">
          <Save className="h-5 w-5 mr-2" />
          Save
        </Button>
        <Button size="lg" onClick={handleAddToCart} className="bg-orange-500 hover:bg-orange-600" data-testid="button-cart-desktop">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Add to Cart
        </Button>
      </div>

      {showTemplates && templates && templates.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowTemplates(false)}>
          <div 
            className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileImage className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Choose a Template</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowTemplates(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Start with a pre-designed template. You can customize it after applying.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="group relative bg-gray-50 rounded-lg p-3 text-left hover:bg-orange-50 transition-colors border-2 border-transparent hover:border-orange-300"
                  data-testid={`button-template-${template.id}`}
                >
                  {template.previewImage ? (
                    <img 
                      src={template.previewImage} 
                      alt={template.name}
                      className="w-full aspect-square object-cover rounded-md mb-2 bg-white"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 rounded-md mb-2 flex items-center justify-center">
                      <FileImage className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <p className="font-medium text-sm text-gray-900 truncate">{template.name}</p>
                  {template.description && (
                    <p className="text-xs text-gray-500 truncate">{template.description}</p>
                  )}
                </button>
              ))}
            </div>

            <Button 
              variant="outline"
              className="w-full mt-4" 
              onClick={() => setShowTemplates(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowHelp(false)}>
          <div 
            className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Layers className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Quick Guide</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHelp(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-gray-900">Upload Your Art</p>
                  <p className="text-sm text-gray-600">Tap Upload to add your image or logo</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-gray-900">Add Text & Shapes</p>
                  <p className="text-sm text-gray-600">Use the tools to customize your design</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-gray-900">Stay in Safe Zone</p>
                  <p className="text-sm text-gray-600">Keep text inside the green border</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-medium text-gray-900">Add to Cart</p>
                  <p className="text-sm text-gray-600">When happy, tap Cart to checkout</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Guide Colors</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dashed border-red-500 rounded" />
                    <span className="text-sm text-gray-600">Bleed (trimmed)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-dashed border-green-500 rounded" />
                    <span className="text-sm text-gray-600">Safe Zone</span>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600" 
              onClick={() => setShowHelp(false)}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}

      {showCustomShapeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowCustomShapeModal(false)}>
          <div 
            className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileImage className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg">Custom Die-Cut Shape</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCustomShapeModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-gray-600 mb-4">
              This product supports custom die-cut shapes. Upload your shape file to define the cut outline for your stickers.
            </p>

            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Supported formats: SVG, PNG, JPG
                </p>
                <p className="text-xs text-gray-400">
                  For best results, use a simple outline shape
                </p>
              </div>
              
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                onClick={handleCustomShapeUpload}
                data-testid="button-upload-custom-shape"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Shape File
              </Button>

              <Button 
                variant="outline"
                className="w-full" 
                onClick={() => setShowCustomShapeModal(false)}
              >
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAssets && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowAssets(false)}>
          <div 
            className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Design Assets</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAssets(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: "shapes", label: "Shapes" },
                { key: "badges", label: "Badges" },
                { key: "icons", label: "Icons" },
                { key: "decorative", label: "Decorative" },
              ].map((cat) => (
                <Button
                  key={cat.key}
                  variant={assetsCategory === cat.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAssetsCategory(cat.key)}
                  className={assetsCategory === cat.key ? "bg-orange-500 hover:bg-orange-600" : ""}
                  data-testid={`button-category-${cat.key}`}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(designAssets[assetsCategory as keyof typeof designAssets] || []).map((asset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddAsset(asset)}
                  className="group bg-gray-50 rounded-lg p-3 hover:bg-orange-50 transition-colors border-2 border-transparent hover:border-orange-300 flex flex-col items-center"
                  data-testid={`button-asset-${asset.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8 mb-1">
                    <path 
                      d={asset.path} 
                      fill={asset.fill || "none"} 
                      stroke={asset.stroke || "none"} 
                      strokeWidth={asset.strokeWidth || 0}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[10px] text-gray-600 truncate w-full text-center">{asset.name}</span>
                </button>
              ))}
            </div>

            <Button 
              variant="outline"
              className="w-full mt-4" 
              onClick={() => setShowAssets(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showDrawing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => { handleToggleDrawingMode(false); setShowDrawing(false); }}>
          <div 
            className="bg-white w-full md:max-w-sm md:rounded-xl rounded-t-xl p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Paintbrush className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Drawing Tools</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { handleToggleDrawingMode(false); setShowDrawing(false); }}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Tool</label>
                <div className="flex gap-2">
                  <Button
                    variant={!isDrawingMode ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleDrawingMode(true)}
                    className={isDrawingMode ? "bg-orange-500 hover:bg-orange-600" : ""}
                    data-testid="button-brush-tool"
                  >
                    <Paintbrush className="h-4 w-4 mr-1" />
                    Brush
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!fabricCanvasRef.current) return;
                      const activeObj = fabricCanvasRef.current.getActiveObject();
                      if (activeObj && activeObj.set) {
                        activeObj.set('fill', brushColor);
                        fabricCanvasRef.current.renderAll();
                        toast({ title: "Fill applied" });
                      } else {
                        toast({ title: "Select an object first", description: "Click on a shape to fill it with color" });
                      }
                    }}
                    data-testid="button-fill-tool"
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Fill
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => handleBrushColorChange(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                    data-testid="input-brush-color"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleBrushColorChange(color)}
                        className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}
                        style={{ backgroundColor: color }}
                        data-testid={`button-color-${color.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Brush Size: {brushSize}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  data-testid="input-brush-size"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Fine</span>
                  <span>Thick</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <div 
                  className="rounded-full border-2 border-gray-300"
                  style={{ 
                    width: Math.min(brushSize * 2, 60), 
                    height: Math.min(brushSize * 2, 60),
                    backgroundColor: brushColor 
                  }}
                />
                <span className="text-sm text-gray-500">Preview</span>
              </div>

              <Button
                className={`w-full ${isDrawingMode ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                onClick={() => {
                  handleToggleDrawingMode(!isDrawingMode);
                  if (!isDrawingMode) {
                    setShowDrawing(false);
                    toast({ title: "Drawing mode enabled", description: "Draw freely on the canvas" });
                  }
                }}
                data-testid="button-toggle-drawing"
              >
                <PenTool className="h-4 w-4 mr-2" />
                {isDrawingMode ? 'Stop Drawing' : 'Start Drawing'}
              </Button>

              {isDrawingMode && (
                <p className="text-xs text-center text-gray-500">
                  Tap &quot;Stop Drawing&quot; to select and move objects again
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {showEffects && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowEffects(false)}>
          <div 
            className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Effects</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowEffects(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Canvas Background</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={canvasBackground}
                    onChange={(e) => handleCanvasBackgroundChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                    data-testid="input-canvas-background"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#ffffff', '#f3f4f6', '#fef3c7', '#fee2e2', '#dbeafe', '#dcfce7', '#1f2937', '#000000'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleCanvasBackgroundChange(color)}
                        className={`w-7 h-7 rounded-full border-2 ${canvasBackground === color ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        data-testid={`button-bg-${color.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Object Border</label>
                <p className="text-xs text-gray-500 mb-2">Select an object first, then apply a border</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(2, '#000000')} data-testid="button-border-thin">Thin Black</Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(4, '#000000')} data-testid="button-border-medium">Medium Black</Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(2, '#ee7518')} data-testid="button-border-orange">Orange</Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(3, '#3b82f6')} data-testid="button-border-blue">Blue</Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(3, '#ef4444')} data-testid="button-border-red">Red</Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyBorder(0, 'transparent')} data-testid="button-border-none">Remove</Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Object Opacity</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  defaultValue="100"
                  onChange={(e) => handleApplyOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  data-testid="input-opacity"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Transparent</span>
                  <span>Solid</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Drop Shadow</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleApplyShadow(true)} data-testid="button-shadow-add">
                    <Sun className="h-4 w-4 mr-1" />
                    Add Shadow
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleApplyShadow(false)} data-testid="button-shadow-remove">
                    Remove Shadow
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full mt-4" 
              onClick={() => setShowEffects(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
