"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Upload, ShoppingCart, Check, Loader2, ChevronDown, ChevronUp,
  Minus, Plus, ArrowLeft, Type, Shapes, Brush, Palette, Image as ImageIcon,
  Square, Circle, Triangle, Star, Heart, Smile, Undo2, Redo2, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  PaintBucket, Eraser, Pipette, Move, X, Save, Download
} from "lucide-react";
import { getContourFromImage, expandContour, scaleContourPath } from "@/lib/contour-tracer";

type FabricModule = typeof import("fabric");
let fabricModule: FabricModule | null = null;

interface ProductOption {
  id: number;
  optionType: string;
  name: string;
  value?: string;
  priceModifier?: string;
  isDefault?: boolean;
}

interface PricingTier {
  id: number;
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  basePrice?: string;
  options?: ProductOption[];
  pricingTiers?: PricingTier[];
  minQuantity?: number;
  printWidthInches?: string;
  printHeightInches?: string;
  printDpi?: number;
  supportsCustomShape?: boolean;
}

interface Design {
  id: number;
  name?: string;
  productId?: number;
  previewUrl?: string;
  highResExportUrl?: string;
  customShapeUrl?: string;
  contourPath?: string;
  selectedOptions?: Record<string, any>;
  canvasJson?: any;
  bleedColor?: string;
}

interface PriceCalculation {
  pricePerUnit: number;
  optionsCost: number;
  baseSubtotal: number;
  subtotal: number;
}

const DEFAULT_QUANTITY_OPTIONS = [25, 50, 100, 250, 500, 1000];

const EMOJI_LIST = [
  "star", "heart", "fire", "sparkles", "sun", "moon", "lightning", "cloud",
  "flower", "leaf", "trophy", "gift", "crown", "diamond", "music", "camera"
];

const FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana",
  "Courier New", "Impact", "Comic Sans MS", "Trebuchet MS", "Palatino"
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
  "#ff00ff", "#00ffff", "#ff6600", "#9900ff", "#ff69b4", "#32cd32",
  "#4169e1", "#ffd700", "#ff4500", "#1e90ff", "#dc143c", "#00ced1"
];

