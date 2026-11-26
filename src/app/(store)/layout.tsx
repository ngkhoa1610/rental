import { T } from "@/components/store/language-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./store.css";
import "./home.css";
import "./booking.css";
import "./theme.css";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-page store-theme">
      <a className="home-skip" href="#store-main">
        <T>{"Skip to content"}</T>
      </a>
      <SiteHeader />
      <main id="store-main" className="home-container store-main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
