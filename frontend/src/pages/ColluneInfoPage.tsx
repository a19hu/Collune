import { ArrowRight, BadgeCheck, BookOpenText, HelpCircle, Search, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const pageContent = {
  "discover-creators": {
    eyebrow: "Creator Network",
    title: "Discover Creators",
    copy: "Find verified creators by audience, category, content style, and collaboration fit.",
    icon: Search,
    cards: ["Audience-first search", "Verified creator profiles", "Shortlist by campaign goals"],
  },
  "featured-creators": {
    eyebrow: "Curated Talent",
    title: "Featured Creators",
    copy: "Explore a handpicked selection of creators trusted by brands for structured collaborations.",
    icon: BadgeCheck,
    cards: ["Verified work history", "Brand-safe profiles", "High-signal recommendations"],
  },
  "success-stories": {
    eyebrow: "For Brands",
    title: "Success Stories",
    copy: "See how brands use Collune to build creator partnerships with clear outcomes and accountability.",
    icon: Trophy,
    cards: ["Campaign alignment", "On-time delivery", "Measurable collaboration impact"],
  },
  blogs: {
    eyebrow: "Resources",
    title: "Blogs",
    copy: "Read practical guidance on creator discovery, brand partnerships, and collaboration workflows.",
    icon: BookOpenText,
    cards: ["Creator marketing insights", "Brand playbooks", "Workflow best practices"],
  },
  faqs: {
    eyebrow: "Resources",
    title: "FAQs",
    copy: "Get answers about creator verification, payments, brand requests, and collaboration management.",
    icon: HelpCircle,
    cards: ["How verification works", "How payments are handled", "How brands and creators connect"],
  },
};

type PageKey = keyof typeof pageContent;

const ColluneInfoPage = ({ page }: { page: PageKey }) => {
  const content = pageContent[page];
  const Icon = content.icon;

  return (
    <main className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-36 text-[#17327c]">
      <section className="mx-auto max-w-6xl text-center">
        <div className="inline-flex min-h-7 items-center justify-center gap-2 rounded-full border border-[#dae3ff] bg-white/70 px-8 text-[12px] font-black uppercase text-[#2a54cf]">
          <span className="h-2 w-2 rounded-full bg-[#8195ff]" />
          {content.eyebrow}
        </div>

        <div className="mx-auto mt-10 grid h-24 w-24 place-items-center rounded-full bg-white text-[#8794ff] shadow-[0_18px_40px_rgba(45,66,140,0.12)]">
          <Icon className="h-11 w-11" />
        </div>

        <h1 className="mx-auto mt-8 max-w-3xl text-[clamp(48px,7vw,82px)] font-black leading-none tracking-normal text-[#153fb8]">
          {content.title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-extrabold leading-snug text-[#4e5c77]">
          {content.copy}
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {content.cards.map((card) => (
            <article key={card} className="rounded-lg border border-[#edf1fb] bg-white p-7 text-left shadow-[0_14px_30px_rgba(35,58,124,0.08)]">
              <Sparkles className="mb-5 h-7 w-7 text-[#8794ff]" />
              <h2 className="text-xl font-black text-[#334260]">{card}</h2>
              <p className="mt-3 text-sm font-extrabold leading-snug text-[#758097]">
                Built to keep collaborations clear, trusted, and easy to move forward.
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#174bd2] px-7 text-sm font-black text-white shadow-[0_14px_24px_rgba(27,71,207,0.22)] transition hover:-translate-y-0.5"
          >
            Back to Home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ColluneInfoPage;
