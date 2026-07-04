import type { ReactNode } from "react";
import { BadgeIndianRupee, BarChart3, BriefcaseBusiness, CheckCircle2, ClipboardCheck, FileSignature, Gavel, Handshake, Scale, Search, ShieldCheck } from "lucide-react";

const brandObligations = [
  "Provide accurate company information, GST registration, PAN card, and legal entity details.",
  "Brand representatives must be 18 years of age or authorized representatives of the brand entity.",
  "Ensure all campaign briefs comply with applicable Indian laws.",
  "Campaigns undergo regulatory review and obtain necessary approvals from applicable authorities before launch.",
  "Respond to creator proposals and provide clear feedback within agreed timeframes.",
  "Respect creator intellectual property and contractual terms.",
  "The Brand grants Collune the right to use its name, logo, and partnership details for marketing, promotional, portfolio, and legitimate business purposes unless otherwise agreed in writing.",
];

const briefRequirements = [
  "Clear deliverables including content type, format, duration, and platform.",
  "Target audience and content guidelines.",
  "Campaign timeline and delivery deadline.",
  "Budget and compensation structure.",
  "Brand voice, tone, and key messaging.",
  "Advertising standards and legal disclosure requirements as applicable.",
];

const discoveryTools = [
  "Search creators by niche, audience size, engagement rate, and location.",
  "View verified metrics including follower count, engagement rate, and audience demographics.",
  "Review creator portfolios, past campaigns, and brand fit.",
  "Post campaign briefs publicly or send direct offers to selected creators.",
];

const negotiationItems = [
  "Brand posts campaign; creators submit proposals or brand sends direct offers.",
  "Brand and creator negotiate terms including budget, timeline, and deliverables on platform.",
  "Collune provides escrow service and mediates disputes.",
  "Once agreed, contract is finalized on the Collune platform and both parties are bound.",
];

const paymentItems = [
  "Brand submits budget at campaign posting.",
  "Upon creator acceptance, Collune places amount in escrow securely.",
  "After content delivery and brand approval, payment is released to creator.",
  "Collune deducts platform fee of 15-20% before disbursement to creator.",
];

const approvalItems = [
  "Creator delivers content by agreed date.",
  "Brand has 5 business days to review and approve or request revisions.",
  "Creator revises per feedback within 3 business days, with 2 rounds included.",
  "Brand gives final approval and payment is released to creator.",
];

const complianceItems = [
  "ASCI Compliance: Ensure creators disclose sponsored content appropriately.",
  "ECI Compliance for Politics Niche: Obtain pre-approval for political campaigns, disclose funding source, and avoid violation of election guidelines.",
  "IT Rules 2021: Ensure content complies with government content moderation guidelines.",
  "Indemnification: Brand indemnifies Collune and creators for legal claims from campaign content.",
];

