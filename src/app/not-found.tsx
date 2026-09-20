import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="landing-page">
      <a className="home-skip" href="#recovery-main">
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="recovery-main"
        tabIndex={-1}
        className="home-container home-recovery"
      >
        <p>404 · A different direction</p>
        <h1>This page is out of the wardrobe.</h1>
        <p>
          The link may have changed, or this look is no longer here. Find
          something new in the collection.
        </p>
        <div className="home-actions">
          <Link href="/products" className="home-cta">
            Explore looks
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
