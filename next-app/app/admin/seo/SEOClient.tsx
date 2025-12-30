"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Lightbulb,
  FileText,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
}

interface SEOData {
  settings: Record<string, any>;
  products: Product[];
}

interface TooltipProps {
  title: string;
  children: React.ReactNode;
}

function Tooltip({ title, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="text-gray-400 hover:text-gray-600 ml-1"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        data-testid="button-tooltip"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {show && (
        <div className="absolute z-50 left-full ml-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="font-medium mb-1">{title}</div>
          <div className="text-gray-300">{children}</div>
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );
}

function CharacterCounter({ current, optimal, max }: { current: number; optimal: number; max: number }) {
  const color = current === 0 ? "text-red-500" : current <= optimal ? "text-green-600" : current <= max ? "text-yellow-600" : "text-red-500";
  return (
    <span className={`text-xs ${color}`}>
      {current}/{optimal} chars {current > max && "(too long!)"}
    </span>
  );
}

function getSEOStatus(metaTitle: string | null, metaDescription: string | null, description: string | null) {
  const hasTitle = !!metaTitle && metaTitle.length > 0;
  const hasDescription = !!metaDescription && metaDescription.length > 0;
  const titleOk = hasTitle && metaTitle.length >= 30 && metaTitle.length <= 60;
  const descOk = hasDescription && metaDescription.length >= 120 && metaDescription.length <= 160;

  if (titleOk && descOk) return { status: "complete", color: "bg-green-100 text-green-800", icon: CheckCircle2 };
  if (hasTitle || hasDescription) return { status: "partial", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle };
  if (description && description.length > 50) return { status: "auto", color: "bg-blue-100 text-blue-800", icon: Info };
  return { status: "missing", color: "bg-red-100 text-red-800", icon: AlertCircle };
}

function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  const displayTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  const displayDesc = description.length > 160 ? description.substring(0, 157) + "..." : description;
  
  return (
    <div className="bg-white border rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">Preview in Google Search Results:</p>
      <div className="space-y-1">
        <p className="text-blue-800 text-lg hover:underline cursor-pointer truncate">{displayTitle || "Page Title"}</p>
        <p className="text-green-700 text-sm truncate">{url}</p>
        <p className="text-gray-600 text-sm line-clamp-2">{displayDesc || "Add a meta description to control what appears here..."}</p>
      </div>
    </div>
  );
}

export default function SEOClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: number; metaTitle: string; metaDescription: string } | null>(null);
  const [siteForm, setSiteForm] = useState({
    siteTitle: "",
    siteTagline: "",
    siteDescription: "",
    ogImage: "",
    googleAnalyticsId: "",
    businessName: "",
    businessAddress: "",
  });
  const [siteFormLoaded, setSiteFormLoaded] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const { data, isLoading } = useQuery<SEOData>({
    queryKey: ["/api/admin/seo"],
  });

  const saveSiteMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await fetch("/api/admin/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo"] });
      toast({ title: "Site SEO settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: async ({ id, metaTitle, metaDescription }: { id: number; metaTitle: string; metaDescription: string }) => {
      const res = await fetch(`/api/admin/seo/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ metaTitle, metaDescription }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo"] });
      setEditingProduct(null);
      toast({ title: "Product SEO updated" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  useMemo(() => {
    if (data?.settings && !siteFormLoaded) {
      setSiteForm({
        siteTitle: data.settings.siteTitle || "",
        siteTagline: data.settings.siteTagline || "",
        siteDescription: data.settings.siteDescription || "",
        ogImage: data.settings.ogImage || "",
        googleAnalyticsId: data.settings.googleAnalyticsId || "",
        businessName: data.settings.businessName || "",
        businessAddress: data.settings.businessAddress || "",
      });
      setSiteFormLoaded(true);
    }
  }, [data?.settings, siteFormLoaded]);

  const healthScore = useMemo(() => {
    if (!data?.products) return 0;
    const products = data.products.filter(p => p.isActive);
    if (products.length === 0) return 100;

    let score = 0;
    let total = 0;

    if (siteForm.siteTitle) score += 20;
    total += 20;
    if (siteForm.siteDescription) score += 15;
    total += 15;
    if (siteForm.googleAnalyticsId) score += 10;
    total += 10;

    products.forEach(p => {
      const hasTitle = !!p.metaTitle && p.metaTitle.length >= 30;
      const hasDesc = !!p.metaDescription && p.metaDescription.length >= 100;
      if (hasTitle) score += 1;
      if (hasDesc) score += 1;
      total += 2;
    });

    return Math.round((score / total) * 100);
  }, [data?.products, siteForm]);

  const issues = useMemo(() => {
    const list: { type: "error" | "warning"; message: string }[] = [];
    
    if (!siteForm.siteTitle) list.push({ type: "error", message: "Site title is missing" });
    if (!siteForm.siteDescription) list.push({ type: "warning", message: "Site description is missing" });
    if (!siteForm.googleAnalyticsId) list.push({ type: "warning", message: "Google Analytics not configured" });

    data?.products?.filter(p => p.isActive).forEach(p => {
      if (!p.metaTitle && !p.metaDescription) {
        list.push({ type: "error", message: `"${p.name}" has no SEO data` });
      } else if (!p.metaTitle || !p.metaDescription) {
        list.push({ type: "warning", message: `"${p.name}" has incomplete SEO` });
      }
    });

    return list;
  }, [data?.products, siteForm]);

  const saveSiteSettings = () => {
    Object.entries(siteForm).forEach(([key, value]) => {
      saveSiteMutation.mutate({ key, value });
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-40 bg-gray-200 rounded" />
            <div className="h-60 bg-gray-200 rounded" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Search className="h-7 w-7 text-blue-600" />
              SEO Manager
            </h1>
            <p className="text-gray-600">Optimize your site for search engines</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowGuide(!showGuide)}
            className="gap-2"
            data-testid="button-toggle-guide"
          >
            <Lightbulb className="h-4 w-4" />
            {showGuide ? "Hide" : "Show"} SEO Guide
          </Button>
        </div>

        {showGuide && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick SEO Guide for Beginners
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setShowGuide(false)} data-testid="button-close-guide">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">What is SEO?</h3>
                <p className="text-gray-600">
                  SEO (Search Engine Optimization) helps your website show up when people search on Google. 
                  Better SEO = more customers finding you!
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Why does it matter?</h3>
                <p className="text-gray-600">
                  When someone Googles "custom stickers near me," you want YOUR site to appear. 
                  Good SEO makes that happen without paying for ads.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Meta Title (50-60 characters)</h3>
                <p className="text-gray-600">
                  The clickable headline in search results. Make it catchy but include keywords like 
                  "custom stickers" or "business cards."
                </p>
                <p className="text-xs text-blue-600 font-medium">Good: "Custom Vinyl Stickers | Fast Printing | Sticky Banditos"</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Meta Description (150-160 characters)</h3>
                <p className="text-gray-600">
                  The preview text under your title in Google. Tell people WHY to click your site. 
                  Mention benefits like "free shipping" or "fast turnaround."
                </p>
                <p className="text-xs text-blue-600 font-medium">Good: "Order custom die-cut stickers with free design tools. High-quality vinyl, fast shipping. Perfect for businesses and artists!"</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-yellow-800">Pro Tip:</p>
              <p className="text-yellow-700">Focus on completing the products that get the most traffic first. Aim for 100% on your health score!</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">SEO Health Score</span>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-4xl font-bold ${healthScore >= 80 ? "text-green-600" : healthScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                  {healthScore}%
                </span>
                {healthScore >= 80 ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : healthScore >= 50 ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${healthScore >= 80 ? "bg-green-500" : healthScore >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {healthScore >= 80 ? "Great job! Your SEO is in good shape." : healthScore >= 50 ? "Getting there! Complete the items below." : "Needs attention. Fix the issues below."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">Issues Found</span>
              <AlertCircle className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {issues.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">No issues found!</span>
                </div>
              ) : (
                issues.slice(0, 4).map((issue, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${issue.type === "error" ? "text-red-600" : "text-yellow-600"}`}>
                    {issue.type === "error" ? <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                    <span>{issue.message}</span>
                  </div>
                ))
              )}
              {issues.length > 4 && (
                <p className="text-xs text-gray-500">+{issues.length - 4} more issues</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">Products Status</span>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {(() => {
                const products = data?.products?.filter(p => p.isActive) || [];
                const complete = products.filter(p => p.metaTitle && p.metaDescription).length;
                const partial = products.filter(p => (p.metaTitle || p.metaDescription) && !(p.metaTitle && p.metaDescription)).length;
                const missing = products.filter(p => !p.metaTitle && !p.metaDescription).length;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Complete</span>
                      <Badge className="bg-green-100 text-green-800">{complete}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Partial</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{partial}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Missing</span>
                      <Badge className="bg-red-100 text-red-800">{missing}</Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Site-Wide SEO Settings
              <Tooltip title="What are site-wide settings?">
                These apply to your entire website - your homepage and any pages that don&apos;t have their own custom SEO.
              </Tooltip>
            </h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Site Title
                  <Tooltip title="Your site's name in search results">
                    This appears in browser tabs and search results. Keep it short and memorable.
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.siteTitle}
                  onChange={(e) => setSiteForm({ ...siteForm, siteTitle: e.target.value })}
                  placeholder="e.g., Sticky Banditos - Custom Printing"
                  data-testid="input-site-title"
                />
                <CharacterCounter current={siteForm.siteTitle.length} optimal={60} max={70} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Tagline
                  <Tooltip title="A short slogan for your business">
                    Often shown alongside your site title. Think of it as a quick pitch.
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.siteTagline}
                  onChange={(e) => setSiteForm({ ...siteForm, siteTagline: e.target.value })}
                  placeholder="e.g., Premium Custom Stickers & More"
                  data-testid="input-tagline"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Site Description
                <Tooltip title="Your homepage's description in Google">
                  This shows up under your site name in search results. Make it compelling!
                </Tooltip>
              </label>
              <Textarea
                value={siteForm.siteDescription}
                onChange={(e) => setSiteForm({ ...siteForm, siteDescription: e.target.value })}
                placeholder="Describe your business in 1-2 sentences. Include keywords like 'custom stickers', 'fast shipping', etc."
                className="min-h-20"
                data-testid="textarea-site-description"
              />
              <CharacterCounter current={siteForm.siteDescription.length} optimal={160} max={200} />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Google Analytics ID
                  <Tooltip title="Track your website visitors">
                    Get this from Google Analytics (format: G-XXXXXXXXXX). It helps you see how people find and use your site.
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.googleAnalyticsId}
                  onChange={(e) => setSiteForm({ ...siteForm, googleAnalyticsId: e.target.value })}
                  placeholder="e.g., G-ABC123XYZ"
                  data-testid="input-ga-id"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Default Social Image URL
                  <Tooltip title="Image shown when sharing on social media">
                    When someone shares your site on Facebook/Twitter, this image appears. Use a high-quality image (1200x630 recommended).
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.ogImage}
                  onChange={(e) => setSiteForm({ ...siteForm, ogImage: e.target.value })}
                  placeholder="https://example.com/social-image.jpg"
                  data-testid="input-og-image"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Business Name
                  <Tooltip title="Your official business name">
                    Used for local SEO and Google Business listings.
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.businessName}
                  onChange={(e) => setSiteForm({ ...siteForm, businessName: e.target.value })}
                  placeholder="e.g., Sticky Banditos Printing Company"
                  data-testid="input-business-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Business Address
                  <Tooltip title="Your physical location">
                    Helps with local search results and appears in Google Maps.
                  </Tooltip>
                </label>
                <Input
                  value={siteForm.businessAddress}
                  onChange={(e) => setSiteForm({ ...siteForm, businessAddress: e.target.value })}
                  placeholder="e.g., 1607 W Friess Dr, Phoenix, AZ"
                  data-testid="input-business-address"
                />
              </div>
            </div>

            <GooglePreview
              title={siteForm.siteTitle || "Your Site Title"}
              description={siteForm.siteDescription || "Your site description will appear here..."}
              url="https://stickybanditos.com"
            />

            <Button
              onClick={saveSiteSettings}
              disabled={saveSiteMutation.isPending}
              className="gap-2"
              data-testid="button-save-site-seo"
            >
              <Save className="h-4 w-4" />
              {saveSiteMutation.isPending ? "Saving..." : "Save Site Settings"}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Product SEO
              <Tooltip title="SEO for each product page">
                Each product should have its own title and description. This helps people find specific products when searching.
              </Tooltip>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Click on a product to edit its SEO settings</p>
          </div>
          <div className="divide-y">
            {data?.products?.filter(p => p.isActive).map((product) => {
              const seoStatus = getSEOStatus(product.metaTitle, product.metaDescription, product.description);
              const StatusIcon = seoStatus.icon;
              const isExpanded = expandedProduct === product.id;
              const isEditing = editingProduct?.id === product.id;

              return (
                <div key={product.id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedProduct(null);
                        setEditingProduct(null);
                      } else {
                        setExpandedProduct(product.id);
                        setEditingProduct({
                          id: product.id,
                          metaTitle: product.metaTitle || "",
                          metaDescription: product.metaDescription || "",
                        });
                      }
                    }}
                    data-testid={`row-product-${product.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {product.thumbnailUrl && (
                        <img src={product.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">/{product.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={seoStatus.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {seoStatus.status === "complete" ? "Complete" : seoStatus.status === "partial" ? "Partial" : seoStatus.status === "auto" ? "Using Fallback" : "Missing"}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && isEditing && (
                    <div className="px-4 pb-4 space-y-4 bg-gray-50">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Meta Title
                          <Tooltip title="The product's title in search results">
                            Include the product name and a benefit. Example: &quot;Custom Die-Cut Stickers | Waterproof Vinyl&quot;
                          </Tooltip>
                        </label>
                        <Input
                          value={editingProduct.metaTitle}
                          onChange={(e) => setEditingProduct({ ...editingProduct, metaTitle: e.target.value })}
                          placeholder={`e.g., ${product.name} | Custom Printing | Sticky Banditos`}
                          data-testid={`input-meta-title-${product.id}`}
                        />
                        <CharacterCounter current={editingProduct.metaTitle.length} optimal={60} max={70} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          Meta Description
                          <Tooltip title="The product's description in Google">
                            Describe what makes this product special. Include keywords and a call to action!
                          </Tooltip>
                        </label>
                        <Textarea
                          value={editingProduct.metaDescription}
                          onChange={(e) => setEditingProduct({ ...editingProduct, metaDescription: e.target.value })}
                          placeholder="Describe this product with benefits and a call to action..."
                          className="min-h-20"
                          data-testid={`textarea-meta-desc-${product.id}`}
                        />
                        <CharacterCounter current={editingProduct.metaDescription.length} optimal={160} max={200} />
                      </div>

                      <GooglePreview
                        title={editingProduct.metaTitle || product.name}
                        description={editingProduct.metaDescription || product.description || ""}
                        url={`https://stickybanditos.com/products/${product.slug}`}
                      />

                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveProductMutation.mutate(editingProduct)}
                          disabled={saveProductMutation.isPending}
                          className="gap-2"
                          data-testid={`button-save-product-${product.id}`}
                        >
                          <Save className="h-4 w-4" />
                          {saveProductMutation.isPending ? "Saving..." : "Save Product SEO"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setExpandedProduct(null);
                            setEditingProduct(null);
                          }}
                          data-testid={`button-cancel-${product.id}`}
                        >
                          Cancel
                        </Button>
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto"
                        >
                          <Button variant="ghost" size="sm" className="gap-1" data-testid={`link-view-product-${product.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            View Product
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
