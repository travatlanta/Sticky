"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Upload, ShoppingCart, Check, Loader2, ChevronDown, ChevronUp,
  Minus, Plus, ArrowLeft, Type, Shapes, Brush, Palette, Image as ImageIcon,
  Square, Circle, Triangle, Star, Heart, Smile, Undo2, Redo2, Trash2,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  PaintBucket, Eraser, Pipette, Move, X, Save, Download, HelpCircle,
  FolderOpen, Layers, Sparkles, Sun, Moon, Droplets, Zap, CircleDot
} from "lucide-react";
import { getContourFromImage, scaleContourPath, traceContour } from "@/lib/contour-tracer";
import { getCartSessionId, setCartSessionId } from "@/lib/cartSession";

let fabricModule: any = null;

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
  bleedSize?: string;
  safeZoneSize?: string;
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

interface UploadedAsset {
  id: string;
  url: string;
  name: string;
  thumbnail: string;
}

const DEFAULT_QUANTITY_OPTIONS = [25, 50, 100, 250, 500, 1000];

const FONT_FAMILIES = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana",
  "Courier New", "Impact", "Comic Sans MS", "Trebuchet MS", "Palatino"
];

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00",
  "#ff00ff", "#00ffff", "#ff6600", "#9900ff", "#ff69b4", "#32cd32",
  "#4169e1", "#ffd700", "#ff4500", "#1e90ff", "#dc143c", "#00ced1"
];

const HELP_TIPS: Record<string, string> = {
  text: "Add text to your design. Click 'Add Text' then edit directly on the canvas.",
  graphics: "Add shapes, icons, or upload your own images to the design.",
  draw: "Draw freehand on your design using the brush tool.",
  adjust: "Configure product options like material and quantity.",
  uploads: "Upload multiple images here to use as design elements. They'll appear in your gallery.",
  effects: "Add visual effects like shadows, glow, and outlines to selected elements.",
  canvas: "This is your design area. Add text, graphics, and images to create your custom product.",
};

