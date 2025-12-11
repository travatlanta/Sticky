import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, ShoppingCart, Upload, Type, 
  Undo, Redo, ZoomIn, ZoomOut, Trash2, Square
} from "lucide-react";

declare global {
  interface Window {
    fabric: any;
  }
}

export default function Editor() {
  const { designId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: design, isLoading } = useQuery({
    queryKey: [`/api/designs/${designId}`],
    enabled: !!designId,
  });

  const { data: product } = useQuery({
    queryKey: [`/api/products/${design?.productId}`],
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
  }, []);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !window.fabric) return;

    const width = product?.templateWidth || 400;
    const height = product?.templateHeight || 400;

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: width,
      height: height,
      backgroundColor: "#ffffff",
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    // Draw bleed guides
    const bleedSize = 15;
    const bleedRect = new window.fabric.Rect({
      left: 0,
      top: 0,
      width: width,
      height: height,
      fill: "transparent",
      stroke: "#ff4444",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    // Draw safe zone
    const safeRect = new window.fabric.Rect({
      left: bleedSize,
      top: bleedSize,
      width: width - bleedSize * 2,
      height: height - bleedSize * 2,
      fill: "transparent",
      stroke: "#44ff44",
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    canvas.add(bleedRect, safeRect);
    bleedRect.sendToBack();
    safeRect.sendToBack();

    // Load existing design
    if (design?.canvasJson) {
      canvas.loadFromJSON(design.canvasJson, () => {
        canvas.renderAll();
      });
    }

    // Auto-save on changes
    canvas.on("object:modified", () => {
      saveState();
      scheduleAutoSave();
    });

    canvas.on("object:added", () => {
      saveState();
      scheduleAutoSave();
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
    }, 20000);
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
    const text = new window.fabric.IText("Your Text Here", {
      left: 100,
      top: 100,
      fontSize: 24,
      fill: "#000000",
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const handleAddShape = () => {
    if (!fabricCanvasRef.current) return;
    const rect = new window.fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: "#ee7518",
    });
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive",
        });
        return;
      }

      try {
        // Upload to server first
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

        // If it's a PDF, show success message but don't add to canvas
        if (file.type === 'application/pdf') {
          toast({
            title: "File uploaded",
            description: "Your PDF has been uploaded successfully.",
          });
          return;
        }

        // For images, add to canvas using the server URL
        window.fabric.Image.fromURL(uploadData.url, (img: any) => {
          img.scaleToWidth(200);
          fabricCanvasRef.current.add(img);
          fabricCanvasRef.current.setActiveObject(img);
          fabricCanvasRef.current.renderAll();
        }, { crossOrigin: 'anonymous' });

        toast({
          title: "Image added",
          description: "Your artwork has been uploaded and added to the design.",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleDelete = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.25, Math.min(4, zoom + delta));
    setZoom(newZoom);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(newZoom);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    await saveMutation.mutateAsync(json);
    toast({
      title: "Saved!",
      description: "Your design has been saved.",
    });
  };

  const handleAddToCart = async () => {
    await handleSave();
    
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: design?.productId,
          designId: parseInt(designId!),
          quantity: 100,
          selectedOptions: design?.selectedOptions,
          unitPrice: product?.basePrice,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add to cart");

      toast({
        title: "Added to cart!",
        description: "Your design has been added to your cart.",
      });
      navigate("/cart");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="font-medium text-gray-900">{design?.name || "Untitled Design"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-16 bg-white border-r flex flex-col items-center py-4 space-y-4">
          <button
            onClick={handleUpload}
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="Upload Image"
          >
            <Upload className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleAddText}
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="Add Text"
          >
            <Type className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleAddShape}
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
            title="Add Shape"
          >
            <Square className="h-5 w-5 text-gray-600" />
          </button>
          <div className="border-t pt-4 w-full flex flex-col items-center space-y-4">
            <button
              onClick={handleUndo}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={undoStack.length === 0}
              title="Undo"
            >
              <Undo className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleRedo}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              disabled={redoStack.length === 0}
              title="Redo"
            >
              <Redo className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="border-t pt-4 w-full flex flex-col items-center space-y-4">
            <button
              onClick={() => handleZoom(0.1)}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-3 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="border-t pt-4 w-full flex flex-col items-center">
            <button
              onClick={handleDelete}
              className="p-3 rounded-lg hover:bg-red-100 transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </button>
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="relative">
              <div className="absolute -top-6 left-0 text-xs text-gray-500">
                Bleed Area (Red) | Safe Zone (Green)
              </div>
              <canvas ref={canvasRef} className="border border-gray-200" />
              <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
                Zoom: {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
