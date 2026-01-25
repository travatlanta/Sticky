export const dynamic = "force-dynamic";

import OrdersClient from "./OrdersClient";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Page() {
  return (
    <TooltipProvider>
      <OrdersClient />
    </TooltipProvider>
  );
}
