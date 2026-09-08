import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";

const occasions = [
  {
    label: "Date night",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=95",
  },
  {
    label: "Wedding guest",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1800&q=95",
  },
  {
    label: "Party",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=95",
  },
  {
    label: "Vacation",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=95",
  },
  {
    label: "Weekend",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=95",
  },
];

const categories = [
  {
    label: "Dresses",
    count: "32 looks",
    href: "/products?category=dresses",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1500&q=95",
  },
  {
    label: "Tops",
    count: "24 looks",
    href: "/products?category=tops",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=95",
  },
  {
    label: "Sets",
    count: "18 looks",
    href: "/products?category=sets",
    image:
      "https://images.unsplash.com/photo-1506629905607-d9d0a8f0a1e8?auto=format&fit=crop&w=1200&q=95",
  },
  {
    label: "Outerwear",
    count: "16 looks",
    href: "/products?category=outerwear",
    image:
      "https://images.unsplash.com/photo-1548624313-0396c75ce9b1?auto=format&fit=crop&w=1500&q=95",
  },
];

const featuredLooks = [
  {
    name: "Muse Dress",
    collection: "Linen Collection",
    price: "350.000đ",
    period: "/ 3 days",
    status: "Available",
    image:
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1800&q=95",
    imageAlt: "Woman wearing a soft neutral linen dress",
    slug: "muse-dress",
  },
  {
    name: "Luna Set",
    collection: "Soft Tailoring",
    price: "320.000đ",
    period: "/ 3 days",
    status: "Almost booked",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=95",
    imageAlt: "Woman wearing an elegant tailored fashion look",
    slug: "luna-set",
  },
  {
    name: "Soleil Top",
    collection: "Everyday Edit",
    price: "180.000đ",
    period: "/ 3 days",
    status: "Available this weekend",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=95",
    imageAlt: "Fashion look styled for a relaxed weekend",
    slug: "soleil-top",
  },
];

