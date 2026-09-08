import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Search } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

const categories = [
  {
    label: "Cameras",
    count: "32 bodies",
    href: "/products?category=cameras",
  },
  {
    label: "Lenses",
    count: "48 lenses",
    href: "/products?category=lenses",
  },
  {
    label: "Lighting",
    count: "18 kits",
    href: "/products?category=lighting",
  },
  {
    label: "Audio",
    count: "16 kits",
    href: "/products?category=audio",
  },
  {
    label: "Accessories",
    count: "40+ items",
    href: "/products?category=accessories",
  },
];

const featuredEquipment = [
  {
    brand: "SONY",
    name: "FX3",
    slug: "fx3",
    price: "450.000đ",
    period: "/ ngày",
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Professional camera ready for a production shoot",
  },
  {
    brand: "FUJIFILM",
    name: "X-T5",
    slug: "x-t5",
    price: "380.000đ",
    period: "/ ngày",
    status: "Limited",
    image:
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Mirrorless camera on a clean studio surface",
  },
  {
    brand: "DJI",
    name: "RS 4 Mini",
    slug: "rs-4-mini",
    price: "260.000đ",
    period: "/ ngày",
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=85",
    imageAlt: "Camera equipment used for mobile filmmaking",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="bg-hero text-hero-foreground">
          <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-[1280px] grid-cols-1 gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-end lg:px-8 lg:py-12">
            <div className="relative min-h-[58svh] overflow-hidden bg-dark-surface sm:min-h-[62svh] lg:min-h-[680px]">
              <Image
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1800&q=90"
                alt="Professional camera equipment for rental"
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 65vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-muted">
                      Featured rental
                    </p>

                    <p className="mt-2 text-xl font-medium sm:text-2xl">
                      Sony FX3
                    </p>
                  </div>

                  <span className="hidden text-right text-sm text-white/70 sm:block">
                    Full-frame cinema body
                    <br />
                    ready for your next shoot
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end pb-2 lg:pb-10">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Camera rental / Ho Chi Minh City
              </p>

              <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Rent the right gear for the shot.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-dark-muted sm:text-lg">
                Cameras, lenses and production equipment with clear daily
                pricing and availability.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button variant="accent" size="lg" asChild>
                  <Link href="/products">
                    Explore equipment
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-dark-border bg-transparent text-dark-foreground hover:bg-dark-surface hover:text-dark-foreground"
                  asChild
                >
                  <Link href="/booking">Check availability</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-dark-border pt-5 text-xs uppercase tracking-[0.14em] text-dark-muted">
                <span className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" />
                  Clear daily rates
                </span>

                <span className="flex items-center gap-2">
                  <Check className="size-3.5 text-accent" />
                  Availability first
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface py-16 text-surface-foreground sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Rental discovery
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  What are you looking for?
                </h2>
              </div>

              <Link
                href="/products"
                className="group inline-flex items-center gap-2 text-sm font-medium"
              >
                Browse all equipment
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <nav
              className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5"
              aria-label="Equipment categories"
            >
              {categories.map((category, index) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className={`group flex min-h-36 flex-col justify-between py-6 sm:px-6 lg:min-h-44 ${
                    index === 0 ? "sm:pl-0" : ""
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    0{index + 1}
                  </span>

                  <div className="mt-10 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-medium">{category.label}</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {category.count}
                      </p>
                    </div>

                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="bg-background py-16 sm:py-20 lg:py-24">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Featured equipment
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Ready to rent
                </h2>
              </div>

              <Button variant="ghost" asChild>
                <Link href="/products">
                  View catalog
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.825fr_0.825fr]">
              {featuredEquipment.map((item, index) => (
                <article key={item.name} className="group">
                  <Link href={`/products/${item.slug}`}>
                    <div
                      className={`relative overflow-hidden bg-muted ${
                        index === 0 ? "aspect-[4/5]" : "aspect-[4/4.5]"
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes={
                          index === 0
                            ? "(max-width: 1023px) 100vw, 50vw"
                            : "(max-width: 1023px) 100vw, 25vw"
                        }
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      />
                    </div>
                  </Link>

                  <div className="pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {item.brand}
                        </p>

                        <h3 className="mt-1 text-xl font-medium">
                          {item.name}
                        </h3>
                      </div>

                      <span
                        className={`flex shrink-0 items-center gap-1.5 pt-1 text-xs font-medium ${
                          item.status === "Available"
                            ? "text-success"
                            : "text-warning"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="size-1.5 rounded-full bg-current"
                        />

                        {item.status}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          From
                        </p>

                        <p className="mt-1 text-base font-semibold">
                          {item.price}

                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            {item.period}
                          </span>
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 text-sm font-medium">
                        View
                        <ChevronRight className="size-4" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-dark text-dark-foreground">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Check before you book
              </p>

              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Know the gear, the price and the dates before you commit.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-dark-muted">
                Start with the equipment you need, then check its rental
                window. No quote request required for standard items.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link href="/booking">
                  Check availability
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-dark-border bg-transparent text-dark-foreground hover:bg-dark-surface hover:text-dark-foreground"
                asChild
              >
                <Link href="/products">
                  <Search />
                  Find equipment
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}