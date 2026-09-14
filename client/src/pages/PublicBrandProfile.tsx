import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, Check, ExternalLink, Globe2, Instagram, Linkedin, Loader2, MapPin, MessageCircle, UserRound } from "lucide-react";

import { getPublicBrandProfile } from "../lib/authApi";
import type { BrandProfileApi, PublicBrandCampaignApi } from "../types";

type Tab = "profile" | "campaigns";

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[8px] border border-[#dce4f0] bg-white ${className}`}>{children}</section>;
}

function deadlineLabel(value?: string | null) {
  if (!value) return "Deadline not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Deadline not set" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CampaignCard({ campaign }: { campaign: PublicBrandCampaignApi }) {
  const open = campaign.status === "ACTIVE";
  return <article className="overflow-hidden rounded-[7px] border border-[#dce4f0] bg-white">
    {campaign.cover_image ? <img src={campaign.cover_image} alt="" className="h-36 w-full object-cover" /> : <div className="h-2 bg-[#7386ff]" />}
    <div className="p-4"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${open ? "bg-[#ddfbea] text-[#067647]" : "bg-[#eef2f8] text-[#65718a]"}`}>{open ? "Open applications" : campaign.status}</span><span className="text-[10px] font-semibold text-[#7b8597]">{deadlineLabel(campaign.deadline)}</span></div><h3 className="mt-3 text-base font-black text-[#25304a]">{campaign.title}</h3><p className="mt-2 line-clamp-3 text-[12px] font-medium leading-relaxed text-[#65718a]">{campaign.objective || campaign.brief || "Campaign details will be shared with selected creators."}</p>{campaign.platforms.length ? <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#1438c8]">{campaign.platforms.join(" · ")}</p> : null}</div>
  </article>;
}

export default function PublicBrandProfile() {
  const { brandId } = useParams();
  const [brand, setBrand] = useState<BrandProfileApi | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!brandId) { setError("Brand profile id is missing."); setIsLoading(false); return; }
    let mounted = true;
    setIsLoading(true); setError("");
    getPublicBrandProfile(brandId)
      .then((data) => { if (mounted) setBrand(data); })
      .catch((reason) => { if (mounted) setError(reason instanceof Error ? reason.message : "Brand profile not found."); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [brandId]);

  const location = useMemo(() => [brand?.headquarters_city, brand?.headquarters_state, brand?.headquarters_country].filter(Boolean).join(", "), [brand]);
  const socialLinks = useMemo(() => [["LinkedIn", brand?.linkedin_url, Linkedin], ["Instagram", brand?.instagram_url, Instagram]] as const, [brand]);

  if (isLoading) return <main className="grid min-h-[70vh] place-items-center bg-[#f4f7fb]"><Loader2 className="h-9 w-9 animate-spin text-[#1438c8]" /></main>;
  if (!brand) return <main className="min-h-[70vh] bg-[#f4f7fb] px-6 py-16"><Panel className="mx-auto max-w-[760px] p-6 text-sm font-semibold text-[#b42318]">{error || "Brand profile not found."}</Panel></main>;

  const campaignCount = brand.campaigns?.length || 0;
  return <main className="min-h-screen bg-[#f4f7fb] px-4 pb-10 pt-28 text-[#25304a] sm:px-6"><div className="mx-auto max-w-[1200px]">
    <div className="mb-4 text-[13px] font-black text-[#65718a]"><Link to="/" className="hover:text-[#1438c8]">Home</Link><span> &gt; </span><Link to="/creator/marketplace" className="hover:text-[#1438c8]">Campaign Marketplace</Link><span> &gt; {brand.company_name}</span></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div className="grid gap-5">
      <Panel className="overflow-hidden p-5 sm:p-7"><div className="grid justify-items-center gap-6 text-center lg:grid-cols-[210px_1fr] lg:items-center lg:justify-items-stretch lg:text-left">
        <div className="relative grid h-[190px] w-[190px] place-items-center overflow-hidden rounded-full bg-[#e8eeff]">{brand.logo_url || brand.logo ? <img src={brand.logo_url || brand.logo} alt={brand.company_name} className="h-full w-full object-cover" /> : <Building2 className="h-20 w-20 text-[#1438c8]" />}{brand.verification_status === "VERIFIED" ? <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[#7486ff] text-white ring-4 ring-white"><Check className="h-5 w-5" /></span> : null}</div>
        <div className="pt-2"><div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"><h1 className="text-[28px] font-black leading-tight text-[#1438c8]">{brand.company_name}</h1>{brand.verification_status === "VERIFIED" ? <BadgeCheck className="h-5 w-5 fill-[#6f85ff] text-white" /> : null}</div><p className="mt-1 text-[13px] font-semibold text-[#6b7891]">{brand.industry || "Brand"}</p>{location ? <p className="mt-2 flex items-center justify-center gap-1 text-[12px] font-medium text-[#7b8597] lg:justify-start"><MapPin className="h-3.5 w-3.5" />{location}</p> : null}<p className="mt-4 max-w-[560px] text-[13px] font-medium leading-relaxed text-[#526079] lg:max-w-none">{brand.about_brand || "This brand has not added its profile story yet."}</p><div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">{socialLinks.filter(([, url]) => Boolean(url)).map(([label, url, Icon]) => <a key={label} href={url || undefined} target="_blank" rel="noreferrer" aria-label={label} className="grid h-9 w-9 place-items-center rounded-[13px] bg-[#1438c8] text-white transition hover:scale-105"><Icon className="h-4 w-4" /></a>)}{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#d8e0ec] px-3 text-xs font-black text-[#1438c8]"><Globe2 className="h-4 w-4" />Website <ExternalLink className="h-3.5 w-3.5" /></a> : null}</div><div className="mt-5 w-full max-w-[210px] rounded-[6px] border border-[#d8e0ec] bg-white px-4 py-2 text-center lg:ml-auto"><strong className="block text-[24px] font-black leading-none text-[#1438c8]">{campaignCount}</strong><span className="text-[11px] font-semibold text-[#6c7790]">Published Campaigns</span></div></div>
      </div></Panel>
      <div className="flex border-b border-[#dce4f0] bg-white px-5"><button type="button" onClick={() => setTab("profile")} className={`px-4 py-3 text-sm font-black ${tab === "profile" ? "border-b-2 border-[#1438c8] text-[#1438c8]" : "text-[#65718a]"}`}>About</button><button type="button" onClick={() => setTab("campaigns")} className={`px-4 py-3 text-sm font-black ${tab === "campaigns" ? "border-b-2 border-[#1438c8] text-[#1438c8]" : "text-[#65718a]"}`}>Campaigns ({campaignCount})</button></div>
      {tab === "profile" ? <><Panel className="p-5"><h2 className="inline-flex items-center gap-2 text-lg font-black text-[#65718a]"><UserRound className="h-4 w-4 text-[#7386ff]" />About {brand.company_name}</h2><p className="mt-4 whitespace-pre-line text-[13px] font-medium leading-relaxed text-[#536179]">{brand.about_brand || "Profile details have not been added yet."}</p></Panel><Panel className="p-5"><h2 className="inline-flex items-center gap-2 text-lg font-black text-[#65718a]"><BriefcaseBusiness className="h-4 w-4 text-[#7386ff]" />Brand Details</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-[6px] bg-[#eef4ff] p-4"><span className="text-[10px] font-semibold text-[#758198]">Industry</span><strong className="mt-1 block text-[15px] font-black text-[#1438c8]">{brand.industry || "Not added"}</strong></div><div className="rounded-[6px] bg-[#eef4ff] p-4"><span className="text-[10px] font-semibold text-[#758198]">Company Size</span><strong className="mt-1 block text-[15px] font-black text-[#1438c8]">{brand.company_size || "Not added"}</strong></div><div className="rounded-[6px] bg-[#eef4ff] p-4 sm:col-span-2"><span className="text-[10px] font-semibold text-[#758198]">Account Contact</span><strong className="mt-1 block text-[15px] font-black text-[#1438c8]">{brand.contact_person_name || "Not added"}</strong></div></div></Panel></> : <Panel className="p-5"><h2 className="inline-flex items-center gap-2 text-lg font-black text-[#65718a]"><CalendarDays className="h-4 w-4 text-[#7386ff]" />Campaigns from {brand.company_name}</h2>{campaignCount ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{brand.campaigns?.map((campaign) => <CampaignCard key={campaign.campaign_id} campaign={campaign} />)}</div> : <p className="mt-4 rounded-[6px] bg-[#f7f9fc] p-6 text-center text-sm font-semibold text-[#65718a]">No published campaigns yet.</p>}</Panel>}
    </div><aside className="grid content-start gap-5"><Panel className="p-5"><h2 className="text-lg font-black text-[#65718a]">Brand Overview</h2><div className="mt-4 grid gap-4 text-[13px]"><div><span className="text-[#7b8597]">Headquarters</span><p className="mt-1 font-black text-[#25304a]">{location || "Not added"}</p></div><div><span className="text-[#7b8597]">Company website</span>{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer" className="mt-1 block break-all font-black text-[#1438c8]">Visit website</a> : <p className="mt-1 font-black text-[#25304a]">Not added</p>}</div></div><Link to={`/creator/chat?brandId=${brand.brand_id}`} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#1438c8] text-sm font-black text-white"><MessageCircle className="h-4 w-4" />Message Brand</Link></Panel><Panel className="p-5 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#dce5ff] text-[#7386ff]"><BadgeCheck className="h-6 w-6" /></span><h2 className="mt-3 text-sm font-black text-[#25304a]">Collune Brand Profile</h2><p className="mt-2 text-[12px] font-semibold leading-tight text-[#64728c]">Campaigns and brand information are shared directly by this brand.</p></Panel></aside></div>
  </div></main>;
}
