"use client";
import { T } from "@/components/store/language-provider";

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
        <h1>
          <T>{"A small interruption."}</T>
        </h1>
        <p>
          <T>
            {
              "We couldn’t load this page. Try again, or head back to the collection."
            }
          </T>
        </p>
        <div className="home-actions">
          <Button type="button" className="home-cta" onClick={retry}>
            <T>{"Try again"}</T>
          </Button>
          <Link href="/products" className="home-cta-ghost">
            <T>{"Explore looks"}</T>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
