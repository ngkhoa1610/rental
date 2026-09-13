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
      <p className="store-overline">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function EmptyState({
  title,
  children,
  href = "/products",
  label = "Explore looks",
}: {
  title: string;
  children: ReactNode;
  href?: string;
  label?: string;
}) {
  return (
    <div className="store-empty">
      <h2>{title}</h2>
      <p>{children}</p>
      <Link href={href} className="home-cta">
        {label}
      </Link>
    </div>
  );
}
