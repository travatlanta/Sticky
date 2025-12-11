import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, ShoppingCart, Upload, Type, 
  Undo, Redo, ZoomIn, ZoomOut, Trash2, Square,
  Circle, Info, HelpCircle, Palette, Layers,
  MousePointer, Move, ChevronRight, ChevronLeft
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
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showHelp, setShowHelp] = useState(true);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: design, isLoading } = useQuery({
    queryKey: ["/api/designs", designId],
    enabled: !!designId,
  });

  const { data: product } = useQuery({
    queryKey: ["/api/products", (design as any)?.productId],
    enabled: !!(design as any)?.productId,
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

    const templateWidth = (product as any)?.templateWidth || 400;
    const templateHeight = (product as any)?.templateHeight || 400;
    
    const containerWidth = canvasContainerRef.current?.clientWidth || 800;
    const containerHeight = canvasContainerRef.current?.clientHeight || 600;
    
    const scaleX = (containerWidth - 80) / templateWidth;
    const scaleY = (containerHeight - 80) / templateHeight;
    const initialScale = Math.min(scaleX, scaleY, 2);
    
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

    const bleedSize = 15 * initialScale;
    const bleedRect = new window.fabric.Rect({
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
      name: "bleedGuide",
    });

    const safeRect = new window.fabric.Rect({
      left: bleedSize,
      top: bleedSize,
      width: displayWidth - bleedSize * 2,
      height: displayHeight - bleedSize * 2,
      fill: "transparent",
      stroke: "#22c55e",
      strokeWidth: 1,
      strokeDashArray: [8, 4],
      selectable: false,
      evented: false,
      name: "safeGuide",
    });

    canvas.add(bleedRect, safeRect);
    bleedRect.sendToBack();
    safeRect.sendToBack();

    if ((design as any)?.canvasJson) {
      canvas.loadFromJSON((design as any).canvasJson, () => {
        canvas.renderAll();
      });
    }

    canvas.on("object:modified", () => {
      saveState();
      scheduleAutoSave();
    });

    canvas.on("object:added", () => {
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
    const text = new window.fabric.IText("Click to edit text", {
      left: fabricCanvasRef.current.width / 2 - 80,
      top: fabricCanvasRef.current.height / 2 - 15,
      fontSize: 28,
      fill: "#000000",
      fontFamily: "Arial",
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    toast({ title: "Text added", description: "Double-click to edit the text." });
  };

  const handleAddRect = () => {
    if (!fabricCanvasRef.current) return;
    const rect = new window.fabric.Rect({
      left: fabricCanvasRef.current.width / 2 - 50,
      top: fabricCanvasRef.current.height / 2 - 50,
      width: 100,
      height: 100,
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
      left: fabricCanvasRef.current.width / 2 - 40,
      top: fabricCanvasRef.current.height / 2 - 40,
      radius: 40,
      fill: "#3b82f6",
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
    fabricCanvasRef.current.renderAll();
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
            description: "Your PDF has been uploaded and will be used for print production.",
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

        toast({
          title: "Image added",
          description: "Your artwork has been added to the canvas.",
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
    if (activeObject && activeObject.name !== "bleedGuide" && activeObject.name !== "safeGuide") {
      fabricCanvasRef.current.remove(activeObject);
      fabricCanvasRef.current.renderAll();
      setActiveObject(null);
      toast({ title: "Deleted", description: "Selected element removed." });
    }
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setZoom(newZoom);
      const templateWidth = (product as any)?.templateWidth || 400;
      const templateHeight = (product as any)?.templateHeight || 400;
      fabricCanvasRef.current.setWidth(templateWidth * newZoom);
      fabricCanvasRef.current.setHeight(templateHeight * newZoom);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleSave = async () => {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    await saveMutation.mutateAsync(json);
    toast({
      title: "Design saved",
      description: "Your design has been saved successfully.",
    });
  };

  const handleAddToCart = async () => {
    await handleSave();
    
    try {
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

      toast({
        title: "Added to cart",
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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-lg text-gray-900 truncate max-w-xs">
            {(design as any)?.name || "Untitled Design"}
          </h1>
          <span className="text-sm text-gray-500">
            {(product as any)?.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo"
              data-testid="button-undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
              data-testid="button-redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(-0.25)}
              title="Zoom Out"
              data-testid="button-zoom-out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleZoom(0.25)}
              title="Zoom In"
              data-testid="button-zoom-in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(!showHelp)}
            className={showHelp ? "bg-primary-100" : ""}
            title="Toggle Help"
            data-testid="button-toggle-help"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <div className="h-6 border-l mx-2" />

          <Button variant="outline" onClick={handleSave} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button onClick={handleAddToCart} data-testid="button-add-to-cart">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 bg-white border-r flex flex-col items-center py-4 gap-2">
          <p className="text-xs font-medium text-gray-500 mb-2">Tools</p>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUpload}
            className="w-14 h-14 flex flex-col gap-1"
            title="Upload Image"
            data-testid="button-upload"
          >
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">Upload</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddText}
            className="w-14 h-14 flex flex-col gap-1"
            title="Add Text"
            data-testid="button-add-text"
          >
            <Type className="h-5 w-5" />
            <span className="text-[10px]">Text</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddRect}
            className="w-14 h-14 flex flex-col gap-1"
            title="Add Rectangle"
            data-testid="button-add-rect"
          >
            <Square className="h-5 w-5" />
            <span className="text-[10px]">Rectangle</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddCircle}
            className="w-14 h-14 flex flex-col gap-1"
            title="Add Circle"
            data-testid="button-add-circle"
          >
            <Circle className="h-5 w-5" />
            <span className="text-[10px]">Circle</span>
          </Button>

          <div className="border-t w-full my-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={!activeObject}
            className="w-14 h-14 flex flex-col gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Delete Selected"
            data-testid="button-delete"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px]">Delete</span>
          </Button>
        </aside>

        <main 
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center p-6 overflow-auto"
        >
          <div className="relative">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <canvas ref={canvasRef} className="block" data-testid="design-canvas" />
            </div>
            
            <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-red-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #ef4444 0, #ef4444 8px, transparent 8px, transparent 12px)" }} />
                <span className="text-gray-600">Bleed Area (Red) - Content may be trimmed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-green-500" style={{ backgroundImage: "repeating-linear-gradient(90deg, #22c55e 0, #22c55e 8px, transparent 8px, transparent 12px)" }} />
                <span className="text-gray-600">Safe Zone (Green) - Keep important content here</span>
              </div>
            </div>
          </div>
        </main>

        {showRightPanel && (
          <aside className="w-72 bg-white border-l overflow-y-auto">
            {showHelp && (
              <Card className="m-4 p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <h3 className="font-heading font-bold text-blue-900">Quick Start Guide</h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Upload your artwork or add text and shapes using the tools on the left.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Keep important content inside the green Safe Zone.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Extend backgrounds to the red Bleed Area to avoid white edges.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>Click Save frequently, then Add to Cart when done.</span>
                  </li>
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-blue-600 hover:text-blue-700 w-full"
                  onClick={() => setShowHelp(false)}
                >
                  Got it, hide this
                </Button>
              </Card>
            )}

            <div className="p-4">
              <h3 className="font-heading font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Design Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">High Resolution</p>
                  <p>Use images at least 300 DPI for best print quality.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">File Formats</p>
                  <p>We accept PNG, JPG, SVG, and PDF files up to 50MB.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-1">Colors</p>
                  <p>Printed colors may vary slightly from screen display.</p>
                </div>
              </div>
            </div>

            {activeObject && (
              <div className="p-4 border-t">
                <h3 className="font-heading font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Selected Element
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium capitalize">{activeObject.type || "Object"}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Drag to move, use corners to resize, or press Delete to remove.
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              <h3 className="font-heading font-bold text-gray-900 mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delete</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Del / Backspace</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Move</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Arrow Keys</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deselect</span>
                  <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Escape</kbd>
                </div>
              </div>
            </div>
          </aside>
        )}

        <button
          onClick={() => setShowRightPanel(!showRightPanel)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-r-0 rounded-l-lg p-1 shadow-sm hover:bg-gray-50"
          style={{ right: showRightPanel ? "288px" : "0" }}
          data-testid="button-toggle-panel"
        >
          {showRightPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
