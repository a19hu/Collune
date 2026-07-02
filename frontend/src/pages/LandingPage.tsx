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
  Play,
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
import heroCreator1 from "../assets/collune/hero-creator-1.jpg";
import heroCreator2 from "../assets/collune/hero-creator-2.jpg";
import heroCreator3 from "../assets/collune/hero-creator-3.jpg";
import heroCreator4 from "../assets/collune/hero-creator-4.jpg";
import HtmlButton from "../HtmlComponents/HtmlButton";
import { CreatorCard } from "../HtmlComponents/CreatorCard";

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



const LandingPage = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorProfileApi[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [creatorError, setCreatorError] = useState("");
  const [selectedCreatorCategory, setSelectedCreatorCategory] = useState("All Creators");
  const creatorCategories = useMemo(() => {
    const categories = creators.map((creator) => creator.category).filter(Boolean);
    return ["All Creators", ...Array.from(new Set(categories)).slice(0, 4)];
  }, [creators]);
  const filteredCreators = useMemo(() => {
    if (selectedCreatorCategory === "All Creators") return creators;
    return creators.filter((creator) => creator.category === selectedCreatorCategory);
  }, [creators, selectedCreatorCategory]);

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
    <main id="top" className="min-h-screen overflow-hidden bg-[#f3f6ff] font-sans text-[#17327c]">
      <section className="relative grid min-h-[calc(100vh-1px)] place-items-center px-5 pb-20 pt-28">
        <div className="absolute left-[max(120px,calc(50%-565px))] top-[150px] hidden h-[560px] w-[178px] rounded-l-[170px] border-l-[3px] border-dashed border-[#b9a8ff] opacity-80 lg:block" />
        <div className="absolute right-[max(120px,calc(50%-565px))] top-[278px] hidden h-[560px] w-[178px] rounded-r-[170px] border-r-[3px] border-dashed border-[#b9a8ff] opacity-80 lg:block" />

        <FloatingPhoto image={heroCreator1} className="left-[max(78px,calc(50%-592px))] top-[200px] h-[126px] w-[136px] rotate-[6deg] [&>span]:-bottom-4 [&>span]:-right-5" icon={<Check className="h-6 w-6" />} />
        <FloatingPhoto image={heroCreator2} className="right-[max(94px,calc(50%-585px))] top-[34px] h-[130px] w-[124px] -rotate-[7deg] [&>span]:bottom-4 [&>span]:-left-7" icon={<Star className="h-5 w-5" />} />
        <FloatingPhoto image={heroCreator3} className="left-[max(94px,calc(50%-575px))] top-[555px] h-[128px] w-[134px] -rotate-[7deg] [&>span]:-bottom-5 [&>span]:-left-4 [&>span]:bg-[#a893ff]" icon={<Boxes className="h-5 w-5" />} />
        <FloatingPhoto image={heroCreator4} className="right-[max(110px,calc(50%-570px))] top-[532px] h-[138px] w-[146px] rotate-[8deg] [&>span]:-right-5 [&>span]:-top-4 [&>span]:bg-[#a893ff]" icon={<BadgeCheck className="h-5 w-5" />} />

        <HeroBadge className="left-[max(60px,calc(48%-580px))] top-[380px] rotate-[12deg]" icon={<ShieldCheck className="h-6 w-6" />}>
          Trusted<br />Collaborations
        </HeroBadge>
        <HeroBadge className="right-[max(150px,calc(50%-545px))] top-[245px] -rotate-[10deg] bg-[#8194ff]" icon={<Clock3 className="h-6 w-6" />}>
          On time<br />Payments
        </HeroBadge>

        <div className="relative z-10 flex w-full max-w-[780px] flex-col items-center text-center">
          <SectionLabel>More Than a Marketplace</SectionLabel>
          <h1 className="mb-5 mt-7 text-[clamp(46px,6vw,70px)] font-black leading-[1.02] tracking-normal text-[#173fb5]">
            Where Brands And Creators
            <span className="block italic text-[#ad9bff]">Build What Lasts.</span>
          </h1>
          <p className="max-w-xl text-[15px] font-extrabold leading-snug text-[#4e5c77]">
            We bring trust, alignment, and accountability into every collaboration,
            so outcomes speak louder than reach.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <HeroButton onClick={() => navigate("/creator-register")} icon={<Play className="h-4 w-4 fill-current" />}>
              Apply as a Creator
            </HeroButton>
            <HeroButton onClick={() => navigate("/brand-register")} icon={<FileText className="h-4 w-4" />} variant="light">
              Apply as a Brand
            </HeroButton>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-3 text-xs font-black text-[#8291c1]">
            {[
              ["Verified Creators", BadgeCheck],
              ["Secure Payments", ShieldCheck],
              ["Structured Workflows", Sparkles],
            ].map(([label, Icon], index) => {
              const BenefitIcon = Icon;
              return (
                <span key={label as string} className="inline-flex items-center gap-2">
                  {index ? <span className="h-4 w-px bg-[#b9c4e5]" /> : null}
                  <BenefitIcon className="h-4 w-4 rounded-full bg-[#8da0ff] p-0.5 text-white" />
                  {label as string}
                </span>
              );
            })}
          </div>
        </div>

        <a href="#creators" aria-label="Scroll to creators" className="absolute bottom-7 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-white text-[#9aa7c4] shadow-[0_12px_28px_rgba(68,90,158,0.1)]">
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
          {creatorCategories.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedCreatorCategory(tab)}
              className={`min-h-10 rounded-full text-[13px] font-black transition ${
                selectedCreatorCategory === tab ? "bg-[#b6a3ff] text-white" : "text-[#2450bf] hover:bg-[#eef3ff]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-2 lg:grid-cols-4">
          {isLoadingCreators ? (
            <p className="col-span-full py-8 text-sm font-black text-[#7b8aaa]">Loading creators...</p>
          ) : creatorError ? (
            <p className="col-span-full py-8 text-sm font-black text-[#bf3f5f]">{creatorError}</p>
          ) : filteredCreators.length ? (
            filteredCreators.slice(0, 8).map((creator, index) => (
              <CreatorCard creator={creator} index={index} />
            ))
          ) : (
            <p className="col-span-full py-8 text-sm font-black text-[#7b8aaa]">No creators available yet.</p>
          )}
        </div>
        <div className="mt-10">
          <HtmlButton
            buttonName="Explore all 250+ Creators"
            variant="light"
            onClick={() => navigate("/discover-creators")}
            />
        </div>
      </section>

      <section id="about" className="bg-[#f5f7ff] px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_96px_1fr]">
          <div className="text-center lg:text-left">
            <div className="inline-flex min-h-7 min-w-[270px] items-center justify-center gap-2 rounded-full border border-[#dce5ff] bg-white/30 px-8 text-[12px] font-black uppercase text-[#3956c8]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8095ff] shadow-[0_0_0_5px_rgba(128,149,255,0.16)]" />
              Trust And Accountability
            </div>
            <h3 className="mb-5 mt-8 text-[clamp(30px,5vw,46px)] font-black leading-none tracking-normal text-[#173bb5]">
              Trust isn't a Feature.
              <span className="block italic text-[#b4a2ff]">It's the foundation of every collaboration.</span>
            </h3>
            <p className="max-w-[535px] text-[15px] font-extrabold leading-tight text-[#3f4d62] lg:max-w-[470px]">
              Collune ensures every collaboration is built on transparency,
              accountability, and mutual respect, so you can focus on creating impact.
            </p>
            <div className="mt-9 inline-grid grid-cols-[auto_1fr] items-center gap-x-4 text-left text-[16px] font-black text-[#8292ea]">
              <span className="row-span-2 flex">
                <i className="h-9 w-9 rounded-full bg-[#7890ff]" />
                <i className="-ml-3 h-9 w-9 rounded-full bg-[#a995ff]" />
                <i className="-ml-3 h-9 w-9 rounded-full bg-white" />
              </span>
              <strong><span className="text-[#b4a2ff]">10,000+</span> Collaborations</strong>
              <small className="text-sm font-extrabold text-[#76839e]">powered by trust</small>
            </div>
          </div>

          <div className="relative hidden h-[430px] border-l-2 border-[#e1e7fb] lg:block">
            {[86, 215, 348].map((top) => (
              <span
                key={top}
                style={{ top }}
                className="absolute -left-[7px] h-3.5 w-3.5 rounded-full border-2 border-[#8da0ff] bg-[#f5f7ff] after:absolute after:left-5 after:top-[5px] after:w-20 after:border-t-2 after:border-dashed after:border-[#a8b7ff] after:content-[''] before:absolute before:left-[96px] before:top-[1px] before:h-2.5 before:w-2.5 before:rounded-full before:bg-[#8195ff] before:content-['']"
              />
            ))}
          </div>

          <div className="grid gap-7">
            {trustCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="grid min-h-[112px] grid-cols-[64px_1fr_auto] items-center gap-5 rounded-[18px] bg-white px-6 py-5 text-left shadow-[0_10px_28px_rgba(65,85,148,0.07)] md:grid-cols-[78px_1fr_auto]">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-[#dfe7ff] text-[#7f94ff] md:h-[74px] md:w-[74px]">
                    <Icon className="h-8 w-8" />
                  </span>
                  <div>
                    <h3 className="mb-1 text-[17px] font-black leading-tight text-[#465064]">{card.title}</h3>
                    <p className="max-w-[270px] text-[13px] font-extrabold leading-tight text-[#758097]">{card.text}</p>
                  </div>
                  <span className="hidden h-5 w-5 place-items-center rounded-full bg-[#8296ff] text-white sm:grid">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-7xl gap-5 rounded-[18px] bg-white px-6 py-6 text-[13px] font-extrabold text-[#8290aa] shadow-[0_10px_28px_rgba(65,85,148,0.04)] md:grid-cols-2 lg:grid-cols-[1.75fr_repeat(3,auto)] lg:px-10">
          <p className="flex items-center gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dfe7ff] text-[#8296ff]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            Collune is committed to building the most reliable ecosystem for brands and creators to work together with confidence.
          </p>
          {[
            ["Safe & verified", Check],
            ["Fair & Secure", Lock],
            ["Transparent & clear", BadgeCheck],
          ].map(([label, Icon]) => (
            <span key={label as string} className="flex items-center gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#dfe7ff] text-[#8296ff]">
                <Icon className="h-4.5 w-4.5" />
              </span>
              {label as string}
            </span>
          ))}
        </div>
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
    <div className={`absolute z-10 hidden overflow-visible rounded-[18px] shadow-[0_24px_48px_rgba(31,52,112,0.18)] lg:block ${className}`}>
      <img src={image} alt="" className="h-full w-full rounded-[18px] object-cover" />
      <span className="absolute grid h-12 w-12 place-items-center rounded-full border-[5px] border-[#f2f5ff] bg-[#244abe] text-white">
        {icon}
      </span>
    </div>
  );
}

function HeroBadge({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div className={`absolute z-20 hidden items-center gap-2 rounded-[15px] bg-[#a996ff] px-5 py-3 text-[13px] font-black leading-tight text-white shadow-[0_18px_30px_rgba(122,107,235,0.23)] lg:inline-flex ${className}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function HeroButton({
  children,
  variant = "solid",
  icon,
  onClick,
}: {
  children: ReactNode;
  variant?: "solid" | "light";
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[52px] min-w-[205px] items-center justify-center gap-3 rounded-full px-6 text-[13px] font-black shadow-[0_14px_24px_rgba(28,57,176,0.18)] transition hover:-translate-y-0.5 ${
        variant === "solid"
          ? "bg-[#2448bd] text-white"
          : "border border-[#dce5ff] bg-white text-[#2448bd]"
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-full ${variant === "solid" ? "bg-white/30 text-white" : "bg-[#2448bd] text-white"}`}>
        {icon}
      </span>
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
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

export default LandingPage;
