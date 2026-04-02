import { companyInfo } from "@/lib/company-info";
import { useSEO } from "@/hooks/use-seo";

export default function Terms() {
  useSEO({ title: "Terms of Service", description: "Terms of service for The Maine Cleaning Co. — scheduling, cancellations, payment, and satisfaction guarantee." });
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-28 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-3">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-[0.95rem] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Agreement to Terms</h2>
            <p>By accessing or using The Maine Cleaning Co. website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Services</h2>
            <p>The Maine Cleaning Co. provides residential, commercial, and short-term rental cleaning services in Southern Maine. Service availability, pricing, and scheduling are subject to change. Online estimates are non-binding and provided for informational purposes; final pricing is confirmed after review of your property and requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Scheduling & Cancellations</h2>
            <p>We ask for at least 24 hours' notice for cancellations or rescheduling. Late cancellations or no-shows may be subject to a cancellation fee. We will make every reasonable effort to accommodate schedule changes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Payment</h2>
            <p>Payment is due upon completion of services unless other arrangements have been made in writing. We accept major credit cards, ACH transfers, and other payment methods as communicated at the time of booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Satisfaction Guarantee</h2>
            <p>We stand behind the quality of our work. If you are not satisfied with our cleaning, please contact us within 24 hours and we will return to address any concerns at no additional charge.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Liability</h2>
            <p>The Maine Cleaning Co. is fully bonded and insured. We take care to protect your property during every cleaning. In the unlikely event of damage, please notify us within 24 hours so we can resolve the matter promptly.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Website Use</h2>
            <p>You agree not to misuse our website or attempt to access it through unauthorized means. Content on this website is the property of The Maine Cleaning Co. and may not be reproduced without permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Changes to Terms</h2>
            <p>We reserve the right to update these terms at any time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the revised terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact Us</h2>
            <p>For questions about these terms, please contact us:</p>
            <p className="mt-2">
              The Maine Cleaning Co.<br />
              <a href={companyInfo.contact.emailHref} className="text-primary hover:underline">{companyInfo.contact.email}</a><br />
              <a href={companyInfo.contact.phoneHref} className="text-primary hover:underline">{companyInfo.contact.phoneDisplay}</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
