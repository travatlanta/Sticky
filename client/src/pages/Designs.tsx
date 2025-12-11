import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  ArrowLeft, 
  Plus,
  Clock,
  Edit,
  Trash2,
  MoreVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Design {
  id: number;
  name: string;
  thumbnailUrl?: string;
  canvasData?: string;
  productId?: number;
  createdAt: string;
  updatedAt?: string;
}

export default function Designs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: designs, isLoading } = useQuery<Design[]>({
    queryKey: ["/api/designs"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/designs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete design");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/designs"] });
      toast({ title: "Design deleted" });
    },
    onError: () => toast({ title: "Failed to delete design", variant: "destructive" }),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/account">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back-account">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Account
            </Button>
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Palette className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-3xl md:text-4xl text-white">My Designs</h1>
                <p className="text-white/80 text-sm md:text-base">
                  {designs?.length || 0} saved design{designs?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link href="/products">
              <Button className="bg-white text-green-600 hover:bg-white/90 shadow-lg" data-testid="button-create-design">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Design</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="py-8 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto max-w-4xl">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !designs || designs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Palette className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="font-heading text-2xl text-gray-900 mb-2">No Saved Designs</h2>
              <p className="text-gray-500 mb-6">Start creating your first design!</p>
              <Link href="/products">
                <Button className="bg-green-500 hover:bg-green-600" data-testid="button-browse-products">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Design
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {designs.map((design) => (
                <Card key={design.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow" data-testid={`design-card-${design.id}`}>
                  <div className="relative aspect-square bg-gray-100">
                    {design.thumbnailUrl ? (
                      <img 
                        src={design.thumbnailUrl} 
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
                        <Palette className="h-12 w-12 text-green-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 shadow-sm" data-testid={`button-design-menu-${design.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/editor/${design.id}`} className="flex items-center cursor-pointer" data-testid={`link-edit-design-${design.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Design
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this design?")) {
                                deleteMutation.mutate(design.id);
                              }
                            }}
                            data-testid={`button-delete-design-${design.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 truncate mb-1">{design.name || "Untitled Design"}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(design.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