export default function Editor() {
  const params = useParams();
  const designId = params.designId as string;
  const isNewDesign = designId === "new";
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [toolDockOpen, setToolDockOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("text");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [imageSize, setImageSize] = useState({ width: 2, height: 2 });
  const [quantity, setQuantity] = useState(50);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<PriceCalculation | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [contourPath, setContourPath] = useState<string>("");
  const [bleedColor, setBleedColor] = useState("#ffffff");
  const [isSaving, setIsSaving] = useState(false);
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [drawingMode, setDrawingMode] = useState(false);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<"brush" | "text" | "fill" | "bleed">("brush");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const animationFrameRef = useRef<number>();

  const { data: design, isLoading: designLoading, error: designError } = useQuery<Design>({
    queryKey: [`/api/designs/${designId}`],
    queryFn: async () => {
      const res = await fetch(`/api/designs/${designId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch design");
      return res.json();
    },
    enabled: !!designId && !isNewDesign,
    retry: false,
  });

  const { data: product, isLoading: productLoading, error: productError } = useQuery<Product>({
    queryKey: [`/api/products/by-id/${design?.productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/by-id/${design?.productId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!design?.productId,
    retry: false,
  });

  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const initCanvas = async () => {
      if (!fabricModule) {
        fabricModule = await import("fabric");
      }
      
      const canvas = new fabricModule.Canvas(canvasRef.current!, {
        backgroundColor: "#f3f4f6",
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = canvas;

      canvas.on("object:modified", saveCanvasState);
      canvas.on("object:added", saveCanvasState);
      canvas.on("object:removed", saveCanvasState);
      
      setFabricLoaded(true);
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = previewContainerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      const size = Math.min(containerWidth, containerHeight, 500);

      canvas.setDimensions({ width: size, height: size });
      canvas.renderAll();
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [designLoading]);

  useEffect(() => {
    if (design?.previewUrl && !uploadedImage) {
      setUploadedImage(design.previewUrl);
    }
    if (design?.selectedOptions) {
      setSelectedOptions(design.selectedOptions as Record<string, number>);
    }
    if (design?.bleedColor) {
      setBleedColor(design.bleedColor);
    }
    if (design?.contourPath) {
      setContourPath(design.contourPath);
    }
    if (design?.canvasJson && fabricCanvasRef.current) {
      fabricCanvasRef.current.loadFromJSON(design.canvasJson).then(() => {
        fabricCanvasRef.current?.renderAll();
      });
    }
  }, [design]);

  useEffect(() => {
    if (product?.options && Object.keys(selectedOptions).length === 0) {
      const defaults: Record<string, number> = {};
      product.options.forEach((opt) => {
        if (opt.isDefault) {
          defaults[opt.optionType] = opt.id;
        }
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  const priceCalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const calculatePrice = useCallback(async () => {
    if (!product?.slug) return;
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/products/${product.slug}/calculate-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, selectedOptions }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to calculate price");
      const data = await res.json();
      setCalculatedPrice(data);
    } catch (error) {
      console.error("Price calculation error:", error);
    } finally {
      setPriceLoading(false);
    }
  }, [product?.slug, quantity, selectedOptions]);

  useEffect(() => {
    if (priceCalculationTimeoutRef.current) {
      clearTimeout(priceCalculationTimeoutRef.current);
    }
    priceCalculationTimeoutRef.current = setTimeout(() => {
      if (product?.slug) {
        calculatePrice();
      }
    }, 300);
    return () => {
      if (priceCalculationTimeoutRef.current) {
        clearTimeout(priceCalculationTimeoutRef.current);
      }
    };
  }, [product?.slug, quantity, selectedOptions, calculatePrice]);

  const saveCanvasState = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev.slice(-19), json]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    
    const currentState = JSON.stringify(canvas.toJSON());
    setRedoStack(prev => [...prev, currentState]);
    
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    canvas.loadFromJSON(prevState).then(() => {
      canvas.renderAll();
    });
  }, [undoStack]);

  const redo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || redoStack.length === 0) return;
    
    const currentState = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev, currentState]);
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    canvas.loadFromJSON(nextState).then(() => {
      canvas.renderAll();
    });
  }, [redoStack]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj: any) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, []);

  const addText = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) return;
    
    const text = new fabricModule.IText("Your Text", {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fontFamily,
      fontSize,
      fill: textColor,
      originX: "center",
      originY: "center",
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setActiveTool("select");
  }, [fontFamily, fontSize, textColor]);

  const addShape = useCallback((shapeType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) return;
    
    const centerX = canvas.width! / 2;
    const centerY = canvas.height! / 2;
    let shape: any;
    
    switch (shapeType) {
      case "square":
        shape = new fabricModule.Rect({
          left: centerX,
          top: centerY,
          width: 80,
          height: 80,
          fill: fillColor,
          originX: "center",
          originY: "center",
        });
        break;
      case "circle":
        shape = new fabricModule.Circle({
          left: centerX,
          top: centerY,
          radius: 40,
          fill: fillColor,
          originX: "center",
          originY: "center",
        });
        break;
      case "triangle":
        shape = new fabricModule.Triangle({
          left: centerX,
          top: centerY,
          width: 80,
          height: 70,
          fill: fillColor,
          originX: "center",
          originY: "center",
        });
        break;
      case "star":
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? 40 : 20;
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          starPoints.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
        }
        shape = new fabricModule.Polygon(starPoints, {
          left: centerX,
          top: centerY,
          fill: fillColor,
          originX: "center",
          originY: "center",
        });
        break;
      case "heart":
        shape = new fabricModule.Path(
          "M 50 30 C 50 20 40 10 25 10 C 10 10 0 25 0 40 C 0 60 25 75 50 100 C 75 75 100 60 100 40 C 100 25 90 10 75 10 C 60 10 50 20 50 30 Z",
          {
            left: centerX,
            top: centerY,
            fill: fillColor,
            scaleX: 0.6,
            scaleY: 0.6,
            originX: "center",
            originY: "center",
          }
        );
        break;
      default:
        shape = new fabricModule.Rect({
          left: centerX,
          top: centerY,
          width: 80,
          height: 80,
          fill: fillColor,
          originX: "center",
          originY: "center",
        });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    setActiveTool("select");
  }, [fillColor]);

  const addEmoji = useCallback((emojiName: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) return;
    
    const emojiPaths: Record<string, string> = {
      star: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
      heart: "M 50 30 C 50 20 40 10 25 10 C 10 10 0 25 0 40 C 0 60 25 75 50 100 C 75 75 100 60 100 40 C 100 25 90 10 75 10 C 60 10 50 20 50 30 Z",
    };
    
    let shape: any;
    if (emojiPaths[emojiName]) {
      shape = new fabricModule.Path(emojiPaths[emojiName], {
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        fill: fillColor,
        scaleX: 0.5,
        scaleY: 0.5,
        originX: "center",
        originY: "center",
      });
    } else {
      shape = new fabricModule.Circle({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        radius: 30,
        fill: fillColor,
        originX: "center",
        originY: "center",
      });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }, [fillColor]);

  const addClipart = useCallback((clipartName: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) return;
    
    const clipartPaths: Record<string, string> = {
      arrow: "M 50 0 L 100 50 L 75 50 L 75 100 L 25 100 L 25 50 L 0 50 Z",
      checkmark: "M 10 50 L 35 75 L 90 20 L 80 10 L 35 55 L 20 40 Z",
      badge: "M 50 0 L 61 35 L 100 38 L 70 62 L 80 100 L 50 78 L 20 100 L 30 62 L 0 38 L 39 35 Z",
      ribbon: "M 20 0 L 80 0 L 80 70 L 50 90 L 20 70 Z",
      burst: "M 50 0 L 55 35 L 85 20 L 65 45 L 100 50 L 65 55 L 85 80 L 55 65 L 50 100 L 45 65 L 15 80 L 35 55 L 0 50 L 35 45 L 15 20 L 45 35 Z",
      banner: "M 0 20 L 20 20 L 20 0 L 80 0 L 80 20 L 100 20 L 100 80 L 80 80 L 80 100 L 20 100 L 20 80 L 0 80 Z",
      speechBubble: "M 10 10 L 90 10 L 90 60 L 50 60 L 30 80 L 35 60 L 10 60 Z",
      lightning: "M 55 0 L 35 40 L 60 40 L 30 100 L 45 55 L 20 55 Z",
    };
    
    const pathData = clipartPaths[clipartName];
    if (!pathData) return;
    
    const shape = new fabricModule.Path(pathData, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      fill: fillColor,
      scaleX: 0.6,
      scaleY: 0.6,
      originX: "center",
      originY: "center",
    });
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    setActiveTool("select");
  }, [fillColor]);

  const toggleDrawingMode = useCallback((enabled: boolean) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) return;
    
    canvas.isDrawingMode = enabled;
    setDrawingMode(enabled);
    
    if (enabled) {
      const brush = new fabricModule.PencilBrush(canvas);
      brush.color = brushColor;
      brush.width = brushWidth;
      canvas.freeDrawingBrush = brush;
      setActiveTool("draw");
    } else {
      setActiveTool("select");
    }
  }, [brushColor, brushWidth]);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushWidth;
  }, [brushColor, brushWidth]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setUploadedImage(dataUrl);
        
        const img = new Image();
        img.onload = () => {
          const dpi = product?.printDpi || 300;
          const widthInches = Math.round((img.width / dpi) * 10) / 10;
          const heightInches = Math.round((img.height / dpi) * 10) / 10;
          setImageSize({
            width: Math.max(1, Math.min(12, widthInches || 2)),
            height: Math.max(1, Math.min(12, heightInches || 2)),
          });

          const path = getContourFromImage(img, 0.25, 10, 3);
          const scaledPath = scaleContourPath(path, 4, 4);
          setContourPath(scaledPath);

          const canvas = fabricCanvasRef.current;
          if (canvas && fabricModule) {
            fabricModule.FabricImage.fromURL(dataUrl).then((fabricImg) => {
              const canvasWidth = canvas.width! - 40;
              const canvasHeight = canvas.height! - 40;
              const scale = Math.min(canvasWidth / fabricImg.width!, canvasHeight / fabricImg.height!);
              
              fabricImg.scale(scale);
              fabricImg.set({
                left: canvas.width! / 2,
                top: canvas.height! / 2,
                originX: "center",
                originY: "center",
              });
              
              canvas.add(fabricImg);
              canvas.sendObjectToBack(fabricImg);
              canvas.renderAll();
            });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload/artwork", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await fetch(`/api/designs/${designId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ previewUrl: url, highResExportUrl: url }),
          credentials: "include",
        });
      }

      toast({ title: "Upload complete", description: "Your artwork has been uploaded." });
    } catch (error) {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const saveDesign = async () => {
    setIsSaving(true);
    try {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      
      const canvasJson = canvas.toJSON();
      const previewDataUrl = canvas.toDataURL({ format: "png", quality: 0.8 });
      
      await fetch(`/api/designs/${designId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvasJson,
          bleedColor,
          contourPath,
          selectedOptions,
        }),
        credentials: "include",
      });

      toast({ title: "Design saved", description: "Your changes have been saved." });
    } catch (error) {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await saveDesign();
      
      const unitPrice = calculatedPrice?.pricePerUnit 
        ? (calculatedPrice.pricePerUnit + (calculatedPrice.optionsCost || 0))
        : parseFloat(product?.basePrice || "0");

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
          selectedOptions,
          designId: parseInt(designId),
          unitPrice: unitPrice.toString(),
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      setAddedToCart(true);
      toast({ title: "Added to cart", description: "Your design has been added to your cart." });
    } catch (error) {
      toast({ title: "Failed to add to cart", description: "Please try again.", variant: "destructive" });
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent | React.TouchEvent) => {
    const container = previewContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left - rect.width / 2) / rect.width;
    const y = (clientY - rect.top - rect.height / 2) / rect.height;
    
    setMousePosition({ x: x * 15, y: y * 15 });
    setIsInteracting(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const animate = () => {
      setMousePosition(prev => ({
        x: prev.x * 0.9,
        y: prev.y * 0.9,
      }));
      if (Math.abs(mousePosition.x) > 0.1 || Math.abs(mousePosition.y) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsInteracting(false);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [mousePosition]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  const openColorPicker = (target: "brush" | "text" | "fill" | "bleed") => {
    setColorPickerTarget(target);
    setShowColorPicker(true);
  };

  const handleColorSelect = (color: string) => {
    switch (colorPickerTarget) {
      case "brush":
        setBrushColor(color);
        break;
      case "text":
        setTextColor(color);
        const canvas = fabricCanvasRef.current;
        const activeObj = canvas?.getActiveObject();
        if (activeObj && activeObj.type === "i-text") {
          (activeObj as any).set("fill", color);
          canvas?.renderAll();
        }
        break;
      case "fill":
        setFillColor(color);
        break;
      case "bleed":
        setBleedColor(color);
        break;
    }
    setShowColorPicker(false);
  };

  if (isNewDesign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-xl font-semibold mb-4">Select a product to start designing</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Choose a product from our catalog, then you can start creating your custom design.
        </p>
        <Button onClick={() => router.push("/products")} data-testid="button-browse-products">
          Browse Products
        </Button>
      </div>
    );
  }

  if (designLoading || productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (designError || !design) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-xl font-semibold mb-4">Design not found</h2>
        <Button onClick={() => router.push("/products")} data-testid="button-browse-products">
          Browse Products
        </Button>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-xl font-semibold mb-4">Product not found</h2>
        <Button onClick={() => router.push("/products")} data-testid="button-browse-products">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg truncate max-w-[180px]" data-testid="text-product-name">
            {product?.name || "Design Editor"}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={undo} disabled={undoStack.length === 0} data-testid="button-undo">
              <Undo2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0} data-testid="button-redo">
              <Redo2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={deleteSelected} data-testid="button-delete">
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={saveDesign} disabled={isSaving} data-testid="button-save">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div 
          ref={previewContainerRef}
          className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerLeave}
          data-testid="preview-container"
        >
          <div 
            className="relative transition-transform duration-100 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
            }}
          >
            <div 
              className="absolute inset-[-12px] rounded-lg shadow-2xl"
              style={{ 
                backgroundColor: bleedColor,
                clipPath: contourPath ? `path('${expandContour(contourPath, 12)}')` : undefined,
              }}
            />
            <canvas 
              ref={canvasRef} 
              className="relative z-10 rounded-lg shadow-lg bg-white"
              style={{ touchAction: "none" }}
              data-testid="canvas-editor"
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.svg"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-file-upload"
          />
        </div>

        <div className="lg:w-80 bg-card border-t lg:border-t-0 lg:border-l flex flex-col">
          <div className="lg:hidden flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToolDockOpen(!toolDockOpen)}
              className="w-full max-w-[200px]"
              data-testid="button-toggle-tools"
            >
              {toolDockOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              <span className="ml-2">{toolDockOpen ? "Hide Tools" : "Show Tools"}</span>
            </Button>
          </div>

          <div className={`flex-1 overflow-y-auto transition-all ${toolDockOpen ? "max-h-[60vh] lg:max-h-none" : "max-h-0 lg:max-h-none overflow-hidden"}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 sticky top-0 bg-card z-10">
                <TabsTrigger value="text" data-testid="tab-text">
                  <Type className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="graphics" data-testid="tab-graphics">
                  <Shapes className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="draw" data-testid="tab-draw">
                  <Brush className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="adjust" data-testid="tab-adjust">
                  <Palette className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="p-4 space-y-4">
                <Button className="w-full" onClick={addText} data-testid="button-add-text">
                  <Type className="w-4 h-4 mr-2" /> Add Text
                </Button>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Font</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background"
                    data-testid="select-font"
                  >
                    {FONT_FAMILIES.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Size: {fontSize}px</label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([val]) => setFontSize(val)}
                    min={12}
                    max={72}
                    step={1}
                    data-testid="slider-font-size"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openColorPicker("text")}
                    data-testid="button-text-color"
                  >
                    <div className="w-5 h-5 rounded border mr-2" style={{ backgroundColor: textColor }} />
                    {textColor}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="graphics" className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Shapes</h3>
                  <div className="grid grid-cols-5 gap-2">
                    <Button variant="outline" size="icon" onClick={() => addShape("square")} data-testid="button-shape-square">
                      <Square className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addShape("circle")} data-testid="button-shape-circle">
                      <Circle className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addShape("triangle")} data-testid="button-shape-triangle">
                      <Triangle className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addShape("star")} data-testid="button-shape-star">
                      <Star className="w-5 h-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addShape("heart")} data-testid="button-shape-heart">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Icons</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="icon" onClick={() => addEmoji("star")} data-testid="button-emoji-star">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addEmoji("heart")} data-testid="button-emoji-heart">
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addEmoji("smile")} data-testid="button-emoji-smile">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Clipart</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="icon" onClick={() => addClipart("arrow")} data-testid="button-clipart-arrow" title="Arrow">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("checkmark")} data-testid="button-clipart-check" title="Checkmark">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("badge")} data-testid="button-clipart-badge" title="Badge">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("ribbon")} data-testid="button-clipart-ribbon" title="Ribbon">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("burst")} data-testid="button-clipart-burst" title="Burst">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 3l1.45 3.55L17 8l-3.55 1.45L12 13l-1.45-3.55L7 8l3.55-1.45L12 3zm5.5 6l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1zM6 14l1.35 3.15L10.5 18.5l-3.15 1.35L6 23l-1.35-3.15L1.5 18.5l3.15-1.35L6 14z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("banner")} data-testid="button-clipart-banner" title="Banner">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14l-4-4h3V8h2v6h3l-4 4z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("speechBubble")} data-testid="button-clipart-speech" title="Speech">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-3H7V9h10v2zm0-3H7V6h10v2z"/></svg>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => addClipart("lightning")} data-testid="button-clipart-lightning" title="Lightning">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8H7z"/></svg>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Fill Color</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openColorPicker("fill")}
                    data-testid="button-fill-color"
                  >
                    <div className="w-5 h-5 rounded border mr-2" style={{ backgroundColor: fillColor }} />
                    {fillColor}
                  </Button>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Upload Image</h3>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-image"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    Upload Image
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="draw" className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={drawingMode ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => toggleDrawingMode(!drawingMode)}
                    data-testid="button-toggle-draw"
                  >
                    <Brush className="w-4 h-4 mr-2" />
                    {drawingMode ? "Drawing" : "Draw"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleDrawingMode(false)}
                    data-testid="button-select-mode"
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Brush Size: {brushWidth}px</label>
                  <Slider
                    value={[brushWidth]}
                    onValueChange={([val]) => setBrushWidth(val)}
                    min={1}
                    max={50}
                    step={1}
                    data-testid="slider-brush-size"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Brush Color</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openColorPicker("brush")}
                    data-testid="button-brush-color"
                  >
                    <div className="w-5 h-5 rounded border mr-2" style={{ backgroundColor: brushColor }} />
                    {brushColor}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="adjust" className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Bleed/Border Color</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openColorPicker("bleed")}
                    data-testid="button-bleed-color"
                  >
                    <div className="w-5 h-5 rounded border mr-2" style={{ backgroundColor: bleedColor }} />
                    {bleedColor}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the color that appears around your design
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Product Options</h3>
                  
                  {product?.options?.filter(o => o.optionType === "material").length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm text-muted-foreground mb-2 block">Material</label>
                      <div className="grid grid-cols-2 gap-2">
                        {product.options.filter(o => o.optionType === "material").map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedOptions({ ...selectedOptions, material: option.id })}
                            className={`p-2 rounded-md border text-sm text-left transition-all ${
                              selectedOptions.material === option.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-material-${option.id}`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product?.options?.filter(o => o.optionType === "coating").length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm text-muted-foreground mb-2 block">Finish</label>
                      <div className="grid grid-cols-2 gap-2">
                        {product.options.filter(o => o.optionType === "coating").map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedOptions({ ...selectedOptions, coating: option.id })}
                            className={`p-2 rounded-md border text-sm text-left transition-all ${
                              selectedOptions.coating === option.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }`}
                            data-testid={`button-coating-${option.id}`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-3 block">Quantity</label>
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(product?.minQuantity || 1, quantity - 25))}
                      data-testid="button-quantity-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min={product?.minQuantity || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || product?.minQuantity || 1)}
                      className="w-20 text-center"
                      data-testid="input-quantity"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 25)}
                      data-testid="button-quantity-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_QUANTITY_OPTIONS.slice(0, 4).map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setQuantity(qty)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          quantity === qty
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        data-testid={`button-qty-${qty}`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold" data-testid="text-total-price">
                {priceLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  formatPrice(calculatedPrice?.subtotal || 0)
                )}
              </span>
            </div>
            {calculatedPrice && (
              <p className="text-xs text-muted-foreground mb-3">
                {formatPrice(calculatedPrice.pricePerUnit + (calculatedPrice.optionsCost || 0))} per unit
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={addedToCart}
              data-testid="button-add-to-cart"
            >
              {addedToCart ? (
                <>
                  <Check className="w-4 h-4 mr-2" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Color</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className="w-10 h-10 rounded-md border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                data-testid={`color-${color.replace("#", "")}`}
              />
            ))}
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium mb-2 block">Custom Color</label>
            <Input
              type="color"
              className="w-full h-12 p-1"
              onChange={(e) => handleColorSelect(e.target.value)}
              data-testid="input-custom-color"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
