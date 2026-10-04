import type { Metadata } from "next";
import { ApiProvider } from "@/components/store/api-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import "../(store)/store.css";
import "./admin.css";
export const metadata: Metadata = {
  title: "Quản trị — Rental Store",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApiProvider scope="admin">
      <AdminShell>{children}</AdminShell>
    </ApiProvider>
  );
}
