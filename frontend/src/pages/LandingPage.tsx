import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Boxes,
  Check,
  Clock3,
  FileText,
  Lock,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCreatorsList, type CreatorProfileApi } from "../lib/authApi";
import creator1 from "../assets/collune/creator-1.png";
import creator2 from "../assets/collune/creator-2.png";
import creator3 from "../assets/collune/creator-3.png";
import creator4 from "../assets/collune/creator-4.png";
import heroCreator1 from "../assets/collune/hero-creator-1.png";
import heroCreator2 from "../assets/collune/hero-creator-2.png";
import heroCreator3 from "../assets/collune/hero-creator-3.png";
import heroCreator4 from "../assets/collune/hero-creator-4.png";
import HtmlButton from "../HtmlComponents/HtmlButton";

const creatorImages = [
  creator1,
  creator2,
  creator3,
  creator4,
  heroCreator3,
  heroCreator1,
  creator2,
  heroCreator4,
];

const trustCards = [
  {
    icon: ShieldCheck,
    title: "Verified Creators",
    text: "Every creator is reviewed before joining Collune.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    text: "Creators get paid on time. Brands gain accountability.",
  },
  {
    icon: MessageCircle,
    title: "Structured Collaboration",
    text: "Clear expectations, timelines, and communication.",
  },
];

const brandSteps = [
  { icon: Search, title: "Discover", text: "Find creators that match your brand and campaign goals." },
  { icon: Bookmark, title: "Shortlist", text: "Save and organize your favorite creators." },
  { icon: Send, title: "Request", text: "Send collaboration requests and share campaign details." },
  { icon: MessageCircle, title: "Collaborate", text: "Align, create and achieve impact together." },
];

const creatorSteps = [
  { icon: Upload, title: "Join", text: "Create your account and become a verified creator." },
  { icon: FileText, title: "Build Profile", text: "Showcase your work, audience, and collaboration preferences." },
  { icon: Boxes, title: "Get discovered", text: "Get discovered by brands looking for creators like you." },
  { icon: MessageCircle, title: "Collaborate", text: "Work on exciting campaigns and grow together." },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="inline-flex min-h-7 min-w-[min(330px,100%)] items-center justify-center gap-2 rounded-full border border-[#dae3ff] bg-white/60 px-8 text-[12px] font-black uppercase text-[#2a54cf]">
      <span className="h-2 w-2 rounded-full bg-[#8195ff] shadow-[0_0_0_4px_rgba(129,149,255,0.13)]" />
      {children}
    </div>
  );
}


function FloatingPhoto({
  image,
  className,
  icon,
}: {
  image: string;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div className={`absolute z-10 hidden rounded-[22px] shadow-[0_22px_48px_rgba(31,52,112,0.18)] lg:block ${className}`}>
      <img src={image} alt="" className="h-full w-full rounded-[22px] object-cover" />
      <span className="absolute grid h-14 w-14 place-items-center rounded-full border-[5px] border-[#f5f7ff] bg-[#2450cc] text-white">
        {icon}
      </span>
    </div>
  );
}

function getCreatorHandle(creator: CreatorProfileApi) {
  const connectedAccount = creator.social_accounts.find((account) => account.handle || account.username);
  const rawHandle = connectedAccount?.handle || connectedAccount?.username || creator.user?.username || "";
  return rawHandle ? `@${rawHandle.replace(/^@/, "")}` : "";
}

function getCreatorChips(creator: CreatorProfileApi) {
  const socialChips = creator.social_accounts
    .map((account) => account.platform || account.handle)
    .filter(Boolean);
  const profileChips = [...creator.collaboration_preferences, ...creator.languages].filter(Boolean);
  return [...socialChips, ...profileChips].slice(0, 3);
}

