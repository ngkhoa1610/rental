"use client";
import { T } from "@/components/store/language-provider";
import { Button } from "@/components/ui/button";
/** Do not expose raw errors or customer navigation in the admin workspace. */
export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="admin-panel" role="alert">
      <h2>
        <T>{"A small interruption."}</T>
      </h2>
      <Button onClick={retry}>
        <T>{"Try again"}</T>
      </Button>
    </section>
  );
}
