import type { OperationName } from "./api/contracts";

/** Only completed writes publish a toast. Reads/filtering never generate success noise. */
export const actionSuccess: Partial<Record<OperationName, string>> = {
  "reviews.create": "Review sent for store approval.",
  "profile.update": "Contact details saved.",
  "session.logout": "Signed out of this workspace.",
  "orders.create": "Request sent. The store still needs to approve it.",
  "orders.change": "Change request sent for store review.",
  "admin.products.save": "Product changes saved.",
  "admin.availability.save": "Unavailable dates saved.",
  "admin.availability.remove": "Unavailable dates removed.",
  "admin.content.save": "Content changes saved.",
  "admin.reviews.moderate": "Review decision saved.",
  "admin.staff.update": "Staff access updated.",
  "admin.orders.transition": "Rental status updated.",
  "admin.orders.resolve": "Change decision saved.",
  "admin.payments.record":
    "Offline transaction recorded. Rental status is unchanged.",
};
