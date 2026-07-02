import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  Globe2,
  Instagram,
  Linkedin,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Twitter,
  UserRound,
  Youtube,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import { getCreatorPublicProfile, getCreatorsList, type CreatorProfileApi } from "../lib/authApi";
import { AddCreatorToShortlistModal } from "../components/Brand/Shortlists/AddCreatorToShortlistModal";
import type { CreatorSocialPlatform } from "../types";
import { formatUpdatedAt } from "../HtmlComponents/BrandCard";

const fallbackPortfolio = [
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=480&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=480&q=80",
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

function BrandActions({ creator, isBrand }: { creator: CreatorProfileApi; isBrand: boolean }) {
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

export function PublicCreatorProfile() {
  const { creatorId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<CreatorProfileApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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
    const audience = profile?.audience_size || 0;
    return {
      totalFollowers: compactNumber(audience),
      engagementRate: audience ? "5.1%" : "0%",
      reach: compactNumber(Math.max(Math.round(audience * 0.5), audience ? 1200 : 0)),
      comments: compactNumber(Math.max(Math.round(audience * 0.1), audience ? 250 : 0)),
      shares: compactNumber(Math.max(Math.round(audience * 0.06), audience ? 140 : 0)),
    };
  }, [profile]);

  const visiblePlatforms = useMemo(() => {
    const accounts = profile?.social_accounts || [];
    if (accounts?.length) return accounts.slice(0, 4);
    return [
      { account_id: "instagram", platform: "INSTAGRAM" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.5), is_connected: false, created_at: "" },
      { account_id: "youtube", platform: "YOUTUBE" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.3), is_connected: false, created_at: "" },
      { account_id: "Facebook", platform: "FACEBOOK" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.2), is_connected: false, created_at: "" },
      { account_id: "x", platform: "X" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.12), is_connected: false, created_at: "" },
    ];
  }, [profile]);

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
          <div className="grid gap-6 lg:grid-cols-[250px_1fr] lg:items-center">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[28px] font-black leading-tight text-[#1438c8]">{profile?.display_name}</h1>
                <BadgeCheck className="h-5 w-5 fill-[#6f85ff] text-white" />
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#6b7891]">
                {profile.category || "Creator"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#7b8597]">
                <MapPin className="h-3.5 w-3.5" />
                {profile?.location || "Location not added"} {profile?.languages?.length ? ` | ${profile.languages.join(", ")}` : ""}
              </p>
              <p className="mt-4 max-w-[560px] text-[13px] font-medium leading-relaxed text-[#526079]">
                {profile?.bio || "This creator has not added a profile bio yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["#e69bf4", "#ff624f", "#8099ff", "#344055", "#d9dee5"].map((color) => (
                  <span key={color} className="h-8 w-8 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-5 max-w-[210px] rounded-[6px] border border-[#d8e0ec] bg-white px-4 py-2 text-center lg:ml-auto">
                <strong className="block text-[24px] font-black leading-none text-[#1438c8]">{(profile?.total_flowers).toLocaleString() || 0}</strong>
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
              <MetricTile value={ (profile?.total_flowers).toLocaleString() || 0 } label="Total Followers" />
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
                  <MetricTile value={profile?.languages.length ? profile?.languages.map((language) => language.slice(0, 2)).join("/") : "En/Hn"} label="Top Languages" />
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
                const followers = account.followers || Math.round((profile.audience_size || 0) / Math.max(visiblePlatforms.length, 1));
                const isYouTube = account.platform === "YOUTUBE";
                return (
                  <div key={account.account_id} className="rounded-[6px] border border-[#dbe3ee] bg-white p-4">
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
                          <span className={isBrand ? "" : "blur-[5px]"}>{isYouTube ? compactNumber(account.view_count || 0) : profileStats.engagementRate}</span>
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
            <SectionTitle title="Portfolio" right={profile.portfolio_url ? <a href={profile.portfolio_url} className="text-[12px] font-black text-[#1438c8]">Open portfolio</a> : null} />
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
                    <button type="button" className="h-12 rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]">Add to Shortlist</button>
                    <button type="button" className="h-12 rounded-[6px] bg-[#1438c8] text-sm font-black text-white">Save Creator</button>
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
    </main>
  );
}

export default PublicCreatorProfile;
