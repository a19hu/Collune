import { Building2, CheckCircle2, Globe2, Mail, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";

const services = [
  "Creator discovery with verified creators aligned to your niche and audience",
  "Campaign management tools for brief creation, negotiation, and content approval",
  "Compliance and legal frameworks aligned with applicable Indian laws",
  "Analytics and reporting for real-time performance metrics and campaign ROI",
  "Payment and settlement workflows with GST/TDS compliance",
];

const reasons = [
  "Specialized expertise across sector-specific dynamics and compliance requirements",
  "Legal compliance first, with campaign screening before launch",
  "Transparent pricing with itemized billing and GST/TDS clarity",
  "Creator-first community approach with fair compensation and genuine opportunities",
  "End-to-end support with account management and platform assistance",
];

const sectors = ["Politics", "Education", "Lifestyle", "Fashion", "Food", "Hospitality", "Emerging sectors"];

const socialLinks = [
  ["Instagram", "@thecollune"],
  ["LinkedIn", "@thecollune"],
  ["X (Twitter)", "@thecollune"],
  ["YouTube", "@thecollune"],
  ["Facebook", "@thecollune"],
  ["Reddit", "@thecollune"],
];

function InfoCard({ title, copy, icon: Icon }: { title: string; copy: string; icon: typeof ShieldCheck }) {
  return (
    <section className="rounded-xl border border-[#dfe7f2] bg-white p-6">
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef3ff] text-[#173ca8]">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-black tracking-normal text-[#1d2430]">{title}</h2>
      <p className="mt-3 text-[15px] font-medium leading-7 text-[#65758f]">{copy}</p>
    </section>
  );
}

export default function AboutCollune() {
  return (
    <main className="bg-white pt-32 text-[#1d2430]">
      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
          <div>
            <span className="inline-flex h-10 items-center rounded-lg bg-[#eef3ff] px-4 text-sm font-black text-[#173ca8]">
              About Collune
            </span>
            <h1 className="mt-6 max-w-4xl text-[40px] font-black leading-tight tracking-normal text-[#101828] md:text-[58px]">
              A regulated creator-brand collaboration platform built on trust.
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-[#5f6f89]">
              Collune connects content creators with brands, organizations, and institutions across the global digital economy. We handle creator discovery, campaign management, escrow payments, compliance verification, and dispute resolution so collaborations move with confidence.
            </p>
          </div>

          <aside className="rounded-xl border border-[#dfe7f2] bg-[#f7f9fc] p-6">
            <h2 className="text-lg font-black text-[#1d2430]">Operating Entity</h2>
            <p className="mt-2 text-sm font-semibold text-[#65758f]">AIM Information Technology</p>
            <div className="mt-6 grid gap-4 text-sm font-semibold text-[#53627a]">
              <span className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#173ca8]" /> Jaipur, Rajasthan, India</span>
              <span className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#173ca8]" /> thecollune@gmail.com</span>
              <span className="flex items-center gap-3"><Globe2 className="h-4 w-4 text-[#173ca8]" /> www.collune.com | www.thecollune.com</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-[#e6edf7] bg-[#f7f9fc] px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          <InfoCard
            title="Vision"
            icon={Sparkles}
            copy="To create a global creator economy where authentic partnerships are built on transparency, verified trust, and regulatory compliance."
          />
          <InfoCard
            title="Mission"
            icon={ShieldCheck}
            copy="Collune operates as a regulated intermediary connecting creators with brands, political organizations, and educational institutions."
          />
          <InfoCard
            title="What We Do"
            icon={Users}
            copy="We bridge discovery, negotiation, execution, and measurement for creator partnerships with specialized tools for Politics and Education."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-[#101828]">Our Services</h2>
          <p className="mt-4 text-base font-medium leading-7 text-[#65758f]">
            Collune removes operational friction for institutional partners and creators through verified workflows, compliance-aware campaign management, and transparent settlement systems.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {sectors.map((sector) => (
              <span key={sector} className="rounded-lg bg-[#eef3ff] px-3 py-2 text-sm font-black text-[#173ca8]">{sector}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {services.map((service) => (
            <div key={service} className="flex gap-3 rounded-lg border border-[#e3eaf4] bg-white p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2fbe74]" />
              <p className="text-sm font-semibold leading-6 text-[#475569]">{service}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#101828] px-6 py-16 text-white md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-white">
              <Building2 className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-3xl font-black tracking-normal">Why Choose Collune?</h2>
            <p className="mt-4 text-base font-medium leading-7 text-[#c7d3e5]">
              Every collaboration is built on transparency, regulatory compliance, and accountability, enabling authentic partnerships that drive measurable impact.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason} className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm font-semibold leading-6 text-[#edf3ff]">
                {reason}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-[#dfe7f2] bg-white p-7">
          <h2 className="text-2xl font-black tracking-normal text-[#101828]">Contact Information</h2>
          <div className="mt-6 grid gap-4 text-[15px] font-semibold text-[#53627a]">
            <p>Email: thecollune@gmail.com</p>
            <p>Website: www.collune.com | www.thecollune.com</p>
            <p>Location: Jaipur, Rajasthan, India</p>
            <p>Operating Entity: AIM Information Technology</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#dfe7f2] bg-[#f7f9fc] p-7">
          <h2 className="text-2xl font-black tracking-normal text-[#101828]">Social Media</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {socialLinks.map(([label, handle]) => (
              <div key={label} className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#53627a]">
                <span className="font-black text-[#173ca8]">{label}:</span> {handle}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
