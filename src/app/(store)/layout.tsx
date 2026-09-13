import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./store.css";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page">
      <a className="home-skip" href="#store-main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="store-main" className="home-container store-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
