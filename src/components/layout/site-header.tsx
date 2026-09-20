"use client";

import { useState, type ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { Heart, Menu, Shirt, ShoppingBag, X } from "lucide-react";
import { BagCount } from "@/components/store/selection-actions";

const navigation = [
  { label: "Explore looks", href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "Feedback", href: "/feedback" },
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
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="home-header-actions">
            <NavLink
              href="/wishlist"
              className="home-icon-link home-wishlist-link"
              aria-label="Wishlist"
            >
              <Heart aria-hidden="true" />
            </NavLink>
            <NavLink
              href="/cart"
              className="home-icon-link home-bag-link"
              aria-label="Rental bag"
            >
              <ShoppingBag aria-hidden="true" />
              <BagCount />
            </NavLink>
          </div>
        </div>
      </header>
      <MobileNav />
    </>
  );
}

function NavLink({
  href,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <Link {...props} href={href} aria-current={active ? "page" : undefined} />
  );
}

const mobileLinks = [
  { label: "Looks", href: "/products", icon: Shirt },
  { label: "Saved", href: "/wishlist", icon: Heart },
  { label: "Bag", href: "/cart", icon: ShoppingBag },
];

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav className="home-mobile-nav" aria-label="Mobile navigation">
        <div className="home-mobile-bar">
          {mobileLinks.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="home-mobile-menu"
              aria-label="Open navigation menu"
            >
              <Menu aria-hidden="true" />
              <span>Menu</span>
            </Button>
          </SheetTrigger>
        </div>
      </nav>
      <SheetContent
        side="bottom"
        className="home-mobile-sheet"
        showCloseButton={false}
      >
        <SheetHeader className="p-0 pr-12">
          <SheetTitle className="font-bold">Rental Store</SheetTitle>
          <SheetDescription>Find your next look.</SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 size-11"
            aria-label="Close navigation menu"
          >
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
        <nav className="home-sheet-links" aria-label="More navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
