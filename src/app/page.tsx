import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="bg-hero text-hero-foreground">
          <div className="mx-auto flex min-h-[70vh] w-full max-w-[1280px] items-center px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em]">
                Rental Store
              </p>

              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-8xl">
                Equipment for your next shoot.
              </h1>

              <p className="mt-6 max-w-xl text-base text-hero-foreground/70 sm:text-lg">
                Professional camera and production equipment,
                available when you need it.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}