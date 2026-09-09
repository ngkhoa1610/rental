import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
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
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=90",
  },
  {
    label: "Wedding guest",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600&q=90",
  },
  {
    label: "Party",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=90",
  },
  {
    label: "Vacation",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=90",
  },
  {
    label: "Weekend",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90",
  },
];

const categories = [
  {
    label: "Dresses",
    count: "32 looks",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1400&q=90",
  },
  {
    label: "Sets",
    count: "18 looks",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90",
  },
  {
    label: "Tops",
    count: "24 looks",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=90",
  },
  {
    label: "Outerwear",
    count: "12 looks",
    image:
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=1200&q=90",
  },
];

const featuredLooks = [
  {
    name: "Muse Dress",
    collection: "The Occasion Edit",
    price: "₫280.000",
    duration: "3 days",
    image:
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1800&q=90",
  },
  {
    name: "Luna Set",
    collection: "Weekend Edit",
    price: "₫220.000",
    duration: "3 days",
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=90",
  },
  {
    name: "Soleil Top",
    collection: "Everyday Edit",
    price: "₫160.000",
    duration: "3 days",
    image:
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=90",
  },
];

const rentalSteps = [
  {
    number: "01",
    title: "Choose your look",
    description:
      "Browse pieces curated around occasions, moods and moments worth dressing for.",
  },
  {
    number: "02",
    title: "Choose your dates",
    description:
      "Tell us when you need it. We make sure your look is ready when you are.",
  },
  {
    number: "03",
    title: "Confirm your rental",
    description:
      "Select your size, review the rental details and confirm your order in minutes.",
  },
  {
    number: "04",
    title: "Wear & return",
    description:
      "Wear it your way, then return it when your rental window is over.",
  },
];

const faqs = [
  {
    question: "How long can I rent an item?",
    answer:
      "Our standard rental window is 3 days. Selected pieces and occasions may have different rental durations.",
  },
  {
    question: "What if I am between sizes?",
    answer:
      "Each product includes a detailed size guide. Selected styles can also be arranged with size alternatives.",
  },
  {
    question: "How does delivery work?",
    answer:
      "Your order is prepared ahead of your selected rental date and delivered according to the available delivery option for your area.",
  },
  {
    question: "What happens after I wear it?",
    answer:
      "Simply return the piece using the provided return process. We take care of cleaning and preparing it for the next rental.",
  },
];

