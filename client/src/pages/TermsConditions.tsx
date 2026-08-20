import type { ReactNode } from "react";
import { AlertTriangle, BadgeIndianRupee, Ban, FileCheck2, FileText, Gavel, KeyRound, Scale, ShieldCheck, UserCheck } from "lucide-react";

const eligibilityItems = [
  "Possess the legal capacity to enter into binding agreements.",
  "Have valid identification documents.",
  "Comply with all applicable Indian laws and regulations.",
];

const registrationItems = [
  "Provide accurate, complete, and current information.",
  "Complete KYC verification.",
  "Accept Terms & Conditions and Privacy Policy.",
  "Maintain account security and confidentiality of credentials.",
];

const prohibitedItems = [
  "Post illegal, defamatory, obscene, or hate speech content.",
  "Violate ECI guidelines on political advertising and disclosure.",
  "Violate ASCI code for advertorial and endorsement disclosures.",
  "Engage in fraud, manipulation, or unauthorized access.",
  "Infringe on intellectual property rights.",
  "Conduct spam, phishing, or multi-level marketing schemes.",
  "Violate privacy or disclose confidential information.",
  "Harm the platform's security, functionality, or reputation.",
];

const creatorResponsibilities = [
  "Accurate disclosure of audience demographics and engagement metrics.",
  "Compliance with Indian laws and regulations.",
  "Timely delivery of agreed-upon content.",
  "Disclosure of sponsored/advertorial content as per ASCI guidelines.",
];

const paymentItems = [
  "All payments are processed via secure payment gateway with TLS encryption.",
  "Creators receive payment 7-14 days after campaign completion and approval.",
  "Collune charges a platform fee specified during registration.",
  "GST/TDS applies per Indian tax regulations.",
];

const refundItems = [
  "Refunds initiated by brands within 30 days of campaign start are eligible for full refund, minus platform fees.",
  "After 30 days, refunds are subject to content delivery and approval status.",
  "Disputes are resolved via Collune dispute resolution mechanism; unresolved cases are escalated to Jaipur jurisdiction courts.",
];

const ipItems = [
  "Creators retain ownership of original content and grant brands a limited, non-exclusive license to use content as agreed.",
  "Brands may not repurpose, modify, or redistribute content beyond agreed scope without creator consent.",
  "All intellectual property infringements must be reported immediately to Collune; legal action may be pursued as appropriate.",
  "Collune retains ownership of platform design, functionality, and proprietary tools.",
];

const liabilityItems = [
  "Indirect, incidental, or consequential damages.",
  "Loss of profits, data, or revenue from platform use.",
  "Third-party actions or content posted by other users.",
  "Service interruptions, security breaches, or technical errors beyond reasonable control.",
  "Financial fraud, cheating, or unauthorized transactions conducted by users on the platform, except where liability is mandated by applicable law.",
];

const laws = [
  "Information Technology Rules 2021 (IT Rules 2021)",
  "Digital Personal Data Protection Act 2023 (DPDP Act 2023)",
  "Representation of the People Act, 1951 and Election Commission guidelines",
  "Advertising Standards Council of India (ASCI) Code",
  "GST and income tax laws of India",
];

function TermsSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof FileText;
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
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#173ca8]" />
          <p className="text-sm font-semibold leading-6 text-[#53627a]">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function TermsConditions() {
  return (
    <main className="bg-white pt-32 text-[#1d2430]">
      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10">
        <div className="max-w-4xl">
          <span className="inline-flex h-10 items-center rounded-lg bg-[#eef3ff] px-4 text-sm font-black text-[#173ca8]">
            Terms & Conditions
          </span>
          <h1 className="mt-6 text-[40px] font-black leading-tight tracking-normal text-[#101828] md:text-[58px]">
            Rules for accessing and using Collune services.
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-[#5f6f89]">
            These Terms govern your access to and use of the Collune platform, services, and website. By registering, accessing, or using Collune, you agree to be bound by these Terms, our Privacy Policy, and all applicable Indian laws and regulations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Effective Date: To be updated</span>
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Last Updated: To be updated</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <TermsSection number="1" title="User Eligibility" icon={UserCheck}>
            <BulletList items={eligibilityItems} />
          </TermsSection>

          <TermsSection number="2" title="Account Registration" icon={KeyRound}>
            <BulletList items={registrationItems} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Collune reserves the right to reject applications, verify information, and request additional documentation. Account suspension or termination may occur for falsified information, suspicious activity, or policy violations.
            </p>
          </TermsSection>

          <TermsSection number="3" title="Platform Usage Rules" icon={Ban}>
            <h3 className="mb-3 text-sm font-black text-[#1d2430]">Prohibited Activities</h3>
            <BulletList items={prohibitedItems} />
          </TermsSection>

          <TermsSection number="4" title="User Responsibilities" icon={ShieldCheck}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Creators are responsible for:</h3>
                <BulletList items={creatorResponsibilities} />
              </div>
              <div className="rounded-lg bg-[#eef3ff] p-5">
                <h3 className="text-sm font-black text-[#1d2430]">Brands and institutions are responsible for:</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                  Providing accurate campaign briefs, ensuring compliance with all regulations, timely payment of agreed amounts, and respecting creator intellectual property.
                </p>
              </div>
            </div>
          </TermsSection>

          <TermsSection number="5" title="Payment & Refund Policy" icon={BadgeIndianRupee}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Payment Processing</h3>
                <BulletList items={paymentItems} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-black text-[#1d2430]">Refund Policy</h3>
                <BulletList items={refundItems} />
              </div>
            </div>
          </TermsSection>

          <TermsSection number="6" title="Intellectual Property" icon={FileCheck2}>
            <BulletList items={ipItems} />
          </TermsSection>

          <TermsSection number="7" title="Limitation of Liability" icon={AlertTriangle}>
            <p className="mb-4 text-sm font-semibold leading-6 text-[#53627a]">Collune shall not be liable for:</p>
            <BulletList items={liabilityItems} />
            <p className="mt-4 text-sm font-black leading-6 text-[#1d2430]">
              Total liability of Collune shall not exceed the amount paid by the user in the 12 months preceding the claim. This limitation applies to the fullest extent permitted by Indian law.
            </p>
          </TermsSection>

          <TermsSection number="8" title="Governing Law" icon={Gavel}>
            <p className="mb-4 text-sm font-semibold leading-6 text-[#53627a]">
              These Terms shall be governed by and construed in accordance with the laws of India, specifically the jurisdiction of Jaipur, Rajasthan. All disputes shall be subject to exclusive jurisdiction of courts in Jaipur.
            </p>
            <h3 className="mb-3 text-sm font-black text-[#1d2430]">Applicable Laws</h3>
            <BulletList items={laws} />
          </TermsSection>

          <TermsSection number="9" title="Term & Termination" icon={Scale}>
            <p className="text-sm font-semibold leading-6 text-[#53627a]">
              Users may terminate their account at any time. Collune may suspend or terminate accounts for policy violations, fraudulent activity, or non-compliance with legal requirements. Upon termination, data is retained per legal requirements and deleted per privacy policy.
            </p>
          </TermsSection>

          <TermsSection number="10" title="Amendments" icon={FileText}>
            <p className="text-sm font-semibold leading-6 text-[#53627a]">
              Collune reserves the right to amend these Terms at any time. Continued use constitutes acceptance of modified terms. Significant changes will be notified via email.
            </p>
          </TermsSection>
        </div>
      </section>
    </main>
  );
}
