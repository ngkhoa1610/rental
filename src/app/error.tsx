"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";

/** Never expose a raw server/client error message to the customer. */
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="home-container home-recovery">
        <h1>A small interruption.</h1>
        <p>
          We couldn’t load this page. Try again, or head back to the collection.
        </p>
        <div className="home-actions">
          <Button type="button" className="home-cta" onClick={retry}>
            Try again
          </Button>
          <Link href="/products" className="home-cta-ghost">
            Explore looks
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
