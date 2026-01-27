"use client";


import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Package,
  Upload,
  Image,
  Layout,
  FileImage,
  Edit2,
  CheckCircle,
  Layers,
  Truck,
  Flame,
  Scissors,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DealsTab from "@/components/admin/DealsTab";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlobalTier {
  id: number;
  tierNumber: number;
  minQuantity: number;
  maxQuantity: number | null;
  discountPercent: string;
  isActive: boolean;
}

interface ProductPricingRow {
  id: number;
  name: string;
  slug: string;
  categoryId: number | null;
  categoryName: string;
  basePrice: string;
  isActive: boolean;
  useGlobalTiers: boolean;
  tiers: Array<{ id: number; minQuantity: number; maxQuantity: number | null; pricePerUnit: string }>;
  materials: Array<{ id: number; name: string; priceModifier: string; tier2PriceModifier?: string | null; tier3PriceModifier?: string | null; tier4PriceModifier?: string | null }>;
  finishes: Array<{ id: number; name: string; priceModifier: string; tier2PriceModifier?: string | null; tier3PriceModifier?: string | null; tier4PriceModifier?: string | null }>;
}

function PricingToolsTab({ onAdjustmentApplied }: { onAdjustmentApplied: () => void }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ productId: number; field: string; tierId?: number; optionId?: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  
  const showSavedNotification = () => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 2000);
  };
  
  const { data: categories } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['/api/categories'],
  });

  const { data: globalTiersData, refetch: refetchGlobalTiers } = useQuery<{ tiers: GlobalTier[] }>({
    queryKey: ['/api/admin/pricing/global-tiers'],
  });

  const { data: productsData, refetch: refetchProducts } = useQuery<{ products: ProductPricingRow[] }>({
    queryKey: ['/api/admin/pricing/products'],
  });

  const { data: optionPrices, refetch: refetchOptions } = useQuery<{ 
    options: Record<string, { count: number; minPrice: string; maxPrice: string; mostCommonPrice: string }> 
  }>({
    queryKey: ['/api/admin/products/bulk-options'],
  });

  const [globalTierEdits, setGlobalTierEdits] = useState<Record<number, Partial<GlobalTier>>>({});
  const [savingGlobalTiers, setSavingGlobalTiers] = useState(false);
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
  const [savingOption, setSavingOption] = useState<string | null>(null);
  
  // Track which product row is currently being edited (for highlighting)
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Bulk tier pricing popup state (for Quick Actions)
  const [bulkTierPricingPopup, setBulkTierPricingPopup] = useState<{
    isOpen: boolean;
    optionType: 'material' | 'finish';
    optionName: string;
  } | null>(null);
  const [bulkTierPricingEdits, setBulkTierPricingEdits] = useState<{
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
  }>({ tier1: '', tier2: '', tier3: '', tier4: '' });
  const [savingBulkTierPricing, setSavingBulkTierPricing] = useState(false);
  
  // Tier pricing popup state (inline popover)
  const [tierPricingPopup, setTierPricingPopup] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
    optionType: 'material' | 'finish' | 'base';
    optionName: string;
    optionId: number;
    tier2Id?: number;
    tier3Id?: number;
    tier4Id?: number;
    tier1Price: string;
    tier2Price: string;
    tier3Price: string;
    tier4Price: string;
    popupX: number;
    popupY: number;
    arrowPosition: string;
    arrowX: number;
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [tierPricingEdits, setTierPricingEdits] = useState<{
    tier1: string;
    tier2: string;
    tier3: string;
    tier4: string;
  }>({ tier1: '', tier2: '', tier3: '', tier4: '' });
  const [savingTierPricing, setSavingTierPricing] = useState(false);

  const globalTiers = globalTiersData?.tiers || [];
  const products = productsData?.products || [];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const globalTierProducts = products.filter(p => p.useGlobalTiers);
  const customTierProducts = products.filter(p => !p.useGlobalTiers);

  const handleSaveGlobalTiers = async () => {
    const tiersToSave = globalTiers.map(tier => ({
      ...tier,
      ...globalTierEdits[tier.tierNumber],
    }));

    setSavingGlobalTiers(true);
    try {
      const res = await fetch('/api/admin/pricing/global-tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tiers: tiersToSave }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      showSavedNotification();
      setGlobalTierEdits({});
      refetchGlobalTiers();
      onAdjustmentApplied();
    } catch (e) {
      toast({ title: 'Failed to save global tiers', variant: 'destructive' });
    } finally {
      setSavingGlobalTiers(false);
    }
  };

  const handleCellEdit = (productId: number, field: string, currentValue: string, tierId?: number, optionId?: number) => {
    setEditingCell({ productId, field, tierId, optionId });
    setEditValue(currentValue);
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const cellKey = `${editingCell.productId}-${editingCell.field}-${editingCell.tierId || ''}-${editingCell.optionId || ''}`;
    setSavingCell(cellKey);

    try {
      const res = await fetch('/api/admin/pricing/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: editingCell.productId,
          field: editingCell.field,
          value: editValue,
          tierId: editingCell.tierId,
          optionId: editingCell.optionId,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      showSavedNotification();
      refetchProducts();
      onAdjustmentApplied();
    } catch (e) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

  const handleSaveOptionPrice = async (optionName: string) => {
    const newPrice = optionInputs[optionName];
    if (newPrice === undefined || newPrice === '') {
      toast({ title: "Please enter a price", variant: "destructive" });
      return;
    }

    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast({ title: "Invalid price value", variant: "destructive" });
      return;
    }

    if (!confirm(`Update all "${optionName}" options to $${priceValue.toFixed(2)} per sticker?`)) {
      return;
    }

    setSavingOption(optionName);
    try {
      const res = await fetch('/api/admin/products/bulk-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optionName, newPrice: priceValue, preview: false }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      showSavedNotification();
      setOptionInputs(prev => ({ ...prev, [optionName]: '' }));
      refetchOptions();
      refetchProducts();
      onAdjustmentApplied();
    } catch (e) {
      toast({ title: "Failed to update option prices", variant: "destructive" });
    } finally {
      setSavingOption(null);
    }
  };

  const handleToggleGlobalTiers = async (productId: number, useGlobal: boolean) => {
    try {
      const res = await fetch('/api/admin/pricing/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          field: 'useGlobalTiers',
          value: useGlobal,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      showSavedNotification();
      refetchProducts();
    } catch (e) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  // Open tier pricing popup for an add-on option
  const openTierPricingPopup = (
    e: React.MouseEvent,
    productId: number,
    productName: string,
    optionType: 'material' | 'finish' | 'base',
    optionName: string,
    optionId: number,
    tier1Price: string,
    tier2Price: string | null | undefined,
    tier3Price: string | null | undefined,
    tier4Price: string | null | undefined,
    tier2Id?: number,
    tier3Id?: number,
    tier4Id?: number
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    // For fixed positioning, use viewport coordinates directly
    // Position the popup below the clicked cell, centered horizontally
    const popupWidth = 280;
    let popupX = rect.left + (rect.width / 2) - (popupWidth / 2);
    let popupY = rect.bottom + 12; // 12px gap for arrow
    let arrowPosition = 'top'; // Arrow points up to the cell
    
    // Adjust if popup would go off right edge of screen
    if (popupX + popupWidth > window.innerWidth - 10) {
      popupX = window.innerWidth - popupWidth - 10;
    }
    // Adjust if popup would go off left edge
    if (popupX < 10) {
      popupX = 10;
    }
    
    // If not enough space below, show above the cell
    const popupHeight = 280; // Approximate height
    if (popupY + popupHeight > window.innerHeight - 10) {
      popupY = rect.top - popupHeight - 12;
      arrowPosition = 'bottom'; // Arrow points down to the cell
    }
    
    // Calculate arrow X position relative to popup (to point at cell center)
    const cellCenterX = rect.left + rect.width / 2;
    const arrowX = Math.max(20, Math.min(popupWidth - 20, cellCenterX - popupX));
    
    setEditingProductId(productId);
    setTierPricingPopup({
      isOpen: true,
      productId,
      productName,
      optionType,
      optionName,
      optionId,
      tier2Id,
      tier3Id,
      tier4Id,
      tier1Price: tier1Price || '0',
      tier2Price: tier2Price || '',
      tier3Price: tier3Price || '',
      tier4Price: tier4Price || '',
      popupX,
      popupY,
      arrowPosition,
      arrowX,
    });
    setTierPricingEdits({
      tier1: tier1Price || '0',
      tier2: tier2Price || '',
      tier3: tier3Price || '',
      tier4: tier4Price || '',
    });
  };
  
  // Close popup and clear editing state
  const closeTierPricingPopup = () => {
    setTierPricingPopup(null);
    setEditingProductId(null);
  };
  
  // Close popup on scroll
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      if (tierPricingPopup) {
        closeTierPricingPopup();
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [tierPricingPopup]);

  // Save tier pricing for an add-on option OR base tier pricing
  const saveTierPricing = async () => {
    if (!tierPricingPopup) return;
    
    setSavingTierPricing(true);
    try {
      const updates: { tier: number; promise: Promise<Response> }[] = [];
      const isBasePricing = tierPricingPopup.optionType === 'base';
      
      // Update tier 1
      if (tierPricingEdits.tier1 !== tierPricingPopup.tier1Price) {
        updates.push({
          tier: 1,
          promise: fetch('/api/admin/pricing/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(isBasePricing ? {
              productId: tierPricingPopup.productId,
              field: 'tierPrice',
              value: tierPricingEdits.tier1 || '0',
              tierId: tierPricingPopup.optionId,
            } : {
              productId: tierPricingPopup.productId,
              field: 'optionPrice',
              value: tierPricingEdits.tier1 || '0',
              optionId: tierPricingPopup.optionId,
            }),
          })
        });
      }
      
      // Update tier 2
      if (tierPricingEdits.tier2 !== tierPricingPopup.tier2Price) {
        // For base pricing, only update if we have the tier ID
        if (!isBasePricing || tierPricingPopup.tier2Id) {
          updates.push({
            tier: 2,
            promise: fetch('/api/admin/pricing/products', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(isBasePricing ? {
                productId: tierPricingPopup.productId,
                field: 'tierPrice',
                value: tierPricingEdits.tier2 || tierPricingEdits.tier1 || '0',
                tierId: tierPricingPopup.tier2Id,
              } : {
                productId: tierPricingPopup.productId,
                field: 'optionTierPrice',
                value: tierPricingEdits.tier2,
                optionId: tierPricingPopup.optionId,
                tierNumber: 2,
              }),
            })
          });
        }
      }
      
      // Update tier 3
      if (tierPricingEdits.tier3 !== tierPricingPopup.tier3Price) {
        // For base pricing, only update if we have the tier ID
        if (!isBasePricing || tierPricingPopup.tier3Id) {
          updates.push({
            tier: 3,
            promise: fetch('/api/admin/pricing/products', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(isBasePricing ? {
                productId: tierPricingPopup.productId,
                field: 'tierPrice',
                value: tierPricingEdits.tier3 || tierPricingEdits.tier2 || tierPricingEdits.tier1 || '0',
                tierId: tierPricingPopup.tier3Id,
              } : {
                productId: tierPricingPopup.productId,
                field: 'optionTierPrice',
                value: tierPricingEdits.tier3,
                optionId: tierPricingPopup.optionId,
                tierNumber: 3,
              }),
            })
          });
        }
      }
      
      // Update tier 4
      if (tierPricingEdits.tier4 !== tierPricingPopup.tier4Price) {
        // For base pricing, only update if we have the tier ID
        if (!isBasePricing || tierPricingPopup.tier4Id) {
          updates.push({
            tier: 4,
            promise: fetch('/api/admin/pricing/products', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(isBasePricing ? {
                productId: tierPricingPopup.productId,
                field: 'tierPrice',
                value: tierPricingEdits.tier4 || tierPricingEdits.tier3 || tierPricingEdits.tier2 || tierPricingEdits.tier1 || '0',
                tierId: tierPricingPopup.tier4Id,
              } : {
                productId: tierPricingPopup.productId,
                field: 'optionTierPrice',
                value: tierPricingEdits.tier4,
                optionId: tierPricingPopup.optionId,
                tierNumber: 4,
              }),
            })
          });
        }
      }
      
      // Wait for all updates and check each response
      const responses = await Promise.all(updates.map(u => u.promise));
      const failedTiers: number[] = [];
      responses.forEach((res, i) => {
        if (!res.ok) failedTiers.push(updates[i].tier);
      });
      
      if (failedTiers.length > 0) {
        throw new Error(`Failed to update tier(s): ${failedTiers.join(', ')}`);
      }
      
      showSavedNotification();
      refetchProducts();
      closeTierPricingPopup();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update tier pricing';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSavingTierPricing(false);
    }
  };

  // Open bulk tier pricing popup for an add-on option
  const openBulkTierPricingPopup = (optionType: 'material' | 'finish', optionName: string) => {
    setBulkTierPricingPopup({
      isOpen: true,
      optionType,
      optionName,
    });
    setBulkTierPricingEdits({ tier1: '', tier2: '', tier3: '', tier4: '' });
  };

  // Save bulk tier pricing for an add-on option across ALL products
  const saveBulkTierPricing = async () => {
    if (!bulkTierPricingPopup) return;
    
    // Validate numeric inputs before processing
    const validatePrice = (value: string, tierName: string): number | null => {
      if (!value.trim()) return null;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        throw new Error(`Invalid price for ${tierName}: "${value}"`);
      }
      return num;
    };
    
    setSavingBulkTierPricing(true);
    try {
      const optionName = bulkTierPricingPopup.optionName;
      
      // Validate all inputs first
      const tier1Val = validatePrice(bulkTierPricingEdits.tier1, 'Tier 1 (1-249)');
      const tier2Val = validatePrice(bulkTierPricingEdits.tier2, 'Tier 2 (250-999)');
      const tier3Val = validatePrice(bulkTierPricingEdits.tier3, 'Tier 3 (1000-1999)');
      const tier4Val = validatePrice(bulkTierPricingEdits.tier4, 'Tier 4 (2000+)');
      
      // Build the update payload
      const updateData: Record<string, string | null> = {};
      if (tier1Val !== null) {
        updateData.priceModifier = tier1Val.toFixed(2);
      }
      if (tier2Val !== null) {
        updateData.tier2PriceModifier = tier2Val.toFixed(4);
      }
      if (tier3Val !== null) {
        updateData.tier3PriceModifier = tier3Val.toFixed(4);
      }
      if (tier4Val !== null) {
        updateData.tier4PriceModifier = tier4Val.toFixed(4);
      }
      
      if (Object.keys(updateData).length === 0) {
        toast({ title: 'No values to update', variant: 'destructive' });
        setSavingBulkTierPricing(false);
        return;
      }
      
      const res = await fetch('/api/admin/products/bulk-options', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          optionName,
          ...updateData,
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update');
      }
      
      showSavedNotification();
      refetchProducts();
      refetchOptions();
      onAdjustmentApplied();
      setBulkTierPricingPopup(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update bulk tier pricing';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSavingBulkTierPricing(false);
    }
  };

  const materials = ['Vinyl', 'Foil', 'Holographic'];
  const finishes = ['Gloss', 'Varnish', 'Emboss'];

  const [showInstructions, setShowInstructions] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Instructions Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <h2 className="text-xl font-bold text-gray-900 cursor-help flex items-center gap-2">
                Pricing Dashboard
                <Info className="w-4 h-4 text-gray-400" />
              </h2>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm z-[100]">
              <p className="font-semibold mb-1">Pricing Dashboard</p>
              <p className="text-xs text-gray-600">This is where you manage all product prices. Click any price cell in the table to edit it. Use the collapsible panels below for global settings and bulk updates.</p>
            </TooltipContent>
          </Tooltip>
          <p className="text-gray-600 text-sm">Manage all product pricing from one place</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              data-testid="button-toggle-instructions"
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs z-[100]">
            <p className="text-xs">Click to show/hide the detailed instructions panel with step-by-step guidance</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Collapsible Instructions Panel */}
      {showInstructions && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            How to Use the Pricing Dashboard
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">Global Settings (Apply to ALL products using Global mode)</h4>
              <ul className="text-blue-700 space-y-1">
                <li>1. Open "Global Settings" panel below</li>
                <li>2. Set discount % for each tier (e.g., Tier 1 = 10% off)</li>
                <li>3. Click "Save Global Tiers" button to apply</li>
                <li>4. Products marked "Global" will use these discounts</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">Individual Product Pricing (Custom mode)</h4>
              <ul className="text-blue-700 space-y-1">
                <li>1. Click "Global" button next to a product to switch to "Custom"</li>
                <li>2. Click any price in the spreadsheet to edit it directly</li>
                <li>3. Press Enter or click away to save automatically</li>
                <li>4. Hover over material prices to see tier-specific pricing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">Quick Actions (Bulk updates)</h4>
              <ul className="text-blue-700 space-y-1">
                <li>Use "Quick Actions" to set material/finish prices for ALL products at once</li>
                <li>Enter a new price and click "Set" to update every product</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-800">Understanding the Spreadsheet</h4>
              <ul className="text-blue-700 space-y-1">
                <li><strong>T1-T4</strong>: Quantity tier pricing (1-249, 250-999, 1000-1999, 2000+)</li>
                <li><strong>Vinyl/Foil/Holo</strong>: Material add-on costs per sticker</li>
                <li><strong>Varnish/Emboss</strong>: Finish add-on costs per sticker</li>
                <li><strong>*</strong> = Has tier-specific material pricing (hover to view)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Global Settings */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              data-testid="button-toggle-global-settings"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                    Global Settings
                    <Info className="w-3 h-3 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-500">
                    Bulk discounts for products using Global mode • <span className="text-green-600 font-medium">{globalTierProducts.length} products</span>
                  </p>
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm z-[100]">
            <p className="font-semibold mb-1">Global Tier Settings</p>
            <p className="text-xs text-gray-600">Set quantity tiers and discount percentages that apply to ALL products using Global mode. Click to expand/collapse.</p>
          </TooltipContent>
        </Tooltip>
        
        {showGlobalSettings && (
          <div className="p-4 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {globalTiers.map((tier) => {
                const edits = globalTierEdits[tier.tierNumber] || {};
                const minQty = edits.minQuantity ?? tier.minQuantity;
                const maxQty = edits.maxQuantity ?? tier.maxQuantity;
                const discount = edits.discountPercent ?? tier.discountPercent;
                
                return (
                  <div key={tier.tierNumber} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 text-sm">Tier {tier.tierNumber}</span>
                      <span className="text-lg font-bold text-blue-600">{discount}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="number"
                          value={minQty}
                          onChange={(e) => setGlobalTierEdits(prev => ({
                            ...prev,
                            [tier.tierNumber]: { ...prev[tier.tierNumber], minQuantity: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-16 px-1 py-1 border rounded text-center"
                          data-testid={`input-tier-${tier.tierNumber}-min`}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          value={maxQty ?? ''}
                          placeholder="Max"
                          onChange={(e) => setGlobalTierEdits(prev => ({
                            ...prev,
                            [tier.tierNumber]: { ...prev[tier.tierNumber], maxQuantity: e.target.value ? parseInt(e.target.value) : null }
                          }))}
                          className="w-16 px-1 py-1 border rounded text-center"
                          data-testid={`input-tier-${tier.tierNumber}-max`}
                        />
                        <span className="text-gray-400 text-xs">qty</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500">Off:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={discount}
                          onChange={(e) => setGlobalTierEdits(prev => ({
                            ...prev,
                            [tier.tierNumber]: { ...prev[tier.tierNumber], discountPercent: e.target.value }
                          }))}
                          className="w-14 px-1 py-1 border rounded text-center"
                          data-testid={`input-tier-${tier.tierNumber}-discount`}
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Quick Actions */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              data-testid="button-toggle-quick-actions"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-1">
                    Quick Actions
                    <Info className="w-3 h-3 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-500">Bulk update material and finish prices for all products</p>
                </div>
              </div>
              <div className={`transform transition-transform ${showQuickActions ? 'rotate-180' : ''}`}>
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-sm z-[100]">
            <p className="font-semibold mb-1">Quick Bulk Actions</p>
            <p className="text-xs text-gray-600">Set material (Vinyl, Foil, Holo) and finish (Gloss, Varnish, Emboss) prices for ALL products at once. Click to expand/collapse.</p>
          </TooltipContent>
        </Tooltip>

        {showQuickActions && (
          <div className="p-4 border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  Materials (per sticker)
                </h4>
                <div className="space-y-2">
                  {materials.map((material) => {
                    const data = optionPrices?.options?.[material];
                    return (
                      <div key={material} className="flex items-center gap-2">
                        <span className="w-16 text-xs font-medium">{material}</span>
                        <span className="text-xs text-gray-400">${data?.mostCommonPrice || '0.00'}</span>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBulkTierPricingPopup('material', material)}
                          data-testid={`button-tiers-${material.toLowerCase()}`}
                          className="h-7 text-xs px-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Tiers
                        </Button>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="$0.00"
                          value={optionInputs[material] || ''}
                          onChange={(e) => setOptionInputs(prev => ({ ...prev, [material]: e.target.value }))}
                          className="w-14 px-1 py-1 border rounded text-xs"
                          data-testid={`input-option-${material.toLowerCase()}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveOptionPrice(material)}
                          disabled={savingOption === material || !optionInputs[material]}
                          data-testid={`button-save-${material.toLowerCase()}`}
                          className="h-7 text-xs px-2"
                        >
                          {savingOption === material ? <Loader2 className="h-3 w-3 animate-spin" /> : 'T1'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-green-500" />
                  Finishes (per sticker)
                </h4>
                <div className="space-y-2">
                  {finishes.map((finish) => {
                    const data = optionPrices?.options?.[finish];
                    return (
                      <div key={finish} className="flex items-center gap-2">
                        <span className="w-16 text-xs font-medium">{finish}</span>
                        <span className="text-xs text-gray-400">${data?.mostCommonPrice || '0.00'}</span>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openBulkTierPricingPopup('finish', finish)}
                          data-testid={`button-tiers-${finish.toLowerCase()}`}
                          className="h-7 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Tiers
                        </Button>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="$0.00"
                          value={optionInputs[finish] || ''}
                          onChange={(e) => setOptionInputs(prev => ({ ...prev, [finish]: e.target.value }))}
                          className="w-14 px-1 py-1 border rounded text-xs"
                          data-testid={`input-option-${finish.toLowerCase()}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveOptionPrice(finish)}
                          disabled={savingOption === finish || !optionInputs[finish]}
                          data-testid={`button-save-${finish.toLowerCase()}`}
                          className="h-7 text-xs px-2"
                        >
                          {savingOption === finish ? <Loader2 className="h-3 w-3 animate-spin" /> : 'T1'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Pricing Spreadsheet */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-2 sm:p-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-gray-900 cursor-help flex items-center gap-1 text-sm sm:text-base">
                    Product Pricing Spreadsheet
                    <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                  </h3>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm z-[100]">
                  <p className="font-semibold mb-1">Pricing Spreadsheet</p>
                  <p className="text-xs text-gray-600">View and edit all product prices. Click any value to edit. Rows are color-coded by sticker size. Purple = materials, Green = finishes.</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs sm:text-sm text-gray-500">({filteredProducts.length} products)</span>
              
              {/* Saved Indicator */}
              <div 
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                  showSavedIndicator 
                    ? 'opacity-100 translate-y-0 bg-green-100 text-green-700 border border-green-200' 
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <Check className="w-4 h-4" />
                Saved
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-3 py-1.5 border rounded-lg text-xs sm:text-sm w-40 sm:w-64"
                    data-testid="input-search-products"
                  />
                  <Package className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="z-[100]">
                <p className="text-xs">Type to filter products by name or category</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* Color Legend - hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Size:</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-blue-400"></span>1"</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-green-400"></span>2"</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-purple-400"></span>3"</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-orange-400"></span>4"</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-pink-400"></span>5"</span>
            <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>6"</span>
            <span className="text-gray-400 mx-1">|</span>
            <span className="flex items-center gap-0.5"><span className="px-0.5 py-0.5 bg-white border border-gray-200 rounded text-[9px]">$0</span> Base</span>
            <span className="flex items-center gap-0.5"><span className="px-0.5 py-0.5 bg-purple-50 border border-purple-200 rounded text-[9px]">+$</span> Mat</span>
            <span className="flex items-center gap-0.5"><span className="px-0.5 py-0.5 bg-green-50 border border-green-200 rounded text-[9px]">+$</span> Fin</span>
          </div>
        </div>

        <div ref={tableContainerRef} className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <colgroup>
              <col className="min-w-[130px]" />
              <col className="min-w-[65px]" />
              <col className="min-w-[62px]" />
              <col className="min-w-[62px]" />
              <col className="min-w-[62px]" />
              <col className="min-w-[62px]" />
              <col className="min-w-[62px]" />
              <col className="min-w-[62px]" />
            </colgroup>
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 sticky top-0 z-10">
              <tr className="border-b-2 border-gray-200">
                <th className="text-left px-2 py-2 font-semibold text-gray-800 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        Product
                        <Info className="w-3 h-3 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Product Name</p>
                      <p className="text-xs text-gray-600">Row colors indicate sticker size (1", 2", 3", etc.) based on the first dimension.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-blue-800 bg-blue-50 border-l-2 border-blue-300 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-1 cursor-help">
                        Price
                        <Info className="w-3 h-3 text-blue-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Tier Pricing</p>
                      <p className="text-xs text-gray-600">Click to edit all 4 quantity tiers (1-249, 250-999, 1000-1999, 2000+). Shows Tier 1 price.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-purple-700 bg-purple-100 border-l-2 border-purple-300 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-1 cursor-help">
                        Vinyl
                        <Info className="w-3 h-3 text-purple-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Vinyl Material Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for vinyl material. Standard durable material for most stickers.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-purple-700 bg-purple-100 border-l border-purple-200 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-0.5 cursor-help">
                        Foil
                        <Info className="w-3 h-3 text-purple-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Foil Material Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for metallic foil material. Premium shiny finish.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-purple-700 bg-purple-100 border-l border-purple-200 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-0.5 cursor-help">
                        Holo
                        <Info className="w-3 h-3 text-purple-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Holographic Material Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for holographic material. Rainbow reflective effect.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-green-700 bg-green-100 border-l-2 border-green-300 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-0.5 cursor-help">
                        Gloss
                        <Info className="w-3 h-3 text-green-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Gloss Finish Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for glossy finish. Shiny, smooth protective coating.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-green-700 bg-green-100 border-l border-green-200 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-0.5 cursor-help">
                        Varnish
                        <Info className="w-3 h-3 text-green-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Varnish Finish Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for spot varnish finish. Adds texture and visual pop.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
                <th className="text-center px-1 py-2 font-semibold text-green-700 bg-green-100 border-l border-green-200 text-xs sm:text-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-0.5 cursor-help">
                        Emboss
                        <Info className="w-3 h-3 text-green-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs z-[100]">
                      <p className="font-semibold mb-1">Emboss Finish Add-on</p>
                      <p className="text-xs text-gray-600">Extra cost per sticker for embossed finish. Raised texture for premium feel.</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const tier1 = product.tiers[0];
                const tier2 = product.tiers[1];
                const tier3 = product.tiers[2];
                const tier4 = product.tiers[3];
                const vinyl = product.materials.find(m => m.name === 'Vinyl');
                const foil = product.materials.find(m => m.name === 'Foil');
                const holo = product.materials.find(m => m.name === 'Holographic');
                const gloss = product.finishes.find(f => f.name === 'Gloss');
                const varnish = product.finishes.find(f => f.name === 'Varnish');
                const emboss = product.finishes.find(f => f.name === 'Emboss');
                
                const globalTier1 = globalTiers.find(t => t.tierNumber === 1);
                const globalTier2 = globalTiers.find(t => t.tierNumber === 2);
                const globalTier3 = globalTiers.find(t => t.tierNumber === 3);
                const globalTier4 = globalTiers.find(t => t.tierNumber === 4);
                
                const basePrice = parseFloat(product.basePrice);
                
                // Extract size from product name for color coding
                // Look for the FIRST dimension number (e.g., "1x2" = 1 inch, "2x3" = 2 inch)
                const getSizeColor = (name: string) => {
                  const lowerName = name.toLowerCase();
                  
                  // Match patterns like "1"", "1.5"", "1x2", "1 inch", etc.
                  // We want the FIRST number to determine the size group
                  const inchMatch = lowerName.match(/^(\d+(?:\.\d+)?)["\s]/);
                  const dimensionMatch = lowerName.match(/(\d+(?:\.\d+)?)x\d/);
                  
                  let size = 0;
                  if (inchMatch) {
                    size = Math.floor(parseFloat(inchMatch[1]));
                  } else if (dimensionMatch) {
                    size = Math.floor(parseFloat(dimensionMatch[1]));
                  }
                  
                  switch(size) {
                    case 1: return 'bg-blue-50 border-l-4 border-l-blue-400';
                    case 2: return 'bg-green-50 border-l-4 border-l-green-400';
                    case 3: return 'bg-purple-50 border-l-4 border-l-purple-400';
                    case 4: return 'bg-orange-50 border-l-4 border-l-orange-400';
                    case 5: return 'bg-pink-50 border-l-4 border-l-pink-400';
                    case 6: return 'bg-cyan-50 border-l-4 border-l-cyan-400';
                    default: return 'bg-gray-50 border-l-4 border-l-gray-300';
                  }
                };
                
                const rowColor = getSizeColor(product.name);
                
                const isEditing = editingProductId === product.id;
                
                return (
                  <tr key={product.id} className={`${rowColor} hover:brightness-95 transition-all ${!product.isActive ? 'opacity-50' : ''} ${isEditing ? 'ring-2 ring-blue-500 ring-inset bg-blue-100/50 relative z-10' : ''}`}>
                    <td className="px-2 py-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <div className="font-semibold text-gray-900 truncate max-w-[120px] text-xs sm:text-sm">{product.name}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{product.categoryName}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-gray-600">Category: {product.categoryName}</p>
                          <p className="text-xs text-gray-600 mt-1">Row color indicates size group based on first dimension.</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-1 py-1 text-center border-l-2 border-blue-300 bg-blue-50/30">
                      {tier1 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(
                                e,
                                product.id,
                                product.name,
                                'base',
                                'Price',
                                tier1.id,
                                tier1.pricePerUnit,
                                tier2?.pricePerUnit,
                                tier3?.pricePerUnit,
                                tier4?.pricePerUnit,
                                tier2?.id,
                                tier3?.id,
                                tier4?.id
                              )}
                              className="font-mono text-[11px] sm:text-xs px-1.5 sm:px-2 py-1 rounded bg-blue-100 border border-blue-300 hover:border-blue-500 hover:bg-blue-200 shadow-sm cursor-pointer transition-all font-medium text-blue-800"
                              data-testid={`cell-price-${product.id}`}
                            >
                              ${parseFloat(tier1.pricePerUnit).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Click to edit all 4 tier prices</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-1 py-1 text-center bg-purple-50/30 border-l-2 border-purple-300">
                      {vinyl ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'material', 'Vinyl', vinyl.id, vinyl.priceModifier, vinyl.tier2PriceModifier, vinyl.tier3PriceModifier, vinyl.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-purple-100 border border-purple-300 hover:border-purple-500 hover:bg-purple-200 shadow-sm cursor-pointer transition-all font-medium text-purple-800"
                              data-testid={`cell-vinyl-${product.id}`}
                            >
                              +${parseFloat(vinyl.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Vinyl Material Add-on</div>
                            <div>Extra cost per sticker for vinyl material</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-purple-50/30 border-l border-purple-200">
                      {foil ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'material', 'Foil', foil.id, foil.priceModifier, foil.tier2PriceModifier, foil.tier3PriceModifier, foil.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-purple-100 border border-purple-300 hover:border-purple-500 hover:bg-purple-200 shadow-sm cursor-pointer transition-all font-medium text-purple-800"
                              data-testid={`cell-foil-${product.id}`}
                            >
                              +${parseFloat(foil.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Foil Material Add-on</div>
                            <div>Extra cost per sticker for metallic foil</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-purple-50/30 border-l border-purple-200">
                      {holo ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'material', 'Holographic', holo.id, holo.priceModifier, holo.tier2PriceModifier, holo.tier3PriceModifier, holo.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-purple-100 border border-purple-300 hover:border-purple-500 hover:bg-purple-200 shadow-sm cursor-pointer transition-all font-medium text-purple-800"
                              data-testid={`cell-holo-${product.id}`}
                            >
                              +${parseFloat(holo.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Holographic Material Add-on</div>
                            <div>Extra cost per sticker for rainbow holographic</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-green-50/30 border-l-2 border-green-300">
                      {gloss ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'finish', 'Gloss', gloss.id, gloss.priceModifier, gloss.tier2PriceModifier, gloss.tier3PriceModifier, gloss.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-green-100 border border-green-300 hover:border-green-500 hover:bg-green-200 shadow-sm cursor-pointer transition-all font-medium text-green-800"
                              data-testid={`cell-gloss-${product.id}`}
                            >
                              +${parseFloat(gloss.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Gloss Finish Add-on</div>
                            <div>Extra cost per sticker for glossy coating</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-green-50/30 border-l border-green-200">
                      {varnish ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'finish', 'Varnish', varnish.id, varnish.priceModifier, varnish.tier2PriceModifier, varnish.tier3PriceModifier, varnish.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-green-100 border border-green-300 hover:border-green-500 hover:bg-green-200 shadow-sm cursor-pointer transition-all font-medium text-green-800"
                              data-testid={`cell-varnish-${product.id}`}
                            >
                              +${parseFloat(varnish.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Varnish Finish Add-on</div>
                            <div>Extra cost per sticker for spot varnish</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-1 py-1 text-center bg-green-50/30 border-l border-green-200">
                      {emboss ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => openTierPricingPopup(e, product.id, product.name, 'finish', 'Emboss', emboss.id, emboss.priceModifier, emboss.tier2PriceModifier, emboss.tier3PriceModifier, emboss.tier4PriceModifier)}
                              className="font-mono text-[11px] sm:text-xs px-1 sm:px-1.5 py-1 rounded bg-green-100 border border-green-300 hover:border-green-500 hover:bg-green-200 shadow-sm cursor-pointer transition-all font-medium text-green-800"
                              data-testid={`cell-emboss-${product.id}`}
                            >
                              +${parseFloat(emboss.priceModifier).toFixed(2)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="p-2 text-xs">
                            <div className="font-semibold mb-1">Emboss Finish Add-on</div>
                            <div>Extra cost per sticker for raised embossing</div>
                            <div className="mt-1 text-gray-500">Click to edit tier prices</div>
                          </TooltipContent>
                        </Tooltip>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No products match your search' : 'No products found'}
          </div>
        )}
      </div>

      {/* Tier Pricing Inline Popover */}
      {tierPricingPopup && (
        <>
          {/* Invisible overlay to close popover on click outside */}
          <div 
            className="fixed inset-0 z-[199]" 
            onClick={closeTierPricingPopup}
          />
          <div 
            ref={popupRef}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-[200]"
            style={{ 
              left: `${tierPricingPopup.popupX}px`, 
              top: `${tierPricingPopup.popupY}px`,
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            {/* Arrow pointing to the cell */}
            <div 
              className={`absolute w-0 h-0 ${
                tierPricingPopup.arrowPosition === 'top' 
                  ? 'border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white -top-[10px]'
                  : 'border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white -bottom-[10px]'
              }`}
              style={{ left: `${tierPricingPopup.arrowX - 10}px` }}
            />
            {/* Arrow border/shadow */}
            <div 
              className={`absolute w-0 h-0 ${
                tierPricingPopup.arrowPosition === 'top' 
                  ? 'border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-b-[11px] border-b-gray-200 -top-[11px]'
                  : 'border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[11px] border-t-gray-200 -bottom-[11px]'
              }`}
              style={{ left: `${tierPricingPopup.arrowX - 11}px`, zIndex: -1 }}
            />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`font-bold text-sm ${tierPricingPopup.optionType === 'material' ? 'text-purple-800' : tierPricingPopup.optionType === 'finish' ? 'text-green-800' : 'text-blue-800'}`}>
                  {tierPricingPopup.optionType === 'base' ? 'Base Price Tiers' : `${tierPricingPopup.optionName} Tiers`}
                </h3>
                <p className="text-xs text-gray-500">{tierPricingPopup.productName}</p>
              </div>
              <button 
                onClick={closeTierPricingPopup}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Tier 1: 1-249 */}
              <div className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-gray-600">1-249</div>
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{tierPricingPopup.optionType === 'base' ? '$' : '+$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPricingEdits.tier1}
                    onChange={(e) => setTierPricingEdits(prev => ({ ...prev, tier1: e.target.value }))}
                    className={`w-full pl-6 pr-2 py-1.5 border rounded text-xs font-mono ${tierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500' : tierPricingPopup.optionType === 'finish' ? 'border-green-300 focus:border-green-500' : 'border-blue-300 focus:border-blue-500'} focus:ring-1 focus:outline-none`}
                    placeholder="0.00"
                    data-testid="input-tier1-price"
                  />
                </div>
              </div>

              {/* Tier 2: 250-999 */}
              <div className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-gray-600">250-999</div>
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{tierPricingPopup.optionType === 'base' ? '$' : '+$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPricingEdits.tier2}
                    onChange={(e) => setTierPricingEdits(prev => ({ ...prev, tier2: e.target.value }))}
                    className={`w-full pl-6 pr-2 py-1.5 border rounded text-xs font-mono ${tierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500' : tierPricingPopup.optionType === 'finish' ? 'border-green-300 focus:border-green-500' : 'border-blue-300 focus:border-blue-500'} focus:ring-1 focus:outline-none`}
                    placeholder={tierPricingEdits.tier1 || '0.00'}
                    data-testid="input-tier2-price"
                  />
                </div>
              </div>

              {/* Tier 3: 1000-1999 */}
              <div className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-gray-600">1K-2K</div>
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{tierPricingPopup.optionType === 'base' ? '$' : '+$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPricingEdits.tier3}
                    onChange={(e) => setTierPricingEdits(prev => ({ ...prev, tier3: e.target.value }))}
                    className={`w-full pl-6 pr-2 py-1.5 border rounded text-xs font-mono ${tierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500' : tierPricingPopup.optionType === 'finish' ? 'border-green-300 focus:border-green-500' : 'border-blue-300 focus:border-blue-500'} focus:ring-1 focus:outline-none`}
                    placeholder={tierPricingEdits.tier2 || tierPricingEdits.tier1 || '0.00'}
                    data-testid="input-tier3-price"
                  />
                </div>
              </div>

              {/* Tier 4: 2000+ */}
              <div className="flex items-center gap-2">
                <div className="w-16 text-xs font-medium text-gray-600">2000+</div>
                <div className="flex-1 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{tierPricingPopup.optionType === 'base' ? '$' : '+$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tierPricingEdits.tier4}
                    onChange={(e) => setTierPricingEdits(prev => ({ ...prev, tier4: e.target.value }))}
                    className={`w-full pl-6 pr-2 py-1.5 border rounded text-xs font-mono ${tierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500' : tierPricingPopup.optionType === 'finish' ? 'border-green-300 focus:border-green-500' : 'border-blue-300 focus:border-blue-500'} focus:ring-1 focus:outline-none`}
                    placeholder={tierPricingEdits.tier3 || tierPricingEdits.tier2 || tierPricingEdits.tier1 || '0.00'}
                    data-testid="input-tier4-price"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={closeTierPricingPopup}
                data-testid="button-cancel-tier-pricing"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className={`flex-1 h-8 text-xs ${tierPricingPopup.optionType === 'material' ? 'bg-purple-600 hover:bg-purple-700' : tierPricingPopup.optionType === 'finish' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={saveTierPricing}
                disabled={savingTierPricing}
                data-testid="button-save-tier-pricing"
              >
                {savingTierPricing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Bulk Tier Pricing Popup (for Quick Actions) */}
      {bulkTierPricingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={() => setBulkTierPricingPopup(null)}>
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{bulkTierPricingPopup.optionName} - Bulk Tier Pricing</h3>
                <p className="text-sm text-gray-500">Update pricing for ALL products</p>
              </div>
              <button 
                onClick={() => setBulkTierPricingPopup(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Bulk Update:</strong> These prices will be applied to ALL 32 products. Only fill in the tiers you want to update. Leave blank to skip.
              </p>
            </div>

            <div className="space-y-3">
              {/* Tier 1: 1-249 */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-600">1-249</div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkTierPricingEdits.tier1}
                    onChange={(e) => setBulkTierPricingEdits(prev => ({ ...prev, tier1: e.target.value }))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-mono ${bulkTierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-green-300 focus:border-green-500 focus:ring-green-200'} focus:ring-2 focus:outline-none`}
                    placeholder="0.00"
                    data-testid="input-bulk-tier1-price"
                  />
                </div>
              </div>

              {/* Tier 2: 250-999 */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-600">250-999</div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkTierPricingEdits.tier2}
                    onChange={(e) => setBulkTierPricingEdits(prev => ({ ...prev, tier2: e.target.value }))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-mono ${bulkTierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-green-300 focus:border-green-500 focus:ring-green-200'} focus:ring-2 focus:outline-none`}
                    placeholder="0.00"
                    data-testid="input-bulk-tier2-price"
                  />
                </div>
              </div>

              {/* Tier 3: 1000-1999 */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-600">1000-1999</div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkTierPricingEdits.tier3}
                    onChange={(e) => setBulkTierPricingEdits(prev => ({ ...prev, tier3: e.target.value }))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-mono ${bulkTierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-green-300 focus:border-green-500 focus:ring-green-200'} focus:ring-2 focus:outline-none`}
                    placeholder="0.00"
                    data-testid="input-bulk-tier3-price"
                  />
                </div>
              </div>

              {/* Tier 4: 2000+ */}
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-600">2000+</div>
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkTierPricingEdits.tier4}
                    onChange={(e) => setBulkTierPricingEdits(prev => ({ ...prev, tier4: e.target.value }))}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm font-mono ${bulkTierPricingPopup.optionType === 'material' ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-green-300 focus:border-green-500 focus:ring-green-200'} focus:ring-2 focus:outline-none`}
                    placeholder="0.00"
                    data-testid="input-bulk-tier4-price"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBulkTierPricingPopup(null)}
                data-testid="button-cancel-bulk-tier-pricing"
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 ${bulkTierPricingPopup.optionType === 'material' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={saveBulkTierPricing}
                disabled={savingBulkTierPricing}
                data-testid="button-save-bulk-tier-pricing"
              >
                {savingBulkTierPricing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update All Products'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function FixOptionsButton() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function checkOptions() {
      try {
        const res = await fetch('/api/admin/products');
        const products = await res.json();
        if (products.length > 0) {
          const firstProduct = products[0];
          const optionsRes = await fetch(`/api/admin/products/${firstProduct.id}/options`);
          const optionsData = await optionsRes.json();
          const materials = optionsData.materials || [];
          const hasOldOptions = materials.some((m: any) => 
            m.name.toLowerCase().includes('gloss vinyl') || 
            m.name.toLowerCase().includes('matte vinyl') ||
            m.name.toLowerCase().includes('clear vinyl')
          );
          const hasNewOptions = materials.some((m: any) => 
            m.name === 'Vinyl' || m.name === 'Foil' || m.name === 'Holographic'
          );
          setNeedsUpdate(hasOldOptions || (!hasNewOptions && materials.length > 0));
        }
      } catch (e) {
        console.error('Error checking options:', e);
      }
    }
    checkOptions();
  }, []);

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const res = await fetch('/api/admin/seed-options', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        toast({ title: "Product options updated successfully!" });
        setNeedsUpdate(false);
        setIsFixed(true);
      } else {
        throw new Error('Failed to update');
      }
    } catch (e) {
      toast({ title: "Failed to update options", variant: "destructive" });
    } finally {
      setIsFixing(false);
    }
  };

  if (!needsUpdate && !isFixed) return null;

  if (isFixed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Product options updated!</p>
            <p className="text-sm text-green-600">All products now have the correct material and finish options.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Product options need updating</p>
            <p className="text-sm text-red-600">Click the button to fix all product material and finish options.</p>
          </div>
        </div>
        <Button 
          onClick={handleFix} 
          disabled={isFixing}
          className="bg-red-600 hover:bg-red-700 text-white"
          data-testid="button-fix-options"
        >
          {isFixing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Fix Product Options
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: number | null;

  // Print dimensions for editor canvas
  printWidthInches?: string;
  printHeightInches?: string;
  printDpi?: number;
  bleedSize?: string;
  safeZoneSize?: string;
  supportsCustomShape?: boolean;

  // Per-product shipping settings.  These are returned from the API and
  // optionally edited in the admin form.  shippingType can be 'free',
  // 'flat', or 'calculated'.  flatShippingPrice should be a string
  // representing a decimal or null when not used.
  shippingType?: string;
  flatShippingPrice?: string | null;
}

interface ProductTemplate {
  id: number;
  productId: number;
  name: string;
  description: string | null;
  previewImageUrl: string | null;
  canvasJson: any;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminProducts() {
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    basePrice: "",
    isActive: true,
    isFeatured: false,
    thumbnailUrl: "",
    shippingType: "calculated" as string,
    flatShippingPrice: "" as string | null,
    // Print dimensions (inches) - determines canvas size for customers
    printWidthInches: "4",
    printHeightInches: "4",
    stickerType: "standard" as "standard" | "die-cut" | "kiss-cut" | "custom-shape",
    // Bulk pricing tiers (min-max quantity range + price per unit)
    pricingTiers: [
      { minQuantity: "1000", maxQuantity: "4999", pricePerUnit: "" },
      { minQuantity: "5000", maxQuantity: "9999", pricePerUnit: "" },
      { minQuantity: "10000", maxQuantity: "", pricePerUnit: "" },
    ] as Array<{ minQuantity: string; maxQuantity: string; pricePerUnit: string }>,
  });
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCreate, setIsUploadingCreate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    previewImageUrl: "",
    canvasJson: "",
    isActive: true,
  });
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  
  // Pricing state for edit modal
  const [materialOptions, setMaterialOptions] = useState<Array<{id: number; name: string; priceModifier: string}>>([]);
  const [coatingOptions, setCoatingOptions] = useState<Array<{id: number; name: string; priceModifier: string}>>([]);
  const [pricingTiers, setPricingTiers] = useState<Array<{minQuantity: string; maxQuantity: string; pricePerUnit: string}>>([
    { minQuantity: "1000", maxQuantity: "4999", pricePerUnit: "" },
    { minQuantity: "5000", maxQuantity: "9999", pricePerUnit: "" },
    { minQuantity: "10000", maxQuantity: "", pricePerUnit: "" },
  ]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadProductImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/upload/product-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    
    const imageUrl = await uploadProductImage(file);
    if (imageUrl) {
      setEditingProduct({ ...editingProduct, thumbnailUrl: imageUrl });
    }
  };

  const handleCreateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCreate(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await fetch('/api/admin/upload/product-image', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setFormData({ ...formData, thumbnailUrl: data.url });
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingCreate(false);
    }
  };

  const uploadTemplateImage = async (file: File): Promise<string | null> => {
    setIsUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/upload/template-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading template image:', error);
      toast({ title: "Failed to upload template image", variant: "destructive" });
      return null;
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleTemplateImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const imageUrl = await uploadTemplateImage(file);
    if (imageUrl) {
      setTemplateForm({ ...templateForm, previewImageUrl: imageUrl });
    }
  };

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<ProductTemplate[]>({
    queryKey: ["/api/admin/products", editingProduct?.id, "templates"],
    enabled: !!editingProduct,
    queryFn: async () => {
      if (!editingProduct) return [];
      const res = await fetch(`/api/admin/products/${editingProduct.id}/templates`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  // Fetch product options when editing
  const { data: productOptionsData } = useQuery<{materials: any[]; coatings: any[]}>({
    queryKey: ["/api/admin/products", editingProduct?.id, "options"],
    enabled: !!editingProduct,
    queryFn: async () => {
      if (!editingProduct) return { materials: [], coatings: [] };
      const res = await fetch(`/api/admin/products/${editingProduct.id}/options`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch options");
      return res.json();
    },
  });

  // Fetch pricing tiers when editing
  const { data: productPricingTiers } = useQuery<any[]>({
    queryKey: ["/api/admin/products", editingProduct?.id, "pricing-tiers"],
    enabled: !!editingProduct,
    queryFn: async () => {
      if (!editingProduct) return [];
      const res = await fetch(`/api/admin/products/${editingProduct.id}/pricing-tiers`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch pricing tiers");
      return res.json();
    },
  });

  // Effect to update local state when product options data is fetched
  useEffect(() => {
    if (productOptionsData) {
      setMaterialOptions(productOptionsData.materials.map((m: any) => ({
        id: m.id,
        name: m.name,
        priceModifier: m.priceModifier || "0.00",
      })));
      setCoatingOptions(productOptionsData.coatings.map((c: any) => ({
        id: c.id,
        name: c.name,
        priceModifier: c.priceModifier || "0.00",
      })));
    }
  }, [productOptionsData]);

  // Effect to update local state when pricing tiers data is fetched
  useEffect(() => {
    if (productPricingTiers) {
      const tiers = [...productPricingTiers];
      while (tiers.length < 3) {
        tiers.push({ minQuantity: "", maxQuantity: "", pricePerUnit: "" });
      }
      setPricingTiers(tiers.slice(0, 3).map((t: any) => ({
        minQuantity: t.minQuantity?.toString() || "",
        maxQuantity: t.maxQuantity?.toString() || "",
        pricePerUnit: t.pricePerUnit?.toString() || "",
      })));
    }
  }, [productPricingTiers]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setShowCreateForm(false);
      // Reset form data including shipping and print dimension fields
      setFormData({
        name: "",
        slug: "",
        description: "",
        basePrice: "",
        isActive: true,
        isFeatured: false,
        thumbnailUrl: "",
        shippingType: "calculated",
        flatShippingPrice: "",
        printWidthInches: "4",
        printHeightInches: "4",
        stickerType: "standard",
        pricingTiers: [
          { minQuantity: "1000", maxQuantity: "4999", pricePerUnit: "" },
          { minQuantity: "5000", maxQuantity: "9999", pricePerUnit: "" },
          { minQuantity: "10000", maxQuantity: "", pricePerUnit: "" },
        ],
      });
      toast({ title: "Product created successfully" });
    },
    onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully" });
    },
    onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, force = false }: { id: number; force?: boolean }) => {
      setDeletingProductId(id);
      console.log(`Attempting to delete product ${id}${force ? ' (FORCE)' : ''}...`);
      const url = force ? `/api/admin/products/${id}?force=true` : `/api/admin/products/${id}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      console.log(`Delete response status: ${res.status}`);
      const data = await res.json();
      console.log(`Delete response data:`, data);
      if (!res.ok) {
        const errorMsg = data.error || data.message || "Failed to delete product";
        console.error(`Delete failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      return { ...data, productId: id };
    },
    onSuccess: (data) => {
      console.log(`Delete success:`, data);
      setDeletingProductId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      if (data.softDeleted && data.hasOrders) {
        // Ask if they want to force delete
        if (confirm("This product has existing orders and was deactivated. Do you want to PERMANENTLY delete it along with its order history? This cannot be undone.")) {
          deleteMutation.mutate({ id: data.productId, force: true });
        } else {
          toast({ title: "Product deactivated (has order history)" });
        }
      } else {
        toast({ title: "Product deleted successfully" });
      }
    },
    onError: (error: Error) => {
      console.error(`Delete mutation error:`, error);
      setDeletingProductId(null);
      toast({ 
        title: "Failed to delete product", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      if (!editingProduct) throw new Error("No product selected");
      const res = await fetch(`/api/admin/products/${editingProduct.id}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          canvasJson: data.canvasJson ? JSON.parse(data.canvasJson) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "templates"] });
      setShowAddTemplate(false);
      setTemplateForm({ name: "", description: "", previewImageUrl: "", canvasJson: "", isActive: true });
      toast({ title: "Template created successfully" });
    },
    onError: () => toast({ title: "Failed to create template", variant: "destructive" }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "templates"] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete template", variant: "destructive" }),
  });

  const updateOptionsMutation = useMutation({
    mutationFn: async ({ productId, materials, coatings }: { productId: number; materials: any[]; coatings: any[] }) => {
      const res = await fetch(`/api/admin/products/${productId}/options`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ materials, coatings }),
      });
      if (!res.ok) throw new Error("Failed to update options");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "options"] });
      toast({ title: "Option prices updated successfully" });
    },
    onError: () => toast({ title: "Failed to update option prices", variant: "destructive" }),
  });

  const updatePricingTiersMutation = useMutation({
    mutationFn: async ({ productId, tiers }: { productId: number; tiers: any[] }) => {
      const res = await fetch(`/api/admin/products/${productId}/pricing-tiers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tiers }),
      });
      if (!res.ok) throw new Error("Failed to update pricing tiers");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products", editingProduct?.id, "pricing-tiers"] });
      toast({ title: "Bulk pricing tiers updated successfully" });
    },
    onError: () => toast({ title: "Failed to update pricing tiers", variant: "destructive" }),
  });

  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "", previewImageUrl: "", canvasJson: "", isActive: true });
    setShowAddTemplate(false);
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    resetTemplateForm();
    setMaterialOptions([]);
    setCoatingOptions([]);
    setPricingTiers([
      { minQuantity: "1000", maxQuantity: "4999", pricePerUnit: "" },
      { minQuantity: "5000", maxQuantity: "9999", pricePerUnit: "" },
      { minQuantity: "10000", maxQuantity: "", pricePerUnit: "" },
    ]);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }
    if (templateForm.canvasJson) {
      try {
        JSON.parse(templateForm.canvasJson);
      } catch {
        toast({ title: "Invalid canvas JSON format", variant: "destructive" });
        return;
      }
    }
    createTemplateMutation.mutate(templateForm);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // Set supportsCustomShape based on sticker type
    const updatedFormData = {
      ...formData,
      supportsCustomShape: formData.stickerType !== "standard",
    };
    createMutation.mutate(updatedFormData);
  };

  const toggleActive = (product: Product) => {
    updateMutation.mutate({ id: product.id, data: { isActive: !product.isActive } });
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products & Deals</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage your product catalog and promotional deals</p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === "deals" || v === "pricing") {
              setShowCreateForm(false);
              setEditingProduct(null);
            }
          }} 
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2" data-testid="tab-products">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2" data-testid="tab-pricing">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="deals" className="gap-2" data-testid="tab-deals">
              <Flame className="h-4 w-4" />
              Hot Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
                <p className="text-gray-600 text-sm">Manage your products</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto" data-testid="button-add-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a new sticker product for your store</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Fix Options Banner - Shows when options need updating */}
        <FixOptionsButton />

            {/* Help Guide */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-orange-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Add Products</span><br /><span className="text-gray-600">Click "Add Product" to create new items</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Edit2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Edit Details</span><br /><span className="text-gray-600">Pencil icon to update info & images</span></p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Toggle Status</span><br /><span className="text-gray-600">Activate or deactivate from store</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Layers className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Templates</span><br /><span className="text-gray-600">Add pre-made designs for customers</span></p>
            </div>
            {/* Shipping Settings */}
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold text-gray-800">Shipping Settings</span>
                <br />
                <a href="/admin/shipping" className="text-gray-600 underline hover:text-orange-600">
                  Adjust shipping options
                </a>
              </p>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm mb-6">
            <h2 className="text-base md:text-lg font-semibold mb-4">Create New Product</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {formData.thumbnailUrl ? (
                      <img 
                        src={formData.thumbnailUrl} 
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleCreateImageChange}
                      className="hidden"
                      data-testid="input-create-product-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => createFileInputRef.current?.click()}
                      disabled={isUploadingCreate}
                      className="w-full"
                      data-testid="button-upload-create-image"
                    >
                      {isUploadingCreate ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.thumbnailUrl ? "Change Image" : "Upload Image"}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, or WebP. Max 10MB.</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                    data-testid="input-product-name"
                  />
                </div>
                <div>
                  {/* Label for the URL path input. Avoid using the term "slug" so it's clear to administrators. */}
                  <label className="block text-sm font-medium mb-1">URL Path</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g., custom-sticker-pack"
                    required
                    data-testid="input-product-slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use lowercase letters, numbers, or hyphens; avoid using only numbers. This value becomes part of the product URL.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    required
                    data-testid="input-product-price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="input-product-description"
                  />
                </div>
                {/* Shipping type selector */}
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping Type</label>
                  <select
                    value={formData.shippingType}
                    onChange={(e) => setFormData({ ...formData, shippingType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    data-testid="select-shipping-type"
                  >
                    <option value="calculated">Calculated</option>
                    <option value="flat">Flat Rate</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                {/* Flat shipping price input shown only when shippingType is 'flat' */}
                {formData.shippingType === 'flat' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Flat Shipping Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.flatShippingPrice ?? ''}
                      onChange={(e) => setFormData({ ...formData, flatShippingPrice: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-flat-shipping-price"
                    />
                  </div>
                )}
              </div>
              
              {/* Print Dimensions Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Print Dimensions (for Design Editor)
                </h3>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium mb-1">Width (inches)</label>
                    <input
                      type="number"
                      step="0.125"
                      min="0.5"
                      max="48"
                      value={formData.printWidthInches}
                      onChange={(e) => setFormData({ ...formData, printWidthInches: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-print-width"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Height (inches)</label>
                    <input
                      type="number"
                      step="0.125"
                      min="0.5"
                      max="48"
                      value={formData.printHeightInches}
                      onChange={(e) => setFormData({ ...formData, printHeightInches: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      data-testid="input-print-height"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Canvas: {Math.round(parseFloat(formData.printWidthInches || '4') * 300)} x {Math.round(parseFloat(formData.printHeightInches || '4') * 300)} pixels at 300 DPI
                </p>
              </div>
              
              {/* Sticker Type Selection */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Sticker Type (for Custom Shape Support)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "standard", label: "Standard", desc: "Rectangle/square shape" },
                    { value: "die-cut", label: "Die-Cut", desc: "Custom contour cut" },
                    { value: "kiss-cut", label: "Kiss-Cut", desc: "Cut through vinyl only" },
                    { value: "custom-shape", label: "Custom Shape", desc: "User-defined shape" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, stickerType: type.value as any })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.stickerType === type.value
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      data-testid={`button-sticker-type-${type.value}`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.desc}</div>
                    </button>
                  ))}
                </div>
                {formData.stickerType !== "standard" && (
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm"></span>
                    Canvas will show checkerboard pattern (transparent areas)
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Featured</span>
                </label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-product">
                  {createMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm" data-testid={`product-card-${product.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Product Image Thumbnail */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {product.thumbnailUrl ? (
                      <img 
                        src={product.thumbnailUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{product.name}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{formatPrice(product.basePrice)}</span>
                      <span className="truncate">{product.slug}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActive(product)}
                          data-testid={`button-toggle-${product.id}`}
                        >
                          {product.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{product.isActive ? 'Deactivate product (hide from store)' : 'Activate product (show in store)'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingProduct(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit product details, images, and pricing</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={deletingProductId === product.id}
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this product?")) {
                              deleteMutation.mutate({ id: product.id });
                            }
                          }}
                          data-testid={`button-delete-${product.id}`}
                        >
                          {deletingProductId === product.id ? (
                            <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Permanently delete this product</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first product</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit Product: {editingProduct.name}</h2>
                <Button size="icon" variant="ghost" onClick={handleCloseEditModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="details" data-testid="tab-product-details">
                    <FileImage className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="pricing" data-testid="tab-product-pricing">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="templates" data-testid="tab-product-templates">
                    <Layout className="h-4 w-4 mr-2" />
                    Templates ({templates?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({
                        id: editingProduct.id,
                        data: editingProduct,
                      });
                    }}
                    className="space-y-4"
                  >
                    {/* Product Image Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Product Image</label>
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                          {editingProduct.thumbnailUrl ? (
                            <img 
                              src={editingProduct.thumbnailUrl} 
                              alt={editingProduct.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                            data-testid="input-product-image"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full"
                            data-testid="button-upload-image"
                          >
                            {isUploading ? (
                              "Uploading..."
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {editingProduct.thumbnailUrl ? "Change Image" : "Upload Image"}
                              </>
                            )}
                          </Button>
                          {editingProduct.thumbnailUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProduct({ ...editingProduct, thumbnailUrl: null })}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid="button-remove-image"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove Image
                            </Button>
                          )}
                          <p className="text-xs text-gray-500">JPG, PNG, GIF, or WebP. Max 10MB.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={editingProduct.name}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.basePrice}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, basePrice: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        data-testid="input-edit-price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={editingProduct.description || ""}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                        data-testid="input-edit-description"
                      />
                    </div>
                {/* Shipping type selector for editing existing products */}
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping Type</label>
                  <select
                    value={editingProduct.shippingType || 'calculated'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, shippingType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    data-testid="select-edit-shipping-type"
                  >
                    <option value="calculated">Calculated</option>
                    <option value="flat">Flat Rate</option>
                    <option value="free">Free</option>
                  </select>
                </div>
                {/* Flat shipping price input shown only when editingProduct.shippingType is 'flat' */}
                {editingProduct.shippingType === 'flat' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Flat Shipping Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.flatShippingPrice ?? ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, flatShippingPrice: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                      data-testid="input-edit-flat-shipping-price"
                    />
                  </div>
                )}
                {/* Sticker Type Selection for Edit */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Sticker Type (for Custom Shape Support)
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, supportsCustomShape: false })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        !editingProduct.supportsCustomShape
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      data-testid="button-edit-sticker-type-standard"
                    >
                      <div className="font-medium text-sm">Standard</div>
                      <div className="text-xs text-gray-500">Rectangle/square shape</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, supportsCustomShape: true })}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        editingProduct.supportsCustomShape
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      data-testid="button-edit-sticker-type-custom"
                    >
                      <div className="font-medium text-sm">Die-Cut / Kiss-Cut / Custom</div>
                      <div className="text-xs text-gray-500">Custom contour cut with transparent areas</div>
                    </button>
                  </div>
                  {editingProduct.supportsCustomShape && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm"></span>
                      Canvas will show checkerboard pattern (transparent areas)
                    </p>
                  )}
                </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.isActive}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                          }
                          data-testid="checkbox-edit-active"
                        />
                        <span>Active</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingProduct.isFeatured}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                          }
                          data-testid="checkbox-edit-featured"
                        />
                        <span>Featured</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={handleCloseEditModal} data-testid="button-cancel-edit">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateMutation.isPending || isUploading} data-testid="button-save-changes">
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="pricing">
                  <div className="space-y-6">
                    {/* Material Price Modifiers */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Material Price Modifiers</h3>
                      <p className="text-xs text-gray-500 mb-3">Set extra cost per unit for each material type</p>
                      <div className="grid gap-3">
                        {materialOptions.map((opt, idx) => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <span className="w-32 text-sm font-medium">{opt.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">+$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={opt.priceModifier}
                                onChange={(e) => {
                                  const updated = [...materialOptions];
                                  updated[idx] = { ...opt, priceModifier: e.target.value };
                                  setMaterialOptions(updated);
                                }}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                data-testid={`input-material-price-${opt.name.toLowerCase()}`}
                              />
                              <span className="text-xs text-gray-400">per unit</span>
                            </div>
                          </div>
                        ))}
                        {materialOptions.length === 0 && (
                          <p className="text-sm text-gray-400">No material options found for this product</p>
                        )}
                      </div>
                    </div>

                    {/* Spot Gloss Price Modifiers */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3">Spot Gloss Price Modifiers</h3>
                      <p className="text-xs text-gray-500 mb-3">Set extra cost per unit for each finish type</p>
                      <div className="grid gap-3">
                        {coatingOptions.map((opt, idx) => (
                          <div key={opt.id} className="flex items-center gap-3">
                            <span className="w-32 text-sm font-medium">{opt.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">+$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={opt.priceModifier}
                                onChange={(e) => {
                                  const updated = [...coatingOptions];
                                  updated[idx] = { ...opt, priceModifier: e.target.value };
                                  setCoatingOptions(updated);
                                }}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                data-testid={`input-coating-price-${opt.name.toLowerCase()}`}
                              />
                              <span className="text-xs text-gray-400">per unit</span>
                            </div>
                          </div>
                        ))}
                        {coatingOptions.length === 0 && (
                          <p className="text-sm text-gray-400">No spot gloss options found for this product</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (editingProduct) {
                            updateOptionsMutation.mutate({
                              productId: editingProduct.id,
                              materials: materialOptions,
                              coatings: coatingOptions,
                            });
                          }
                        }}
                        disabled={updateOptionsMutation.isPending}
                        data-testid="button-save-option-prices"
                      >
                        {updateOptionsMutation.isPending ? "Saving..." : "Save Option Prices"}
                      </Button>
                    </div>

                    {/* Bulk Pricing Tiers */}
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-semibold mb-3">Bulk Pricing Tiers</h3>
                      <p className="text-xs text-gray-500 mb-3">Set up to 3 quantity-based discounts (customers see these on product pages)</p>
                      <div className="space-y-3">
                        {pricingTiers.map((tier, idx) => (
                          <div key={idx} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600 w-16">Tier {idx + 1}:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                placeholder="Min qty"
                                value={tier.minQuantity}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx] = { ...tier, minQuantity: e.target.value };
                                  setPricingTiers(updated);
                                }}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                data-testid={`input-tier-${idx}-min`}
                              />
                              <span className="text-gray-400">-</span>
                              <input
                                type="number"
                                min="1"
                                placeholder="Max qty"
                                value={tier.maxQuantity}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx] = { ...tier, maxQuantity: e.target.value };
                                  setPricingTiers(updated);
                                }}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                data-testid={`input-tier-${idx}-max`}
                              />
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">$</span>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                placeholder="Price/unit"
                                value={tier.pricePerUnit}
                                onChange={(e) => {
                                  const updated = [...pricingTiers];
                                  updated[idx] = { ...tier, pricePerUnit: e.target.value };
                                  setPricingTiers(updated);
                                }}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                data-testid={`input-tier-${idx}-price`}
                              />
                              <span className="text-xs text-gray-400">each</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Leave fields empty to disable a tier. Price per unit should be lower than base price for discounts.</p>

                      <div className="flex justify-end mt-4">
                        <Button
                          type="button"
                          onClick={() => {
                            if (editingProduct) {
                              updatePricingTiersMutation.mutate({
                                productId: editingProduct.id,
                                tiers: pricingTiers.filter(t => t.minQuantity && t.pricePerUnit),
                              });
                            }
                          }}
                          disabled={updatePricingTiersMutation.isPending}
                          data-testid="button-save-pricing-tiers"
                        >
                          {updatePricingTiersMutation.isPending ? "Saving..." : "Save Bulk Pricing"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="templates">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        Pre-designed templates customers can use when designing this product.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setShowAddTemplate(!showAddTemplate)}
                        data-testid="button-add-template"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                      </Button>
                    </div>

                    {showAddTemplate && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium text-sm">New Template</h4>
                        <form onSubmit={handleCreateTemplate} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input
                              type="text"
                              value={templateForm.name}
                              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="e.g., Business Card Basic"
                              data-testid="input-template-name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <input
                              type="text"
                              value={templateForm.description}
                              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              placeholder="Brief description of this template"
                              data-testid="input-template-description"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Preview Image</label>
                            <div className="flex items-center gap-3">
                              {templateForm.previewImageUrl ? (
                                <img src={templateForm.previewImageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Image className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <input
                                ref={templateFileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleTemplateImageChange}
                                className="hidden"
                                data-testid="input-template-image"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => templateFileInputRef.current?.click()}
                                disabled={isUploadingTemplate}
                              >
                                {isUploadingTemplate ? "Uploading..." : "Upload Image"}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Canvas JSON (optional)</label>
                            <textarea
                              value={templateForm.canvasJson}
                              onChange={(e) => setTemplateForm({ ...templateForm, canvasJson: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                              rows={3}
                              placeholder='{"objects":[],"version":"5.3.0"}'
                              data-testid="input-template-json"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fabric.js canvas JSON export</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={templateForm.isActive}
                              onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                              id="template-active"
                            />
                            <label htmlFor="template-active" className="text-sm">Active (visible to customers)</label>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={resetTemplateForm}>
                              Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={createTemplateMutation.isPending} data-testid="button-save-template">
                              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {templatesLoading ? (
                      <div className="py-8 text-center text-gray-500">Loading templates...</div>
                    ) : templates && templates.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {templates.map((template) => (
                          <div
                            key={template.id}
                            className={`relative rounded-lg border p-3 ${template.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                            data-testid={`template-card-${template.id}`}
                          >
                            <div className="aspect-square rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">
                              {template.previewImageUrl ? (
                                <img src={template.previewImageUrl} alt={template.name} className="w-full h-full object-cover" />
                              ) : (
                                <Layout className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            {template.description && (
                              <p className="text-xs text-gray-500 truncate">{template.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}> 
                                {template.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this template?")) {
                                    deleteTemplateMutation.mutate(template.id);
                                  }
                                }}
                                data-testid={`button-delete-template-${template.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-500 border-2 border-dashed rounded-lg">
                        <Layout className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No templates yet</p>
                        <p className="text-xs text-gray-400">Add templates for customers to use in the editor</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="pricing">
            {activeTab === "pricing" && (
              <PricingToolsTab onAdjustmentApplied={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] })} />
            )}
          </TabsContent>

          <TabsContent value="deals">
            {activeTab === "deals" && <DealsTab />}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}