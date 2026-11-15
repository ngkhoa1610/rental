import type { RentalOrder } from "./api/contracts";

/** Public shop content. Empty values intentionally disable unconfigured channels. */
export const storeDetails: {
  zalo: string;
  facebook: string;
  phone: string;
} = { zalo: "", facebook: "", phone: "" };

export function contactHref(
  channel: "zalo" | "facebook" | "phone",
  value: string,
): string | null {
  if (channel === "phone")
    return /^\+?[0-9]{8,15}$/.test(value) ? `tel:${value}` : null;
  try {
    const url = new URL(value);
    const hosts =
      channel === "zalo"
        ? ["zalo.me"]
        : ["facebook.com", "www.facebook.com", "m.me"];
    return url.protocol === "https:" &&
      hosts.includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function bookingMessage(order: RentalOrder): string {
  return [
    `Mã hẹn: ${order.id}`,
    ...order.lines.map((line) => `${line.name} × ${line.quantity}`),
    `Nhận: ${order.pickupDate} · Trả: ${order.returnDate}`,
    `Khách: ${order.contact.name}`,
    `SĐT: ${order.contact.phone}`,
    "Nhờ shop kiểm tra và xác nhận yêu cầu thuê này.",
  ].join("\n");
}
export function requestNotes(
  notes: string,
  advice: string,
  delivery: string,
  address: string,
): string {
  const parts = [
    advice,
    delivery === "shipping"
      ? `Đề nghị giao hàng (shop xác nhận phí/khu vực): ${address.trim()}`
      : "",
    notes.trim(),
  ].filter(Boolean);
  const result = parts.join("\n");
  if (delivery === "shipping" && !address.trim())
    throw new Error("Enter a delivery address for the store to review.");
  if (result.length > 1000)
    throw new Error("Keep your request within 1000 characters.");
  return result;
}
