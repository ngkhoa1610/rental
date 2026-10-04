"use client";
import { Button } from "@/components/ui/button";
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <section className="store-api-panel" role="alert">
      <h1>Chưa tải được dữ liệu cửa hàng</h1>
      <p>Vui lòng thử lại sau ít phút.</p>
      <Button onClick={reset}>Thử lại</Button>
    </section>
  );
}
