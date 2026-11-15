"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRentalApi } from "./api-provider";
import { T } from "./language-provider";
export function AccountNavigation() {
  const { session } = useRentalApi();
  const path = usePathname();
  if (!session.profile) return null;
  return (
    <nav className="store-account-nav" aria-label="Account">
      <span>{session.profile.name}</span>
      {[
        ["/account", "Profile"],
        ["/account/orders", "Rental orders"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={path === href ? "page" : undefined}
        >
          <T>{label}</T>
        </Link>
      ))}
    </nav>
  );
}
