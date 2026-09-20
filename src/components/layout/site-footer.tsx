import Link from "next/link";
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
            Fashion worth wearing, without the wardrobe commitment. A look for
            every moment that matters.
          </p>
          <p className="home-copyright">© 2026 Rental Store.</p>
        </div>
        <nav aria-label="Explore Rental Store">
          <h2>Explore</h2>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/products">Explore looks</Link>
            </li>
            <li>
              <Link href="/collections">Collections</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Rental information">
          <h2>Before you rent</h2>
          <ul>
            <li>
              <Link href="/lookbook">Styling inspiration</Link>
            </li>
            <li>
              <Link href="/feedback">The feedback wall</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
