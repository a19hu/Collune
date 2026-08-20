import type { ReactNode } from "react";
import { BadgeIndianRupee, Ban, CheckCircle2, ClipboardList, FileCheck2, FileClock, Gavel, Handshake, Scale, ShieldCheck, UserRoundCheck } from "lucide-react";

const creatorObligations = [
  "Maintain accurate profile information with real audience metrics, honest engagement rates, and genuine follower counts.",
  "Creator account holders must be 18 years of age or authorized representatives of a creator or talent management agency.",
  "Respond to brand inquiries within 24-48 hours.",
  "Honor agreed collaboration terms and deliver content as per brief.",
  "Disclose all sponsored or advertorial content as per ASCI guidelines.",
  "Comply with ECI guidelines for political content in the Politics niche.",
  "Do not engage in fraudulent activity, fake engagement, or bot follower inflation.",
  "Grant Collune the right to use creator name, professional profile, social media handle, and partnership details for marketing, promotional, portfolio, and legitimate business purposes unless otherwise agreed in writing.",
];

const workflow = [
  "Brand posts campaign brief on Collune platform.",
  "Creator reviews brief and submits proposal or accepts offer.",
  "Brand approves creator or negotiates terms.",
  "Collune mediates all contract terms and agreement execution.",
  "Campaign is executed and payment is released post-delivery and approval.",
];

const acceptanceItems = [
  "Deliver content as specified.",
  "Meet agreed timeline.",
  "Comply with regulatory requirements.",
  "Obtain all necessary permissions including music rights and model releases.",
  "Follow brand content guidelines.",
];

const deliveryItems = [
  "Content delivered on agreed date to Collune platform or via secure file transfer.",
  "Technical specifications including resolution, format, and file size must match the brief.",
  "Late delivery may result in revision round forfeiture or campaign cancellation.",
  "Extensions may be granted for illness, natural disaster, or circumstances beyond reasonable control with documentation.",
];

const paymentItems = [
  "Creator sets rates through Collune platform or negotiates per campaign.",
  "Collune holds payment in escrow until delivery and approval.",
  "Payment is released 7 days post-brand approval.",
  "Collune platform fee is 15-20%, displayed at registration with transparent billing.",
];

const taxItems = [
  "Creator is responsible for income tax filing and GST registration if applicable.",
  "Collune issues 1099-equivalent Indian tax document for all earnings.",
  "If brand is GST-registered, TDS of 2% is applied per GST Act.",
];

const ownershipItems = [
  "Creator retains copyright and moral rights to original creative work.",
  "Creator grants brand a limited, non-exclusive license to use content for campaign duration.",
  "Brand may not modify, remix, or repurpose content beyond agreed scope without additional payment.",
  "If brand requests extended usage beyond campaign duration or platforms, creator may negotiate separate licensing fees or extended terms directly with brand.",
];

const cancellationItems = [
  "Creator cancels before work begins: 100% refund to brand.",
  "Creator cancels mid-project, 0-50% complete: creator refunds 50% of payment.",
  "Creator cancels near completion, 50%+ complete: creator retains all payment; brand may not use content.",
  "Brand cancels anytime: creator retains 75% of agreed payment; brand forfeits content rights.",
];

const complianceItems = [
  "ASCI Compliance: Disclose sponsored or advertorial content with '#Ad', '#Sponsored', or 'In Association With'.",
  "ECI Compliance for Politics Niche: Disclose political content, funding source, and comply with pre-poll survey guidelines.",
  "Content Guidelines: No hate speech, misinformation, defamation, or obscene content.",
  "IP Rights: Obtain music licenses, model releases, and third-party permissions.",
  "Platform Compliance: Follow Collune's community guidelines and brand safety standards.",
];

const metricItems = [
  "Collune may verify engagement metrics, audience demographics, and follower authenticity.",
  "Creator must provide honest, real-time analytics to brands.",
  "Fraudulent metrics reporting may result in account suspension and fee forfeiture.",
];

function Section({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof UserRoundCheck;
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

export default function CreativeServicesTerms() {
  return (
    <main className="bg-white pt-32 text-[#1d2430]">
      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10">
        <div className="max-w-4xl">
          <span className="inline-flex h-10 items-center rounded-lg bg-[#eef3ff] px-4 text-sm font-black text-[#173ca8]">
            Creative Services Terms & Conditions
          </span>
          <h1 className="mt-6 text-[40px] font-black leading-tight tracking-normal text-[#101828] md:text-[58px]">
            Terms for creators offering services through Collune.
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-[#5f6f89]">
            These Creative Services Terms supplement the primary Terms & Conditions and govern how content creators use Collune to offer services, manage collaborations, and fulfill campaigns with brands.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Effective Date: To be updated</span>
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Last Updated: To be updated</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <Section number="1" title="Creator Platform Responsibilities" icon={UserRoundCheck}>
            <BulletList items={creatorObligations} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Collune reserves the right to audit creator metrics, remove creators with fraudulent followers, and ban accounts engaging in unethical practices.
            </p>
          </Section>

          <Section number="2" title="Campaign Acceptance & Terms" icon={Handshake}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Campaign Workflow</h3>
                <BulletList items={workflow} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">By accepting a campaign, creator agrees to:</h3>
                <BulletList items={acceptanceItems} />
              </div>
            </div>
          </Section>

          <Section number="3" title="Content Delivery & Timelines" icon={FileClock}>
            <BulletList items={deliveryItems} />
          </Section>

          <Section number="4" title="Payment & Fee Structure" icon={BadgeIndianRupee}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Payment Processing</h3>
                <BulletList items={paymentItems} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Tax Compliance</h3>
                <BulletList items={taxItems} />
              </div>
            </div>
          </Section>

          <Section number="5" title="Content Ownership & Rights" icon={FileCheck2}>
            <BulletList items={ownershipItems} />
          </Section>

          <Section number="6" title="Dispute Resolution & Cancellation" icon={Gavel}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Campaign Cancellation</h3>
                <BulletList items={cancellationItems} />
              </div>
              <div className="rounded-lg bg-[#eef3ff] p-5">
                <h3 className="text-sm font-black text-[#1d2430]">Disputes</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                  Collune mediates all creator-brand disputes, including content quality, timelines, and payment. Unresolved disputes are escalated to Jaipur jurisdiction courts. Creator may appeal Collune's decision to independent arbitration.
                </p>
              </div>
            </div>
          </Section>

          <Section number="7" title="Compliance & Regulatory Obligations" icon={Scale}>
            <BulletList items={complianceItems} />
            <p className="mt-4 text-sm font-black leading-6 text-[#1d2430]">
              Collune reserves the right to remove content violating compliance standards. Repeated violations may result in account suspension or permanent ban.
            </p>
          </Section>

          <Section number="8" title="Performance Metrics & Transparency" icon={ClipboardList}>
            <BulletList items={metricItems} />
          </Section>

          <section className="rounded-xl border border-[#ffd6d6] bg-[#fff7f7] p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-[#d23b3b]">
                <Ban className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-black tracking-normal text-[#101828]">Important Notice</h2>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                  These terms apply to all creators registering and operating on the Collune platform.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
