import type { OrderStatus } from "./api/contracts";
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending approval",
  confirmed: "Confirmed",
  renting: "On rental",
  returned: "Returned",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};
export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["renting", "cancelled"],
  renting: ["returned"],
  returned: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const isOrderHistory = (status: OrderStatus) =>
  ["completed", "cancelled", "rejected"].includes(status);
