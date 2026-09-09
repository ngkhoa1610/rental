import Link from "next/link";
import {
  ArrowUpRight,
  Camera,
  Mail,
} from "lucide-react";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "New arrivals", href: "/products?sort=new" },
      { label: "Collections", href: "/collections" },
      { label: "Categories", href: "/products" },
      { label: "Lookbook", href: "/lookbook" },
    ],
  },
  {
    title: "Rental",
    links: [
      { label: "How it works", href: "#rental-process" },
      { label: "FAQ", href: "/faq" },
      { label: "Size guide", href: "/size-guide" },
      { label: "Care & return", href: "/care-return" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#4b3932] bg-[#40312c] text-[#fffaf7]">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-7 lg:px-10 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr_0.65fr_1fr]">
          <div>
            <Link
              href="/"
              className="text-xl font-medium tracking-[-0.045em]"
            >
              Rental Store
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#d9c9c1]">
              Fashion worth wearing, without the wardrobe commitment.
              Discover curated pieces for the moments that matter.
            </p>

            <div className="mt-7 flex items-center gap-2">
              <Link
                href="/instagram"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-full border border-[#735c52] transition-colors hover:bg-[#59453d]"
              >
                <Camera className="size-4" />
              </Link>

              <Link
                href="/contact"
                aria-label="Contact"
                className="grid size-10 place-items-center rounded-full border border-[#735c52] transition-colors hover:bg-[#59453d]"
              >
                <Mail className="size-4" />
              </Link>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca69b]">
                {group.title}
              </span>

              <nav className="mt-5 flex flex-col gap-3">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-[#f4ebe6] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#bca69b]">
              Stay in the loop
            </span>

            <p className="mt-5 text-sm leading-7 text-[#d9c9c1]">
              New drops, fresh edits and rental inspiration — occasionally,
              never noisy.
            </p>

            <Link
              href="/newsletter"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white"
            >
              Join our updates
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[#5b4740] pt-5 text-[11px] text-[#bca69b] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Rental Store. All rights reserved.</span>

          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}