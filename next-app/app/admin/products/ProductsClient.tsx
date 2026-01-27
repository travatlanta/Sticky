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
  materials: Array<{ id: number; name: string; priceModifier: string }>;
  finishes: Array<{ id: number; name: string; priceModifier: string }>;
}

function PricingToolsTab({ onAdjustmentApplied }: { onAdjustmentApplied: () => void }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ productId: number; field: string; tierId?: number; optionId?: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingCell, setSavingCell] = useState<string | null>(null);
  
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
      toast({ title: 'Global tiers updated!' });
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
      toast({ title: 'Updated!' });
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
      toast({ title: data.message });
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
      toast({ title: useGlobal ? 'Now using global tiers' : 'Now using custom tiers' });
      refetchProducts();
    } catch (e) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const materials = ['Vinyl', 'Foil', 'Holographic'];
  const finishes = ['Varnish', 'Emboss'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Pricing Dashboard</h2>
        <p className="text-gray-600 text-sm">Manage all product pricing from one place - edit directly in the spreadsheet below</p>
      </div>

      {/* Global Bulk Pricing Tiers */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Global Bulk Pricing Tiers</h3>
              <p className="text-sm text-gray-500">
                Default discounts for quantity orders • <span className="text-green-600 font-medium">{globalTierProducts.length} products</span> using global, <span className="text-orange-600 font-medium">{customTierProducts.length} custom</span>
              </p>
            </div>
          </div>
          {Object.keys(globalTierEdits).length > 0 && (
            <Button onClick={handleSaveGlobalTiers} disabled={savingGlobalTiers} data-testid="button-save-global-tiers">
              {savingGlobalTiers ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Global Tiers
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {globalTiers.map((tier) => {
            const edits = globalTierEdits[tier.tierNumber] || {};
            const minQty = edits.minQuantity ?? tier.minQuantity;
            const maxQty = edits.maxQuantity ?? tier.maxQuantity;
            const discount = edits.discountPercent ?? tier.discountPercent;
            
            return (
              <div key={tier.tierNumber} className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-blue-800">Tier {tier.tierNumber}</span>
                  <span className="text-2xl font-bold text-blue-600">{discount}% off</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minQty}
                      onChange={(e) => setGlobalTierEdits(prev => ({
                        ...prev,
                        [tier.tierNumber]: { ...prev[tier.tierNumber], minQuantity: parseInt(e.target.value) || 0 }
                      }))}
                      className="w-24 px-2 py-1 border rounded text-sm text-center"
                      data-testid={`input-tier-${tier.tierNumber}-min`}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      value={maxQty ?? ''}
                      placeholder="Max"
                      onChange={(e) => setGlobalTierEdits(prev => ({
                        ...prev,
                        [tier.tierNumber]: { ...prev[tier.tierNumber], maxQuantity: e.target.value ? parseInt(e.target.value) : null }
                      }))}
                      className="w-24 px-2 py-1 border rounded text-sm text-center"
                      data-testid={`input-tier-${tier.tierNumber}-max`}
                    />
                    <span className="text-gray-500 text-sm">units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Discount:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={discount}
                      onChange={(e) => setGlobalTierEdits(prev => ({
                        ...prev,
                        [tier.tierNumber]: { ...prev[tier.tierNumber], discountPercent: e.target.value }
                      }))}
                      className="w-20 px-2 py-1 border rounded text-sm text-center"
                      data-testid={`input-tier-${tier.tierNumber}-discount`}
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Material & Finish Quick Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded"><Layers className="h-4 w-4 text-purple-600" /></div>
            Material Add-ons (per sticker)
          </h4>
          <div className="space-y-2">
            {materials.map((material) => {
              const data = optionPrices?.options?.[material];
              return (
                <div key={material} className="flex items-center gap-2">
                  <span className="w-24 text-sm font-medium">{material}</span>
                  <span className="text-sm text-gray-500">${data?.mostCommonPrice || '0.00'}</span>
                  <div className="flex-1" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="New price"
                    value={optionInputs[material] || ''}
                    onChange={(e) => setOptionInputs(prev => ({ ...prev, [material]: e.target.value }))}
                    className="w-24 px-2 py-1 border rounded text-sm"
                    data-testid={`input-option-${material.toLowerCase()}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveOptionPrice(material)}
                    disabled={savingOption === material || !optionInputs[material]}
                    data-testid={`button-save-${material.toLowerCase()}`}
                  >
                    {savingOption === material ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded"><Scissors className="h-4 w-4 text-green-600" /></div>
            Finish Add-ons (per sticker)
          </h4>
          <div className="space-y-2">
            {finishes.map((finish) => {
              const data = optionPrices?.options?.[finish];
              return (
                <div key={finish} className="flex items-center gap-2">
                  <span className="w-24 text-sm font-medium">{finish}</span>
                  <span className="text-sm text-gray-500">${data?.mostCommonPrice || '0.00'}</span>
                  <div className="flex-1" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="New price"
                    value={optionInputs[finish] || ''}
                    onChange={(e) => setOptionInputs(prev => ({ ...prev, [finish]: e.target.value }))}
                    className="w-24 px-2 py-1 border rounded text-sm"
                    data-testid={`input-option-${finish.toLowerCase()}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveOptionPrice(finish)}
                    disabled={savingOption === finish || !optionInputs[finish]}
                    data-testid={`button-save-${finish.toLowerCase()}`}
                  >
                    {savingOption === finish ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Set'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Pricing Spreadsheet */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Product Pricing Spreadsheet</h3>
            <span className="text-sm text-gray-500">({filteredProducts.length} products)</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded-lg text-sm w-64"
              data-testid="input-search-products"
            />
            <Package className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Product</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Base Price</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Tier Mode</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Tier 1</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Tier 2</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Tier 3</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Vinyl</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Foil</th>
                <th className="text-center px-3 py-2 font-medium text-gray-700 whitespace-nowrap">Holo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const tier1 = product.tiers[0];
                const tier2 = product.tiers[1];
                const tier3 = product.tiers[2];
                const vinyl = product.materials.find(m => m.name === 'Vinyl');
                const foil = product.materials.find(m => m.name === 'Foil');
                const holo = product.materials.find(m => m.name === 'Holographic');
                
                const globalTier1 = globalTiers.find(t => t.tierNumber === 1);
                const globalTier2 = globalTiers.find(t => t.tierNumber === 2);
                const globalTier3 = globalTiers.find(t => t.tierNumber === 3);
                
                const basePrice = parseFloat(product.basePrice);
                
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 ${!product.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 truncate max-w-48">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.categoryName}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {editingCell?.productId === product.id && editingCell.field === 'basePrice' ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            onBlur={handleCellSave}
                            autoFocus
                            className="w-20 px-1 py-0.5 border rounded text-center text-sm"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCellEdit(product.id, 'basePrice', product.basePrice)}
                          className="px-2 py-0.5 rounded hover:bg-blue-100 font-mono"
                          data-testid={`cell-base-price-${product.id}`}
                        >
                          ${parseFloat(product.basePrice).toFixed(4)}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleToggleGlobalTiers(product.id, !product.useGlobalTiers)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.useGlobalTiers 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                        data-testid={`toggle-global-${product.id}`}
                      >
                        {product.useGlobalTiers ? 'Global' : 'Custom'}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm">
                      {product.useGlobalTiers ? (
                        <span className="text-green-600">{globalTier1?.discountPercent || 0}% off</span>
                      ) : tier1 ? (
                        editingCell?.productId === product.id && editingCell.field === 'tierPrice' && editingCell.tierId === tier1.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            onBlur={handleCellSave}
                            autoFocus
                            className="w-16 px-1 py-0.5 border rounded text-center text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => handleCellEdit(product.id, 'tierPrice', tier1.pricePerUnit, tier1.id)}
                            className="px-1 py-0.5 rounded hover:bg-blue-100"
                          >
                            ${parseFloat(tier1.pricePerUnit).toFixed(4)}
                          </button>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm">
                      {product.useGlobalTiers ? (
                        <span className="text-green-600">{globalTier2?.discountPercent || 0}% off</span>
                      ) : tier2 ? (
                        editingCell?.productId === product.id && editingCell.field === 'tierPrice' && editingCell.tierId === tier2.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            onBlur={handleCellSave}
                            autoFocus
                            className="w-16 px-1 py-0.5 border rounded text-center text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => handleCellEdit(product.id, 'tierPrice', tier2.pricePerUnit, tier2.id)}
                            className="px-1 py-0.5 rounded hover:bg-blue-100"
                          >
                            ${parseFloat(tier2.pricePerUnit).toFixed(4)}
                          </button>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm">
                      {product.useGlobalTiers ? (
                        <span className="text-green-600">{globalTier3?.discountPercent || 0}% off</span>
                      ) : tier3 ? (
                        editingCell?.productId === product.id && editingCell.field === 'tierPrice' && editingCell.tierId === tier3.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                            onBlur={handleCellSave}
                            autoFocus
                            className="w-16 px-1 py-0.5 border rounded text-center text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => handleCellEdit(product.id, 'tierPrice', tier3.pricePerUnit, tier3.id)}
                            className="px-1 py-0.5 rounded hover:bg-blue-100"
                          >
                            ${parseFloat(tier3.pricePerUnit).toFixed(4)}
                          </button>
                        )
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm text-gray-600">
                      {vinyl ? `+$${parseFloat(vinyl.priceModifier).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm text-gray-600">
                      {foil ? `+$${parseFloat(foil.priceModifier).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-sm text-gray-600">
                      {holo ? `+$${parseFloat(holo.priceModifier).toFixed(2)}` : '-'}
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">How pricing works</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• <strong>Global Tiers</strong>: Set default discount percentages that apply to most products</li>
              <li>• <strong>Custom Tiers</strong>: Click "Global" to switch to custom pricing for specific products</li>
              <li>• <strong>Click any price</strong> in the spreadsheet to edit it directly</li>
              <li>• <strong>Material/Finish add-ons</strong> are added on top of the base price per sticker</li>
              <li>• Bulk discounts automatically apply to both base price AND add-ons</li>
            </ul>
          </div>
        </div>
      </div>
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

              {/* Bulk Pricing Tiers */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Bulk Pricing Tiers
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Set up to 3 quantity-based discounts (customers see these on product pages)
                </p>
                <div className="space-y-3">
                  {formData.pricingTiers.map((tier, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 w-16">Tier {index + 1}:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          placeholder="Min"
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const newTiers = [...formData.pricingTiers];
                            newTiers[index].minQuantity = e.target.value;
                            setFormData({ ...formData, pricingTiers: newTiers });
                          }}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          data-testid={`input-tier-${index}-min`}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          min="1"
                          placeholder={index === formData.pricingTiers.length - 1 ? "Max qty" : "Max"}
                          value={tier.maxQuantity}
                          onChange={(e) => {
                            const newTiers = [...formData.pricingTiers];
                            newTiers[index].maxQuantity = e.target.value;
                            setFormData({ ...formData, pricingTiers: newTiers });
                          }}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          data-testid={`input-tier-${index}-max`}
                        />
                        <span className="text-gray-500 text-sm">units</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          placeholder="0.0000"
                          value={tier.pricePerUnit}
                          onChange={(e) => {
                            const newTiers = [...formData.pricingTiers];
                            newTiers[index].pricePerUnit = e.target.value;
                            setFormData({ ...formData, pricingTiers: newTiers });
                          }}
                          className="w-24 px-2 py-1 border rounded text-sm"
                          data-testid={`input-tier-${index}-price`}
                        />
                        <span className="text-gray-500 text-sm">each</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Leave fields empty to disable a tier. Price per unit should be lower than base price for discounts.
                </p>
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