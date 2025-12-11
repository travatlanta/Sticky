import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Save, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SiteSetting {
  id: number;
  key: string;
  value: any;
}

export default function AdminSettings() {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SiteSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Setting updated successfully" });
    },
    onError: () => toast({ title: "Failed to update setting", variant: "destructive" }),
  });

  const handleAddSetting = () => {
    if (!newKey.trim()) return;
    let parsedValue: any = newValue;
    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      parsedValue = newValue;
    }
    updateMutation.mutate({ key: newKey, value: parsedValue });
    setNewKey("");
    setNewValue("");
  };

  const handleSaveSetting = (key: string) => {
    const value = editingSettings[key];
    let parsedValue: any = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    updateMutation.mutate({ key, value: parsedValue });
  };

  const getEditValue = (setting: SiteSetting) => {
    if (editingSettings[setting.key] !== undefined) {
      return editingSettings[setting.key];
    }
    if (typeof setting.value === "object") {
      return JSON.stringify(setting.value, null, 2);
    }
    return String(setting.value || "");
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage site-wide configuration</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Setting</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="setting_key"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="value or JSON"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddSetting} disabled={!newKey.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border-b">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : settings && settings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y">
              {settings.map((setting) => (
                <div key={setting.key} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-sm font-medium text-gray-900 font-mono">
                      {setting.key}
                    </label>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting(setting.key)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <textarea
                    value={getEditValue(setting)}
                    onChange={(e) =>
                      setEditingSettings({ ...editingSettings, [setting.key]: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                    rows={typeof setting.value === "object" ? 4 : 1}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <SettingsIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No settings yet</h3>
            <p className="text-gray-500">Add your first site setting above</p>
          </div>
        )}

        <div className="mt-6 bg-gray-50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Common Settings</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p><code className="bg-gray-200 px-1 rounded">site_name</code> - Website name</p>
            <p><code className="bg-gray-200 px-1 rounded">contact_email</code> - Contact email address</p>
            <p><code className="bg-gray-200 px-1 rounded">shipping_rates</code> - JSON object with shipping rates</p>
            <p><code className="bg-gray-200 px-1 rounded">tax_rate</code> - Tax rate percentage</p>
            <p><code className="bg-gray-200 px-1 rounded">maintenance_mode</code> - true/false for maintenance</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
