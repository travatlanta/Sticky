"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Save, RefreshCw, Palette, Type, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateEmailHtml } from "@/lib/email/template";

type EmailType = 
  | 'order_confirmation'
  | 'artwork_approval'
  | 'ready_for_pickup'
  | 'admin_new_order'
  | 'admin_design_submitted'
  | 'admin_artwork_approved'
  | 'admin_issue_flagged'
  | 'admin_order_paid';

interface EmailTemplate {
  subject: string;
  headline: string;
  subheadline?: string;
  greeting?: string;
  bodyMessage: string;
  ctaButtonText: string;
  ctaButtonColor: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  footerMessage?: string;
  thankYouMessage?: string;
}

interface TemplatesData {
  templates: Record<EmailType, EmailTemplate>;
  emailTypes: EmailType[];
  emailTypeLabels: Record<EmailType, string>;
}

const colorOptions = [
  { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
  { value: 'green', label: 'Green', className: 'bg-green-500' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
  { value: 'red', label: 'Red', className: 'bg-red-500' },
];

const previewVariables: Record<string, string> = {
  '{orderNumber}': 'SB-123456',
  '{customerName}': 'Jane Customer',
  '{customerEmail}': 'jane@example.com',
};

function replaceVariables(text: string): string {
  let result = text;
  for (const [key, value] of Object.entries(previewVariables)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

export default function EmailTemplatesClient() {
  const [selectedType, setSelectedType] = useState<EmailType>('order_confirmation');
  const [formData, setFormData] = useState<EmailTemplate | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteUrl(window.location.origin);
    }
  }, []);

  const { data, isLoading } = useQuery<TemplatesData>({
    queryKey: ["/api/admin/settings/emails"],
  });

  useEffect(() => {
    if (data?.templates && selectedType) {
      setFormData(data.templates[selectedType]);
    }
  }, [data, selectedType]);

  const saveMutation = useMutation({
    mutationFn: async ({ emailType, template }: { emailType: EmailType; template: EmailTemplate }) => {
      const res = await fetch("/api/admin/settings/emails", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailType, template }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save template");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/emails"] });
      toast({ title: "Email template saved successfully" });
    },
    onError: (error: Error) => toast({ 
      title: "Failed to save template", 
      description: error.message,
      variant: "destructive" 
    }),
  });

  const handleChange = (field: keyof EmailTemplate, value: string) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (!formData) return;
    saveMutation.mutate({ emailType: selectedType, template: formData });
  };

  const handleReset = () => {
    if (data?.templates && selectedType) {
      setFormData(data.templates[selectedType]);
    }
  };

  const previewHtml = useMemo(() => {
    if (!formData) return "";
    
    const url = siteUrl || "https://stickybanditos.com";
    const bodyContent = `
      <p style="margin: 0 0 20px 0; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
        ${replaceVariables(formData.bodyMessage)}
      </p>
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; color: #60a5fa; font-size: 18px; font-weight: 700;">Order #SB-123456</p>
        <p style="margin: 8px 0 0 0; color: #9ca3af;">Jane Customer</p>
      </div>
    `;

    return generateEmailHtml({
      preheaderText: replaceVariables(formData.subject),
      headline: replaceVariables(formData.headline),
      subheadline: formData.subheadline ? replaceVariables(formData.subheadline) : undefined,
      greeting: formData.greeting ? replaceVariables(formData.greeting) : undefined,
      bodyContent,
      ctaButton: {
        text: formData.ctaButtonText,
        url: `${url}/orders/123`,
        color: formData.ctaButtonColor,
      },
      customFooterNote: formData.footerMessage ? replaceVariables(formData.footerMessage) : undefined,
    });
  }, [formData, siteUrl]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const emailTypeLabels: Record<string, string> = data?.emailTypeLabels || {};
  const emailTypes: EmailType[] = data?.emailTypes || [];

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-orange-500" />
            Email Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Customize the content and appearance of system-generated emails
          </p>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Email Type:</label>
            <Select
              value={selectedType}
              onValueChange={(v) => setSelectedType(v as EmailType)}
            >
              <SelectTrigger className="w-[300px]" data-testid="select-email-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emailTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {emailTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {formData && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Type className="h-5 w-5 text-blue-500" />
                  Subject & Headlines
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Email subject..."
                      data-testid="input-subject"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use {'{orderNumber}'}, {'{customerName}'} for dynamic values</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Headline</label>
                    <input
                      type="text"
                      value={formData.headline}
                      onChange={(e) => handleChange('headline', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Main headline..."
                      data-testid="input-headline"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subheadline (optional)</label>
                    <input
                      type="text"
                      value={formData.subheadline || ''}
                      onChange={(e) => handleChange('subheadline', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Secondary text..."
                      data-testid="input-subheadline"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Message Content
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Greeting (optional)</label>
                    <input
                      type="text"
                      value={formData.greeting || ''}
                      onChange={(e) => handleChange('greeting', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Hi {customerName},"
                      data-testid="input-greeting"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Body Message</label>
                    <textarea
                      value={formData.bodyMessage}
                      onChange={(e) => handleChange('bodyMessage', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={4}
                      placeholder="Main email message..."
                      data-testid="input-body-message"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Footer Message (optional)</label>
                    <input
                      type="text"
                      value={formData.footerMessage || ''}
                      onChange={(e) => handleChange('footerMessage', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Questions? Contact us at..."
                      data-testid="input-footer-message"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Call-to-Action Button
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formData.ctaButtonText}
                      onChange={(e) => handleChange('ctaButtonText', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="View Order Details"
                      data-testid="input-cta-button-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Button Color</label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleChange('ctaButtonColor', color.value)}
                          className={`w-10 h-10 rounded-lg ${color.className} ${
                            formData.ctaButtonColor === color.value
                              ? 'ring-2 ring-offset-2 ring-black'
                              : ''
                          }`}
                          title={color.label}
                          data-testid={`button-color-${color.value}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleReset} data-testid="button-reset">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-save"
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

            <div>
              <Card className="p-6 bg-gray-50 border-dashed sticky top-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-orange-500" />
                  Email Preview
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Live preview with sample data
                </p>
                <div className="overflow-x-auto rounded-lg border bg-white">
                  {previewHtml ? (
                    <iframe
                      title="Email preview"
                      className="h-[700px] w-full min-w-[500px] border-0 bg-white"
                      sandbox="allow-same-origin"
                      srcDoc={previewHtml}
                    />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      Loading preview...
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
