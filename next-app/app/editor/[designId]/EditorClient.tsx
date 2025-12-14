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
  Paintbrush, Palette, PenTool, Eraser, Wand2, Sun,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  HelpCircle, CheckCircle, Image, FileType, Droplets, MousePointer,
  Move, RotateCcw, ChevronLeft, ChevronRight,
  Plus, Minus, MoreHorizontal
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
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Inline text edit menu state: when a text object is selected the editor
  // shows a small floating menu near the object with quick actions
  // (bold, font size, color, more options).  The position is updated
  // whenever the selection changes or the object moves.
  const [showInlineTextMenu, setShowInlineTextMenu] = useState(false);
  const [inlineMenuPosition, setInlineMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Cart preview state: holds the current cart data and whether the preview
  // overlay is visible.  When an item is added to the cart, the preview
  // becomes visible and displays cart items along with a checkout button.
  const [cartPreview, setCartPreview] = useState<any | null>(null);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Keep track of measurement ruler objects so they can be removed and re-added on zoom
  const measurementObjectsRef = useRef<any[]>([]);

  /**
   * Update the inline text edit menu position based on the currently
   * selected object.  If the object is a text instance, compute its
   * bounding box relative to the page and position the menu slightly
   * above the object.  Otherwise hide the inline menu.  This helper
   * is used in canvas event handlers when the selection changes or
   * objects are modified.
   */
  const updateInlineMenu = useCallback((obj: any) => {
    if (!canvasRef.current) return;
    if (obj && obj.type === 'i-text') {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const bounding = obj.getBoundingRect();
      // Position the menu centered horizontally over the text and slightly
      // above it.  Adjust the x offset to centre the menu (approx width 120).
      const x = canvasRect.left + bounding.left + bounding.width / 2 - 60;
      const y = canvasRect.top + bounding.top - 45;
      setInlineMenuPosition({ x, y });
      setShowInlineTextMenu(true);
    } else {
      setShowInlineTextMenu(false);
    }
  }, []);

  /**
   * Draw ruler tick marks and labels along the top and left edges of the canvas.
   * The measurements are based on the product's template width and height (in inches)
   * and scale according to the current zoom level.  Each inch is marked with a
   * small line and label (e.g. 1", 2").  All measurement objects are stored in
   * measurementObjectsRef so they can be removed before re‑rendering.
   */
  const addMeasurements = useCallback((canvas: any, prod: any, scale: number) => {
    // Determine the pixel‑per‑inch ratio.  Sticker template dimensions are
    // stored in pixel units where 100 px corresponds to one inch (see
    // seed data: templateWidth 100 => 1" product).  Using a hard coded
    // DPI of 300 caused the guides to drift away from the canvas edges when
    // zooming.  Instead compute pxPerInch from the product dimensions or
    // fall back to 100 if undefined.
    const pxPerInch = prod?.templateWidth && prod?.templateHeight
      ? (prod.templateWidth / (prod.templateWidth / 100))
      : 100;
    // Remove any existing measurement objects from the canvas
    if (measurementObjectsRef.current && measurementObjectsRef.current.length > 0) {
      measurementObjectsRef.current.forEach((obj) => canvas.remove(obj));
      measurementObjectsRef.current = [];
    }
    if (!prod) return;
    const widthInches = prod?.templateWidth ? prod.templateWidth / pxPerInch : 0;
    const heightInches = prod?.templateHeight ? prod.templateHeight / pxPerInch : 0;
    // Draw vertical tick marks (top edge).  Use Math.floor to avoid drawing
    // extra ticks for fractional inches.  Each tick position is at i * pxPerInch * scale.
    for (let i = 0; i <= Math.floor(widthInches); i++) {
      const x = i * pxPerInch * scale;
      // small vertical tick line
      const tick = new window.fabric.Line([x, 0, x, 10], {
        stroke: '#6b7280',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      measurementObjectsRef.current.push(tick);
      canvas.add(tick);
      // label for each inch except 0
      if (i > 0) {
        const label = new window.fabric.Text(`${i}\"`, {
          left: x - 10,
          top: 12,
          fontSize: 10,
          fill: '#6b7280',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        measurementObjectsRef.current.push(label);
        canvas.add(label);
      }
    }
    // Draw horizontal tick marks (left edge)
    for (let j = 0; j <= Math.floor(heightInches); j++) {
      const y = j * pxPerInch * scale;
      const tick = new window.fabric.Line([0, y, 10, y], {
        stroke: '#6b7280',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      measurementObjectsRef.current.push(tick);
      canvas.add(tick);
      if (j > 0) {
        const label = new window.fabric.Text(`${j}\"`, {
          left: 12,
          top: y - 6,
          fontSize: 10,
          fill: '#6b7280',
          selectable: false,
          evented: false,
          excludeFromExport: true,
        });
        measurementObjectsRef.current.push(label);
        canvas.add(label);
      }
    }
    canvas.renderAll();
  }, []);

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

  // Fetch all designs for the current user to allow switching between designs.  This
  // query calls the /api/designs endpoint, which returns all designs for the
  // authenticated user.  The list is used to populate a dropdown menu so
  // users can switch to a different design without navigating back to the
  // dashboard.  If the endpoint is protected by authentication, ensure the
  // user is logged in to retrieve the list.
  const { data: designList } = useQuery<any[]>({
    queryKey: ["/api/designs"],
    queryFn: async () => {
      const res = await fetch(`/api/designs`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
    // Always enabled; if not authenticated the endpoint may return an error
  });

  // Handle switching to a new design.  When a user selects a design from
  // the dropdown, prompt them to save their current work.  If they confirm,
  // call handleSave(); otherwise, discard changes.  Then navigate to the new
  // design by pushing a new route.  This relies on Next.js router to
  // re-render the editor with the new designId.
  const handleSelectDesign = useCallback(async (newId: number) => {
    const confirmSave = window.confirm(
      'You are switching designs. Would you like to save your current design first? Click OK to save, Cancel to discard.'
    );
    if (confirmSave) {
      await handleSave();
    }
    router.push(`/editor/${newId}`);
  }, [router]);

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
    // Derive the pixel‑per‑inch ratio from the template dimensions.  In our
    // product data 100 px corresponds to one inch (e.g. templateWidth 100 => 1"
    // product).  Using a hardcoded DPI of 300 caused bleed/safe lines to be
    // misaligned when zooming.  Compute pxPerInch dynamically from the
    // template width; if undefined fallback to 100.
    const pxPerInch = templateWidth && templateHeight
      ? (templateWidth / (templateWidth / 100))
      : 100;
    
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
    
    // Trim line position: flush with the canvas perimeter.  We no longer
    // offset the cut line by the bleed amount since the canvas itself
    // represents the trimmed artwork area.
    const trimLinePixels = 0;
    // Safe zone position: inside cut line by the safe margin amount only (no bleed)
    const safeZonePixels = safeMarginInches * pxPerInch * initialScale;
    
    // Red TRIM LINE - shows where paper will be cut
    const trimRect = new window.fabric.Rect({
      left: 0,
      top: 0,
      width: displayWidth,
      height: displayHeight,
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

    // Add trim and safe guides on top
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
      // Update the inline text menu position if a text object is active
      if (fabricCanvasRef.current) {
        const active = fabricCanvasRef.current.getActiveObject();
        updateInlineMenu(active);
      }
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
      const obj = e.selected?.[0] || null;
      setActiveObject(obj);
      updateInlineMenu(obj);
    });

    canvas.on("selection:updated", (e: any) => {
      const obj = e.selected?.[0] || null;
      setActiveObject(obj);
      updateInlineMenu(obj);
    });

    canvas.on("selection:cleared", () => {
      setActiveObject(null);
      setShowInlineTextMenu(false);
    });

    // Add measurement rulers based on product dimensions
    addMeasurements(canvas, (product as any), initialScale);

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
    // Initialize the canvas as soon as a design is available.  In the original
    // implementation we waited for both the design and its associated product
    // to load before calling `loadFabric()`.  However, in practice the
    // `product` query may lag behind the design query (or be absent for new
    // designs), which prevented the canvas from ever being initialized and
    // resulted in a blank editor.  To ensure the editor always displays a
    // working canvas, call `loadFabric()` as soon as the design data is
    // available.  The `initCanvas()` function will fall back to reasonable
    // default dimensions if `product` is undefined and will still load any
    // saved `canvasJson` from the design.  We also guard against multiple
    // initializations by checking `fabricCanvasRef.current`.
    if (design && !fabricCanvasRef.current) {
      loadFabric();
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (fabricCanvasRef.current) {
        // Dispose of the Fabric canvas when the component unmounts or the design changes.
        // Without resetting the ref to null, future event handlers (e.g. undo/redo
        // callbacks) may still attempt to call methods on a disposed canvas,
        // leading to errors such as "Cannot read properties of null (reading 'clearRect')".
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [design, loadFabric]);

  useEffect(() => {
    if (product && (product as any).supportsCustomShape && !(design as any)?.customShapeUrl && !customShapeUploaded) {
      setShowCustomShapeModal(true);
    }
  }, [product, design, customShapeUploaded]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pinch-to-zoom gesture handling
  // Note: Using touch-action: none CSS on container instead of preventDefault() 
  // since React touch handlers are passive by default
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      lastTouchDistanceRef.current = distance;
      lastTouchCenterRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scale = distance / lastTouchDistanceRef.current;
      
      if (Math.abs(scale - 1) > 0.01) {
        // Calculate clamped delta to stay within zoom bounds [0.2, 3]
        const rawDelta = (scale - 1) * 0.5;
        const clampedNewZoom = Math.max(0.2, Math.min(3, zoom + rawDelta));
        const clampedDelta = clampedNewZoom - zoom;
        
        if (Math.abs(clampedDelta) > 0.001) {
          handleZoom(clampedDelta);
        }
        lastTouchDistanceRef.current = distance;
      }
    }
  }, [zoom]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistanceRef.current = null;
    lastTouchCenterRef.current = null;
  }, []);

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

  // Define a uniform type for assets. Without a common type annotation the
  // TypeScript compiler infers a union of distinct object types for each
  // category based on the presence or absence of fields like `stroke` and
  // `strokeWidth`. That union does not guarantee that the `stroke` property
  // exists on every element, which then causes errors when we attempt to
  // access `asset.stroke` later (see the map over `designAssets[assetsCategory]`).
  // To ensure all assets share the same shape and that optional fields are
  // always defined on the type, we explicitly define an interface and use
  // it to type our collections. Now each `asset` has a `stroke` and
  // `strokeWidth` property defined as optional, avoiding the type error on
  // property access.
  interface DesignAsset {
    name: string;
    path: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  const designAssets: {
    shapes: DesignAsset[];
    badges: DesignAsset[];
    icons: DesignAsset[];
    decorative: DesignAsset[];
  } = {
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

  // Google Fonts list - popular fonts for design
  const fontList = [
    { name: "Arial", family: "Arial, sans-serif" },
    { name: "Helvetica", family: "Helvetica, Arial, sans-serif" },
    { name: "Times New Roman", family: "Times New Roman, serif" },
    { name: "Georgia", family: "Georgia, serif" },
    { name: "Courier New", family: "Courier New, monospace" },
    { name: "Verdana", family: "Verdana, sans-serif" },
    { name: "Impact", family: "Impact, sans-serif" },
    { name: "Comic Sans MS", family: "Comic Sans MS, cursive" },
    { name: "Trebuchet MS", family: "Trebuchet MS, sans-serif" },
    { name: "Palatino", family: "Palatino Linotype, serif" },
    { name: "Lucida Console", family: "Lucida Console, monospace" },
    { name: "Tahoma", family: "Tahoma, sans-serif" },
    { name: "Century Gothic", family: "Century Gothic, sans-serif" },
    { name: "Garamond", family: "Garamond, serif" },
    { name: "Brush Script MT", family: "Brush Script MT, cursive" },
  ];

  const handleApplyFont = (fontFamily: string) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ fontFamily });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
      setSelectedFont(fontFamily.split(',')[0]);
    } else {
      toast({ title: "Select text first", description: "Click on a text object to change its font" });
    }
  };

  const handleApplyTextColor = (color: string) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ fill: color });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
      setTextColor(color);
    }
  };

  const handleApplyFontSize = (size: number) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ fontSize: size });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
      setFontSize(size);
    }
  };

  const handleToggleBold = () => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      const currentWeight = activeObj.fontWeight || 'normal';
      activeObj.set({ fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleToggleItalic = () => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      const currentStyle = activeObj.fontStyle || 'normal';
      activeObj.set({ fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleToggleUnderline = () => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ underline: !activeObj.underline });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleApplyTextAlign = (align: string) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ textAlign: align });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleApplyLetterSpacing = (spacing: number) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ charSpacing: spacing * 10 }); // Fabric uses units of 1/1000 em
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
    }
  };

  const handleApplyLineHeight = (height: number) => {
    if (!fabricCanvasRef.current) return;
    const activeObj = fabricCanvasRef.current.getActiveObject();
    if (activeObj && activeObj.type === 'i-text' && activeObj.set) {
      activeObj.set({ lineHeight: height });
      fabricCanvasRef.current.renderAll();
      saveState();
      scheduleAutoSave();
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
    // Use a relative zoom approach: if the delta is less than one in magnitude
    // treat it as a percentage change (e.g. delta 0.25 increases zoom by 25%).
    let newZoom: number;
    if (Math.abs(delta) < 1) {
      newZoom = zoom * (1 + delta);
    } else {
      newZoom = zoom + delta;
    }
    newZoom = Math.max(0.2, Math.min(3, newZoom));
    setZoom(newZoom);
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      // Calculate new dimensions based on the product's template size.  We only
      // update the displayed canvas size via setDimensions with the `cssOnly`
      // option to avoid errors where Fabric's backstore dimensions are
      // undefined (see errors like `Cannot set properties of undefined (setting 'width')`).
      const templateWidth = (product as any)?.templateWidth || 300;
      const templateHeight = (product as any)?.templateHeight || 300;
      // Derive pxPerInch similar to initCanvas: 100 px corresponds to 1 inch.
      const pxPerInch = templateWidth && templateHeight
        ? (templateWidth / (templateWidth / 100))
        : 100;
      const newWidth = templateWidth * newZoom;
      const newHeight = templateHeight * newZoom;

      canvas.setZoom(newZoom);
      // Update only the CSS dimensions of the canvas.  This avoids
      // manipulating the internal canvas backstores that Fabric manages and
      // prevents errors when the underlying contexts are undefined.
      canvas.setDimensions({ width: newWidth, height: newHeight }, { cssOnly: true });

      // Recalculate guide positions based on pxPerInch instead of DPI.  The
      // product bleed and safe margins are specified in inches, so convert
      // them using pxPerInch and the current zoom level.
      const bleedInches = parseFloat((product as any)?.bleedSize) || 0.125;
      const safeMarginInches = parseFloat((product as any)?.safeZoneSize) || 0.125;
      const trimLinePixels = 0; // Cut line is flush with canvas perimeter
      const safeZonePixels = safeMarginInches * pxPerInch * newZoom;

      const objects = canvas.getObjects();
      const trimGuide = objects.find((o: any) => o.name === "bleedGuide");
      const safeGuide = objects.find((o: any) => o.name === "safeGuide");

      if (trimGuide) {
        // Trim guide now sits flush with the canvas perimeter on zoom
        trimGuide.set({
          left: 0,
          top: 0,
          width: newWidth,
          height: newHeight,
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

      // No outer bleed line; nothing to update

      canvas.renderAll();

      // Redraw measurement rulers for the new zoom level
      addMeasurements(canvas, product, newZoom);
    }
  };

  // Define handleSave as a function declaration instead of a constant arrow
  // function.  Function declarations are hoisted, allowing the
  // `handleSelectDesign` callback to reference `handleSave` before its
  // definition without causing a "used before declaration" error during
  // compilation.  The implementation remains the same, saving the current
  // canvas JSON via the `saveMutation` hook and showing a toast.
  async function handleSave() {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    await saveMutation.mutateAsync(json);
    toast({ title: "Saved!" });
  }

  /**
   * Add the current design to the cart without leaving the editor.  This
   * function performs the following steps:
   *  1. Saves the current canvas state (autosave is triggered via handleSave).
   *  2. Exports a high‑resolution PNG of the canvas at 300 DPI and uploads
   *     it to the server so the printed artwork is crisp.  Guides (trim/safe
   *     lines and custom shape outlines) are temporarily removed during the
   *     export to avoid including them in the final artwork.  After export
   *     the guides are re‑added to the canvas and re‑rendered.
   *  3. Sends a POST request to `/api/cart/add` to add the design to the
   *     shopping cart.  The quantity, selected options and unit price are
   *     passed through from the current design and product.
   *  4. Fetches the updated cart via `/api/cart` and displays a cart preview
   *     overlay with the cart items and a checkout button.  The user
   *     remains on the editor page to continue designing other products.
   */
  const handleAddToCart = async () => {
    await handleSave();
    try {
      let highResExportUrl: string | null = null;
      // Step 1 & 2: export high‑resolution image and upload
      if (fabricCanvasRef.current && window.fabric) {
        const canvas = fabricCanvasRef.current;
        // Temporarily remove guides and custom shape
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        const customShape = objects.find((o: any) => o.name === "customShapeOutline");
        // Temporarily remove guides and outlines to avoid including them in the exported artwork
        if (bleedGuide) canvas.remove(bleedGuide);
        if (safeGuide) canvas.remove(safeGuide);
        if (customShape) canvas.remove(customShape);
        // Export at 300 DPI (Fabric default is 72 DPI).  Adjust multiplier
        // relative to the initial scale used to display the canvas.  This
        // ensures consistent output regardless of zoom level during editing.
        const baseDpiMultiplier = 300 / 72;
        const multiplier = baseDpiMultiplier / (initialScaleRef.current || 1);
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier, quality: 1 });
        // Restore guides, bleed line, and custom shape for editing
        if (bleedGuide) canvas.add(bleedGuide);
        if (safeGuide) canvas.add(safeGuide);
        if (customShape) {
          canvas.add(customShape);
          canvas.sendToBack(customShape);
        }
        // Bring the cut and safe guides to the front
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
        canvas.renderAll();
        // Upload the PNG as artwork
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
          // Persist high‑res url on design record
          await fetch(`/api/designs/${designId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ highResExportUrl }),
            credentials: 'include',
          });
        }
      }
      // Step 3: Add item to cart
      const addRes = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: (design as any)?.productId,
          designId: parseInt(designId!),
          quantity: 100,
          selectedOptions: (design as any)?.selectedOptions,
          unitPrice: (product as any)?.basePrice,
        }),
        credentials: 'include',
      });
      if (!addRes.ok) throw new Error('Failed to add to cart');
      // Step 4: fetch updated cart and show preview
      const cartRes = await fetch('/api/cart', {
        credentials: 'include',
      });
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartPreview(cartData);
        setShowCartPreview(true);
      }
      toast({ title: 'Added to cart!', description: 'Item added. Continue designing or proceed to checkout.' });
    } catch (error) {
      console.error('Add to cart error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add to cart.',
        variant: 'destructive',
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
      <div className="bg-white border-b px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 sticky top-0 z-20">
        <div className="flex items-center gap-2 min-w-0 flex-1 mb-2 md:mb-0">
          <h1 className="font-heading font-bold text-sm md:text-lg text-gray-900 truncate">
            {(design as any)?.name || "Untitled"}
          </h1>
          {/* Design selection dropdown */}
          {designList && designList.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs md:text-sm" data-testid="button-design-switch">
                  Change
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {designList.map((d: any) => (
                  <DropdownMenuItem key={d.id} onClick={() => handleSelectDesign(d.id)} className="text-sm" data-testid={`design-item-${d.id}`}>
                    {d.name || `Design ${d.id}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-2 md:mt-0">
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
        className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-auto touch-none pb-28 md:pb-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY < 0 ? 0.25 : -0.25); }}
      >
        <div className="relative">
          <div className="bg-white rounded-lg shadow-lg p-2 md:p-6">
            <canvas ref={canvasRef} className="block touch-none" data-testid="design-canvas" />
            {/* Inline text edit menu: shows when a text object is selected */}
            {showInlineTextMenu && inlineMenuPosition && (
              <div
                className="absolute z-30 bg-white border border-gray-200 rounded-lg shadow-md p-1 flex items-center gap-1"
                style={{ left: inlineMenuPosition.x, top: inlineMenuPosition.y }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleBold}
                  className="h-6 w-6"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleApplyFontSize(fontSize + 2)}
                  className="h-6 w-6"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleApplyFontSize(Math.max(fontSize - 2, 8))}
                  className="h-6 w-6"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleApplyTextColor(e.target.value)}
                  className="w-6 h-6 p-0 border-0 cursor-pointer"
                  title="Text color"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowTextMenu(true);
                    setShowInlineTextMenu(false);
                  }}
                  className="h-6 w-6"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            )}
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

      <div className="bg-white border-t px-2 py-2 md:hidden safe-area-bottom fixed bottom-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1 min-w-max pb-1">
              <Button
                variant="ghost"
                onClick={() => setShowUploadMenu(true)}
                className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation"
                data-testid="button-upload"
              >
                <Upload className="h-6 w-6" />
                <span className="text-[10px]">Upload</span>
              </Button>

              {templates && templates.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowTemplates(true)}
                  className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation"
                  data-testid="button-templates"
                >
                  <FileImage className="h-6 w-6" />
                  <span className="text-[10px]">Templates</span>
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => { handleAddText(); setShowTextMenu(true); }}
                className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation"
                data-testid="button-add-text"
              >
                <Type className="h-6 w-6" />
                <span className="text-[10px]">Text</span>
              </Button>


              <Button
                variant="ghost"
                onClick={() => setShowAssets(true)}
                className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation"
                data-testid="button-assets"
              >
                <Sparkles className="h-6 w-6" />
                <span className="text-[10px]">Assets</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowDrawing(true)}
                className={`flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation ${isDrawingMode ? 'text-orange-500 bg-orange-50' : ''}`}
                data-testid="button-draw"
              >
                <Paintbrush className="h-6 w-6" />
                <span className="text-[10px]">Draw</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowEffects(true)}
                className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation"
                data-testid="button-effects"
              >
                <Wand2 className="h-6 w-6" />
                <span className="text-[10px]">Effects</span>
              </Button>

              {activeObject && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="flex flex-col items-center gap-0.5 h-auto min-h-[52px] py-2 px-3 min-w-[52px] touch-manipulation text-red-500"
                  data-testid="button-delete"
                >
                  <Trash2 className="h-6 w-6" />
                  <span className="text-[10px]">Delete</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 pl-2 border-l">
            {/* Save and Cart actions (only) */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
              data-testid="button-save-mobile"
            >
              <Save className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleAddToCart}
              className="bg-orange-500 hover:bg-orange-600 min-h-[44px] px-4 touch-manipulation"
              data-testid="button-add-to-cart-mobile"
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Cart</span>
            </Button>
          </div>
        </div>
      </div>

      <aside className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 bg-white border rounded-r-xl shadow-lg flex-col items-center py-3 px-2 gap-1 z-10">
        <Button variant="ghost" size="icon" onClick={() => setShowUploadMenu(true)} title="Upload" data-testid="button-upload-desktop">
          <Upload className="h-5 w-5" />
        </Button>
        {templates && templates.length > 0 && (
          <Button variant="ghost" size="icon" onClick={() => setShowTemplates(true)} title="Templates" data-testid="button-templates-desktop">
            <FileImage className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => { handleAddText(); setShowTextMenu(true); }} title="Add Text" data-testid="button-text-desktop">
          <Type className="h-5 w-5" />
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

      {/* Cart preview overlay: shown after successfully adding an item to the cart.  */}
      {showCartPreview && cartPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowCartPreview(false)}>
          <div
            className="bg-white w-full md:max-w-md md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg text-gray-900">Cart Preview</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowCartPreview(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {cartPreview?.items?.length ? (
              <>
                <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2">
                  {cartPreview.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg shadow-sm bg-gray-50">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.design?.previewUrl ? (
                          <img src={item.design.previewUrl} alt="Design preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ShoppingCart className="h-6 w-6 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.product?.name || 'Product'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-orange-600">
                        {item.unitPrice
                          ? `$${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}`
                          : item.product?.basePrice
                          ? `$${(parseFloat(item.product.basePrice) * item.quantity).toFixed(2)}`
                          : '$0.00'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {cartPreview.items.reduce(
                      (sum: number, item: any) =>
                        sum + parseFloat(item.unitPrice || item.product?.basePrice || 0) * item.quantity,
                      0
                    ).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCartPreview(false)}
                  >
                    Continue Designing
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      setShowCartPreview(false);
                      router.push('/cart');
                    }}
                  >
                    Checkout
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-600 text-sm mb-4">Your cart is empty.</p>
                <Button onClick={() => setShowCartPreview(false)}>Continue Designing</Button>
              </div>
            )}
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

      {showTextMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-start justify-center md:justify-end"
          onClick={() => setShowTextMenu(false)}
          data-testid="overlay-text-menu"
        >
          <div 
            className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-text-menu"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Type className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Text Formatting</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowTextMenu(false)} data-testid="button-close-text-menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Font Family</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {fontList.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => handleApplyFont(font.family)}
                      className={`text-left px-3 py-2 rounded-md border-2 transition-colors ${
                        selectedFont === font.name 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      style={{ fontFamily: font.family }}
                      data-testid={`button-font-${font.name.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      <span className="text-sm">{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Font Size</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="8"
                    max="120"
                    value={fontSize}
                    onChange={(e) => handleApplyFontSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    data-testid="input-font-size"
                  />
                  <span className="text-sm font-medium w-12 text-center">{fontSize}px</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => handleApplyTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                    data-testid="input-text-color"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ee7518'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleApplyTextColor(color)}
                        className={`w-7 h-7 rounded-full border-2 ${textColor === color ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                        data-testid={`button-text-color-${color.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Text Style</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToggleBold}
                    className="flex-1"
                    data-testid="button-bold"
                  >
                    <Bold className="h-4 w-4 mr-1" />
                    Bold
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToggleItalic}
                    className="flex-1"
                    data-testid="button-italic"
                  >
                    <Italic className="h-4 w-4 mr-1" />
                    Italic
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleToggleUnderline}
                    className="flex-1"
                    data-testid="button-underline"
                  >
                    <Underline className="h-4 w-4 mr-1" />
                    Underline
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Text Alignment</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleApplyTextAlign('left')}
                    className="flex-1"
                    data-testid="button-align-left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleApplyTextAlign('center')}
                    className="flex-1"
                    data-testid="button-align-center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleApplyTextAlign('right')}
                    className="flex-1"
                    data-testid="button-align-right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Letter Spacing</label>
                <input
                  type="range"
                  min="-10"
                  max="100"
                  defaultValue="0"
                  onChange={(e) => handleApplyLetterSpacing(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  data-testid="input-letter-spacing"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tight</span>
                  <span>Wide</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Line Height</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  defaultValue="1.2"
                  onChange={(e) => handleApplyLineHeight(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  data-testid="input-line-height"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Compact</span>
                  <span>Spacious</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full mt-4" 
              onClick={() => setShowTextMenu(false)}
              data-testid="button-done-text-menu"
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {showUploadMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowUploadMenu(false)} data-testid="overlay-upload-menu">
          <div 
            className="bg-white w-full md:max-w-2xl md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-upload-menu"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Upload Your Artwork</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowUploadMenu(false)} data-testid="button-close-upload-menu">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-orange-400 transition-colors cursor-pointer"
              onClick={handleUpload}
              data-testid="dropzone-upload"
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="font-medium text-gray-900 mb-1">Click to upload your file</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG, GIF, WebP, SVG, and PDF up to 50MB</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Design Tips for Best Print Quality
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowUploadMenu(false); setShowTutorial(true); setTutorialStep(0); }}
                  className="text-orange-600"
                  data-testid="button-start-tutorial"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  Editor Tutorial
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Use High Resolution</p>
                    <p className="text-xs text-blue-700">300 DPI recommended for best print quality. Low-res images may appear blurry.</p>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 flex gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileType className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 text-sm">Best File Formats</p>
                    <p className="text-xs text-green-700">PNG for transparency, PDF for vectors. Avoid heavily compressed JPGs.</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Droplets className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900 text-sm">Use CMYK Colors</p>
                    <p className="text-xs text-purple-700">RGB colors may shift when printed. Some bright colors print darker.</p>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3 flex gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Square className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-orange-900 text-sm">Mind the Safe Zone</p>
                    <p className="text-xs text-orange-700">Keep important content inside the green line. Content near edges may be cut.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Quick Tips</h4>
              <ul className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Extend backgrounds to the red trim line for edge-to-edge printing
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Use solid colors for text - avoid thin strokes or small text under 8pt
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Save your design often - auto-save runs every 15 seconds
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={() => setShowTutorial(false)} data-testid="overlay-tutorial">
          <div 
            className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl p-4 md:p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-tutorial"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-orange-600" />
                </div>
                <h3 className="font-heading font-bold text-lg">Editor Tutorial</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowTutorial(false)} data-testid="button-close-tutorial">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {[
              {
                icon: <Upload className="h-6 w-6" />,
                title: "Upload Your Artwork",
                description: "Click the Upload button to add your images, logos, or artwork. We support JPG, PNG, GIF, WebP, SVG, and PDF files up to 50MB.",
                tip: "For best results, use high-resolution images (300 DPI or higher)."
              },
              {
                icon: <Type className="h-6 w-6" />,
                title: "Add & Edit Text",
                description: "Click the Text button to add text to your design. Double-tap any text to edit it. Use the text menu to change fonts, colors, size, and styling.",
                tip: "We offer 15 different fonts to choose from!"
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: "Design Assets Library",
                description: "Access our library of shapes, badges, icons, and decorative elements. Click Assets to browse categories and add elements to your canvas.",
                tip: "All assets are vector graphics that print crisp at any size."
              },
              {
                icon: <MousePointer className="h-6 w-6" />,
                title: "Select & Transform",
                description: "Click any object to select it. Drag to move, use corner handles to resize, and rotate using the top handle. Selected objects show a blue border.",
                tip: "Hold Shift while resizing to maintain proportions."
              },
              {
                icon: <Move className="h-6 w-6" />,
                title: "Zoom & Navigate",
                description: "Use the zoom controls in the header to zoom in/out. This helps you work on details and see the full design.",
                tip: "The percentage shows your current zoom level."
              },
              {
                icon: <RotateCcw className="h-6 w-6" />,
                title: "Undo & Redo",
                description: "Made a mistake? Use Undo to go back. Changed your mind? Use Redo to restore. These buttons are in the header.",
                tip: "Your design is auto-saved every 15 seconds."
              },
              {
                icon: <ShoppingCart className="h-6 w-6" />,
                title: "Save & Add to Cart",
                description: "When you're happy with your design, click Save to save your progress, then Add to Cart to proceed to checkout.",
                tip: "We'll generate a high-resolution version for printing."
              }
            ].map((step, index) => (
              <div key={index} className={`${tutorialStep === index ? 'block' : 'hidden'}`}>
                <div className="bg-orange-50 rounded-xl p-6 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                    {step.icon}
                  </div>
                  <h4 className="font-bold text-lg text-center mb-2">{step.title}</h4>
                  <p className="text-gray-600 text-center mb-3">{step.description}</p>
                  <div className="bg-white rounded-lg p-3 text-sm text-orange-700 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{step.tip}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {[0, 1, 2, 3, 4, 5, 6].map((dot) => (
                    <button
                      key={dot}
                      onClick={() => setTutorialStep(dot)}
                      className={`w-2 h-2 rounded-full transition-colors ${tutorialStep === dot ? 'bg-orange-500' : 'bg-gray-300'}`}
                      data-testid={`button-tutorial-dot-${dot}`}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                disabled={tutorialStep === 0}
                data-testid="button-tutorial-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              {tutorialStep < 6 ? (
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setTutorialStep(tutorialStep + 1)}
                  data-testid="button-tutorial-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowTutorial(false)}
                  data-testid="button-tutorial-finish"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Got It!
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
