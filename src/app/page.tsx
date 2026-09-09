import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  RotateCcw,
  Shirt,
  Sparkles,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";

// Presentation content only. These are not inventory records or rental policies.
const occasions = ["Date night", "Wedding guest", "Party", "Vacation", "Weekend"];
const perks = [
  { icon: Shirt, title: "Curated looks", note: "Pieces for the moments that matter" },
  { icon: Sparkles, title: "Room to experiment", note: "A new silhouette for your next plan" },
  { icon: RotateCcw, title: "Wear more. Keep less.", note: "Enjoy the outfit beyond ownership" },
];
const rentalSteps = [
  { icon: Shirt, title: "Choose your look", description: "Start with the occasion, then find a piece that feels like you." },
  { icon: CalendarDays, title: "Choose your dates", description: "Plan when you would like to wear your chosen look." },
  { icon: ClipboardCheck, title: "Confirm the details", description: "Check sizing, availability and rental terms before committing." },
  { icon: RotateCcw, title: "Wear & return", description: "Enjoy your moment, then follow the agreed return arrangements." },
];
const faqs = [
  { question: "How long can I rent an item?", answer: "The sample looks below show a 3-day rental. The rental period for your chosen piece needs to be confirmed before booking." },
  { question: "What if I am between sizes?", answer: "Check the measurements and fit of your chosen piece before renting. Size availability and alternatives still need to be confirmed." },
  { question: "How does delivery work?", answer: "Delivery options, timing and any charges need to be confirmed for your location and rental dates." },
  { question: "What happens after I wear it?", answer: "Return timing, care instructions and the return method need to be confirmed before your rental." },
];
const featuredLooks = [
  { name: "Muse Dress", collection: "The Occasion Edit", price: "₫280.000" },
  { name: "Luna Set", collection: "Weekend Edit", price: "₫220.000" },
  { name: "Soleil Top", collection: "Everyday Edit", price: "₫160.000" },
];

export default function HomePage() {
  return (
    <div className="landing-page" id="home">
      <a className="home-skip" href="#home-main">Skip to content</a>
      <SiteHeader />
      <main id="home-main" tabIndex={-1}>
        <section className="home-hero-wash" aria-labelledby="hero-title">
          <div className="home-container home-hero-inner">
            <div className="home-hero-grid">
              <div>
                <p className="home-hero-brands" aria-label="Outfit occasions">
                  {occasions.map((occasion) => <span key={occasion}>{occasion}</span>)}
                </p>
                <h1 className="home-hero-title" id="hero-title">
                  <span className="home-hero-title-main">Rental Store</span>
                  <span className="home-hero-title-sub">Find something worth wearing.</span>
                </h1>
                <p className="home-hero-lead">
                  Fashion rental for dates, celebrations and everyday plans.
                  A look for the moment, without a wardrobe full of one-time outfits.
                </p>
                <div className="home-actions">
                  <Button asChild size="lg" className="home-cta home-cta-glow">
                    <Link href="#featured-looks">Explore looks <ArrowRight aria-hidden="true" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="home-cta-ghost">
                    <Link href="#rental-process">How it works</Link>
                  </Button>
                </div>
              </div>
              <figure className="home-hero-media">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=90"
                  alt="Street-style fashion portrait in a mustard outfit"
                  fill
                  preload
                  sizes="(min-width: 1200px) 540px, (min-width: 1024px) 46vw, (min-width: 432px) 400px, calc(100vw - 32px)"
                  className="home-hero-photo"
                />
              </figure>
            </div>
            <ul className="home-hero-perks" aria-label="The rental idea">
              {perks.map(({ icon: Icon, title, note }) => (
                <li key={title}>
                  <span className="home-perk-icon"><Icon aria-hidden="true" /></span>
                  <div><p className="home-perk-title">{title}</p><p className="home-perk-note">{note}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="rental-process" className="home-botanical" aria-labelledby="process-title">
          <div className="home-container home-section-inner">
            <ScrollReveal><h2 className="home-section-title" id="process-title">Your next look, in four steps.</h2></ScrollReveal>
            <ol className="home-step-list">
              {rentalSteps.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="home-step">
                  <ScrollReveal delay={index * 60} className="home-step-content">
                    <span className="home-step-icon"><Icon aria-hidden="true" /></span>
                    <div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  </ScrollReveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="home-faq" aria-labelledby="faq-title">
          <div className="home-container home-section-inner">
            <ScrollReveal><h2 className="home-section-title" id="faq-title">Before you rent.</h2></ScrollReveal>
            <div className="home-faq-list">
              {faqs.map((faq) => (
                <details className="home-faq-row" key={faq.question} open>
                  <summary>{faq.question}<ChevronDown aria-hidden="true" /></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
            <Link href="#featured-looks" className="home-link-arrow">Find your next look <ArrowRight aria-hidden="true" /></Link>
          </div>
        </section>

        <section id="featured-looks" className="home-edit-dots" aria-labelledby="edit-title">
          <div className="home-container home-section-inner home-offer-grid">
            <ScrollReveal>
              <figure className="home-offer-poster">
                <div className="home-offer-photo">
                  <Image
                    src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=90"
                    alt="Fashion editorial with a patterned outfit and warm pink accents"
                    fill
                    sizes="(min-width: 1200px) 450px, (min-width: 1024px) 40vw, (min-width: 432px) 400px, calc(100vw - 32px)"
                    className="object-cover"
                  />
                </div>
                <figcaption><span>The rental edit</span><strong>Wear more.<br />Keep less.</strong></figcaption>
              </figure>
            </ScrollReveal>
            <div>
              <ScrollReveal>
                <h2 className="home-section-title" id="edit-title">What are you wearing next?</h2>
                <p className="home-offer-lead">The occasion dress. The effortless set. The top that changes a whole outfit. Start with a little inspiration.</p>
              </ScrollReveal>
              <ul className="home-offer-list" aria-label="Sample rental looks">
                {featuredLooks.map((look) => (
                  <li key={look.name}>
                    <Check className="home-offer-check" aria-hidden="true" />
                    <div><h3>{look.name}</h3><p>{look.collection}</p></div>
                    <p className="home-look-price"><strong>{look.price}</strong><span>/ 3 days</span></p>
                  </li>
                ))}
              </ul>
              <p className="home-offer-fine">Sample looks and indicative prices. Images are for inspiration; availability and rental terms are to be confirmed.</p>
              <Button asChild variant="outline" size="lg" className="home-cta-ghost">
                <Link href="#rental-process">See how renting works <ArrowRight aria-hidden="true" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
