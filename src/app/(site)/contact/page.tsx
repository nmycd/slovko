import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

// Padding and the message box follow the window height, so the page fits without scrolling.
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-[clamp(1rem,4vh,3rem)]">
      <ContactForm />
    </div>
  );
}
