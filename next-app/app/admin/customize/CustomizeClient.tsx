"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, RotateCcw, Sparkles, Home, Layers, Tag, 
  Package, Megaphone, Palette, Eye, EyeOff, User, UserX,
  Star, Sticker, Circle, X, Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HomepageSettings, ThemeSettings } from "@/lib/homepage-settings";
import { defaultHomepageSettings, defaultThemeSettings } from "@/lib/homepage-settings";
import SectionPreview from "@/components/admin/SectionPreview";

export default function CustomizeClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hero");
  const [heroView, setHeroView] = useState<"loggedIn" | "loggedOut">("loggedOut");

  const { data: settings, isLoading } = useQuery<HomepageSettings>({
    queryKey: ["/api/admin/settings/homepage"],
  });

  const { data: themeSettings } = useQuery<ThemeSettings>({
    queryKey: ["/api/admin/settings/theme"],
  });

  interface Product {
    id: number;
    name: string;
    slug: string;
    basePrice: string;
    thumbnailUrl?: string;
    categoryId: number;
  }

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const stickerProducts = products?.filter(p => p.categoryId === 1) || [];

  const [formData, setFormData] = useState<HomepageSettings | null>(null);
  const [themeFormData, setThemeFormData] = useState<ThemeSettings | null>(null);

  const currentSettings = formData || settings || defaultHomepageSettings;
  const currentTheme = themeFormData || themeSettings || defaultThemeSettings;

  const saveMutation = useMutation({
    mutationFn: async (data: HomepageSettings) => {
      const response = await fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/homepage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/homepage"] });
      toast({ title: "Saved!", description: "Homepage settings updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/settings/homepage", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset");
      return response.json();
    },
    onSuccess: () => {
      setFormData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/homepage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/homepage"] });
      toast({ title: "Reset!", description: "Homepage restored to default settings." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset settings.", variant: "destructive" });
    },
  });

  const saveThemeMutation = useMutation({
    mutationFn: async (data: ThemeSettings) => {
      const response = await fetch("/api/admin/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/theme"] });
      toast({ title: "Theme Saved!", description: "Color scheme updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save theme.", variant: "destructive" });
    },
  });

  const resetThemeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/settings/theme", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to reset");
      return response.json();
    },
    onSuccess: () => {
      setThemeFormData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/theme"] });
      toast({ title: "Theme Reset!", description: "Colors restored to defaults." });
    },
  });

  const updateField = (path: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(currentSettings));
    const keys = path.split(".");
    let obj = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setFormData(newData);
  };

  const updateThemeField = (field: keyof ThemeSettings, value: string) => {
    setThemeFormData({ ...currentTheme, [field]: value });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Site Customization</h1>
            <p className="text-gray-600 text-sm md:text-base">Edit homepage content and site colors</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              data-testid="button-reset-homepage"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(currentSettings)}
              disabled={saveMutation.isPending}
              data-testid="button-save-homepage"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-6 h-auto">
            <TabsTrigger value="hero" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Home className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Hero</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="stickers" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Layers className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Stickers</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Tag className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Labels</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Package className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Popular</span>
            </TabsTrigger>
            <TabsTrigger value="cta" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Megaphone className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">CTA</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-1 text-xs md:text-sm py-2">
              <Palette className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Colors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Hero Section
                </CardTitle>
                <CardDescription>
                  The main banner at the top of your homepage. There are two versions - one for logged-in users and one for visitors.
                </CardDescription>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={heroView === "loggedOut" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHeroView("loggedOut")}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Visitor View
                  </Button>
                  <Button
                    variant={heroView === "loggedIn" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHeroView("loggedIn")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Logged-In View
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Top Badge Text</Label>
                  <Input
                    value={currentSettings.hero.badge}
                    onChange={(e) => updateField("hero.badge", e.target.value)}
                    placeholder="Premium Quality Printing"
                    data-testid="input-hero-badge"
                  />
                  <p className="text-xs text-gray-500 mt-1">The small badge above the main headline</p>
                </div>

                {heroView === "loggedOut" ? (
                  <>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Badge className="mb-3 bg-orange-100 text-orange-700">Visitor View</Badge>
                      <div className="grid gap-4">
                        <div>
                          <Label>Headline (Top Line)</Label>
                          <Input
                            value={currentSettings.hero.loggedOut.headlineTop}
                            onChange={(e) => updateField("hero.loggedOut.headlineTop", e.target.value)}
                            placeholder="Custom Printing"
                            data-testid="input-hero-headline-top"
                          />
                        </div>
                        <div>
                          <Label>Headline (Bottom Line - Gradient)</Label>
                          <Input
                            value={currentSettings.hero.loggedOut.headlineBottom}
                            onChange={(e) => updateField("hero.loggedOut.headlineBottom", e.target.value)}
                            placeholder="Made Easy"
                            data-testid="input-hero-headline-bottom"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={currentSettings.hero.loggedOut.description}
                            onChange={(e) => updateField("hero.loggedOut.description", e.target.value)}
                            placeholder="From stickers to business cards..."
                            data-testid="input-hero-description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Primary Button</Label>
                            <Input
                              value={currentSettings.hero.loggedOut.primaryButtonText}
                              onChange={(e) => updateField("hero.loggedOut.primaryButtonText", e.target.value)}
                              placeholder="Browse Products"
                            />
                          </div>
                          <div>
                            <Label>Secondary Button</Label>
                            <Input
                              value={currentSettings.hero.loggedOut.secondaryButtonText}
                              onChange={(e) => updateField("hero.loggedOut.secondaryButtonText", e.target.value)}
                              placeholder="Sign In to Start"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Badge className="mb-3 bg-blue-100 text-blue-700">Logged-In View</Badge>
                      <div className="grid gap-4">
                        <div>
                          <Label>Welcome Prefix</Label>
                          <Input
                            value={currentSettings.hero.loggedIn.welcomePrefix}
                            onChange={(e) => updateField("hero.loggedIn.welcomePrefix", e.target.value)}
                            placeholder="Welcome back"
                          />
                          <p className="text-xs text-gray-500 mt-1">This will be followed by the users name</p>
                        </div>
                        <div>
                          <Label>Headline (Gradient)</Label>
                          <Input
                            value={currentSettings.hero.loggedIn.headline}
                            onChange={(e) => updateField("hero.loggedIn.headline", e.target.value)}
                            placeholder="Let's Create"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={currentSettings.hero.loggedIn.description}
                            onChange={(e) => updateField("hero.loggedIn.description", e.target.value)}
                            placeholder="From stickers to business cards..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Primary Button</Label>
                            <Input
                              value={currentSettings.hero.loggedIn.primaryButtonText}
                              onChange={(e) => updateField("hero.loggedIn.primaryButtonText", e.target.value)}
                              placeholder="Browse Products"
                            />
                          </div>
                          <div>
                            <Label>Secondary Button</Label>
                            <Input
                              value={currentSettings.hero.loggedIn.secondaryButtonText}
                              onChange={(e) => updateField("hero.loggedIn.secondaryButtonText", e.target.value)}
                              placeholder="My Account"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <SectionPreview section="hero" settings={currentSettings} heroView={heroView} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Features Section
                </CardTitle>
                <CardDescription>
                  The four feature cards shown below the hero section highlighting your key benefits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {currentSettings.features.cards.map((card, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">Card {index + 1}</Badge>
                      </div>
                      <div className="grid gap-3">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={card.title}
                            onChange={(e) => {
                              const newCards = [...currentSettings.features.cards];
                              newCards[index] = { ...card, title: e.target.value };
                              updateField("features.cards", newCards);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={card.description}
                            onChange={(e) => {
                              const newCards = [...currentSettings.features.cards];
                              newCards[index] = { ...card, description: e.target.value };
                              updateField("features.cards", newCards);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionPreview section="features" settings={currentSettings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stickers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Custom Stickers Section
                  </CardTitle>
                  <CardDescription>
                    The showcase section with floating sticker cards and the main call-to-action.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Section Title</Label>
                      <Input
                        value={currentSettings.customStickers.title}
                        onChange={(e) => updateField("customStickers.title", e.target.value)}
                        placeholder="Custom Stickers"
                      />
                    </div>
                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={currentSettings.customStickers.subtitle}
                        onChange={(e) => updateField("customStickers.subtitle", e.target.value)}
                        placeholder="Stick it anywhere. Make it yours."
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-900 mb-3">Center Card (Main CTA)</p>
                    <div className="grid gap-3">
                      <div>
                        <Label>Card Title</Label>
                        <Input
                          value={currentSettings.customStickers.cardTitle}
                          onChange={(e) => updateField("customStickers.cardTitle", e.target.value)}
                          placeholder="Die-Cut, Circles, Sheets & More"
                          data-testid="input-stickers-card-title"
                        />
                      </div>
                      <div>
                        <Label>Price/Subtitle Text</Label>
                        <Input
                          value={currentSettings.customStickers.cardSubtitle}
                          onChange={(e) => updateField("customStickers.cardSubtitle", e.target.value)}
                          placeholder="Starting at just $0.10/sticker"
                          data-testid="input-stickers-card-subtitle"
                        />
                        <p className="text-xs text-orange-700 mt-1">This is the price text shown on the card</p>
                      </div>
                      <div>
                        <Label>Button Text</Label>
                        <Input
                          value={currentSettings.customStickers.buttonText}
                          onChange={(e) => updateField("customStickers.buttonText", e.target.value)}
                          placeholder="Design Your Stickers"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-3">Featured Products (Floating Cards)</p>
                    <p className="text-xs text-blue-700 mb-3">Select up to 6 sticker products to display as floating cards in this section. Leave empty to show the first 6 stickers automatically.</p>
                    
                    <div className="space-y-2">
                      {(currentSettings.customStickers.featuredProductIds || []).map((productId, idx) => {
                        const product = stickerProducts.find(p => p.id === productId);
                        return (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                            <span className="flex-1 text-sm truncate">{product?.name || `Product ID: ${productId}`}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                const newIds = (currentSettings.customStickers.featuredProductIds || []).filter((_, i) => i !== idx);
                                updateField("customStickers.featuredProductIds", newIds);
                              }}
                              data-testid={`button-remove-featured-${idx}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                      
                      {(currentSettings.customStickers.featuredProductIds || []).length < 6 && (
                        <Select
                          key={`featured-select-${(currentSettings.customStickers.featuredProductIds || []).join('-')}`}
                          onValueChange={(value) => {
                            const productId = parseInt(value);
                            const currentIds = currentSettings.customStickers.featuredProductIds || [];
                            if (!currentIds.includes(productId)) {
                              updateField("customStickers.featuredProductIds", [...currentIds, productId]);
                            }
                          }}
                        >
                          <SelectTrigger data-testid="select-add-featured-product">
                            <SelectValue placeholder="Add a product..." />
                          </SelectTrigger>
                          <SelectContent>
                            {stickerProducts
                              .filter(p => !(currentSettings.customStickers.featuredProductIds || []).includes(p.id))
                              .map(product => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} - ${parseFloat(product.basePrice).toFixed(2)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Stickers That Stick Section
                  </CardTitle>
                  <CardDescription>
                    The feature section with bullet points and large sticker visual.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Badge Text</Label>
                      <Input
                        value={currentSettings.stickersThatStick.badge}
                        onChange={(e) => updateField("stickersThatStick.badge", e.target.value)}
                        placeholder="Premium Quality"
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={currentSettings.stickersThatStick.title}
                        onChange={(e) => updateField("stickersThatStick.title", e.target.value)}
                        placeholder="Stickers That Stick"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={currentSettings.stickersThatStick.description}
                      onChange={(e) => updateField("stickersThatStick.description", e.target.value)}
                      placeholder="From branding to personal expression..."
                    />
                  </div>
                  <div>
                    <Label>Feature Bullet Points (one per line)</Label>
                    <Textarea
                      value={currentSettings.stickersThatStick.features.join("\n")}
                      onChange={(e) => updateField("stickersThatStick.features", e.target.value.split("\n").filter(Boolean))}
                      placeholder="Full-color, high-resolution printing"
                      rows={3}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Button Text</Label>
                      <Input
                        value={currentSettings.stickersThatStick.buttonText}
                        onChange={(e) => updateField("stickersThatStick.buttonText", e.target.value)}
                        placeholder="Browse Stickers"
                      />
                    </div>
                    <div>
                      <Label>Price Display</Label>
                      <Input
                        value={currentSettings.stickersThatStick.priceText}
                        onChange={(e) => updateField("stickersThatStick.priceText", e.target.value)}
                        placeholder="From $0.10/sticker"
                        data-testid="input-stickers-price"
                      />
                      <p className="text-xs text-gray-500 mt-1">Shown on the sticker card visual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SectionPreview section="stickers" settings={currentSettings} products={stickerProducts} />
            </div>
          </TabsContent>

          <TabsContent value="labels">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Labels Section
                </CardTitle>
                <CardDescription>
                  The dark section showcasing product labels, bottle labels, and packaging options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Badge Text</Label>
                    <Input
                      value={currentSettings.labels.badge}
                      onChange={(e) => updateField("labels.badge", e.target.value)}
                      placeholder="For Your Business"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={currentSettings.labels.title}
                      onChange={(e) => updateField("labels.title", e.target.value)}
                      placeholder="Labels That Make An Impression"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentSettings.labels.description}
                    onChange={(e) => updateField("labels.description", e.target.value)}
                    placeholder="Professional labels for products..."
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Label Cards</Label>
                  {currentSettings.labels.cards.map((card, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">Card {index + 1}</Badge>
                        {card.isPopular && <Badge className="bg-yellow-100 text-yellow-800">Popular</Badge>}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label>Title</Label>
                          <Input
                            value={card.title}
                            onChange={(e) => {
                              const newCards = [...currentSettings.labels.cards];
                              newCards[index] = { ...card, title: e.target.value };
                              updateField("labels.cards", newCards);
                            }}
                          />
                        </div>
                        <div>
                          <Label>Subtitle</Label>
                          <Input
                            value={card.subtitle}
                            onChange={(e) => {
                              const newCards = [...currentSettings.labels.cards];
                              newCards[index] = { ...card, subtitle: e.target.value };
                              updateField("labels.cards", newCards);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Button</Label>
                    <Input
                      value={currentSettings.labels.primaryButtonText}
                      onChange={(e) => updateField("labels.primaryButtonText", e.target.value)}
                      placeholder="Shop Labels"
                    />
                  </div>
                  <div>
                    <Label>Secondary Button</Label>
                    <Input
                      value={currentSettings.labels.secondaryButtonText}
                      onChange={(e) => updateField("labels.secondaryButtonText", e.target.value)}
                      placeholder="Shop Bottle Labels"
                    />
                  </div>
                </div>

                <SectionPreview section="labels" settings={currentSettings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popular">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Popular Products Section
                </CardTitle>
                <CardDescription>
                  The product cards highlighting your most popular offerings. These should focus on STICKER products only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Section Title</Label>
                    <Input
                      value={currentSettings.popularProducts.title}
                      onChange={(e) => updateField("popularProducts.title", e.target.value)}
                      placeholder="Popular Products"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={currentSettings.popularProducts.subtitle}
                      onChange={(e) => updateField("popularProducts.subtitle", e.target.value)}
                      placeholder="Start creating with our most loved print products"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Product Cards</Label>
                  {currentSettings.popularProducts.products.map((product, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline">Product {index + 1}</Badge>
                      </div>
                      <div className="grid gap-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label>Product Name</Label>
                            <Input
                              value={product.title}
                              onChange={(e) => {
                                const newProducts = [...currentSettings.popularProducts.products];
                                newProducts[index] = { ...product, title: e.target.value };
                                updateField("popularProducts.products", newProducts);
                              }}
                              data-testid={`input-popular-title-${index}`}
                            />
                          </div>
                          <div>
                            <Label>Price Text</Label>
                            <Input
                              value={product.price}
                              onChange={(e) => {
                                const newProducts = [...currentSettings.popularProducts.products];
                                newProducts[index] = { ...product, price: e.target.value };
                                updateField("popularProducts.products", newProducts);
                              }}
                              placeholder="Starting at $4.99"
                              data-testid={`input-popular-price-${index}`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={product.description}
                            onChange={(e) => {
                              const newProducts = [...currentSettings.popularProducts.products];
                              newProducts[index] = { ...product, description: e.target.value };
                              updateField("popularProducts.products", newProducts);
                            }}
                            data-testid={`input-popular-desc-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <SectionPreview section="popular" settings={currentSettings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cta">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Call to Action Section
                </CardTitle>
                <CardDescription>
                  The final section at the bottom of the homepage encouraging visitors to take action.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={currentSettings.cta.title}
                    onChange={(e) => updateField("cta.title", e.target.value)}
                    placeholder="Ready to Create Something Amazing?"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentSettings.cta.description}
                    onChange={(e) => updateField("cta.description", e.target.value)}
                    placeholder="Join thousands of satisfied customers..."
                  />
                </div>
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={currentSettings.cta.buttonText}
                    onChange={(e) => updateField("cta.buttonText", e.target.value)}
                    placeholder="Start Designing"
                  />
                </div>

                <SectionPreview section="cta" settings={currentSettings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
                <CardDescription>
                  Customize your site colors. Changes will apply site-wide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="color"
                        value={currentTheme.primaryColor}
                        onChange={(e) => updateThemeField("primaryColor", e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={currentTheme.primaryColor}
                        onChange={(e) => updateThemeField("primaryColor", e.target.value)}
                        placeholder="#f97316"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used for buttons, links, and accents</p>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="color"
                        value={currentTheme.accentColor}
                        onChange={(e) => updateThemeField("accentColor", e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={currentTheme.accentColor}
                        onChange={(e) => updateThemeField("accentColor", e.target.value)}
                        placeholder="#fb923c"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Secondary highlight color</p>
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="color"
                        value={currentTheme.backgroundColor}
                        onChange={(e) => updateThemeField("backgroundColor", e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={currentTheme.backgroundColor}
                        onChange={(e) => updateThemeField("backgroundColor", e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Main page background</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => resetThemeMutation.mutate()}
                    disabled={resetThemeMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Colors
                  </Button>
                  <Button 
                    onClick={() => saveThemeMutation.mutate(currentTheme)}
                    disabled={saveThemeMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Colors
                  </Button>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Tip:</strong> Color changes are saved separately from content changes. 
                    After saving, refresh the page to see your new colors applied across the site.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
