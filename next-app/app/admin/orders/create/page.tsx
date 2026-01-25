import { Suspense } from "react";
import CreateOrderClient from "./CreateOrderClient";

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CreateOrderClient />
    </Suspense>
  );
}
