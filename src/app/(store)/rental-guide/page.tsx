import type { Metadata } from "next";
import { Ruler, ShieldCheck, MapPin } from "lucide-react";
import { PageHeading } from "@/components/store/page-heading";
import { RentalFaq } from "@/components/store/rental-faq";
import { ContactOptions } from "@/components/store/contact-options";
import { T } from "@/components/store/language-provider";
export const metadata: Metadata = {
  title: "Bảng size & Quy định — Rental Store",
};
export default function RentalGuidePage() {
  return (
    <>
      <PageHeading
        eyebrow="Before your first rental"
        title="A good fit starts with clear details."
        description="Measure, ask, and agree the details before collecting your outfit. Product measurements and store policies are confirmed individually."
      />
      <div className="store-guide-grid">
        <section className="store-guide-panel">
          <Ruler />
          <h2>
            <T>{"Find your fit"}</T>
          </h2>
          <p>
            <T>
              {
                "Use a soft tape. Keep it level and comfortable, without pulling tight."
              }
            </T>
          </p>
          <table>
            <caption>
              <T>{"How to measure — not a product size chart"}</T>
            </caption>
            <thead>
              <tr>
                <th>
                  <T>{"Measurement"}</T>
                </th>
                <th>
                  <T>{"Where to measure"}</T>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Bust", "Around the fullest part of your bust"],
                ["Waist", "Around your natural waist"],
                ["Hips", "Around the fullest part of your hips"],
              ].map(([a, b]) => (
                <tr key={a}>
                  <th>
                    <T>{a}</T>
                  </th>
                  <td>
                    <T>{b}</T>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <T>
              {
                "Garment-specific S/M/L measurements have not been supplied. Your usual size is a note for advice, not a guaranteed fit."
              }
            </T>
          </p>
          <ContactOptions label="Ask about sizing on Zalo" />
        </section>
        <section className="store-guide-panel">
          <ShieldCheck />
          <h2>
            <T>{"Agree before you rent"}</T>
          </h2>
          <ul>
            <li>
              <T>
                {
                  "Confirm the item's condition and any included accessories at pickup."
                }
              </T>
            </li>
            <li>
              <T>
                {
                  "Agree on care and damage terms with the store before collection."
                }
              </T>
            </li>
            <li>
              <T>
                {
                  "No ID upload is required in this preview. Do not send identity documents through booking notes."
                }
              </T>
            </li>
          </ul>
          <MapPin />
          <h3>
            <T>{"Collection & return"}</T>
          </h3>
          <p>
            <T>
              {
                "Store pickup is the default. Delivery and fitting requests require confirmation; fees and timing are not assumed."
              }
            </T>
          </p>
        </section>
      </div>
      <section className="store-home-section">
        <h2>
          <T>{"Good questions. Clear answers."}</T>
        </h2>
        <RentalFaq />
      </section>
    </>
  );
}
