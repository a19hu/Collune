import type { ReactNode } from "react";
import { Cookie, Database, FileText, LockKeyhole, Mail, RefreshCw, Scale, ShieldCheck, UserCheck } from "lucide-react";

const collectionItems = [
  "Complete account registration requires verified name, contact information, professional details, and supporting documentation.",
  "Profile information including bio, portfolio, social media handles, content samples, and audience demographics.",
  "Campaign data including collaboration details, content created, usage rights agreements, and performance metrics.",
  "Financial information including bank account details, GST/TDS information, and invoice records.",
  "Technical data including IP address, browser type, device information, cookies, and usage logs.",
  "Automatic collection including session duration, pages visited, features used, and error logs.",
];

const usageItems = [
  "Provide, maintain, and improve Services.",
  "Facilitate collaborations and transactions.",
  "Process payments and comply with GST/TDS requirements.",
  "Conduct KYC verification as per RBI and financial regulations.",
  "Enforce Terms & Conditions and compliance requirements.",
  "Send transactional and service updates.",
  "Analyze platform usage and optimize user experience.",
  "Detect and prevent fraud, security breaches, and unauthorized access.",
  "Comply with legal obligations under IT Rules 2021 and DPDP Act 2023.",
  "Conduct market research with user consent.",
];

const cookieItems = [
  ["Essential Cookies", "Maintain session security and platform functionality."],
  ["Performance Cookies", "Analyze user behavior and improve Services."],
  ["Marketing Cookies", "Track campaign performance and user engagement."],
  ["Third-party Cookies", "Enable analytics and advertising platforms. Users can opt out via browser settings."],
];

const sharingItems = [
  ["Service Providers", "Payment processors, email/SMS providers, and cloud infrastructure partners bound by confidentiality agreements."],
  ["Campaign Parties", "Limited data shared between creators and brands as necessary for collaboration execution."],
  ["Legal Compliance", "Data disclosed to authorities when required by law or court order."],
  ["Regulatory Obligations", "Campaign information may be shared with relevant regulatory authorities to meet legal and compliance obligations."],
  ["Business Transfer", "User data may be transferred to an acquiring entity in case of merger, acquisition, or organizational restructuring, with prior notification to users."],
];

const rights = [
  ["Access", "Request a copy of your personal data."],
  ["Correction", "Update or correct inaccurate information."],
  ["Deletion", "Request data deletion, subject to legal retention requirements."],
  ["Portability", "Receive your data in a structured, machine-readable format."],
  ["Opt-out", "Withdraw consent for non-essential processing."],
];

function PolicySection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: typeof ShieldCheck;
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

function PairList({ items }: { items: string[][] }) {
  return (
    <div className="grid gap-3">
      {items.map(([label, copy]) => (
        <div key={label} className="rounded-lg bg-[#f7f9fc] p-4">
          <h3 className="text-sm font-black text-[#1d2430]">{label}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#53627a]">{copy}</p>
        </div>
      ))}
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="bg-white pt-32 text-[#1d2430]">
      <section className="mx-auto max-w-7xl px-6 pb-14 md:px-10">
        <div className="max-w-4xl">
          <span className="inline-flex h-10 items-center rounded-lg bg-[#eef3ff] px-4 text-sm font-black text-[#173ca8]">
            Privacy Policy
          </span>
          <h1 className="mt-6 text-[40px] font-black leading-tight tracking-normal text-[#101828] md:text-[58px]">
            How Collune collects, uses, and protects your information.
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-[#5f6f89]">
            This Privacy Policy explains how Collune, operated by AIM Information Technology, collects, uses, discloses, and safeguards your information when you use our platform, services, and websites.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Effective Date: To be updated</span>
            <span className="rounded-lg border border-[#dfe7f2] bg-white px-4 py-2 text-sm font-black text-[#53627a]">Last Updated: To be updated</span>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fc] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <PolicySection number="1" title="Information Collection" icon={Database}>
            <BulletList items={collectionItems} />
          </PolicySection>

          <PolicySection number="2" title="User Data Usage" icon={UserCheck}>
            <BulletList items={usageItems} />
          </PolicySection>

          <PolicySection number="3" title="Cookies Policy" icon={Cookie}>
            <PairList items={cookieItems} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              Users may disable cookies through browser preferences, though this may limit platform functionality.
            </p>
          </PolicySection>

          <PolicySection number="4" title="Data Sharing & Third Parties" icon={Scale}>
            <PairList items={sharingItems} />
            <p className="mt-4 text-sm font-black leading-6 text-[#1d2430]">
              We do not sell user data to third parties. International data transfers comply with DPDP Act 2023 requirements.
            </p>
          </PolicySection>

          <PolicySection number="5" title="Data Security" icon={LockKeyhole}>
            <PairList
              items={[
                ["Encryption", "All data is encrypted in transit using TLS 1.2+ and at rest using industry-standard protocols."],
                ["Access Control", "Role-based access with multi-factor authentication for sensitive operations."],
                ["Regular Audits", "Annual security audits and penetration testing."],
                ["Data Retention", "Retention periods are defined per data category; old data is securely deleted or anonymized."],
              ]}
            />
          </PolicySection>

          <PolicySection number="6" title="User Rights" icon={ShieldCheck}>
            <PairList items={rights} />
            <p className="mt-4 text-sm font-semibold leading-6 text-[#53627a]">
              To exercise these rights, submit a written request with identity verification.
            </p>
          </PolicySection>

          <PolicySection number="7" title="Contact for Privacy Concerns" icon={Mail}>
            <div className="rounded-lg bg-[#eef3ff] p-5">
              <p className="text-sm font-semibold leading-6 text-[#53627a]">
                For privacy inquiries or to exercise your rights, contact our Data Protection Officer.
              </p>
              <p className="mt-3 text-sm font-black text-[#173ca8]">Response timeframe: 30 days for access requests; 45 days for complex requests.</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#53627a]">
                You may also file a complaint with the Data Protection Board of India if you believe your rights have been violated.
              </p>
            </div>
          </PolicySection>

          <PolicySection number="8" title="Policy Updates" icon={RefreshCw}>
            <p className="text-sm font-semibold leading-6 text-[#53627a]">
              We may update this policy periodically. Continued use of the platform constitutes acceptance of updated terms. Significant changes will be notified via email.
            </p>
          </PolicySection>
        </div>
      </section>
    </main>
  );
}
