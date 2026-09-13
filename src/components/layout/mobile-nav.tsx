"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Shirt, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  navigation: { label: string; href: string }[];
}
const mobileLinks = [
  { label: "Looks", href: "/products", icon: Shirt },
  { label: "Saved", href: "/wishlist", icon: Heart },
  { label: "Bag", href: "/cart", icon: ShoppingBag },
];

export function MobileNav({ navigation }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sheetLinks = [
    { label: "Home", href: "/" },
    ...navigation,
    { label: "Search", href: "/search" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav className="home-mobile-nav" aria-label="Mobile navigation">
        <div className="home-mobile-bar">
          {mobileLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || pathname.startsWith(`${href}/`)
                  ? "page"
                  : undefined
              }
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
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
          {sheetLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="lg" className="home-sheet-cta">
          <Link href="/products" onClick={() => setOpen(false)}>
            Explore looks
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