function Section({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof BriefcaseBusiness;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#dfe7f2] bg-white p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#eef3ff] text-[#173ca8]">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-black text-[#173ca8]">{number}</p>
          <h2 className="mt-1 text-2xl font-black tracking-normal text-[#101828]">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item} className="flex gap-3 rounded-lg bg-[#f7f9fc] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2fbe74]" />
          <p className="text-sm font-semibold leading-6 text-[#53627a]">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function BrandServicesTerms() {
  return (
    <main className="bg-white pt-32 text-[#1d2430]">
      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10">
        <div className="max-w-4xl">
          <span className="inline-flex h-10 items-center rounded-lg bg-[#eef3ff] px-4 text-sm font-black text-[#173ca8]">
            Brand Services Terms & Conditions
          </span>
          <h1 className="mt-6 text-[40px] font-black leading-tight tracking-normal text-[#101828] md:text-[58px]">
            Terms for brands, companies, and institutions using Collune.
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-[#5f6f89]">
            These Brand Services Terms supplement the primary Terms & Conditions and govern how brands and institutions use Collune to discover creators, manage campaigns, and execute collaborations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Effective Date: To be updated</span>
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Last Updated: To be updated</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <Section number="1" title="Brand Platform Access & Responsibilities" icon={BriefcaseBusiness}>
            <BulletList items={brandObligations} />
          </Section>

          <Section number="2" title="Campaign Creation & Brief Standards" icon={ClipboardCheck}>
            <BulletList items={briefRequirements} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Vague, incomplete, or non-compliant briefs may result in creator rejection or campaign delay. Collune may request revision of non-compliant briefs.
            </p>
          </Section>

          <Section number="3" title="Creator Discovery & Selection" icon={Search}>
            <BulletList items={discoveryTools} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              All creator metrics are verified by Collune. Brands receive authentic engagement data; Collune bans creators using fake followers or fraudulent metrics.
            </p>
          </Section>

          <Section number="4" title="Campaign Negotiation & Approval" icon={Handshake}>
            <BulletList items={negotiationItems} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Only authorized brand representatives with verified email or legal signature can approve campaigns. Collune confirms approval status.
            </p>
          </Section>

          <Section number="5" title="Payment & Budget Management" icon={BadgeIndianRupee}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Payment Process</h3>
                <BulletList items={paymentItems} />
              </div>
              <div className="rounded-lg bg-[#eef3ff] p-5">
                <h3 className="text-sm font-black text-[#1d2430]">Tax Compliance</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                  If a brand is GST-registered, 2% TDS is deducted per GST Act. Brands receive tax invoices from Collune and creators. For multiple campaigns, Collune provides consolidated reporting and tax documentation.
                </p>
              </div>
            </div>
          </Section>

          <Section number="6" title="Content Review & Approval Process" icon={FileSignature}>
            <BulletList items={approvalItems} />
            <p className="mt-4 text-sm font-black leading-6 text-[#1d2430]">
              If a brand does not respond within 5 days, content is deemed approved and payment is released. Brand cannot later reject approved content.
            </p>
          </Section>

          <Section number="7" title="Content Rights & Licensing" icon={ShieldCheck}>
            <div className="rounded-lg bg-[#f7f9fc] p-5">
              <h3 className="text-sm font-black text-[#1d2430]">Brand License Scope</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                Brand receives a non-exclusive, limited license to use creator content for the campaign duration, agreed platforms, and agreed geographic scope. Non-exclusive means creators may use content for portfolio and case studies.
              </p>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Brand cannot extend use beyond agreed scope, modify content, claim authorship, or sublicense without creator written consent. Extended licensing requires separate negotiation and additional payment.
            </p>
          </Section>

          <Section number="8" title="Dispute Resolution & Cancellation" icon={Gavel}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Brand Cancellation</h3>
                <BulletList
                  items={[
                    "Before work begins: 100% refund.",
                    "During production, 0-50% complete: 50% refund to brand.",
                    "Near completion, 50%+ complete: no refund; creator retains payment.",
                    "Post-delivery: no refund; content cannot be used by brand.",
                  ]}
                />
              </div>
              <div className="rounded-lg bg-[#eef3ff] p-5">
                <h3 className="text-sm font-black text-[#1d2430]">Disputes</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                  Collune mediates content quality, approval, and payment disputes. Unresolved disputes are escalated to Jaipur jurisdiction courts. Brand may appeal Collune's decision to independent arbitration.
                </p>
              </div>
            </div>
          </Section>

          <Section number="9" title="Compliance & Regulatory Requirements" icon={Scale}>
            <BulletList items={complianceItems} />
            <p className="mt-4 text-sm font-black leading-6 text-[#1d2430]">
              Collune may remove non-compliant campaigns. Repeated violations may result in account suspension or permanent ban.
            </p>
          </Section>

          <Section number="10" title="Analytics & Reporting" icon={BarChart3}>
            <p className="text-sm font-semibold leading-6 text-[#53627a]">
              Brands receive real-time dashboards tracking creator metrics, engagement, and reach. Post-campaign reports include impressions, engagement rate, click-through rate, and audience insights.
            </p>
          </Section>
        </div>
      </section>
    </main>
  );
}
