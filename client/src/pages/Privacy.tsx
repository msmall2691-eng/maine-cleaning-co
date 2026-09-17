import { companyInfo } from "@/lib/company-info";
import { useSEO } from "@/hooks/use-seo";
import { Section } from "@/components/layout/Section";
import { LogoWatermark } from "@/components/brand/Logo";

export default function Privacy() {
  useSEO({ title: "Privacy Policy", description: "Privacy policy for The Maine Cleaning Co. — how we collect, use, and protect your personal information." });
  return (
    <>
      {/* Compact page header — same top rhythm as every other page, so
          the h1 no longer starts 3.5rem under a fixed header with
          nothing above it. */}
      <Section
        measure="prose"
        rhythm="none"
        reveal={false}
        className="pt-28 sm:pt-36 lg:pt-40 pb-[clamp(1.75rem,3vw,2.75rem)]"
      >
        <h1 className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] leading-[1.05] font-serif font-bold tracking-[-0.02em] text-foreground heading-rule-left">Privacy Policy</h1>
        <p className="mt-7 text-sm text-muted-foreground">Last updated: March 2026</p>
      </Section>

      <Section measure="prose" rhythm="tight" className="overflow-hidden pb-[clamp(3.25rem,6vw,5.5rem)]">
        <LogoWatermark position="right" />
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-[0.95rem] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Information We Collect</h2>
            <p>When you use our website or request an estimate, we may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Name, email address, and phone number</li>
              <li>Property address and service details</li>
              <li>Photos you upload with your estimate request</li>
              <li>Account credentials if you create a client portal account</li>
              <li>Usage data such as pages visited and interactions with our site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide cleaning estimates and schedule services</li>
              <li>Communicate with you about your account or bookings</li>
              <li>Send appointment confirmations and reminders</li>
              <li>Improve our website and services</li>
              <li>Respond to your inquiries and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Information Sharing</h2>
            <p>We do not sell, rent, or trade your personal information to third parties. We may share information with trusted service providers who assist us in operating our website and business, subject to confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Data Security</h2>
            <p>We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Cookies</h2>
            <p>Our website uses cookies and similar technologies to improve your browsing experience and analyze site traffic. You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. To make a request, please contact us at <a href={companyInfo.contact.emailHref} className="text-primary hover:underline">{companyInfo.contact.email}</a>.</p>
          </section>

          <section>
            <h2 className="text-[1.25rem] sm:text-[1.375rem] font-serif font-bold text-foreground mb-3">Contact Us</h2>
            <p>If you have questions about this privacy policy, contact us at:</p>
            <p className="mt-2">
              The Maine Cleaning Co.<br />
              <a href={companyInfo.contact.emailHref} className="text-primary hover:underline">{companyInfo.contact.email}</a><br />
              <a href={companyInfo.contact.phoneHref} className="text-primary hover:underline">{companyInfo.contact.phoneDisplay}</a>
            </p>
          </section>
        </div>
      </Section>
    </>
  );
}
