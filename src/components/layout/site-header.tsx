"use client";
import { T, useLanguage } from "@/components/store/language-provider";

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
import {
  Heart,
  Menu,
  Shirt,
  ShoppingBag,
  UserRound,
  X,
  CalendarDays,
} from "lucide-react";
import { LanguageSwitch } from "@/components/store/language-provider";
import { AccountNavigation } from "@/components/store/account-navigation";
import { ContactOptions } from "@/components/store/contact-options";
import { BagCount } from "@/components/store/selection-actions";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Rent clothing", href: "/products" },
  { label: "Rent accessories", href: "/accessories" },
  { label: "Check available dates", href: "/availability" },
  { label: "Size & rental guide", href: "/rental-guide" },
  { label: "Your bookings", href: "/account/orders" },
];

export function SiteHeader() {
  const { t } = useLanguage();
  return (
    <>
      <header className="home-header">
        <div className="home-container home-header-inner">
          <Link
            href="/"
            className="home-brand"
            aria-label={t("Rental Store home")}
          >
            <span className="home-brand-icon">
              <Shirt aria-hidden="true" />
            </span>
            <span>
              RENTAL STORE<small>FASHION & ACCESSORIES</small>
            </span>
          </Link>
          <nav className="home-desktop-nav" aria-label={t("Main navigation")}>
            {navigation.map((item) => (
              <NavLink key={item.href} href={item.href}>
                <T>{item.label}</T>
              </NavLink>
            ))}
          </nav>
          <div className="home-header-actions">
            <ContactOptions className="home-header-advice" />
            <LanguageSwitch />
            <NavLink
              href="/account"
              className="home-icon-link"
              aria-label={t("Your account")}
            >
              <UserRound aria-hidden="true" />
            </NavLink>
            <NavLink
              href="/wishlist"
              className="home-icon-link home-wishlist-link"
              aria-label={t("Wishlist")}
            >
              <Heart aria-hidden="true" />
            </NavLink>
            <NavLink
              href="/cart"
              className="home-icon-link home-bag-link"
              aria-label={t("Rental bag")}
            >
              <ShoppingBag aria-hidden="true" />
              <BagCount />
            </NavLink>
          </div>
        </div>
      </header>
      <AccountNavigation />
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
  { label: "Available dates", href: "/availability", icon: CalendarDays },
  { label: "Your bookings", href: "/account/orders", icon: UserRound },
];

function MobileNav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <nav className="home-mobile-nav" aria-label={t("Mobile navigation")}>
        <div className="home-mobile-bar">
          {mobileLinks.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon aria-hidden="true" />
              <span>
                <T>{label}</T>
              </span>
            </NavLink>
          ))}
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="home-mobile-menu"
              aria-label={t("Open navigation menu")}
            >
              <Menu aria-hidden="true" />
              <span>
                <T>{"Menu"}</T>
              </span>
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
          <SheetDescription>
            <T>{"Find your next look."}</T>
          </SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 size-11"
            aria-label={t("Close navigation menu")}
          >
            <X aria-hidden="true" />
          </Button>
        </SheetClose>
        <nav className="home-sheet-links" aria-label={t("More navigation")}>
          <NavLink href="/account" onClick={() => setOpen(false)}>
            <T>{"Your account"}</T>
          </NavLink>
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <T>{item.label}</T>
            </NavLink>
          ))}
          {[
            { href: "/wishlist", label: "Saved" },
            { href: "/collections", label: "Collections" },
            { href: "/lookbook", label: "Lookbook" },
            { href: "/feedback", label: "Feedback" },
          ].map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
        <ContactOptions />
      </SheetContent>
    </Sheet>
  );
}
