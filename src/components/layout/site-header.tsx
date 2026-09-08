import Link from "next/link";
import { Heart, Search, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const navigation = [
  {
    label: "New Arrivals",
    href: "/products?sort=new",
  },
  {
    label: "Collections",
    href: "/collections",
  },
  {
    label: "Categories",
    href: "/products",
  },
  {
    label: "Lookbook",
    href: "/lookbook",
  },
];

export function SiteHeader() {
  return (
    <header className="">
      <div className="mx-auto flex min-h-16 w-full items-center border-b border-border/80 bg-surface/92 px-4 shadow-[0_8px_30px_rgba(91,67,57,0.06)] backdrop-blur-xl sm:min-h-[72px] sm:px-6 lg:px-7">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-[-0.035em]"
          aria-label="Rental Store home"
        >
          Rental Store
        </Link>

        <nav
          className="ml-12 hidden items-center gap-7 lg:flex"
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-foreground/68 transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search looks">
              <Search className="size-[18px]" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="size-[18px]" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label="Rental bag">
              <ShoppingBag className="size-[18px]" />
            </Link>
          </Button>

          <Button className="ml-2 rounded-full px-5" size="sm" asChild>
            <Link href="#featured-looks">Rent a look</Link>
          </Button>
        </div>

        <div className="ml-auto lg:hidden">
          <MobileNav navigation={navigation} />
        </div>
      </div>
    </header>
  );
}