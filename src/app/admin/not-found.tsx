import Link from "next/link";
import { T } from "@/components/store/language-provider";
export default function AdminNotFound() {
  return (
    <section className="admin-panel">
      <h2>
        <T>{"Admin page not found"}</T>
      </h2>
      <Link href="/admin" className="store-text-link">
        <T>{"Open overview"}</T>
      </Link>
    </section>
  );
}
