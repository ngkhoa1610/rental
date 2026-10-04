import { T } from "@/components/store/language-provider";
import Link from "next/link";
import { ContactOptions } from "@/components/store/contact-options";
import { Shirt } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-container home-footer-grid">
        <div>
          <Link href="/" className="home-brand" aria-label="Rental Store home">
            <span className="home-brand-icon">
              <Shirt aria-hidden="true" />
            </span>
            <span>RENTAL STORE</span>
          </Link>
          <p className="home-footer-description">
            <T>
              {
                "Fashion worth wearing, without the wardrobe commitment. A look for every moment that matters."
              }
            </T>
          </p>
          <ContactOptions />
          <p className="home-copyright">
            <T>{"© 2026 Rental Store."}</T>
          </p>
        </div>
        <nav aria-label="Explore Rental Store">
          <h2>
            <T>{"Explore"}</T>
          </h2>
          <ul>
            <li>
              <Link href="/">
                <T>{"Home"}</T>
              </Link>
            </li>
            <li>
              <Link href="/products">
                <T>{"Explore looks"}</T>
              </Link>
            </li>
            <li>
              <Link href="/collections">
                <T>{"Collections"}</T>
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Rental information">
          <h2>
            <T>{"Before you rent"}</T>
          </h2>
          <ul>
            <li>
              <Link href="/availability">
                <T>{"Check available dates"}</T>
              </Link>
            </li>
            <li>
              <Link href="/rental-guide">
                <T>{"Size & rental guide"}</T>
              </Link>
            </li>
            <li>
              <Link href="/account/orders">
                <T>{"Your bookings"}</T>
              </Link>
            </li>
            <li>
              <Link href="/lookbook">
                <T>{"Styling inspiration"}</T>
              </Link>
            </li>
            <li>
              <Link href="/feedback">
                <T>{"The feedback wall"}</T>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
