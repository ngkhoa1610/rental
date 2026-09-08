import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/layout/mobile-nav";

const navigation = [
  {
    label: "Products",
    href: "/products",
  },
  {
    label: "Rentals",
    href: "/rentals",
  },
  {
    label: "About",
    href: "/about",
  },
];

export function SiteHeader() {
  return (
    <header className="bg-dark text-dark-foreground">
      <div className="mx-auto flex min-h-20 w-full max-w-[1280px] items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 text-sm font-bold uppercase tracking-tight"
          aria-label="Rental Store home"
        >
          Rental Store
        </Link>

        {/* Desktop navigation */}
        <nav
          className="ml-12 hidden items-center gap-8 lg:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            asChild
          >
            <Link href="/search">
              <Search className="size-5" />
            </Link>
          </Button>

          <Separator
            orientation="vertical"
            className="h-6 bg-dark-border"
          />

          <Button variant="accent" asChild>
            <Link href="/booking">Book Now</Link>
          </Button>
        </div>

        {/* Mobile */}
        <div className="ml-auto lg:hidden">
          <MobileNav navigation={navigation} />
        </div>
      </div>
    </header>
  );
}