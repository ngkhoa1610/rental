import Link from "next/link";
import { Heart, Search, Shirt, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BagCount } from "@/components/store/selection-actions";

const navigation = [
  { label: "Explore looks", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "How it works", href: "/#rental-process" },
];

export function SiteHeader() {
  return (
    <>
      <header className="home-header">
        <div className="home-container home-header-inner">
          <Link href="/" className="home-brand" aria-label="Rental Store home">
            <span className="home-brand-icon">
              <Shirt aria-hidden="true" />
            </span>
            <span>RENTAL STORE</span>
          </Link>
          <nav className="home-desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="home-header-actions">
            <Link
              href="/search"
              className="home-icon-link"
              aria-label="Search looks"
            >
              <Search aria-hidden="true" />
            </Link>
            <Link
              href="/wishlist"
              className="home-icon-link home-wishlist-link"
              aria-label="Wishlist"
            >
              <Heart aria-hidden="true" />
            </Link>
            <Link
              href="/cart"
              className="home-icon-link home-bag-link"
              aria-label="Rental bag"
            >
              <ShoppingBag aria-hidden="true" />
              <BagCount />
            </Link>
            <Button
              asChild
              className="home-cta home-header-cta home-browse-cta"
            >
              <Link href="/products">Explore looks</Link>
            </Button>
          </div>
        </div>
      </header>
      <MobileNav navigation={navigation} />
    </>
  );
}
