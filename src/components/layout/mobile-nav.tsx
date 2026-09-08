"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

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
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[min(100%,_360px)] bg-dark text-dark-foreground"
      >
        <SheetHeader>
          <SheetTitle className="text-left text-sm font-bold uppercase tracking-tight">
            Rental Store
          </SheetTitle>
        </SheetHeader>

        <nav
          className="mt-8 flex flex-col"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigate}
              className="border-b border-dark-border py-5 text-2xl font-medium tracking-tight transition-opacity hover:opacity-70"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-8 bg-dark-border" />

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          asChild
        >
          <Link href="/booking" onClick={handleNavigate}>
            Book Now
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}