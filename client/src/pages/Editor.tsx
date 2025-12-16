import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, ShoppingCart, Upload, Type, 
  Undo, Redo, ZoomIn, ZoomOut, Trash2, Square,
  Circle, Info, X, MoreVertical, Layers, FileImage
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
  const [showHelp, setShowHelp] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [showCustomShapeModal, setShowCustomShapeModal] = useState(false);
  const [customShapeUploaded, setCustomShapeUploaded] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: design, isLoading } = useQuery({
    queryKey: ["/api/designs", designId],
    enabled: !!designId,
  });

  const { data: product } = useQuery({
    queryKey: ["/api/products", (design as any)?.productId],
    enabled: !!(design as any)?.productId,
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<Array<{
    id: number;
    name: string;
    description: string | null;
    previewImage: string | null;
    canvasJson: any;
  }>>({
    queryKey: ["/api/products", (design as any)?.productId, "templates"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${(design as any)?.productId}/templates`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
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

    // Get product print dimensions
    const templateWidth = (product as any)?.templateWidth || 1200;
    const templateHeight = (product as any)?.templateHeight || 1200;
    const printDpi = (product as any)?.printDpi || 300;
    
    const containerWidth = canvasContainerRef.current?.clientWidth || 350;
    const containerHeight = canvasContainerRef.current?.clientHeight || 350;
    
    // Calculate scale to fit canvas in container
    const scaleX = (containerWidth - 48) / templateWidth;
    const scaleY = (containerHeight - 80) / templateHeight;
    const fitScale = Math.max(Math.min(scaleX, scaleY, 1), 0.05);
    
    // Calculate display dimensions
    const displayWidth = Math.round(templateWidth * fitScale);
    const displayHeight = Math.round(templateHeight * fitScale);

    // Create canvas at display dimensions
    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: displayWidth,
      height: displayHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    // Store scale for export calculations
    (canvas as any)._printScale = fitScale;
    (canvas as any)._printWidth = templateWidth;
    (canvas as any)._printHeight = templateHeight;
    (canvas as any)._printDpi = printDpi;
    
    // Start at 100% view zoom
    setZoom(1);
    fabricCanvasRef.current = canvas;

    // Calculate guide positions in display coordinates
    const safeZoneInches = parseFloat((product as any)?.safeZoneSize) || 0.125;
    const safeZonePixels = safeZoneInches * printDpi * fitScale;
    
    // Red TRIM LINE - at canvas edge where paper gets cut
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
      excludeFromExport: true,
    });

    // Green SAFE ZONE - keep important content inside
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

    // Add guides on top (they'll be brought to front after content loads)
    canvas.add(bleedRect, safeRect);

    if ((design as any)?.canvasJson) {
      canvas.loadFromJSON((design as any).canvasJson, () => {
        // Bring guides back to front after loading content
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
        canvas.renderAll();
      });
    } else {
      // For new designs, ensure guides are on top
      canvas.bringToFront(bleedRect);
      canvas.bringToFront(safeRect);
    }

    canvas.on("object:modified", () => {
      saveState();
      scheduleAutoSave();
    });

    canvas.on("object:added", (e: any) => {
      // Keep guides on top when new objects are added
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

  // Show custom shape modal for die-cut products
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

        // Save the custom shape URL to the design
        await fetch(`/api/designs/${designId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customShapeUrl: uploadData.url }),
          credentials: 'include',
        });

        // Add the shape as a clipping outline on the canvas
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

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    setZoom(newZoom);
    
    // Apply CSS transform to the canvas wrapper for visual zoom
    // This keeps Fabric canvas internals untouched - guides stay aligned
    const canvasWrapper = canvasContainerRef.current?.querySelector('.canvas-container') as HTMLElement;
    if (canvasWrapper) {
      canvasWrapper.style.transform = `scale(${newZoom})`;
      canvasWrapper.style.transformOrigin = 'center center';
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
      // Generate high-res export for admin viewing
      let highResExportUrl = null;
      if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        const templateWidth = (product as any)?.templateWidth || 400;
        const templateHeight = (product as any)?.templateHeight || 400;
        
        // Temporarily remove guides for export
        const objects = canvas.getObjects();
        const bleedGuide = objects.find((o: any) => o.name === "bleedGuide");
        const safeGuide = objects.find((o: any) => o.name === "safeGuide");
        const customShape = objects.find((o: any) => o.name === "customShapeOutline");
        
        if (bleedGuide) canvas.remove(bleedGuide);
        if (safeGuide) canvas.remove(safeGuide);
        if (customShape) canvas.remove(customShape);
        
        // Export at print resolution using stored print scale
        const printScale = (canvas as any)._printScale || 1;
        const multiplier = 1 / printScale; // Scale up to original print size
        const dataUrl = canvas.toDataURL({
          format: 'png',
          multiplier: multiplier,
          quality: 1,
        });
        
        // Restore guides
        if (bleedGuide) canvas.add(bleedGuide);
        if (safeGuide) canvas.add(safeGuide);
        if (customShape) { canvas.add(customShape); canvas.sendToBack(customShape); }
        if (bleedGuide) canvas.bringToFront(bleedGuide);
        if (safeGuide) canvas.bringToFront(safeGuide);
        canvas.renderAll();
        
        // Upload the high-res image
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
          
          // Save high-res URL to design
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
      navigate("/cart");
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
      // Parse the template canvas JSON
      const templateData = typeof template.canvasJson === 'string' 
        ? JSON.parse(template.canvasJson) 
        : template.canvasJson;

      // Store current canvas state for undo
      const json = JSON.stringify(canvas.toJSON());
      setUndoStack((prev) => [...prev.slice(-49), json]);
      setRedoStack([]);

      // Save guide properties before clearing (guides will be destroyed on clear)
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

      // Clear the entire canvas
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      
      // Recreate guide elements from saved properties
      guides.forEach((guide) => {
        const rect = new window.fabric.Rect({
          ...guide.props,
          name: guide.name,
        });
        canvas.add(rect);
      });

      // Load the template objects
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
      {/* Compact Mobile Header */}
      <div className="bg-white border-b px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="font-heading font-bold text-sm md:text-lg text-gray-900 truncate">
            {(design as any)?.name || "Untitled"}
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Undo/Redo - visible on all screens */}
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

          {/* Zoom controls - visible on all screens */}
          <div className="flex items-center gap-1 border-l pl-2 ml-1">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(-0.25)} data-testid="button-zoom-out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(0.25)} data-testid="button-zoom-in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Help button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            data-testid="button-help"
          >
            <Info className="h-4 w-4" />
          </Button>

          {/* More menu for mobile */}
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

      {/* Canvas Area - Takes most of the screen */}
      <main 
        ref={canvasContainerRef}
        className="flex-1 flex items-center justify-center p-3 md:p-6 overflow-auto"
      >
        <div className="relative">
          <div className="bg-white rounded-lg shadow-lg p-2 md:p-6">
            <canvas ref={canvasRef} className="block touch-none" data-testid="design-canvas" />
          </div>
          
          {/* Guide legend - visible on all screens */}
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

      {/* Mobile Bottom Toolbar */}
      <div className="bg-white border-t px-2 py-2 md:hidden">
        <div className="flex items-center justify-between gap-1">
          {/* Tool buttons */}
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

          {/* Action buttons */}
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

      {/* Desktop Sidebar */}
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

      {/* Desktop Action Buttons */}
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

      {/* Templates Modal */}
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

      {/* Help Modal */}
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

      {/* Custom Shape Upload Modal */}
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
    </div>
  );
}
