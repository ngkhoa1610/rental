import Link from "next/link";
import { ArrowUpRight, Camera, Mail } from "lucide-react";

const footerLinks = {
  discover: [
    { label: "New Arrivals", href: "/products?sort=new" },
    { label: "Collections", href: "/collections" },
    { label: "Categories", href: "/products" },
    { label: "Lookbook", href: "/lookbook" },
  ],
  rental: [
    { label: "How it works", href: "#rental-flow" },
    { label: "Check availability", href: "/products" },
    { label: "Rental guide", href: "/rental-guide" },
    { label: "Size guide", href: "/size-guide" },
  ],
  help: [
    { label: "Contact us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Shipping & return", href: "/shipping-return" },
    { label: "Care guide", href: "/care-guide" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="">
      <div className="mx-auto overflow-hidden bg-foreground text-background">
        <div className="grid gap-14 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-[1.35fr_2fr] lg:px-14 lg:py-16">
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center text-lg font-semibold tracking-[-0.04em]"
            >
              Rental Store
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-background/65">
              Curated fashion to rent, wear and return. Find something you love
              for the moments worth dressing for.
            </p>

            <Link
              href="#featured-looks"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-medium text-foreground transition-transform duration-300 hover:-translate-y-0.5"
            >
              Rent a look
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            <FooterColumn title="Discover" links={footerLinks.discover} />
            <FooterColumn title="Rental" links={footerLinks.rental} />
            <FooterColumn title="Help" links={footerLinks.help} />
          </div>
        </div>

        <div className="mx-6 border-t border-background/12 sm:mx-10 lg:mx-14" />

        <div className="flex flex-col gap-5 px-6 py-6 text-xs text-background/50 sm:px-10 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© 2026 Rental Store</span>

            <Link
              className="transition-colors hover:text-background"
              href="/privacy"
            >
              Privacy
            </Link>

            <Link
              className="transition-colors hover:text-background"
              href="/terms"
            >
              Terms
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="mailto:hello@rentalstore.vn"
              className="inline-flex items-center gap-2 transition-colors hover:text-background"
            >
              <Mail className="size-3.5" />
              hello@rentalstore.vn
            </a>

            <a
              href="#"
              aria-label="Instagram"
              className="transition-colors hover:text-background"
            >
              <Camera className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-background/45">
        {title}
      </h2>

      <nav className="mt-5 flex flex-col items-start gap-3" aria-label={title}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-background/70 transition-colors hover:text-background"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}