function CreatorCard({ creator, index }: { creator: CreatorProfileApi; index: number; key?: string }) {
  const image = creator.profile_image_url || creatorImages[index % creatorImages.length];
  const name = creator.display_name || creator.user?.name || "Creator";
  const handle = getCreatorHandle(creator);
  const category = creator.category || "Creator";
  const chips = getCreatorChips(creator);
  const isVerified = creator.verification_status?.toLowerCase() === "verified";

  return (
    <article className="overflow-hidden rounded-lg border border-[#e0e7fb] bg-white text-left shadow-[0_14px_32px_rgba(41,64,132,0.09)]">
      <div className="relative aspect-[1.55] overflow-hidden">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[9px] font-black text-[#7690ff]">
          <BadgeCheck className="h-3 w-3 fill-current" />
          {isVerified ? "verified" : creator.verification_status || "pending"}
        </span>
        <span className="absolute right-2.5 top-2.5 grid h-6 min-w-6 place-items-center rounded-full bg-white/85 px-1 text-xs font-black text-[#9aa6bc]">
          {creator.audience_size ? `${Math.round(creator.audience_size / 1000)}k` : "i"}
        </span>
      </div>
      <div className="px-4 py-3">
        <h3 className="inline text-lg font-black text-[#314064]">{name}</h3>
        {handle ? <p className="ml-1 inline text-xs font-extrabold text-[#7b8aaa]">{handle}</p> : null}
        <strong className="mt-0.5 block text-xs font-black text-[#3158ca]">{category}</strong>
        <span className="block text-xs font-black text-[#8a96b1]">Platforms:</span>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(chips.length ? chips : ["Creator"]).map((chip) => (
            <span key={chip} className="grid min-h-6 place-items-center rounded-full bg-[#eef3ff] px-2 text-center text-[10px] font-black text-[#60749e]">
              {chip}
            </span>
          ))}
        </div>
      </div>
      <Link to={`/creators/${creator.creator_id}`} className="flex min-h-10 items-center justify-center gap-1 border-t border-[#edf1fb] text-[13px] font-black text-[#3356c5]">
        View Profile
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function JourneyColumn({
  title,
  side,
  steps,
}: {
  title: string;
  side: "left" | "right";
  steps: typeof brandSteps;
}) {
  return (
    <div>
      <div className="mb-8 inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-[#dce5ff] px-5 py-2.5 text-[13px] font-black uppercase text-[#3558c9]">
        {side === "left" ? <Star className="h-3.5 w-3.5" /> : <UserRound className="h-3.5 w-3.5" />}
        {title}
      </div>
      <div className="relative grid gap-7 before:absolute before:bottom-9 before:top-9 before:border-l-2 before:border-dashed before:border-[#b1bdff] before:content-[''] before:left-0 lg:before:left-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="relative grid min-h-[116px] grid-cols-[64px_1fr] items-center gap-4 rounded-lg border border-[#edf1fb] bg-white p-5 text-left shadow-[0_14px_30px_rgba(35,58,124,0.08)] md:grid-cols-[84px_1fr]">
              <span className={`absolute top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border-2 border-[#93a4ff] bg-[#f5f7ff] text-xs font-black text-[#7e91ff] ${side === "left" ? "-left-3 lg:-left-12" : "-left-3 lg:-right-12 lg:left-auto"}`}>
                {index + 1}
              </span>
              <span className="grid h-16 w-16 place-items-center rounded-lg bg-[#e7edff] text-[#8194ff] md:h-[76px] md:w-[76px]">
                <Icon className="h-8 w-8" />
              </span>
              <div>
                <h3 className="mb-1 text-[17px] font-black text-[#3a4864]">{step.title}</h3>
                <p className="text-[13px] font-extrabold leading-tight text-[#7c879d]">{step.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

const LandingPage = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorProfileApi[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [creatorError, setCreatorError] = useState("");
  const creatorCategories = useMemo(() => {
    const categories = creators.map((creator) => creator.category).filter(Boolean);
    return ["All Creators", ...Array.from(new Set(categories)).slice(0, 4)];
  }, [creators]);

  useEffect(() => {
    let isMounted = true;
    getCreatorsList()
      .then((data) => {
        if (isMounted) setCreators(data);
      })
      .catch((error) => {
        if (isMounted) setCreatorError(error instanceof Error ? error.message : "Could not load creators.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingCreators(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main id="top" className="min-h-screen overflow-hidden bg-[#f5f7ff] font-sans text-[#17327c]">
      <section className="relative grid min-h-[930px] place-items-center px-6 pb-20 pt-36">
        <div className="absolute left-[max(150px,calc(50%-555px))] top-[260px] hidden h-[380px] w-[210px] rounded-bl-[170px] border-b-[3px] border-l-[3px] border-dashed border-[#b5a8ff] opacity-80 lg:block" />
        <div className="absolute right-[max(135px,calc(50%-580px))] top-[278px] hidden h-[380px] w-[210px] rounded-br-[170px] border-b-[3px] border-r-[3px] border-dashed border-[#b5a8ff] opacity-80 lg:block" />

        <FloatingPhoto image={heroCreator1} className="left-[max(90px,calc(50%-595px))] top-[138px] h-48 w-48 rotate-[7deg] [&>span]:-bottom-2.5 [&>span]:-right-4" icon={<Check className="h-7 w-7" />} />
        <FloatingPhoto image={heroCreator2} className="right-[max(110px,calc(50%-610px))] top-[132px] h-40 w-44 -rotate-[8deg] [&>span]:bottom-6 [&>span]:-left-8" icon={<Star className="h-6 w-6" />} />
        <FloatingPhoto image={heroCreator3} className="left-[max(116px,calc(50%-595px))] top-[625px] h-48 w-48 -rotate-[7deg] [&>span]:-bottom-4 [&>span]:-left-5 [&>span]:bg-[#a791ff]" icon={<Boxes className="h-6 w-6" />} />
        <FloatingPhoto image={heroCreator4} className="right-[max(110px,calc(50%-610px))] top-[625px] h-44 w-48 rotate-[8deg] [&>span]:-right-5 [&>span]:-top-5 [&>span]:bg-[#a791ff]" icon={<BadgeCheck className="h-6 w-6" />} />

        <div className="absolute left-[max(112px,calc(50%-590px))] top-[420px] z-20 hidden rotate-[9deg] items-center gap-2 rounded-[18px] bg-[#9c8cff] px-6 py-4 text-base font-black leading-none text-white shadow-[0_18px_30px_rgba(122,107,235,0.22)] lg:inline-flex">
          <ShieldCheck className="h-7 w-7" />
          <span>Trusted<br />Collaboration</span>
        </div>
        <div className="absolute right-[max(165px,calc(50%-560px))] top-[395px] z-20 hidden -rotate-[9deg] items-center gap-2 rounded-[18px] bg-[#8194ff] px-6 py-4 text-base font-black leading-none text-white shadow-[0_18px_30px_rgba(122,107,235,0.22)] lg:inline-flex">
          <Clock3 className="h-7 w-7" />
          <span>On time<br />Payments</span>
        </div>

        <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center text-center">
          <SectionLabel>More Than a Marketplace</SectionLabel>
          <h1 className="mb-5 mt-7 text-[clamp(48px,6.5vw,85px)] font-black leading-[0.98] tracking-normal text-[#153fb8]">
            Where Brands And Creators
            <span className="block italic text-[#ad9bff]">Build What Lasts.</span>
          </h1>
          <p className="max-w-2xl text-[17px] font-extrabold leading-snug text-[#4e5c77]">
            We bring trust, alignment, and accountability into every collaboration,
            so outcomes speak louder than reach.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <HtmlButton
            buttonName="Apply as a Creator"
            onClick={() => navigate("/creator-register")}
            />
            <HtmlButton
            buttonName="Apply as a Brand"
            variant="light"
            onClick={() => navigate("/brand-register")}
            />
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-5 text-sm font-black text-[#8291c1]">
            {[
              ["Verified Creators", BadgeCheck],
              ["Secure Payments", ShieldCheck],
              ["Structured Workflows", Sparkles],
            ].map(([label, Icon]) => (
              <span key={label as string} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#8da0ff]" />
                {label as string}
              </span>
            ))}
          </div>
        </div>

        <a href="#creators" aria-label="Scroll to creators" className="absolute bottom-11 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full bg-white text-[#9aa7c4] shadow-[0_12px_28px_rgba(68,90,158,0.1)]">
          <ArrowDown className="h-4.5 w-4.5" />
        </a>
      </section>

      <section id="creators" className="px-6 py-20 text-center">
        <SectionLabel>Featured Creators</SectionLabel>
        <p className="mx-auto mt-8 max-w-xl text-[16px] font-extrabold leading-tight text-[#4e5c77]">
          Explore a curated network of verified creators across industries,
          audiences, and content styles.
        </p>
        <div className="mx-auto my-12 grid max-w-[850px] grid-cols-2 gap-1.5 rounded-[24px] border border-[#d9e2fb] bg-white p-2 md:grid-cols-5 md:rounded-full">
          {creatorCategories.map((tab, index) => (
            <button key={tab} className={`min-h-10 rounded-full text-[13px] font-black ${index === 0 ? "bg-[#b6a3ff] text-white" : "text-[#2450bf]"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingCreators ? (
            <p className="col-span-full py-8 text-sm font-black text-[#7b8aaa]">Loading creators...</p>
          ) : creatorError ? (
            <p className="col-span-full py-8 text-sm font-black text-[#bf3f5f]">{creatorError}</p>
          ) : creators.length ? (
            creators.slice(0, 8).map((creator, index) => (
              <CreatorCard key={creator.creator_id} creator={creator} index={index} />
            ))
          ) : (
            <p className="col-span-full py-8 text-sm font-black text-[#7b8aaa]">No creators available yet.</p>
          )}
        </div>
        <div className="mt-10">
          <HtmlButton
            buttonName="Explore all 250+ Creators"
            onClick={() => navigate("/discover-creators")}
            />
        </div>
      </section>

      <section id="about" className="mx-auto grid max-w-7xl items-center gap-9 px-6 py-20 lg:grid-cols-[1fr_120px_1fr]">
        <div className="text-center lg:text-left">
          <SectionLabel>Trust And Accountability</SectionLabel>
          <h2 className="mb-5 mt-8 text-[clamp(42px,5vw,62px)] font-black leading-none tracking-normal text-[#153fb8]">
            Trust isn't a Feature.
            <span className="block italic text-[#ad9bff]">It's the foundation of every collaboration.</span>
          </h2>
          <p className="text-[15px] font-extrabold leading-tight text-[#4e5c77]">
            Collune ensures every collaboration is built on transparency,
            accountability, and mutual respect, so you can focus on creating impact.
          </p>
          <div className="mt-9 inline-grid grid-cols-[auto_1fr] items-center gap-x-4 text-left text-[16px] font-black text-[#8c9af0]">
            <span className="row-span-2 flex">
              <i className="h-9 w-9 rounded-full bg-[#9b90ff]" />
              <i className="-ml-2 h-9 w-9 rounded-full bg-[#88a0ff]" />
              <i className="-ml-2 h-9 w-9 rounded-full bg-white" />
            </span>
            <strong>10,000+ Collaborations</strong>
            <small className="text-sm font-extrabold text-[#76839e]">powered by trust</small>
          </div>
        </div>

        <div className="relative hidden h-[430px] border-l-2 border-[#cfdcff] lg:block">
          {[86, 215, 348].map((top) => (
            <span key={top} style={{ top }} className="absolute -left-[7px] h-3 w-3 rounded-full border-2 border-[#8fa0ff] bg-[#f5f7ff] after:absolute after:left-5 after:top-1 after:w-24 after:border-t-2 after:border-dashed after:border-[#a8b6ff] after:content-[''] before:absolute before:left-28 before:top-0.5 before:h-2 before:w-2 before:rounded-full before:bg-[#8fa0ff] before:content-['']" />
          ))}
        </div>

        <div className="grid gap-8">
          {trustCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="grid min-h-[132px] grid-cols-[64px_1fr_auto] items-center gap-5 rounded-lg border border-[#edf1fb] bg-white p-6 shadow-[0_14px_30px_rgba(35,58,124,0.08)] md:grid-cols-[74px_1fr_auto]">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-[#e6edff] text-[#879aff] md:h-[74px] md:w-[74px]">
                  <Icon className="h-8 w-8" />
                </span>
                <div>
                  <h3 className="mb-1 text-[17px] font-black text-[#334260]">{card.title}</h3>
                  <p className="text-[13px] font-extrabold leading-tight text-[#758097]">{card.text}</p>
                </div>
                <Check className="hidden h-4 w-4 text-[#8194ff] sm:block" />
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mb-28 grid max-w-7xl gap-5 rounded-[18px] bg-white px-6 py-6 text-[13px] font-extrabold text-[#71809f] md:grid-cols-2 lg:grid-cols-[1.75fr_repeat(3,auto)] lg:px-10">
        <p className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#91a1ff]" />
          Collune is committed to building the most reliable ecosystem for brands and creators to work together with confidence.
        </p>
        {[
          ["Safe & verified", Check],
          ["Fair & Secure", Lock],
          ["Transparent & clear", BadgeCheck],
        ].map(([label, Icon]) => (
          <span key={label as string} className="flex items-center gap-3">
            <Icon className="h-4.5 w-4.5 text-[#91a1ff]" />
            {label as string}
          </span>
        ))}
      </section>

      <section id="how-it-works" className="px-6 pb-28 text-center">
        <SectionLabel>How It Works</SectionLabel>
        <h2 className="mb-5 mt-8 text-[clamp(42px,5.4vw,66px)] font-black leading-none tracking-normal text-[#153fb8]">
          Two Journeys. <span className="italic text-[#ad9bff]">One collaboration</span>
        </h2>
        <p className="mx-auto max-w-xl text-[15px] font-extrabold leading-tight text-[#4e5c77]">
          Whether you're a brand or a creator, Collune makes collaborations simple,
          structured, and successful.
        </p>
        <div className="mx-auto mt-16 grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_320px_1fr]">
          <JourneyColumn title="For Brands" side="left" steps={brandSteps} />
          <div className="relative order-first grid min-h-[260px] place-items-center lg:order-none lg:min-h-[390px] lg:before:absolute lg:before:right-1/2 lg:before:top-1/2 lg:before:w-36 lg:before:border-t-2 lg:before:border-dashed lg:before:border-[#a8b7ff] lg:before:content-[''] lg:after:absolute lg:after:left-1/2 lg:after:top-1/2 lg:after:w-36 lg:after:border-t-2 lg:after:border-dashed lg:after:border-[#a8b7ff] lg:after:content-['']">
            <div className="relative z-10 grid h-[220px] w-[220px] place-items-center content-center rounded-full border-[20px] border-[#e9e5ff] bg-white p-10 text-center text-[#8794ff] shadow-[0_20px_42px_rgba(56,72,145,0.08)] md:h-[245px] md:w-[245px]">
              <Sparkles className="h-9 w-9 fill-current" />
              <strong className="mt-2 text-[22px] font-black">Collaborate</strong>
              <span className="text-[11px] font-extrabold leading-tight text-[#8a94ad]">Build meaningful partnerships that create real impact.</span>
            </div>
          </div>
          <JourneyColumn title="For Creators" side="right" steps={creatorSteps} />
        </div>
      </section>

      <section id="brands" className="bg-[linear-gradient(115deg,#6d68de_0%,#0c3bb7_48%,#36a8d0_100%)] px-6 py-24 text-center text-white">
        <h2 className="mb-5 text-[clamp(42px,5vw,64px)] font-black leading-none tracking-normal">
          Ready to build better <span className="italic text-[#b3a2ff]">collaborations?</span>
        </h2>
        <p className="text-[15px] font-extrabold text-white/80">Join a growing network of verified creators and ambitious brands.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          <HtmlButton
            buttonName="Apply as a Creator"
            onClick={() => navigate("/creator-register")}
            />
            <HtmlButton
            buttonName="Apply as a Brand"
            variant="light"
            onClick={() => navigate("/brand-register")}
            />
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
