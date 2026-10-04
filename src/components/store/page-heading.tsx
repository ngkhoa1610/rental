import { T } from "@/components/store/language-provider";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  eyebrow = "The rental wardrobe",
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <header className="store-page-heading">
      <p className="store-overline">
        <T>{eyebrow}</T>
      </p>
      <h1>
        <T>{title}</T>
      </h1>
      <p>
        <T>{description}</T>
      </p>
    </header>
  );
}

export function EmptyState({
  title,
  children,
  href = "/products",
  label = "Explore looks",
  showAction = true,
}: {
  title: string;
  children: ReactNode;
  href?: string;
  label?: string;
  showAction?: boolean;
}) {
  return (
    <div className="store-empty">
      <h2>
        <T>{title}</T>
      </h2>
      <p>{children}</p>
      {showAction && (
        <Link href={href} className="home-cta">
          <T>{label}</T>
        </Link>
      )}
    </div>
  );
}