export default function Editor() {
  const params = useParams();
  const searchParams = useSearchParams();
  const designId = params.designId as string;
  const isNewDesign = designId === "new";
  const router = useRouter();
  const { toast } = useToast();
  
  const initialQuantityFromUrl = parseInt(searchParams.get("qty") || "0", 10);
  
  // Check if this is a deal with fixed quantity
  const dealId = searchParams.get("dealId");
  const dealPrice = searchParams.get("price");
  const isDeal = !!dealId && initialQuantityFromUrl > 0;
  const fixedDealPrice = isDeal && dealPrice ? parseFloat(dealPrice) : null;
  
  // Order context params (coming from payment page)
  const orderIdFromUrl = searchParams.get("orderId");
  const itemIdFromUrl = searchParams.get("itemId");
  const productIdFromUrl = searchParams.get("productId");
  const tokenFromUrl = searchParams.get("token");
  
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewUrlLoadedRef = useRef<string | null>(null);
  const canvasJsonLoadedRef = useRef<boolean>(false);
  const designDataLoadedRef = useRef<boolean>(false);

  const [toolDockOpen, setToolDockOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [quantity, setQuantity] = useState(initialQuantityFromUrl > 0 ? initialQuantityFromUrl : 50);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<PriceCalculation | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [contourPath, setContourPath] = useState<string>("");
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
  const [colorPickerTarget, setColorPickerTarget] = useState<"brush" | "text" | "fill">("brush");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 400 });
  const [productDimensionsInches, setProductDimensionsInches] = useState({ width: 4, height: 4 });
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowBlur, setShadowBlur] = useState(15);
  const [shadowOffsetX, setShadowOffsetX] = useState(5);
  const [shadowOffsetY, setShadowOffsetY] = useState(5);
  const [glowEnabled, setGlowEnabled] = useState(false);
  const [glowColor, setGlowColor] = useState("#ffff00");
  const [glowBlur, setGlowBlur] = useState(20);
  const [outlineEnabled, setOutlineEnabled] = useState(false);
  const [outlineColor, setOutlineColor] = useState("#ffffff");
  const [outlineWidth, setOutlineWidth] = useState(3);
  const animationFrameRef = useRef<number>();

  const PIXELS_PER_INCH = 100;

  // Create checkerboard pattern for transparent background indication
  const createCheckerboardPattern = useCallback(() => {
    if (!fabricModule) return null;
    
    const patternCanvas = document.createElement('canvas');
    const size = 20;
    patternCanvas.width = size * 2;
    patternCanvas.height = size * 2;
    const ctx = patternCanvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, size * 2, size * 2);
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(size, size, size, size);
    
    return new fabricModule.Pattern({
      source: patternCanvas,
      repeat: 'repeat',
    });
  }, [fabricModule]);

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

  // Determine which product ID to use: from design or from URL params
  const effectiveProductId = design?.productId || (productIdFromUrl ? parseInt(productIdFromUrl, 10) : null);
  
  const { data: product, isLoading: productLoading, error: productError } = useQuery<Product>({
    queryKey: [`/api/products/by-id/${effectiveProductId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/by-id/${effectiveProductId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!effectiveProductId,
    retry: false,
  });

  useEffect(() => {
    if (product) {
      const widthInches = parseFloat(product.printWidthInches || "4");
      const heightInches = parseFloat(product.printHeightInches || "4");
      setProductDimensionsInches({ width: widthInches, height: heightInches });
      
      const newWidth = Math.round(widthInches * PIXELS_PER_INCH);
      const newHeight = Math.round(heightInches * PIXELS_PER_INCH);
      setCanvasDimensions({ width: newWidth, height: newHeight });
    }
  }, [product]);

  useEffect(() => {
    if (fabricCanvasRef.current) return;
    
    const checkAndInit = () => {
      if (!canvasRef.current) {
        setTimeout(checkAndInit, 100);
        return;
      }
      
      initCanvas();
    };

    const initCanvas = async () => {
      try {
        if (!fabricModule) {
          console.log("Loading Fabric.js module...");
          const fabricImport = await import("fabric") as any;
          fabricModule = fabricImport.fabric || fabricImport;
          console.log("Fabric.js loaded successfully", Object.keys(fabricModule));
        }
        
        if (!canvasRef.current) {
          console.error("Canvas ref not available");
          return;
        }
        
        const canvas = new fabricModule.Canvas(canvasRef.current, {
          backgroundColor: "#ffffff",
          selection: true,
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;
        console.log("Canvas initialized successfully");

        // Attach event listeners for undo/redo only (contour updates happen separately if needed)
        canvas.on("object:modified", saveCanvasState);
        canvas.on("object:added", saveCanvasState);
        canvas.on("object:removed", saveCanvasState);
        
        setFabricLoaded(true);
      } catch (error) {
        console.error("Failed to initialize canvas:", error);
      }
    };

    checkAndInit();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricLoaded) return;

    const updateCanvasSize = () => {
      const container = previewContainerRef.current;
      if (!container) return;

      // Larger padding to ensure bleed zone is visible
      const padding = 120;
      const containerWidth = container.clientWidth - padding;
      const containerHeight = container.clientHeight - padding;
      
      const productWidth = canvasDimensions.width;
      const productHeight = canvasDimensions.height;
      
      // Always scale to fit - never exceed container bounds
      const scaleX = containerWidth / productWidth;
      const scaleY = containerHeight / productHeight;
      // Use the smaller scale to ensure it fits, cap at 2x max zoom
      const scale = Math.min(scaleX, scaleY, 2);
      
      const displayWidth = Math.round(productWidth * scale);
      const displayHeight = Math.round(productHeight * scale);

      console.log(`Canvas scaling: product ${productWidth}x${productHeight}, container ${containerWidth}x${containerHeight}, display ${displayWidth}x${displayHeight}, scale ${scale.toFixed(2)}`);
      
      canvas.setDimensions({ width: displayWidth, height: displayHeight });
      canvas.setZoom(scale);
      canvas.renderAll();
    };

    // Initial update
    updateCanvasSize();
    
    // Also update when container resizes
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (previewContainerRef.current) {
      resizeObserver.observe(previewContainerRef.current);
    }
    
    window.addEventListener("resize", updateCanvasSize);
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      resizeObserver.disconnect();
    };
  }, [fabricLoaded, canvasDimensions]);

  useEffect(() => {
    // Only load design data once to prevent infinite re-render loops
    if (design && !designDataLoadedRef.current) {
      designDataLoadedRef.current = true;
      if (design.previewUrl) {
        setUploadedImage(design.previewUrl);
      }
      if (design.selectedOptions) {
        setSelectedOptions(design.selectedOptions as Record<string, number>);
      }
      if (design.contourPath) {
        setContourPath(design.contourPath);
      }
    }
    if (design?.canvasJson && fabricCanvasRef.current) {
      // Load saved canvas JSON (from editor saves)
      // Prevent re-loading the same JSON
      if (canvasJsonLoadedRef.current) {
        return;
      }
      canvasJsonLoadedRef.current = true;
      
      const canvas = fabricCanvasRef.current;
      // Remove ALL event listeners during load to prevent state update loops
      canvas.off();
      
      canvas.loadFromJSON(design.canvasJson).then(() => {
        canvas.renderAll();
        // Re-attach event listeners after load completes
        canvas.on("object:modified", saveCanvasState);
        canvas.on("object:added", saveCanvasState);
        canvas.on("object:removed", saveCanvasState);
        if (product?.supportsCustomShape) {
          canvas.on("object:moving", updateContourFromCanvas);
          canvas.on("object:scaling", updateContourFromCanvas);
        }
        console.log("Canvas JSON loaded and events re-attached");
      });
    } else if (design?.previewUrl && fabricCanvasRef.current && fabricLoaded && fabricModule) {
      // No canvas JSON - this is a file upload, load the image onto the canvas
      // Prevent loading the same image multiple times
      if (previewUrlLoadedRef.current === design.previewUrl) {
        console.log("PreviewUrl already loaded, skipping:", design.previewUrl);
        return;
      }
      
      console.log("Loading uploaded image onto canvas:", design.previewUrl);
      previewUrlLoadedRef.current = design.previewUrl;
      
      const canvas = fabricCanvasRef.current;
      // Remove ALL event listeners during load to prevent state update loops
      canvas.off();
      
      fabricModule.Image.fromURL(design.previewUrl, { crossOrigin: 'anonymous' }).then((img: any) => {
        if (!fabricCanvasRef.current) return;
        
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // Scale image to fit within canvas while maintaining aspect ratio
        const imgWidth = img.width || 400;
        const imgHeight = img.height || 400;
        const scale = Math.min(
          (canvasWidth * 0.8) / imgWidth,
          (canvasHeight * 0.8) / imgHeight
        );
        
        img.scale(scale);
        img.set({
          left: (canvasWidth - imgWidth * scale) / 2,
          top: (canvasHeight - imgHeight * scale) / 2,
          selectable: true,
          hasControls: true,
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        // Re-attach event listeners after load completes
        canvas.on("object:modified", saveCanvasState);
        canvas.on("object:added", saveCanvasState);
        canvas.on("object:removed", saveCanvasState);
        if (product?.supportsCustomShape) {
          canvas.on("object:moving", updateContourFromCanvas);
          canvas.on("object:scaling", updateContourFromCanvas);
        }
        console.log("Image added to canvas and events re-attached");
      }).catch((err: any) => {
        console.error("Failed to load image onto canvas:", err);
        previewUrlLoadedRef.current = null; // Reset on error so user can retry
        // Re-attach events even on error
        canvas.on("object:modified", saveCanvasState);
        canvas.on("object:added", saveCanvasState);
        canvas.on("object:removed", saveCanvasState);
      });
    }
  }, [design, fabricLoaded, fabricModule]);

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

  // Update canvas background based on product type (checkerboard for die-cut/custom shape)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricLoaded || !product || !fabricModule) return;

    console.log("Setting canvas background for product:", product.name, "supportsCustomShape:", product.supportsCustomShape);

    if (product.supportsCustomShape) {
      // Create checkerboard pattern inline to ensure fabricModule is available
      const patternCanvas = document.createElement('canvas');
      const size = 20;
      patternCanvas.width = size * 2;
      patternCanvas.height = size * 2;
      const ctx = patternCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(0, 0, size * 2, size * 2);
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillRect(size, size, size, size);
        
        const pattern = new fabricModule.Pattern({
          source: patternCanvas,
          repeat: 'repeat',
        });
        
        canvas.setBackgroundColor(pattern as any, () => {
          console.log("Checkerboard pattern applied");
          canvas.renderAll();
        });
      }
    } else {
      canvas.setBackgroundColor('#ffffff', () => {
        console.log("White background applied");
        canvas.renderAll();
      });
    }
  }, [product, fabricLoaded]);

  const priceCalculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const calculatePrice = useCallback(async () => {
    if (!product?.id) return;
    setPriceLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/calculate-price`, {
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
  }, [product?.id, quantity, selectedOptions]);

  useEffect(() => {
    if (priceCalculationTimeoutRef.current) {
      clearTimeout(priceCalculationTimeoutRef.current);
    }
    priceCalculationTimeoutRef.current = setTimeout(() => {
      if (product?.id) {
        calculatePrice();
      }
    }, 300);
    return () => {
      if (priceCalculationTimeoutRef.current) {
        clearTimeout(priceCalculationTimeoutRef.current);
      }
    };
  }, [product?.id, quantity, selectedOptions, calculatePrice]);

  const updateContourFromCanvas = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !product?.supportsCustomShape) return;

    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
    });

    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      
      const newContour = traceContour(imageData, 10, 2);
      setContourPath(newContour);
    };
    img.src = dataUrl;
  }, [product?.supportsCustomShape]);

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
    
    try {
      canvas.loadFromJSON(JSON.parse(prevState), () => {
        canvas.renderAll();
      });
    } catch (e) {
      canvas.loadFromJSON(prevState).then(() => {
        canvas.renderAll();
      });
    }
  }, [undoStack]);

  const redo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || redoStack.length === 0) return;
    
    const currentState = JSON.stringify(canvas.toJSON());
    setUndoStack(prev => [...prev, currentState]);
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    try {
      canvas.loadFromJSON(JSON.parse(nextState), () => {
        canvas.renderAll();
      });
    } catch (e) {
      canvas.loadFromJSON(nextState).then(() => {
        canvas.renderAll();
      });
    }
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
    if (!canvas || !fabricModule) {
      toast({ title: "Editor not ready", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    
    const text = new fabricModule.IText("Your Text", {
      left: canvasDimensions.width / 2,
      top: canvasDimensions.height / 2,
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
    toast({ title: "Text added" });
  }, [fontFamily, fontSize, textColor, toast, canvasDimensions]);

  const addShape = useCallback((shapeType: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) {
      toast({ title: "Editor not ready", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    
    const centerX = canvasDimensions.width / 2;
    const centerY = canvasDimensions.height / 2;
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
    toast({ title: "Shape added" });
  }, [fillColor, toast, canvasDimensions]);

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
        left: canvasDimensions.width / 2,
        top: canvasDimensions.height / 2,
        fill: fillColor,
        scaleX: 0.5,
        scaleY: 0.5,
        originX: "center",
        originY: "center",
      });
    } else {
      shape = new fabricModule.Circle({
        left: canvasDimensions.width / 2,
        top: canvasDimensions.height / 2,
        radius: 30,
        fill: fillColor,
        originX: "center",
        originY: "center",
      });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }, [fillColor, canvasDimensions]);

  const addClipart = useCallback((clipartName: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) {
      toast({ title: "Editor not ready", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    
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
      left: canvasDimensions.width / 2,
      top: canvasDimensions.height / 2,
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
    toast({ title: "Clipart added" });
  }, [fillColor, toast, canvasDimensions]);

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

  const applyDropShadow = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast({
        title: "No object selected",
        description: "Please select an element on the canvas first.",
        variant: "destructive",
      });
      return;
    }
    
    activeObject.set({
      shadow: {
        color: shadowColor,
        blur: shadowBlur,
        offsetX: shadowOffsetX,
        offsetY: shadowOffsetY,
      }
    });
    canvas.renderAll();
    setShadowEnabled(true);
    toast({ title: "Drop shadow applied" });
  }, [shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, toast]);

  const applyGlow = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast({
        title: "No object selected",
        description: "Please select an element on the canvas first.",
        variant: "destructive",
      });
      return;
    }
    
    activeObject.set({
      shadow: {
        color: glowColor,
        blur: glowBlur,
        offsetX: 0,
        offsetY: 0,
      }
    });
    canvas.renderAll();
    setGlowEnabled(true);
    toast({ title: "Glow effect applied" });
  }, [glowColor, glowBlur, toast]);

  const applyOutline = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast({
        title: "No object selected",
        description: "Please select an element on the canvas first.",
        variant: "destructive",
      });
      return;
    }
    
    activeObject.set({
      stroke: outlineColor,
      strokeWidth: outlineWidth,
    });
    canvas.renderAll();
    setOutlineEnabled(true);
    toast({ title: "Outline applied" });
  }, [outlineColor, outlineWidth, toast]);

  const removeEffects = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (!activeObject) {
      toast({
        title: "No object selected",
        description: "Please select an element on the canvas first.",
        variant: "destructive",
      });
      return;
    }
    
    activeObject.set({
      shadow: null,
      stroke: null,
      strokeWidth: 0,
    });
    canvas.renderAll();
    setShadowEnabled(false);
    setGlowEnabled(false);
    setOutlineEnabled(false);
    toast({ title: "Effects removed" });
  }, [toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        const canvas = fabricCanvasRef.current;
        if (!canvas || !fabricModule) return;

        (fabricModule as any).Image.fromURL(dataUrl, (fabricImg: any) => {
          if (!fabricImg) {
            toast({ title: "Failed to load image", variant: "destructive" });
            return;
          }
          
          fabricImg.set({
            left: canvasDimensions.width / 2,
            top: canvasDimensions.height / 2,
            originX: "center",
            originY: "center",
          });

          const maxSize = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.8;
          const scale = Math.min(maxSize / fabricImg.width, maxSize / fabricImg.height);
          fabricImg.scale(scale);

          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.renderAll();

          if (product?.supportsCustomShape) {
            setTimeout(() => {
              updateContourFromCanvas();
            }, 100);
          }

          const asset: UploadedAsset = {
            id: Date.now().toString(),
            url: dataUrl,
            name: file.name,
            thumbnail: dataUrl,
          };
          setUploadedAssets(prev => [...prev, asset]);
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newAssets: UploadedAsset[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });

        newAssets.push({
          id: `${Date.now()}-${i}`,
          url: dataUrl,
          name: file.name,
          thumbnail: dataUrl,
        });
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }

    setUploadedAssets(prev => [...prev, ...newAssets]);
    setIsUploading(false);
    
    toast({
      title: "Upload complete",
      description: `${newAssets.length} file(s) added to your gallery.`,
    });
  };

  const addAssetToCanvas = useCallback((asset: UploadedAsset) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabricModule) {
      console.log("Canvas or fabricModule not ready");
      return;
    }

    console.log("Adding asset to canvas:", asset.name);
    
    (fabricModule as any).Image.fromURL(asset.url, (fabricImg: any) => {
      if (!fabricImg) {
        console.error("Failed to create fabric image");
        toast({ title: "Failed to add image", variant: "destructive" });
        return;
      }
      
      fabricImg.set({
        left: canvasDimensions.width / 2,
        top: canvasDimensions.height / 2,
        originX: "center",
        originY: "center",
      });

      const maxSize = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.8;
      const scale = Math.min(maxSize / fabricImg.width, maxSize / fabricImg.height);
      fabricImg.scale(scale);

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      console.log("Image added to canvas");
      
      toast({ title: "Image added", description: "Click and drag to position it." });
    }, { crossOrigin: 'anonymous' });
  }, [canvasDimensions, toast]);

  const removeAsset = useCallback((assetId: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== assetId));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent | React.TouchEvent) => {
    if (isInteracting) return;
    
    const container = previewContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    
    if (clientX === undefined || clientY === undefined) return;

    const x = ((clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((clientY - rect.top) / rect.height - 0.5) * 6;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setMousePosition({ x, y });
    });
  }, [isInteracting]);

  const handlePointerLeave = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      setMousePosition({ x: 0, y: 0 });
    });
  }, []);

  const saveDesign = async (): Promise<number | null> => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;

    setIsSaving(true);
    try {
      const canvasJson = canvas.toJSON();
      const previewUrl = canvas.toDataURL({ format: 'png', quality: 0.8 });

      // For new designs from order context, create a new design
      if (isNewDesign && productIdFromUrl) {
        const createRes = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: `Design for Order #${orderIdFromUrl || 'new'}`,
            productId: parseInt(productIdFromUrl, 10),
            canvasJson,
            previewUrl,
            contourPath,
            selectedOptions,
          }),
        });

        if (!createRes.ok) throw new Error('Failed to create design');
        const newDesign = await createRes.json();
        
        // If we have order context, update the order item with the new design
        let linkedToOrder = false;
        if (orderIdFromUrl && itemIdFromUrl) {
          if (tokenFromUrl) {
            // Using token-based auth (for unauthenticated users)
            const tokenLinkRes = await fetch(`/api/orders/by-token/${tokenFromUrl}/artwork`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderItemId: parseInt(itemIdFromUrl, 10),
                designId: newDesign.id,
              }),
            });
            if (!tokenLinkRes.ok) {
              const errorData = await tokenLinkRes.json().catch(() => ({}));
              throw new Error(errorData.message || 'Failed to link design to order');
            }
            linkedToOrder = true;
          } else if (session?.user) {
            // Using session-based auth (for authenticated users from order page)
            const linkRes = await fetch(`/api/orders/${orderIdFromUrl}/artwork`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                orderItemId: parseInt(itemIdFromUrl, 10),
                designId: newDesign.id,
              }),
            });
            
            if (!linkRes.ok) {
              const errorData = await linkRes.json().catch(() => ({}));
              throw new Error(errorData.message || 'Failed to link design to order');
            }
            linkedToOrder = true;
          } else {
            // No auth available - show error
            throw new Error('You must be logged in to save designs to orders');
          }
        }
        
        if (linkedToOrder) {
          toast({
            title: "Design saved",
            description: "Your design has been saved to the order.",
          });
          // Redirect back to order page
          router.push(`/orders/${orderIdFromUrl}`);
        } else {
          toast({
            title: "Design created",
            description: "Your design has been saved.",
          });
        }
        
        return newDesign.id;
      }

      // For existing designs, update as normal
      const res = await fetch(`/api/designs/${designId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          canvasJson,
          previewUrl,
          contourPath,
          selectedOptions,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // If editing existing design from order, redirect back
      if (orderIdFromUrl) {
        toast({
          title: "Design updated",
          description: "Redirecting back to order...",
        });
        router.push(`/orders/${orderIdFromUrl}`);
        return parseInt(designId, 10);
      }
      
      toast({
        title: "Design saved",
        description: "Your design has been saved successfully.",
      });
      
      return parseInt(designId, 10);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your design.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToCart = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    try {
      await saveDesign();

      const cartSessionId = getCartSessionId();
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Cart-Session-Id': cartSessionId,
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product?.id,
          designId: parseInt(designId),
          quantity,
          selectedOptions,
          unitPrice: calculatedPrice?.pricePerUnit,
        }),
      });

      if (!res.ok) throw new Error('Failed to add to cart');
      
      const data = await res.json();
      if (data.sessionId) {
        setCartSessionId(data.sessionId);
      }

      setAddedToCart(true);
      toast({
        title: "Added to cart",
        description: `${quantity} ${product?.name} added to your cart.`,
      });

      setTimeout(() => {
        router.push('/cart');
      }, 1500);
    } catch (error) {
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  // Detect if we're in order context (editing artwork for an existing order)
  // Order context is when we have orderId and itemId (token is optional - used for guest orders)
  const isOrderContext = !!(orderIdFromUrl && itemIdFromUrl);

  // Handle saving design for order context (link to existing order item)
  const handleSaveToOrder = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    try {
      setIsSaving(true);

      // Export canvas
      const previewDataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });

      // Create/update design
      const designPayload: any = {
        name: `[CUSTOMER_UPLOAD] Artwork for Order Item ${itemIdFromUrl}`,
        productId: effectiveProductId,
        canvasJson: JSON.stringify(canvas.toJSON()),
        previewUrl: previewDataUrl,
      };

      let savedDesignId: number;

      if (isNewDesign) {
        // Create new design
        const res = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(designPayload),
        });

        if (!res.ok) throw new Error("Failed to create design");
        const data = await res.json();
        savedDesignId = data.id;
      } else {
        // Update existing design
        const res = await fetch(`/api/designs/${designId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(designPayload),
        });

        if (!res.ok) throw new Error("Failed to update design");
        savedDesignId = parseInt(designId);
      }

      // Link design to order item
      // Use token-based endpoint for guest orders, or authenticated endpoint for logged-in users
      const linkEndpoint = tokenFromUrl 
        ? `/api/orders/by-token/${tokenFromUrl}/artwork`
        : `/api/orders/${orderIdFromUrl}/artwork`;
      
      const linkRes = await fetch(linkEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderItemId: parseInt(itemIdFromUrl || "0"),
          designId: savedDesignId,
        }),
      });

      if (!linkRes.ok) throw new Error("Failed to link design to order");

      toast({
        title: "Artwork saved!",
        description: "Your design has been linked to this order.",
      });

      // Navigate back to order page
      setTimeout(() => {
        router.push(`/orders/${orderIdFromUrl}`);
      }, 1000);
    } catch (error) {
      console.error("Save to order error:", error);
      toast({
        title: "Error",
        description: "Failed to save artwork to order.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const openColorPicker = (target: "brush" | "text" | "fill") => {
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
    }
    setShowColorPicker(false);
  };


  // Show product selection only if it's a new design WITHOUT a productId in URL
  if (isNewDesign && !productIdFromUrl) {
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
  
  // Show loading when we have a productId from URL but still fetching the product
  if (isNewDesign && productIdFromUrl && productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  // For new designs with order context, we don't need an existing design
  // Only show "Design not found" if we're trying to load an existing design and it failed
  if (!isNewDesign && (designError || !design)) {
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
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-muted flex flex-col">
        <header className="bg-card border-b sticky top-0 z-50">
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-lg truncate max-w-[180px]" data-testid="text-product-name">
              {product?.name || "Design Editor"}
            </h1>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={undo} disabled={undoStack.length === 0} data-testid="button-undo">
                    <Undo2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={redoStack.length === 0} data-testid="button-redo">
                    <Redo2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={deleteSelected} data-testid="button-delete">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete selected</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={saveDesign} disabled={isSaving} data-testid="button-save">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save design</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowHelp(!showHelp)} data-testid="button-help">
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Help & Tips</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div 
            ref={previewContainerRef}
            data-testid="canvas-container"
            className="flex-1 flex items-center justify-center p-4 lg:p-6 relative overflow-hidden min-h-[50vh] lg:min-h-0"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerLeave}
          >
            <div className="relative flex flex-col items-center">
              <div 
                className="relative transition-transform duration-100 ease-out"
                style={{
                  transform: `perspective(1000px) rotateX(${-mousePosition.y}deg) rotateY(${mousePosition.x}deg)`,
                }}
              >
                <canvas 
                  ref={canvasRef} 
                  className="relative z-10 rounded-lg shadow-lg"
                  style={{ touchAction: "none" }}
                  data-testid="canvas-editor"
                />
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground font-medium">
                {productDimensionsInches.width}" × {productDimensionsInches.height}"
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.svg,.eps,.cdr,.ai,.psd"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
            <input
              ref={multiFileInputRef}
              type="file"
              accept="image/*,.pdf,.svg,.eps,.cdr,.ai,.psd"
              multiple
              onChange={handleMultiFileUpload}
              className="hidden"
              data-testid="input-multi-file-upload"
            />
          </div>

          <div className="lg:w-72 xl:w-80 bg-card border-t lg:border-t-0 lg:border-l flex flex-col max-h-[50vh] lg:max-h-none">
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
                <TabsList className="w-full grid grid-cols-6 sticky top-0 bg-card z-10 p-1 gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="uploads" 
                        data-testid="tab-uploads"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <FolderOpen className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.uploads}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="text" 
                        data-testid="tab-text"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <Type className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.text}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="graphics" 
                        data-testid="tab-graphics"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <Shapes className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.graphics}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="draw" 
                        data-testid="tab-draw"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <Brush className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.draw}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="effects" 
                        data-testid="tab-effects"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <Sparkles className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.effects}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger 
                        value="adjust" 
                        data-testid="tab-adjust"
                        className="data-[state=active]:shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 py-2.5"
                      >
                        <Palette className="w-5 h-5" />
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>{HELP_TIPS.adjust}</TooltipContent>
                  </Tooltip>
                </TabsList>

                {activeTab === "" && (
                  <div className="p-4 space-y-4" data-testid="quickstart-guide">
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <svg className="w-6 h-6 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Start designing here</span>
                    </div>
                    
                    <Button
                      onClick={() => {
                        setActiveTab("uploads");
                        multiFileInputRef.current?.click();
                      }}
                      className="w-full"
                      data-testid="button-quickstart-upload"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Image
                    </Button>
                    
                    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <h3 className="font-semibold text-sm">Quick Start Guide</h3>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <Type className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Text</span>
                            <p>Add custom text with different fonts, sizes, and colors</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Shapes className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Graphics</span>
                            <p>Add shapes and clipart to your design</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FolderOpen className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Uploads</span>
                            <p>Upload your own images and logos</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Brush className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Draw</span>
                            <p>Freehand drawing with brush tools</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Effects</span>
                            <p>Add shadows, glow, and outlines</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Palette className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">Adjust</span>
                            <p>Customize background and bleed colors</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <h3 className="font-semibold text-sm">Tips</h3>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                          <span>Click objects on canvas to select and edit them</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                          <span>Drag corners to resize, use handles to rotate</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                          <span>Use undo/redo buttons to fix mistakes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                          <span>{isOrderContext ? 'Click "Update Design" when finished' : 'Save your design before adding to cart'}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                <TabsContent value="text" className="p-3 space-y-3">
                  <Button className="w-full" onClick={addText} data-testid="button-add-text">
                    <Type className="w-4 h-4 mr-2" /> Add Text
                  </Button>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border bg-background text-sm"
                      data-testid="select-font"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Size: {fontSize}px</label>
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
                    <label className="text-sm font-medium mb-1 block">Color</label>
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

                <TabsContent value="graphics" className="p-3 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Shapes</h3>
                    <div className="grid grid-cols-5 gap-2">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addShape("square")} 
                        className="aspect-square"
                        data-testid="button-shape-square"
                      >
                        <Square className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addShape("circle")} 
                        className="aspect-square"
                        data-testid="button-shape-circle"
                      >
                        <Circle className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addShape("triangle")} 
                        className="aspect-square"
                        data-testid="button-shape-triangle"
                      >
                        <Triangle className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addShape("star")} 
                        className="aspect-square"
                        data-testid="button-shape-star"
                      >
                        <Star className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addShape("heart")} 
                        className="aspect-square"
                        data-testid="button-shape-heart"
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Clipart</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addClipart("arrow")} 
                        className="aspect-square"
                        data-testid="button-clipart-arrow" 
                        title="Arrow"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addClipart("checkmark")} 
                        className="aspect-square"
                        data-testid="button-clipart-check" 
                        title="Checkmark"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addClipart("badge")} 
                        className="aspect-square"
                        data-testid="button-clipart-badge" 
                        title="Badge"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
                      </Button>
                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => addClipart("lightning")} 
                        className="aspect-square"
                        data-testid="button-clipart-lightning" 
                        title="Lightning"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8H7z"/></svg>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Fill Color</label>
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
                </TabsContent>

                <TabsContent value="uploads" className="p-3 space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => multiFileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-multiple"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload Files
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Upload multiple images to use in your design. Click an image to add it to the canvas.
                  </p>

                  {uploadedAssets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No uploads yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="relative group aspect-square rounded-md overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary"
                          onClick={() => addAssetToCanvas(asset)}
                          data-testid={`asset-${asset.id}`}
                        >
                          <img
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAsset(asset.id);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`remove-asset-${asset.id}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="draw" className="p-3 space-y-3">
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
                    <label className="text-sm font-medium mb-1 block">Brush Size: {brushWidth}px</label>
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
                    <label className="text-sm font-medium mb-1 block">Brush Color</label>
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

                <TabsContent value="effects" className="p-3 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Select an element on the canvas, then apply effects below.
                  </p>

                  <div className="space-y-3 p-3 rounded-md border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Moon className="w-4 h-4" /> Drop Shadow
                      </h3>
                      <Button size="sm" onClick={applyDropShadow} data-testid="button-apply-shadow">
                        Apply
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Blur: {shadowBlur}px</label>
                      <Slider
                        value={[shadowBlur]}
                        onValueChange={([val]) => setShadowBlur(val)}
                        min={0}
                        max={50}
                        step={1}
                        data-testid="slider-shadow-blur"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">X: {shadowOffsetX}</label>
                        <Slider
                          value={[shadowOffsetX]}
                          onValueChange={([val]) => setShadowOffsetX(val)}
                          min={-30}
                          max={30}
                          step={1}
                          data-testid="slider-shadow-x"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Y: {shadowOffsetY}</label>
                        <Slider
                          value={[shadowOffsetY]}
                          onValueChange={([val]) => setShadowOffsetY(val)}
                          min={-30}
                          max={30}
                          step={1}
                          data-testid="slider-shadow-y"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                      <div className="flex gap-1 flex-wrap">
                        {["#000000", "#333333", "#666666", "#999999"].map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border-2 ${shadowColor === color ? "border-primary" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setShadowColor(color)}
                            data-testid={`shadow-color-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 rounded-md border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Sun className="w-4 h-4" /> Glow Effect
                      </h3>
                      <Button size="sm" onClick={applyGlow} data-testid="button-apply-glow">
                        Apply
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Intensity: {glowBlur}px</label>
                      <Slider
                        value={[glowBlur]}
                        onValueChange={([val]) => setGlowBlur(val)}
                        min={5}
                        max={60}
                        step={1}
                        data-testid="slider-glow-blur"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                      <div className="flex gap-1 flex-wrap">
                        {["#ffff00", "#00ffff", "#ff00ff", "#ff6600", "#00ff00", "#ffffff"].map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border-2 ${glowColor === color ? "border-primary" : "border-muted"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setGlowColor(color)}
                            data-testid={`glow-color-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 rounded-md border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <CircleDot className="w-4 h-4" /> Outline
                      </h3>
                      <Button size="sm" onClick={applyOutline} data-testid="button-apply-outline">
                        Apply
                      </Button>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Width: {outlineWidth}px</label>
                      <Slider
                        value={[outlineWidth]}
                        onValueChange={([val]) => setOutlineWidth(val)}
                        min={1}
                        max={20}
                        step={1}
                        data-testid="slider-outline-width"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                      <div className="flex gap-1 flex-wrap">
                        {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map(color => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded border-2 ${outlineColor === color ? "border-primary" : "border-muted"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setOutlineColor(color)}
                            data-testid={`outline-color-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={removeEffects}
                    data-testid="button-remove-effects"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove All Effects
                  </Button>
                </TabsContent>

                <TabsContent value="adjust" className="p-3 space-y-4">
                  {/* Product Type Indicator */}
                  {product?.supportsCustomShape && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm border" />
                        <span>Die-Cut / Custom Shape Mode</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Checkerboard pattern shows transparent areas that will be cut away
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-2">Product Options</h3>
                    
                    {(product?.options?.filter(o => o.optionType === "material")?.length ?? 0) > 0 && (
                      <div className="mb-3">
                        <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                        <div className="grid grid-cols-2 gap-1">
                          {product?.options?.filter(o => o.optionType === "material").map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setSelectedOptions({ ...selectedOptions, material: option.id })}
                              className={`p-2 rounded-md border text-xs text-left transition-all ${
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

                    {(product?.options?.filter(o => o.optionType === "coating")?.length ?? 0) > 0 && (
                      <div className="mb-3">
                        <label className="text-xs text-muted-foreground mb-1 block">Finish</label>
                        <div className="grid grid-cols-2 gap-1">
                          {product?.options?.filter(o => o.optionType === "coating").map((option) => (
                            <button
                              key={option.id}
                              onClick={() => setSelectedOptions({ ...selectedOptions, coating: option.id })}
                              className={`p-2 rounded-md border text-xs text-left transition-all ${
                                selectedOptions.coating === option.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid={`button-coating-${option.id}`}
                            >
                              <span>{option.name}</span>
                              {option.priceModifier && parseFloat(option.priceModifier) > 0 && (
                                <span className="text-muted-foreground ml-1">(+{formatPrice(parseFloat(option.priceModifier))})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
                    <div className="flex items-center gap-2 mb-2">
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
                        className="w-16 text-center"
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
                    <div className="flex flex-wrap gap-1">
                      {DEFAULT_QUANTITY_OPTIONS.slice(0, 4).map((qty) => (
                        <button
                          key={qty}
                          onClick={() => setQuantity(qty)}
                          className={`px-2 py-1 text-xs rounded-full transition-all ${
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

                    {/* Bulk Pricing Tiers - Clickable to set quantity */}
                    {product?.pricingTiers && product.pricingTiers.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Bulk Discounts (click to select)</p>
                        <div className="space-y-1">
                          {product.pricingTiers.slice(0, 4).map((tier, idx) => {
                            const isActive = quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity);
                            return (
                              <button 
                                key={tier.id}
                                type="button"
                                onClick={() => setQuantity(tier.minQuantity)}
                                className={`w-full flex justify-between text-xs px-2 py-1.5 rounded cursor-pointer transition-all ${
                                  isActive 
                                    ? 'bg-green-200 dark:bg-green-800 font-medium border border-green-400 dark:border-green-600' 
                                    : 'bg-white/50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50'
                                }`}
                                data-testid={`button-pricing-tier-${idx}`}
                              >
                                <span className="text-green-700 dark:text-green-300">
                                  {tier.minQuantity.toLocaleString()}{tier.maxQuantity ? `-${tier.maxQuantity.toLocaleString()}` : '+'} units
                                </span>
                                <span className="text-green-800 dark:text-green-200 font-semibold">
                                  {formatPrice(parseFloat(tier.pricePerUnit))}/ea
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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

        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editor Help</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium mb-1">Canvas Area</h3>
                <p className="text-muted-foreground">{HELP_TIPS.canvas}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Adding Text</h3>
                <p className="text-muted-foreground">{HELP_TIPS.text}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Graphics & Shapes</h3>
                <p className="text-muted-foreground">{HELP_TIPS.graphics}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Uploads Gallery</h3>
                <p className="text-muted-foreground">{HELP_TIPS.uploads}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Drawing</h3>
                <p className="text-muted-foreground">{HELP_TIPS.draw}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Adjustments</h3>
                <p className="text-muted-foreground">{HELP_TIPS.adjust}</p>
              </div>
              <div className="pt-2 border-t">
                <h3 className="font-medium mb-1">Die-Cut Stickers</h3>
                <p className="text-muted-foreground">
                  For die-cut products, the sticker shape follows your design's contours. 
                  Upload an image with transparency, and the border will automatically 
                  wrap around the visible parts of your design.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fixed Bottom Bar */}
        <div className={`fixed bottom-0 left-0 right-0 border-t shadow-lg z-50 ${isOrderContext ? 'bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20' : isDeal ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20' : 'bg-card'}`} data-testid="fixed-cart-bar">
          <div className="max-w-7xl mx-auto px-3 py-2">
            
            {/* ORDER CONTEXT MODE - Simple save button */}
            {isOrderContext ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">ORDER ARTWORK</span>
                  <span className="text-sm text-blue-600 dark:text-blue-400 hidden sm:inline">
                    Design artwork for your order
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/orders/${orderIdFromUrl}`)}
                    data-testid="button-back-to-order"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveToOrder}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-save-to-order"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1" /> Save Artwork
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Deal Badge */}
                {isDeal && (
                  <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b border-orange-200 dark:border-orange-800">
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SPECIAL DEAL</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400">Fixed quantity - cannot be changed</span>
                  </div>
                )}
                
                {/* Bulk Discount Tiers Row - hidden for deals */}
                {!isDeal && product?.pricingTiers && product.pricingTiers.length > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-2 pb-2 border-b border-border/50 overflow-x-auto">
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-medium whitespace-nowrap mr-1">Bulk Savings:</span>
                    {product.pricingTiers.slice(0, 5).map((tier, idx) => {
                      const isActive = quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity);
                      return (
                        <button 
                          key={tier.id}
                          type="button"
                          onClick={() => setQuantity(tier.minQuantity)}
                          className={`px-2 py-0.5 text-[10px] rounded-full transition-all whitespace-nowrap ${
                            isActive 
                              ? 'bg-green-500 text-white font-medium' 
                              : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/60'
                          }`}
                          data-testid={`button-bulk-tier-${idx}`}
                        >
                          {tier.minQuantity}+ @ {formatPrice(parseFloat(tier.pricePerUnit))}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Quantity, Price & Add to Cart Row */}
                <div className="flex items-center justify-between gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(product?.minQuantity || 1, quantity - 25))}
                      className={`h-9 w-9 shrink-0 ${isDeal ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isDeal}
                      data-testid="button-fixed-qty-decrease"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className={`flex flex-col items-center min-w-[60px] ${isDeal ? 'bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-lg' : ''}`}>
                      <span className={`text-lg font-bold ${isDeal ? 'text-orange-700 dark:text-orange-300' : ''}`} data-testid="text-fixed-quantity">{quantity}</span>
                      <span className={`text-[10px] uppercase tracking-wide ${isDeal ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>{isDeal ? 'fixed' : 'qty'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 25)}
                      className={`h-9 w-9 shrink-0 ${isDeal ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isDeal}
                      data-testid="button-fixed-qty-increase"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quick Quantity Presets - hidden on very small screens and for deals */}
                  {!isDeal && (
                    <div className="hidden sm:flex items-center gap-1">
                      {DEFAULT_QUANTITY_OPTIONS.slice(0, 4).map((qty) => (
                        <button
                          key={qty}
                          onClick={() => setQuantity(qty)}
                          className={`px-2 py-1 text-xs rounded-full transition-all ${
                            quantity === qty
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          data-testid={`button-fixed-qty-${qty}`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price & Add to Cart */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isDeal ? 'text-orange-600 dark:text-orange-400' : ''}`} data-testid="text-fixed-price">
                        {priceLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin inline" />
                        ) : isDeal && fixedDealPrice ? (
                          formatPrice(fixedDealPrice)
                        ) : (
                          formatPrice(calculatedPrice?.subtotal || 0)
                        )}
                      </div>
                      {isDeal && fixedDealPrice ? (
                        <div className="text-[10px] text-orange-600 dark:text-orange-400">
                          {formatPrice(fixedDealPrice / quantity)}/ea
                        </div>
                      ) : calculatedPrice && (
                        <div className="text-[10px] text-muted-foreground">
                          {formatPrice(calculatedPrice.pricePerUnit + (calculatedPrice.optionsCost || 0))}/ea
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleAddToCart}
                      disabled={addedToCart}
                      className={`shrink-0 ${isDeal ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                      data-testid="button-fixed-add-to-cart"
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-4 h-4 mr-1" /> {isOrderContext ? 'Updated!' : 'Added'}
                        </>
                      ) : isOrderContext ? (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Update Design
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Spacer to prevent content from being hidden behind fixed bar */}
        <div className="h-20" />
      </div>
    </TooltipProvider>
  );
}
