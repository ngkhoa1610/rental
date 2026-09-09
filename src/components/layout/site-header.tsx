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
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6">
      <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center rounded-[20px] border border-[#eadbd2]/90 bg-[#fffdfa]/88 px-4 shadow-[0_10px_35px_rgba(91,67,57,0.06)] backdrop-blur-xl sm:min-h-[72px] sm:px-6 lg:px-7">
        <Link
          href="/"
          className="shrink-0 text-[13px] font-semibold tracking-[-0.04em] text-[#3f302b]"
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
              className="text-[12px] font-medium text-[#806f66] transition-colors hover:text-[#9f6254]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search looks">
              <Search className="size-[17px]" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="size-[17px]" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label="Rental bag">
              <ShoppingBag className="size-[17px]" />
            </Link>
          </Button>

          <Button
            size="sm"
            className="ml-2 rounded-full bg-[#9f6254] px-5 text-[12px] shadow-[0_10px_22px_-15px_rgba(159,98,84,0.75)] hover:bg-[#8e574b]"
            asChild
          >
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