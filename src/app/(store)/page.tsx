import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Shirt,
  ClipboardCheck,
  MapPin,
} from "lucide-react";
import { T } from "@/components/store/language-provider";
import { ProductCard } from "@/components/store/product-card";
import { QuickBooking } from "@/components/store/quick-booking";
import { RentalFaq } from "@/components/store/rental-faq";
import { FashionImage } from "@/components/ui/fashion-image";
import { SectionButton } from "@/components/ui/section-button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { storeProducts } from "@/server/rental/storefront";
export const metadata: Metadata = {
  title: "Rental Store — Trang phục đẹp, đúng lịch của bạn",
  description:
    "Khám phá trang phục, xem lịch trống và gửi yêu cầu thuê. Nhận mã hẹn, chờ shop xác nhận; không thanh toán qua cổng online.",
};
const steps = [
  {
    icon: Shirt,
    title: "Find your look",
    copy: "Explore silhouettes and measurements before choosing.",
  },
  {
    icon: CalendarDays,
    title: "Pick dates. Send a request.",
    copy: "Check availability and use your saved contact details.",
  },
  {
    icon: ClipboardCheck,
    title: "Get your booking ID",
    copy: "The store confirms your dates and any deposit required.",
  },
  {
    icon: MapPin,
    title: "Try on. Pick up. Enjoy.",
    copy: "Arrange your visit. Delivery requests need store confirmation.",
  },
];
export default async function HomePage() {
  const products = await storeProducts();
  if (!products.length)
    return (
      <div className="store-home">
        <h1>Trang phục đẹp, đúng lịch của bạn</h1>
        <p>Cửa hàng đang chuẩn bị bộ sưu tập.</p>
        <RentalFaq />
      </div>
    );
  return (
    <div className="store-home">
      <section className="store-home-hero" aria-labelledby="hero-title">
        <div className="store-hero-copy">
          <p className="store-overline">THE SAKURA WARDROBE · 2026</p>
          <h1 id="hero-title">
            <T>{"The right look."}</T>
            <em>
              <T>{"For your day."}</T>
            </em>
          </h1>
          <p className="store-hero-lead">
            <T>
              {
                "Dress for the invitation, the celebration, or just a different kind of day. Find a look, check your dates, and let the store take it from there."
              }
            </T>
          </p>
          <div className="home-actions">
            <SectionButton target="quick-booking" className="home-cta">
              <CalendarDays />
              <T>{"Check outfit availability"}</T>
            </SectionButton>
            <SectionButton target="weekly-offers" className="store-text-link">
              <T>{"This week's offers"}</T>
              <ArrowUpRight />
            </SectionButton>
          </div>
          <div className="store-hero-note">
            <span>01 / 03</span>
            <p>
              <T>{"More moments. Less wardrobe."}</T>
            </p>
          </div>
        </div>
        <figure className="store-hero-image">
          <FashionImage
            src={products[0].image}
            alt={products[0].imageAlt}
            fill
            preload
            sizes="(max-width:767px) 92vw, 550px"
          />
          <div className="store-hero-image-note">
            <Sparkles />
            <div>
              <span>THE OCCASION EDIT</span>
              <strong>{products[0].name}</strong>
            </div>
            <Link
              href={`/products/${products[0].slug}`}
              aria-label={`View ${products[0].name}`}
            >
              <ArrowUpRight />
            </Link>
          </div>
          <figcaption>
            <T>{"Styling image · illustrative"}</T>
          </figcaption>
        </figure>
      </section>
      <ul className="store-trust-strip">
        {[
          { icon: CalendarDays, text: "Check dates before you book" },
          { icon: ShieldCheck, text: "Deposit confirmed with the store" },
          { icon: Sparkles, text: "Offline payment. No online gateway." },
        ].map(({ icon: Icon, text }) => (
          <li key={text}>
            <Icon aria-hidden="true" />
            <T>{text}</T>
          </li>
        ))}
      </ul>
      <QuickBooking />
      <ScrollReveal>
        <section className="store-home-section" id="rental-process">
          <div className="store-section-heading">
            <div>
              <p className="store-overline">
                <T>{"A simple rental ritual"}</T>
              </p>
              <h2>
                <T>{"Four steps. One good look."}</T>
              </h2>
            </div>
            <Link href="/rental-guide" className="store-text-link">
              <T>{"See the rental guide"}</T>
              <ArrowUpRight />
            </Link>
          </div>
          <ol className="store-step-grid">
            {steps.map(({ icon: Icon, title, copy }, index) => (
              <li key={title}>
                <div>
                  <span>0{index + 1}</span>
                  <Icon />
                </div>
                <h3>
                  <T>{title}</T>
                </h3>
                <p>
                  <T>{copy}</T>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </ScrollReveal>
      <section className="store-home-section">
        <div className="store-section-heading">
          <div>
            <p className="store-overline">
              <T>{"Curated for your next plan"}</T>
            </p>
            <h2>
              <T>{"A wardrobe. Many versions of you."}</T>
            </h2>
          </div>
          <Link href="/products" className="store-text-link">
            <T>{"Explore the wardrobe"}</T>
            <ArrowUpRight />
          </Link>
        </div>
        <div className="store-product-grid">
          {products.map((product) => (
            <ProductCard product={product} key={product.slug} />
          ))}
        </div>
      </section>
      <section id="weekly-offers" tabIndex={-1} className="store-offer-card">
        <Sparkles aria-hidden="true" />
        <div>
          <p className="store-overline">
            <T>{"This week's offers"}</T>
          </p>
          <h2>
            <T>{"A little something to look forward to."}</T>
          </h2>
          <p>
            <T>
              {
                "Offers are being updated. The store will confirm prices and terms before your rental."
              }
            </T>
          </p>
        </div>
        <Link href="/products" className="home-cta-ghost">
          <T>{"Explore looks"}</T>
          <ArrowUpRight />
        </Link>
      </section>
      <section className="store-home-section store-home-faq">
        <div>
          <p className="store-overline">
            <T>{"Before you rent"}</T>
          </p>
          <h2>
            <T>{"Good questions. Clear answers."}</T>
          </h2>
          <p>
            <T>{"Your outfit should feel right. So should the rental."}</T>
          </p>
        </div>
        <RentalFaq />
      </section>
      <section className="store-home-section">
        <div className="store-section-heading">
          <div>
            <p className="store-overline">
              <T>{"The outfit, out in the world"}</T>
            </p>
            <h2>
              <T>{"See it. Style it. Make it yours."}</T>
            </h2>
            <p>
              <T>
                {
                  "Styling examples for now. Real customer photos are published only with permission."
                }
              </T>
            </p>
          </div>
          <Link href="/feedback" className="store-text-link">
            <T>{"The feedback wall"}</T>
            <ArrowUpRight />
          </Link>
        </div>
        <div className="store-inspiration-grid">
          {products.map((p) => (
            <figure key={p.slug}>
              <FashionImage
                src={p.image}
                alt={p.imageAlt}
                fill
                sizes="(max-width:639px) 90vw, 380px"
              />
              <figcaption>
                <span>
                  <T>{"Illustrative outfit"}</T>
                </span>
                <Link href={`/products/${p.slug}`}>
                  {p.name}
                  <ArrowUpRight />
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
