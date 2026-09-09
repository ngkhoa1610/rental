import Link from "next/link";
import { Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#rental-process" },
  { label: "Rental edit", href: "#featured-looks" },
  { label: "FAQ", href: "#faq" },
];

export function SiteHeader() {
  return (
    <>
      <header className="home-header">
        <div className="home-container home-header-inner">
          <Link href="/" className="home-brand" aria-label="Rental Store home">
            <span className="home-brand-icon"><Shirt aria-hidden="true" /></span>
            <span>RENTAL STORE</span>
          </Link>
          <nav className="home-desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <Button asChild className="home-cta home-header-cta">
            <Link href="#featured-looks">Explore looks</Link>
          </Button>
        </div>
      </header>
      <MobileNav navigation={navigation} />
    </>
  );
}
