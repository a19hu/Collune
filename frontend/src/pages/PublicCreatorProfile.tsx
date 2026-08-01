import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  Check,
  Globe2,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Twitter,
  UserRound,
} from "lucide-react";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";


import { useAuth } from "../contexts/AuthContext";
import { getCreatorPublicProfile } from "../lib/authApi";
import { AddCreatorToShortlistModal } from "../components/Brand/Shortlists/AddCreatorToShortlistModal";
import type { CreatorPublicProfileApi, CreatorSocialPlatform } from "../types";
import { formatUpdatedAt } from "../HtmlComponents/BrandCard";
import { getLocationDisplayValue } from "./StepsCreatorRegister";

const fallbackPortfolio = [
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=480&q=80",
];

function XIcon({ className }: { className?: string }) {
  return <span className={className}>X</span>;
}

const socialTiles = [
  { label: "Instagram", color: "bg-[#f77737]", icon: Instagram },
  { label: "LinkedIn", color: "bg-[#0a66c2]", icon: Linkedin },
  { label: "X (Twitter)", color: "bg-[#111827]", icon: XIcon },
  { label: "YouTube", color: "bg-[#ff0000]", icon: Youtube },
  { label: "Facebook", color: "bg-[#1877f2]", icon: Facebook },
];

const platformMeta: Record<CreatorSocialPlatform, { label: string; color: string; Icon: typeof Instagram }> = {
  INSTAGRAM: { label: "Instagram", color: "bg-[#f4a5ff]", Icon: Instagram },
  YOUTUBE: { label: "Youtube", color: "bg-[#ff624f]", Icon: Youtube },
  X: { label: "X / Twitter", color: "bg-[#344055]", Icon: Twitter },
  FACEBOOK: { label: "Facebook", color: "bg-[#4f7cff]", Icon: Globe2 },
};

function compactNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(value);
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[8px] border border-[#dce4f0] bg-white ${className}`}>{children}</section>;
}

function SectionTitle({ icon, title, right }: { icon?: ReactNode; title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-[#65718a]">
        {icon}
        <span>{title}</span>
      </div>
      {right}
    </div>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid min-h-[82px] place-items-center rounded-[6px] bg-[#eef4ff] px-3 text-center">
      <strong className="text-[24px] font-black leading-none text-[#1438c8]">{value}</strong>
      <span className="mt-1 text-[11px] font-semibold text-[#6c7790]">{label}</span>
    </div>
  );
}

function LockedMetricTile({ value, label, unlocked }: { value: string; label: string; unlocked: boolean }) {
  return (
    <div className="relative grid min-h-[82px] place-items-center overflow-hidden rounded-[6px] bg-[#eef4ff] px-3 text-center">
      <strong className={`text-[24px] font-black leading-none text-[#1438c8] ${unlocked ? "" : "blur-[5px]"}`}>
        {value}
      </strong>
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6c7790]">
        {unlocked ? null : <Lock className="h-3 w-3" />}
        {label}
      </span>
    </div>
  );
}

function BrandActions({ creator, isBrand }: { creator: CreatorPublicProfileApi; isBrand: boolean }) {
  const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false);

  if (isBrand) {
    return (
      <>
        <Panel className="p-5">
          <h2 className="text-lg font-black text-[#65718a]">For Brands</h2>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => setIsShortlistModalOpen(true)}
              className="h-12 rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]"
            >
              Add to Shortlist
            </button>
            <button type="button" className="h-12 rounded-[6px] bg-[#1438c8] text-sm font-black text-white">
              Save Creator
            </button>
          </div>
        </Panel>
        <AddCreatorToShortlistModal
          creator={creator}
          isOpen={isShortlistModalOpen}
          onClose={() => setIsShortlistModalOpen(false)}
        />
      </>
    );
  }

  return (
    <Panel className="p-6 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#dce5ff] text-[#7386ff]">
        <Lock className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-sm font-black text-[#25304a]">Want full access?</h2>
      <p className="mx-auto mt-2 max-w-[230px] text-[13px] font-semibold leading-tight text-[#64728c]">
        Login as a brand to unlock detailed audience insights, performance analytics and collaboration options.
      </p>
      <Link to="/login" className="mx-auto mt-4 grid h-11 max-w-[190px] place-items-center rounded-[6px] bg-[#1438c8] text-sm font-black text-white">
        Login as a Brand
      </Link>
      <p className="mt-3 text-[12px] font-semibold text-[#64728c]">
        Don't have an account? <Link to="/brand-register" className="font-black text-[#7386ff]">Sign up</Link>
      </p>
    </Panel>
  );
}