export default function HomePage() {
  return (
    <div className="landing-page min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="home-hero">
          <div className="home-hero-wash">
            <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
              <ScrollReveal className="home-hero-copy">
                <div className="home-hero-brands">
                  <span>Rental Store</span>
                  <span className="home-hero-dot" />
                  <span>Fashion Rental</span>
                </div>

                <h1 className="home-hero-title">
                  <span className="home-hero-title-main">
                    Find something
                  </span>
                  <span className="home-hero-title-sub">
                    worth wearing.
                  </span>
                </h1>

                <p className="home-hero-lead">
                  Curated fashion for the moments you want to remember —
                  without keeping a wardrobe full of one-time outfits.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    className="home-primary-cta rounded-full px-6"
                    asChild
                  >
                    <Link href="#featured-looks">
                      Explore the collection
                      <ArrowRight />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="home-secondary-cta rounded-full px-6"
                    asChild
                  >
                    <Link href="#rental-process">
                      How renting works
                    </Link>
                  </Button>
                </div>

                <div className="home-hero-note">
                  <Sparkles className="size-4" />
                  <span>
                    Thoughtfully selected. Professionally cleaned. Ready to
                    wear.
                  </span>
                </div>
              </ScrollReveal>

              <ScrollReveal
                className="home-hero-media"
                delay={120}
                distance={32}
              >
                <div className="home-hero-photo-wrap">
                  <div className="home-hero-frame" />

                  <div className="home-hero-photo">
                    <Image
                      src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2200&q=95"
                      alt="Fashion rental editorial"
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="home-hero-caption">
                    <span>New collection</span>
                    <ArrowDownRight className="size-4" />
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal distance={18}>
              <div className="mx-auto w-full max-w-[1440px] px-4 pb-5 sm:px-6 lg:px-8">
                <div className="home-perks">
                  <div className="home-perk">
                    <Check />
                    <div>
                      <strong>Curated looks</strong>
                      <span>Pieces selected for real occasions</span>
                    </div>
                  </div>

                  <div className="home-perk">
                    <Check />
                    <div>
                      <strong>Easy rental</strong>
                      <span>Choose your dates and we handle the rest</span>
                    </div>
                  </div>

                  <div className="home-perk">
                    <Check />
                    <div>
                      <strong>Ready to wear</strong>
                      <span>Cleaned, prepared and checked before delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="occasions" className="home-section home-botanical">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <ScrollReveal>
              <div className="home-section-heading">
                <div>
                  <span className="home-eyebrow">Start with the moment</span>
                  <h2>What are you dressing for?</h2>
                </div>

                <Link
                  href="/collections"
                  className="home-text-link hidden sm:inline-flex"
                >
                  Explore all occasions
                  <ArrowRight />
                </Link>
              </div>
            </ScrollReveal>

            <div className="home-occasion-grid">
              {occasions.map((occasion, index) => (
                <ScrollReveal key={occasion.label} delay={index * 70}>
                  <Link
                    href={`/products?occasion=${encodeURIComponent(
                      occasion.label
                    )}`}
                    className={`home-occasion ${
                      index === 0 ? "home-occasion-featured" : ""
                    }`}
                  >
                    <div className="home-occasion-image">
                      <Image
                        src={occasion.image}
                        alt={occasion.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="home-occasion-overlay" />

                    <div className="home-occasion-label">
                      <span>{occasion.label}</span>
                      <ChevronRight />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>

            <Link
              href="/collections"
              className="home-text-link mt-6 inline-flex sm:hidden"
            >
              Explore all occasions
              <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="home-section home-categories">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <ScrollReveal>
              <div className="mb-12 max-w-2xl">
                <span className="home-eyebrow">Browse the wardrobe</span>
                <h2>Pieces made for more than one plan.</h2>
                <p>
                  From effortless sets to occasion-ready dresses, discover
                  pieces that make renting feel as natural as getting dressed.
                </p>
              </div>
            </ScrollReveal>

            <div className="home-category-grid">
              {categories.map((category, index) => (
                <ScrollReveal
                  key={category.label}
                  delay={index * 80}
                  className={
                    index === 0
                      ? "home-category home-category-large"
                      : "home-category"
                  }
                >
                  <Link href="/products" className="group block">
                    <div className="home-category-image">
                      <Image
                        src={category.image}
                        alt={category.label}
                        fill
                        sizes={
                          index === 0
                            ? "(max-width: 768px) 100vw, 50vw"
                            : "(max-width: 768px) 50vw, 25vw"
                        }
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      />
                    </div>

                    <div className="home-category-meta">
                      <div>
                        <h3>{category.label}</h3>
                        <span>{category.count}</span>
                      </div>
                      <ArrowRight />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="featured-looks" className="home-section home-featured">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <ScrollReveal>
              <div className="home-section-heading mb-12">
                <div>
                  <span className="home-eyebrow">The latest edit</span>
                  <h2>Looks worth making plans for.</h2>
                </div>

                <Link
                  href="/products?sort=new"
                  className="home-text-link hidden sm:inline-flex"
                >
                  View new arrivals
                  <ArrowRight />
                </Link>
              </div>
            </ScrollReveal>

            <div className="home-featured-grid">
              <ScrollReveal className="home-featured-main">
                <Link href="/products/muse-dress" className="group block">
                  <div className="home-featured-image">
                    <Image
                      src={featuredLooks[0].image}
                      alt={featuredLooks[0].name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />

                    <span
                      className="home-image-action"
                      aria-hidden="true"
                    >
                      <Heart />
                    </span>

                    <span className="home-image-badge">New</span>
                  </div>

                  <div className="home-product-meta">
                    <div>
                      <span className="home-product-collection">
                        {featuredLooks[0].collection}
                      </span>
                      <h3>{featuredLooks[0].name}</h3>
                    </div>

                    <div className="text-right">
                      <strong>{featuredLooks[0].price}</strong>
                      <span>/ {featuredLooks[0].duration}</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>

              <div className="home-featured-support">
                {featuredLooks.slice(1).map((look, index) => (
                  <ScrollReveal key={look.name} delay={120 + index * 100}>
                    <Link href="/products" className="group block">
                      <div className="home-support-image">
                        <Image
                          src={look.image}
                          alt={look.name}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                        />
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <span className="home-product-collection">
                            {look.collection}
                          </span>
                          <h3 className="mt-1 text-lg font-medium tracking-[-0.025em]">
                            {look.name}
                          </h3>
                        </div>

                        <div className="text-right text-sm">
                          <strong>{look.price}</strong>
                          <span className="block text-muted-foreground">
                            / {look.duration}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <Link
              href="/products?sort=new"
              className="home-text-link mt-8 inline-flex sm:hidden"
            >
              View new arrivals
              <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="home-section home-rental-edit">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="home-offer">
              <ScrollReveal className="home-offer-media">
                <Image
                  src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90"
                  alt="Fashion rental collection"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />

                <div className="home-offer-tag">The rental edit</div>
              </ScrollReveal>

              <ScrollReveal
                className="home-offer-content"
                delay={100}
                distance={28}
              >
                <span className="home-eyebrow">Wear more. Keep less.</span>

                <h2>
                  Your wardrobe
                  <br />
                  doesn&apos;t need
                  <br />
                  to own everything.
                </h2>

                <p>
                  Renting gives you room to experiment. Try the silhouette,
                  color or occasion piece you&apos;ve been thinking about —
                  then send it back when the moment is over.
                </p>

                <ul className="home-offer-list">
                  <li>
                    <Check />
                    <span>Curated styles for real occasions</span>
                  </li>
                  <li>
                    <Check />
                    <span>Professional cleaning between rentals</span>
                  </li>
                  <li>
                    <Check />
                    <span>Simple delivery and return process</span>
                  </li>
                </ul>

                <div className="home-offer-price">
                  <span>Starting from</span>
                  <strong>₫160.000</strong>
                  <span>/ rental</span>
                </div>

                <Button
                  size="lg"
                  className="home-primary-cta mt-7 rounded-full px-6"
                  asChild
                >
                  <Link href="/products">
                    Explore rental pieces
                    <ArrowRight />
                  </Link>
                </Button>

                <span className="home-offer-fine">
                  Prices vary by item, size and rental duration.
                </span>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section
          id="rental-process"
          className="home-section home-process"
        >
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <ScrollReveal>
              <div className="home-process-heading">
                <div>
                  <span className="home-eyebrow">
                    No complicated wardrobe math
                  </span>
                  <h2>Renting made simple.</h2>
                </div>

                <p>
                  Pick a look, tell us when you need it, then enjoy the outfit.
                  We take care of everything around it.
                </p>
              </div>
            </ScrollReveal>

            <div className="home-steps">
              {rentalSteps.map((step, index) => (
                <ScrollReveal
                  key={step.number}
                  delay={index * 90}
                  className="home-step"
                >
                  <div className="home-step-number">{step.number}</div>

                  <div className="home-step-body">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>

                  {index < rentalSteps.length - 1 && (
                    <div className="home-step-connector" aria-hidden="true">
                      <ArrowRight />
                    </div>
                  )}
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-lookbook">
          <div className="mx-auto max-w-[1440px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <ScrollReveal>
              <div className="home-section-heading mb-12">
                <div>
                  <span className="home-eyebrow">From the lookbook</span>
                  <h2>Dress for the memory.</h2>
                </div>

                <Link
                  href="/lookbook"
                  className="home-text-link hidden sm:inline-flex"
                >
                  See the lookbook
                  <ArrowRight />
                </Link>
              </div>
            </ScrollReveal>

            <div className="home-lookbook-grid">
              <ScrollReveal className="home-lookbook-item home-lookbook-tall">
                <Image
                  src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90"
                  alt="Fashion lookbook"
                  fill
                  sizes="(max-width: 768px) 100vw, 35vw"
                  className="object-cover"
                />
              </ScrollReveal>

              <ScrollReveal
                className="home-lookbook-item"
                delay={90}
              >
                <Image
                  src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=90"
                  alt="Fashion lookbook"
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover"
                />
              </ScrollReveal>

              <ScrollReveal
                className="home-lookbook-item home-lookbook-wide"
                delay={180}
              >
                <Image
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=90"
                  alt="Fashion lookbook"
                  fill
                  sizes="(max-width: 768px) 100vw, 35vw"
                  className="object-cover"
                />
              </ScrollReveal>
            </div>

            <Link
              href="/lookbook"
              className="home-text-link mt-8 inline-flex sm:hidden"
            >
              See the lookbook
              <ArrowRight />
            </Link>
          </div>
        </section>

        <section className="home-section home-faq">
          <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:py-28">
            <ScrollReveal>
              <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
                <div>
                  <span className="home-eyebrow">Before you rent</span>
                  <h2>Good to know.</h2>
                  <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                    A few answers before your first rental. If you still have
                    questions, we&apos;re happy to help.
                  </p>

                  <Link
                    href="/faq"
                    className="home-text-link mt-7 inline-flex"
                  >
                    Read all FAQs
                    <ArrowRight />
                  </Link>
                </div>

                <div className="home-faq-list">
                  {faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="home-faq-row"
                    >
                      <summary>
                        <span>{faq.question}</span>
                        <ChevronRight />
                      </summary>

                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="home-final-cta">
          <div className="home-final-image">
            <Image
              src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2200&q=95"
              alt="Fashion rental editorial"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="home-final-overlay" />

          <ScrollReveal className="home-final-content" distance={20}>
            <span className="home-eyebrow">Your next look is waiting</span>

            <h2>What are you wearing next?</h2>

            <p>
              Find something you love. Rent it for the moment. Send it back
              when you&apos;re ready.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="home-primary-cta rounded-full bg-white px-7 text-foreground hover:bg-white/90"
                asChild
              >
                <Link href="/products">
                  Explore looks
                  <ArrowRight />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/60 bg-white/10 px-7 text-white backdrop-blur-sm hover:bg-white hover:text-foreground"
                asChild
              >
                <Link href="#rental-process">
                  See how it works
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}