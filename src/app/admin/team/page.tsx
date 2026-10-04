import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Nhân viên — Quản trị Rental Store",
};
import { AdminTeam } from "@/components/admin/admin-team";
export default function Page() {
  return <AdminTeam />;
}
