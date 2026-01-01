"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Mail, Save, RefreshCw, Palette, Building, Phone, MapPin, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface ReceiptSettings {
  headerColor: string;
  logoUrl: string;
  companyName: string;
  supportEmail: string;
  companyAddress: string;
  companyPhone: string;
  footerMessage: string;
  thankYouMessage: string;
}

const defaultSettings: ReceiptSettings = {
  headerColor: '#1a1a1a',
  logoUrl: '',
  companyName: 'Sticky Banditos Printing Company',
  supportEmail: 'mhobbs.stickybanditos@gmail.com',
  companyAddress: '2 North 35th Ave, Phoenix, AZ 85009',
  companyPhone: '602-554-5338',
  footerMessage: 'Questions about your order? Contact us at',
  thankYouMessage: 'Thank you for your order!',
};

export default function ReceiptSettingsClient() {
  const [formData, setFormData] = useState<ReceiptSettings>(defaultSettings);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<ReceiptSettings>({
    queryKey: ["/api/admin/settings/receipt"],
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: ReceiptSettings) => {
      const res = await fetch("/api/admin/settings/receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save settings");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/receipt"] });
      toast({ title: "Receipt template saved successfully" });
    },
    onError: (error: Error) => toast({ 
      title: "Failed to save settings", 
      description: error.message,
      variant: "destructive" 
    }),
  });

  const handleChange = (field: keyof ReceiptSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData(defaultSettings);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-7 w-7 text-orange-500" />
            Receipt Email Template
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Customize the order confirmation emails sent to customers
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Branding
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Header Background Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.headerColor}
                    onChange={(e) => handleChange('headerColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                    data-testid="input-header-color"
                  />
                  <input
                    type="text"
                    value={formData.headerColor}
                    onChange={(e) => handleChange('headerColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                    placeholder="#1a1a1a"
                    data-testid="input-header-color-text"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo URL (optional)</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="https://example.com/logo.png"
                  data-testid="input-logo-url"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to use default logo</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              Company Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Your Company Name"
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="support@example.com"
                    data-testid="input-support-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => handleChange('companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="555-555-5555"
                    data-testid="input-company-phone"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Company Address
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="123 Main St, City, State 12345"
                  data-testid="input-company-address"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Messages
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Thank You Message
                </label>
                <input
                  type="text"
                  value={formData.thankYouMessage}
                  onChange={(e) => handleChange('thankYouMessage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Thank you for your order!"
                  data-testid="input-thank-you-message"
                />
                <p className="text-xs text-gray-500 mt-1">Shown below the order confirmation title</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Footer Message</label>
                <input
                  type="text"
                  value={formData.footerMessage}
                  onChange={(e) => handleChange('footerMessage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Questions about your order? Contact us at"
                  data-testid="input-footer-message"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed above your support email in the footer</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-50 border-dashed">
            <h2 className="text-lg font-semibold mb-4">Email Preview</h2>
            <div className="bg-white rounded-lg border overflow-hidden max-w-md mx-auto">
              <div 
                className="p-4 text-center" 
                style={{ backgroundColor: formData.headerColor }}
              >
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="h-12 mx-auto" />
                ) : (
                  <span className="text-white font-bold text-lg">{formData.companyName}</span>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="font-bold text-lg">Order Confirmation</h3>
                <p className="text-gray-600 text-sm">{formData.thankYouMessage}</p>
              </div>
              <div className="px-4 pb-4 text-center">
                <div className="bg-gray-100 rounded p-3 inline-block">
                  <span className="text-gray-500 text-sm">Order Number</span><br/>
                  <span className="font-bold">#SB-123456</span>
                </div>
              </div>
              <div className="bg-gray-100 p-4 text-center text-sm">
                <p className="text-gray-600 mb-2">
                  {formData.footerMessage}<br/>
                  <a href="#" className="text-blue-600">{formData.supportEmail}</a>
                </p>
                <p className="text-gray-500 text-xs">
                  {formData.companyName}<br/>
                  {formData.companyAddress}<br/>
                  {formData.companyPhone}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReset} data-testid="button-reset-settings">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-save-settings"
            >
              {saveMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
