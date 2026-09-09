"use client";

import { useState } from "react";
import Link from "next/link";
import { House, Menu, MessageCircle, Shirt, X } from "lucide-react";

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

export function MobileNav({ navigation }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav className="home-mobile-nav" aria-label="Mobile navigation">
        <div className="home-mobile-bar">
          <Link href="#home"><House aria-hidden="true" /><span>Home</span></Link>
          <Link href="#featured-looks"><Shirt aria-hidden="true" /><span>Looks</span></Link>
          <Link href="#faq"><MessageCircle aria-hidden="true" /><span>FAQ</span></Link>
          <SheetTrigger asChild>
            <Button variant="ghost" className="home-mobile-menu" aria-label="Open navigation menu">
              <Menu aria-hidden="true" /><span>Menu</span>
            </Button>
          </SheetTrigger>
        </div>
      </nav>
      <SheetContent side="bottom" className="home-mobile-sheet" showCloseButton={false}>
        <SheetHeader className="p-0 pr-12">
          <SheetTitle className="font-bold">Rental Store</SheetTitle>
          <SheetDescription>Find your next look.</SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button variant="ghost" size="icon" className="absolute right-3 top-3 size-11" aria-label="Close navigation menu"><X aria-hidden="true" /></Button>
        </SheetClose>
        <nav className="home-sheet-links" aria-label="More navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
          ))}
        </nav>
        <Button asChild size="lg" className="home-sheet-cta">
          <Link href="#featured-looks" onClick={() => setOpen(false)}>Explore looks</Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