function VerifiedCard() {
  return (
    <Panel className="flex min-h-[108px] items-center gap-4 p-5">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#dce5ff] text-[#7386ff]">
        <ShieldCheck className="h-8 w-8" />
      </span>
      <h2 className="text-lg font-black leading-tight text-[#65718a]">Profile Verified by Collune</h2>
    </Panel>
  );
}

function BrandLoginPromptModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/55 px-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] rounded-[10px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#25304a]">Login Required</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#64728c]">
              Please login as a brand to add creators to a shortlist or save them for later.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#dce4f0] text-[#64728c]"
            aria-label="Close login prompt"
          >
            <span className="text-lg leading-none">x</span>
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <Link to="/login" className="grid h-12 place-items-center rounded-[6px] bg-[#1438c8] text-sm font-black text-white">
            Login as a Brand
          </Link>
          <Link to="/brand-register" className="grid h-12 place-items-center rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]">
            Create Brand Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PublicCreatorProfile() {
  const { creatorId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<CreatorPublicProfileApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBrandLoginPromptOpen, setIsBrandLoginPromptOpen] = useState(false);
  const isBrand = currentUser?.role === "Brand";

 useEffect(() => {
    let isMounted = true;

    getCreatorPublicProfile(creatorId)
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((error) => {
        if (isMounted) setError(error instanceof Error ? error.message : "Could not load creators.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [creatorId]);

  const profileStats = useMemo(() => {
    const audience = profile?.total_followers || 0;
    const engagementRate = profile?.avg_eng_rate || 0;
    return {
      totalFollowers: compactNumber(audience),
      engagementRate: engagementRate ? `${engagementRate}%` : "0%",
      reach: compactNumber(profile?.total_view_count || Math.max(Math.round(audience * 0.5), audience ? 1200 : 0)),
      comments: compactNumber(Math.max(Math.round(audience * 0.1), audience ? 250 : 0)),
      shares: compactNumber(Math.max(Math.round(audience * 0.06), audience ? 140 : 0)),
    };
  }, [profile]);

  const visiblePlatforms = useMemo(() => {
    const accounts = profile?.platform_data || [];
    if (accounts.length) {
      return accounts.slice(0, 4).map((account) => ({
        platform: account.name,
        followers: account.followers || 0,
        view_count: account.view_count || 0,
        engagement_rate: account.engagement_rate || 0,
      }));
    }
    return [
      { platform: "INSTAGRAM" as CreatorSocialPlatform, followers: Math.round((profile?.total_followers || 0) * 0.5), view_count: 0, engagement_rate: 0 },
      { platform: "YOUTUBE" as CreatorSocialPlatform, followers: Math.round((profile?.total_followers || 0) * 0.3), view_count: 0, engagement_rate: 0 },
      { platform: "FACEBOOK" as CreatorSocialPlatform, followers: Math.round((profile?.total_followers || 0) * 0.2), view_count: 0, engagement_rate: 0 },
      { platform: "X" as CreatorSocialPlatform, followers: Math.round((profile?.total_followers || 0) * 0.12), view_count: 0, engagement_rate: 0 },
    ];
  }, [profile]);

  const locationDisplay = useMemo(() => {
    const rawLocation = profile?.location || "";
    return rawLocation ? getLocationDisplayValue(rawLocation) : "";
  }, [profile?.location]);

  const languageDisplay = useMemo(() => {
    if (!profile?.languages?.length) return "";
    return profile.languages.join(", ");
  }, [profile?.languages]);

  if (isLoading) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f4f7fb]">
        <Loader2 className="h-9 w-9 animate-spin text-[#1438c8]" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-[70vh] bg-[#f4f7fb] px-6 py-16">
        <Panel className="mx-auto max-w-[760px] p-6 text-sm font-semibold text-[#b42318]">
          {error || "Creator profile not found."}
        </Panel>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 pb-10 pt-28 text-[#25304a] sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 text-[13px] font-black text-[#65718a]">
          <Link to="/" className="hover:text-[#1438c8]">Home</Link>
          <span> &gt; </span>
          <Link to="/discover-creators" className="hover:text-[#1438c8]">Discover Creators</Link>
          <span> &gt; {profile?.display_name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5">
        <Panel className="overflow-hidden p-5 sm:p-7">
          <div className="grid justify-items-center gap-6 text-center lg:grid-cols-[250px_1fr] lg:items-center lg:justify-items-stretch lg:text-left">
            <div className="relative h-[210px] w-[210px] overflow-hidden rounded-full bg-[#f3e4d4]">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt={profile.display_name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-[#1438c8]">
                  <UserRound className="h-24 w-24" />
                </div>
              )}
              <span className="absolute bottom-5 right-6 grid h-11 w-11 place-items-center rounded-full bg-[#7486ff] text-white ring-4 ring-white">
                <Check className="h-6 w-6" />
              </span>
            </div>

            <div className="pt-3">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <h1 className="text-[28px] font-black leading-tight text-[#1438c8]">{profile?.display_name}</h1>
                <BadgeCheck className="h-5 w-5 fill-[#6f85ff] text-white" />
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#6b7891]">
                {profile.category || "Creator"}
              </p>
              <p className="mt-2 flex items-center justify-center gap-1 text-[12px] font-medium text-[#7b8597] lg:justify-start">
                <MapPin className="h-3.5 w-3.5" />
                <span>{locationDisplay || "Location not added"}</span>
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[12px] font-medium text-[#7b8597] lg:justify-start">
                <Globe2 className="h-3.5 w-3.5" />
                <span>{languageDisplay || "Language not added"}</span>
              </p>
              <p className="mt-4 max-w-[560px] text-[13px] font-medium leading-relaxed text-[#526079] lg:max-w-none">
                {profile?.bio || "This creator has not added a profile bio yet."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3 lg:justify-start">
                <div className="flex flex-wrap justify-center gap-4 lg:justify-start" aria-label="Social platforms">
              {socialTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <span key={tile.color} className={`grid h-9 w-9 place-items-center rounded-[13px] ${tile.color} text-white transition hover:scale-105`}>
                    <Icon className="text-lg font-black leading-none"  />
                    </span>
                );
              })}
            </div>
              </div>
              <div className="mt-5 w-full max-w-[210px] rounded-[6px] border border-[#d8e0ec] bg-white px-4 py-2 text-center lg:ml-auto">
                <strong className="block text-[24px] font-black leading-none text-[#1438c8]">{(profile?.total_followers || 0).toLocaleString()}</strong>
                <span className="text-[11px] font-semibold text-[#6c7790]">Followers across Platforms</span>
              </div>
            </div>
          </div>
        </Panel>

          <Panel className="p-5">
            <SectionTitle icon={<UserRound className="h-4 w-4 text-[#7386ff]" />} title={`About ${profile?.display_name || "Creator"}`} />
            <p className="mt-4 text-[13px] font-medium leading-relaxed text-[#536179]">
              {profile?.about || "Profile bio has not been added yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {/* {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#e9edff] px-3 py-1 text-[11px] font-bold text-[#1438c8]">
                  {chip}
                </span>
              ))} */}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle
              icon={<BarChart3 className="h-4 w-4 text-[#7386ff]" />}
              title="Audience Snapshot"
              right={isBrand ? <span className="text-[11px] font-semibold text-[#7b8597]">{formatUpdatedAt(profile?.updated_at)}</span> : null}
            />
            <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isBrand ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>
              <MetricTile value={(profile?.total_followers || 0).toLocaleString()} label="Total Followers" />
              {isBrand ? (
                <>
                  <MetricTile value={profileStats.engagementRate} label="Avg. Eng. rate" />
                  <MetricTile value={profileStats.reach} label="Avg. Reach" />
                  <MetricTile value={profileStats.reach} label="Avg. Reach" />
                  <MetricTile value={profileStats.comments} label="Avg. Comments" />
                  <MetricTile value={profileStats.shares} label="Avg. Shares" />
                </>
              ) : (
                <>
                  <LockedMetricTile value={profileStats.engagementRate} label="Avg. Engagement rate" unlocked={false} />
                  <LockedMetricTile value="72%" label="Audience from India" unlocked={false} />
                  <MetricTile value={profile?.languages?.length ? profile.languages.map((language) => language.slice(0, 2)).join("/") : "En/Hn"} label="Top Languages" />
                </>
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle title="Platforms" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {visiblePlatforms.map((account) => {
                const meta = platformMeta[account.platform] || platformMeta.INSTAGRAM;
                const Icon = meta.Icon;
                const followers = account.followers || Math.round((profile.total_followers || 0) / Math.max(visiblePlatforms.length, 1));
                const isYouTube = account.platform === "YOUTUBE";
                return (
                  <div key={account.platform} className="rounded-[6px] border border-[#dbe3ee] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-7 w-7 place-items-center rounded-[4px] ${meta.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[12px] font-bold text-[#526079]">{meta.label}</span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div>
                        <strong className="block text-[15px] font-black text-[#1438c8]">{compactNumber(followers)}</strong>
                        <span className="text-[10px] font-semibold text-[#758198]">{isYouTube ? "Subscribers" : "Followers"}</span>
                      </div>
                      <div>
                        <strong className="block text-[15px] font-black text-[#1438c8]">
                          <span className={isBrand ? "" : "blur-[5px]"}>{isYouTube ? compactNumber(account.view_count || 0) : `${account.engagement_rate || profile?.avg_eng_rate || 0}%`}</span>
                        </strong>
                        <span className="text-[10px] font-semibold text-[#758198]">{isYouTube ? "Views" : "Eng. Rate"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle title="Portfolio" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {fallbackPortfolio.map((src, index) => (
                <div key={src} className="relative aspect-[1.18] overflow-hidden rounded-[6px] bg-[#dfe7f2]">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                    {index % 2 ? "391.5K" : "870.5K"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          </div>

          <aside className="grid content-start gap-5">
            <BrandActions creator={profile} isBrand={isBrand} />
            {isBrand ? (
              <>
                <VerifiedCard />
              </>
            ) : (
              <>
                <Panel className="p-5">
                  <h2 className="inline-flex items-center gap-1 text-lg font-black text-[#65718a]">
                    For Brands <Lock className="h-4 w-4" />
                  </h2>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBrandLoginPromptOpen(true)}
                      className="h-12 rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]"
                    >
                      Add to Shortlist
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBrandLoginPromptOpen(true)}
                      className="h-12 rounded-[6px] bg-[#1438c8] text-sm font-black text-white"
                    >
                      Save Creator
                    </button>
                  </div>
                  <p className="mt-4 text-center text-[12px] font-semibold leading-tight text-[#64728c]">
                    These actions are only available for logged in brands
                  </p>
                </Panel>
              </>
            )}
          </aside>
        </div>
      </div>
      <BrandLoginPromptModal isOpen={isBrandLoginPromptOpen} onClose={() => setIsBrandLoginPromptOpen(false)} />
    </main>
  );
}

export default PublicCreatorProfile;