const rentalSteps = [
  {
    number: "01",
    title: "Choose a look",
    description:
      "Browse by occasion, collection or the pieces you already love.",
  },
  {
    number: "02",
    title: "Choose your dates",
    description:
      "Check the rental calendar and pick the days you need the look.",
  },
  {
    number: "03",
    title: "Confirm your rental",
    description:
      "Review the look, dates and rental details before confirming.",
  },
  {
    number: "04",
    title: "Wear & return",
    description:
      "Receive your outfit, wear it your way, then return it on time.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5 lg:px-6">
          <ScrollReveal>
            <div className="relative mx-auto min-h-[680px] max-w-[1440px] overflow-hidden rounded-[28px] bg-peach shadow-[0_18px_60px_rgba(91,67,57,0.08)] sm:min-h-[720px] lg:min-h-[calc(100svh-8rem)]">
              <Image
                src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=2400&q=95"
                alt="Editorial fashion look for a clothes rental collection"
                fill
                priority
                sizes="100vw"
                className="object-cover object-[center_28%]"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/48 via-black/12 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:max-w-4xl lg:p-16">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                  New collection · Rent, wear, return
                </p>

                <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-[6.5rem]">
                  Your next look,
                  <br />
                  ready to rent.
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-6 text-white/82 sm:text-base">
                  Curated pieces for dates, weddings, weekends and every moment
                  worth dressing up for.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-full bg-white px-6 text-foreground hover:bg-white/90"
                    asChild
                  >
                    <Link href="#featured-looks">
                      Start with a look
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/65 bg-white/8 px-6 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
                    asChild
                  >
                    <Link href="#rental-flow">How renting works</Link>
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/75">
                  <span className="flex items-center gap-2">
                    <Check className="size-3.5" />
                    Clear rental pricing
                  </span>

                  <span className="flex items-center gap-2">
                    <Check className="size-3.5" />
                    Check dates before booking
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section
          id="find-your-look"
          className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Find your moment
                  </p>

                  <h2 className="mt-3 max-w-2xl text-4xl font-medium leading-tight tracking-[-0.045em] sm:text-5xl">
                    What are you wearing it for?
                  </h2>
                </div>

                <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-right">
                  Start with the occasion, then discover a look that feels like
                  you.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {occasions.map((occasion, index) => (
                <ScrollReveal key={occasion.label} delay={index * 55}>
                  <Link
                    href={`/products?occasion=${encodeURIComponent(occasion.label)}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-peach"
                  >
                    <Image
                      src={occasion.image}
                      alt={`${occasion.label} fashion inspiration`}
                      fill
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 20vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/65">
                        0{index + 1}
                      </p>

                      <div className="mt-2 flex items-end justify-between gap-3">
                        <h3 className="text-xl font-medium tracking-tight">
                          {occasion.label}
                        </h3>

                        <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-3 sm:px-5 lg:px-6">
          <ScrollReveal>
            <div className="mx-auto max-w-[1440px] rounded-[28px] bg-peach-soft px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24">
              <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Browse the edit
                  </p>

                  <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                    Shop by category
                  </h2>
                </div>

                <Button
                  variant="outline"
                  className="w-fit rounded-full bg-background/65"
                  asChild
                >
                  <Link href="/products">
                    Explore all looks
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 md:grid-cols-12 md:grid-rows-[260px_260px]">
                {categories.map((category, index) => (
                  <ScrollReveal
                    key={category.href}
                    delay={index * 70}
                    className={
                      index === 0
                        ? "md:col-span-5 md:row-span-2"
                        : index === 3
                          ? "md:col-span-7"
                          : "md:col-span-3"
                    }
                  >
                    <Link
                      href={category.href}
                      className="group relative block h-full min-h-[240px] overflow-hidden rounded-[22px] bg-white"
                    >
                      <Image
                        src={category.image}
                        alt={`${category.label} clothing collection`}
                        fill
                        sizes="(max-width: 767px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">
                          {category.count}
                        </p>

                        <div className="mt-1 flex items-end justify-between gap-3">
                          <h3 className="text-2xl font-medium tracking-tight">
                            {category.label}
                          </h3>

                          <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section
          id="featured-looks"
          className="bg-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Just in
                  </p>

                  <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                    Looks worth wearing.
                  </h2>
                </div>

                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm font-medium"
                >
                  View the collection
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid gap-x-5 gap-y-12 lg:grid-cols-[1.45fr_0.775fr_0.775fr]">
              {featuredLooks.map((look, index) => (
                <ScrollReveal
                  key={look.slug}
                  delay={index * 90}
                  className={index === 0 ? "lg:row-span-2" : ""}
                >
                  <article>
                    <div className="group relative">
                      <Link href={`/products/${look.slug}`} className="block">
                        <div
                          className={`relative overflow-hidden rounded-[24px] bg-peach ${
                            index === 0 ? "aspect-[4/5]" : "aspect-[4/4.8]"
                          }`}
                        >
                          <Image
                            src={look.image}
                            alt={look.imageAlt}
                            fill
                            sizes={
                              index === 0
                                ? "(max-width: 1023px) 100vw, 55vw"
                                : "(max-width: 1023px) 100vw, 25vw"
                            }
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                          />

                          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground backdrop-blur-md">
                            {look.status}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        aria-label={`Save ${look.name} to favorites`}
                        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 text-foreground backdrop-blur-md transition-transform duration-300 hover:scale-105"
                      >
                        <Heart className="size-4" />
                      </button>
                    </div>

                    <div className="pt-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {look.collection}
                      </p>

                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <h3 className="text-xl font-medium">{look.name}</h3>

                        <p className="text-sm font-semibold sm:text-right">
                          {look.price}
                          <span className="ml-1 font-normal text-muted-foreground">
                            {look.period}
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-transparent"
                          asChild
                        >
                          <Link href={`/products/${look.slug}`}>
                            View look
                          </Link>
                        </Button>

                        <Button size="sm" className="rounded-full" asChild>
                          <Link href={`/booking?item=${look.slug}`}>
                            Check dates
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="rental-flow" className="px-3 sm:px-5 lg:px-6">
          <ScrollReveal>
            <div className="mx-auto max-w-[1440px] rounded-[28px] bg-surface px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24">
              <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Your rental flow
                  </p>

                  <h2 className="mt-3 max-w-lg text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                    From “I love this” to “it&apos;s on the way.”
                  </h2>

                  <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
                    A simple four-step flow keeps the important part clear:
                    what you&apos;re wearing, when you need it and how to get it.
                  </p>

                  <Button className="mt-8 rounded-full px-6" size="lg" asChild>
                    <Link href="#featured-looks">
                      Choose a look
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {rentalSteps.map((step, index) => (
                    <ScrollReveal key={step.number} delay={index * 80}>
                      <div className="h-full rounded-[20px] bg-peach-soft p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold tracking-[0.16em] text-primary">
                            {step.number}
                          </span>

                          {index < rentalSteps.length - 1 ? (
                            <ChevronRight className="size-4 text-primary/55" />
                          ) : (
                            <Sparkles className="size-4 text-primary/55" />
                          )}
                        </div>

                        <h3 className="mt-12 text-xl font-medium tracking-tight">
                          {step.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <div className="mb-10 flex items-end justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    From the lookbook
                  </p>

                  <h2 className="mt-3 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">
                    Worn by our community.
                  </h2>
                </div>

                <span className="hidden text-sm text-muted-foreground sm:block">
                  Looks worth repeating
                </span>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=95",
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=95",
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=95",
                "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1200&q=95",
              ].map((image, index) => (
                <ScrollReveal key={image} delay={index * 70}>
                  <div
                    className={`relative aspect-[4/5] overflow-hidden rounded-[22px] bg-peach ${
                      index === 1 ? "sm:mt-12" : ""
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Lookbook fashion look ${index + 1}`}
                      fill
                      sizes="(max-width: 639px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-3 pb-3 sm:px-5 sm:pb-5 lg:px-6">
          <ScrollReveal>
            <div className="relative mx-auto min-h-[500px] max-w-[1440px] overflow-hidden rounded-[28px] bg-peach">
              <Image
                src="https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=2400&q=95"
                alt="Fashion editorial look for a special occasion"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />

              <div className="absolute inset-0 bg-black/28" />

              <div className="relative flex min-h-[500px] flex-col items-center justify-center px-6 py-20 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                  Ready when you are
                </p>

                <h2 className="mt-5 max-w-3xl text-5xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-7xl">
                  What are you wearing this weekend?
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/80">
                  Find a look, check the dates and make it yours for a few days.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button
                    size="lg"
                    className="rounded-full bg-white px-6 text-foreground hover:bg-white/90"
                    asChild
                  >
                    <Link href="#featured-looks">
                      Explore looks
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full border-white/65 bg-white/8 px-6 text-white backdrop-blur-md hover:bg-white/15 hover:text-white"
                    asChild
                  >
                    <Link href="#rental-flow">See how it works</Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}