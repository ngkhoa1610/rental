import { T } from "@/components/store/language-provider";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <div className="landing-page">
      <a className="home-skip" href="#recovery-main">
        <T>{"Skip to content"}</T>
      </a>
      <SiteHeader />
      <main
        id="recovery-main"
        tabIndex={-1}
        className="home-container home-recovery"
      >
        <p>
          <T>{"404 · A different direction"}</T>
        </p>
        <h1>
          <T>{"This page is out of the wardrobe."}</T>
        </h1>
        <p>
          <T>
            {
              "The link may have changed, or this look is no longer here. Find something new in the collection."
            }
          </T>
        </p>
        <div className="home-actions">
          <Link href="/products" className="home-cta">
            <T>{"Explore looks"}</T>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
