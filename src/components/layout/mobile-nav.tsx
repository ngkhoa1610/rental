"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavigationItem {
  label: string;
  href: string;
}

interface MobileNavProps {
  navigation: NavigationItem[];
}

export function MobileNav({ navigation }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(100%,_380px)] bg-background"
      >
        <SheetHeader>
          <SheetTitle className="text-left text-sm font-semibold tracking-[-0.03em]">
            Rental Store
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigate}
              className="border-b border-border py-5 text-2xl font-medium tracking-tight transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-7" />

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            asChild
          >
            <Link
              href="/search"
              onClick={handleNavigate}
              aria-label="Search"
            >
              <Search />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            asChild
          >
            <Link
              href="/wishlist"
              onClick={handleNavigate}
              aria-label="Wishlist"
            >
              <Heart />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            asChild
          >
            <Link
              href="/cart"
              onClick={handleNavigate}
              aria-label="Rental bag"
            >
              <ShoppingBag />
            </Link>
          </Button>
        </div>

        <Button size="lg" className="mt-3 w-full rounded-full" asChild>
          <Link href="#featured-looks" onClick={handleNavigate}>
            Rent a look
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}