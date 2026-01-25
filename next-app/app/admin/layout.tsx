import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}
