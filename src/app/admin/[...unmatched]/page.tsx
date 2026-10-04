import { notFound } from "next/navigation";
/** Keep unknown admin URLs inside the admin recovery boundary. */
export default function UnknownAdminPage() {
  notFound();
}
