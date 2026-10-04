import { T } from "./language-provider";
import { ChevronDown } from "lucide-react";
export const rentalFaqs = [
  [
    "Is the outfit cleaned and pressed?",
    "Ask the store about cleaning and the condition of your chosen item. Check it together at collection; the store will confirm its care process.",
  ],
  [
    "What if I stain it or a seam comes loose?",
    "Take a photo and contact the store before treating it yourself. Any charge must follow the terms agreed at collection.",
  ],
  [
    "Can I try it on first?",
    "Add a fitting request to your booking. The store will confirm a time and suitable options before you visit.",
  ],
  [
    "How much is the deposit?",
    "The store confirms the deposit and refund terms for your chosen item. Check the recipient and booking details before transferring money.",
  ],
  [
    "Does a request reserve my outfit?",
    "Not yet. Your booking ID lets you follow the request. The store confirms the reservation; payment is recorded separately.",
  ],
] as const;
export function RentalFaq() {
  return (
    <div className="store-faq-list">
      {rentalFaqs.map(([question, answer]) => (
        <details key={question}>
          <summary>
            <T>{question}</T>
            <ChevronDown aria-hidden="true" />
          </summary>
          <p>
            <T>{answer}</T>
          </p>
        </details>
      ))}
    </div>
  );
}
