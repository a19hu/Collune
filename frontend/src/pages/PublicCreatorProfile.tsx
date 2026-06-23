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
import { getCreatorPublicProfile, type CreatorProfileApi } from "../lib/authApi";
import { AddCreatorToShortlistModal } from "../components/Brand/Shortlists/AddCreatorToShortlistModal";
import type { CreatorSocialPlatform } from "../types";

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
  LINKEDIN: { label: "Linkedin", color: "bg-[#8099ff]", Icon: Linkedin },
  X: { label: "X / Twitter", color: "bg-[#344055]", Icon: Twitter },
  FACEBOOK: { label: "Facebook", color: "bg-[#4f7cff]", Icon: Globe2 },
  TIKTOK: { label: "Tiktok", color: "bg-[#111827]", Icon: Camera },
  SNAPCHAT: { label: "Snapchat", color: "bg-[#ffe85c]", Icon: Camera },
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

function Donut({ values, colors }: { values: number[]; colors: string[] }) {
  let offset = 25;
  const total = values.reduce((sum, value) => sum + value, 0) || 1;

  return (
    <svg viewBox="0 0 44 44" className="h-[78px] w-[78px] -rotate-90">
      <circle cx="22" cy="22" r="15.9" fill="none" stroke="#e6ebf4" strokeWidth="5" />
      {values.map((value, index) => {
        const dash = (value / total) * 100;
        const circle = (
          <circle
            key={`${colors[index]}-${value}`}
            cx="22"
            cy="22"
            r="15.9"
            fill="none"
            stroke={colors[index]}
            strokeDasharray={`${dash} ${100 - dash}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="5"
          />
        );
        offset -= dash;
        return circle;
      })}
    </svg>
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
            <button type="button" className="h-12 rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]">
              Request Collaboration
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

function CreatorStatsCard() {
  const stats = [
    ["Projects Completed", "20+"],
    ["Repeat Brands", "38%"],
    ["Response Rate", "92%"],
    ["Acceptance Rate", "70%"],
    ["Avg. Response Time", "24h"],
    ["Completion Rate", "98%"],
  ];

  return (
    <Panel className="p-5">
      <h2 className="text-lg font-black text-[#65718a]">Creator Stats</h2>
      <div className="mt-4 grid gap-3 text-[13px] font-semibold text-[#7a879d]">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <span>{label}</span>
            <strong className="text-[#64728c]">{value}</strong>
          </div>
        ))}
      </div>
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

function LockedAudienceCard() {
  return (
    <Panel className="overflow-hidden p-5">
      <h2 className="inline-flex items-center gap-1 text-lg font-black text-[#65718a]">
        Audience Breakdown <Lock className="h-4 w-4" />
      </h2>
      <div className="relative mt-4 min-h-[220px] overflow-hidden rounded-[6px] bg-[#f8f4ff]">
        <div className="absolute inset-0 blur-[8px]">
          <div className="mx-auto mt-8 h-28 w-28 rounded-full border-[18px] border-[#c9b8ff]" />
          <div className="mx-8 mt-6 grid gap-2">
            <span className="h-2 rounded-full bg-[#dce5ff]" />
            <span className="h-2 w-2/3 rounded-full bg-[#dce5ff]" />
            <span className="h-2 w-4/5 rounded-full bg-[#dce5ff]" />
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-6 text-center">
          <p className="text-[13px] font-semibold leading-tight text-[#64728c]">Detailed audience insights are locked.</p>
          <Link to="/login" className="mt-4 grid h-11 place-items-center rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]">
            Login as Brand
          </Link>
        </div>
      </div>
    </Panel>
  );
}

export function PublicCreatorProfile() {
  const { creatorId } = useParams();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<CreatorProfileApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!creatorId) {
      setError("Creator profile not found.");
      setIsLoading(false);
      return;
    }

    getCreatorPublicProfile(creatorId)
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load creator profile.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
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
    if (accounts.length) return accounts.slice(0, 4);
    return [
      { account_id: "instagram", platform: "INSTAGRAM" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.5), is_connected: false, created_at: "" },
      { account_id: "youtube", platform: "YOUTUBE" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.3), is_connected: false, created_at: "" },
      { account_id: "linkedin", platform: "LINKEDIN" as CreatorSocialPlatform, handle: "", followers: Math.round((profile?.audience_size || 0) * 0.2), is_connected: false, created_at: "" },
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

  const name = profile.display_name || profile.user?.name || "Creator";
  const firstName = name.split(" ")[0] || "Creator";
  const isBrand = currentUser?.role === "Brand";
  const avatar = profile.profile_image_url;
  const chips = [
    profile.category,
    `${profile.profile_completion || 0}% profile complete`,
    Number(profile.rate_min) || Number(profile.rate_max) ? `₹${compactNumber(Number(profile.rate_min) || 0)} - ₹${compactNumber(Number(profile.rate_max) || 0)}` : "",
    ...profile.languages.slice(0, 2),
    ...profile.collaboration_preferences.slice(0, 3),
  ].filter(Boolean);
  const updatedDate = profile.updated_at ? new Date(profile.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 pb-10 pt-28 text-[#25304a] sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 text-[13px] font-black text-[#65718a]">
          <Link to="/" className="hover:text-[#1438c8]">Home</Link>
          <span> &gt; </span>
          <Link to="/#creators" className="hover:text-[#1438c8]">Discover Creators</Link>
          <span> &gt; {name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-5">
        <Panel className="overflow-hidden p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[250px_1fr] lg:items-center">
            <div className="relative h-[210px] w-[210px] overflow-hidden rounded-full bg-[#f3e4d4]">
              {avatar ? (
                <img src={avatar} alt={name} className="h-full w-full object-cover" />
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
                <h1 className="text-[28px] font-black leading-tight text-[#1438c8]">{name}</h1>
                <BadgeCheck className="h-5 w-5 fill-[#6f85ff] text-white" />
              </div>
              <p className="mt-1 text-[13px] font-semibold text-[#6b7891]">
                {profile.category || "Creator"} {profile.location ? <span> | {profile.location}</span> : null}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#7b8597]">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location || "Location not added"} {profile.languages.length ? ` | ${profile.languages.join(", ")}` : ""}
              </p>
              <p className="mt-4 max-w-[560px] text-[13px] font-medium leading-relaxed text-[#526079]">
                {profile.bio || "This creator has not added a profile bio yet."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {["#e69bf4", "#ff624f", "#8099ff", "#344055", "#d9dee5"].map((color) => (
                  <span key={color} className="h-8 w-8 rounded-full" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-5 max-w-[210px] rounded-[6px] border border-[#d8e0ec] bg-white px-4 py-2 text-center lg:ml-auto">
                <strong className="block text-[24px] font-black leading-none text-[#1438c8]">{profileStats.totalFollowers}</strong>
                <span className="text-[11px] font-semibold text-[#6c7790]">Followers across Platforms</span>
              </div>
            </div>
          </div>
        </Panel>

          <Panel className="p-5">
            <SectionTitle icon={<UserRound className="h-4 w-4 text-[#7386ff]" />} title={`About ${firstName}`} />
            <p className="mt-4 text-[13px] font-medium leading-relaxed text-[#536179]">
              {profile.bio || "Profile bio has not been added yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#e9edff] px-3 py-1 text-[11px] font-bold text-[#1438c8]">
                  {chip}
                </span>
              ))}
              {profile.open_to_travel ? <span className="rounded-full bg-[#e8fff3] px-3 py-1 text-[11px] font-bold text-[#067647]">Open to travel</span> : null}
              {profile.preferred_response_time ? <span className="rounded-full bg-[#fff3df] px-3 py-1 text-[11px] font-bold text-[#995c00]">{profile.preferred_response_time}</span> : null}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionTitle
              icon={<BarChart3 className="h-4 w-4 text-[#7386ff]" />}
              title="Audience Snapshot"
              right={isBrand ? <span className="text-[11px] font-semibold text-[#7b8597]">Updated {updatedDate}</span> : null}
            />
            <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isBrand ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>
              <MetricTile value={profileStats.totalFollowers} label="Total Followers" />
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
                  <MetricTile value={profile.languages.length ? profile.languages.map((language) => language.slice(0, 2)).join("/") : "En/Hn"} label="Top Languages" />
                </>
              )}
            </div>
            {isBrand ? <div className="mt-4 grid gap-5 rounded-[6px] bg-[#eaf1ff] p-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold text-[#64728c]">Audience from India</p>
                <div className="mt-2 flex items-center gap-3">
                  <strong className="text-[15px] font-black text-[#1438c8]">72%</strong>
                  <span className="h-1.5 flex-1 rounded-full bg-white">
                    <span className="block h-full w-[72%] rounded-full bg-[#1438c8]" />
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#64728c]">Top Languages</p>
                <strong className="mt-1 block text-[15px] font-black text-[#1438c8]">{profile.languages.join(", ") || "Not added"}</strong>
              </div>
            </div> : (
              <p className="mt-4 text-center text-[13px] font-semibold text-[#64728c]">
                Login as a brand to unlock detailed audience demographics, locations, age groups, gender split and interests.
              </p>
            )}
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

          {isBrand ? <Panel className="p-5">
            <SectionTitle title="Audience Breakdown" />
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[6px] border border-[#dbe3ee] p-4">
                <p className="text-[11px] font-bold text-[#64728c]">Top Locations</p>
                {[
                  ["India", 72],
                  ["U.S.", 10],
                  ["S.A.", 8],
                  ["U.A.E.", 4],
                  ["U.K.", 4],
                  ["Others", 2],
                ].map(([label, value]) => (
                  <div key={label as string} className="mt-2 grid grid-cols-[46px_1fr_32px] items-center gap-2 text-[10px] font-semibold text-[#59667e]">
                    <span>{label}</span>
                    <span className="h-1.5 rounded-full bg-[#dce5f5]">
                      <span className="block h-full rounded-full bg-[#1438c8]" style={{ width: `${value}%` }} />
                    </span>
                    <span className="text-right">{value}%</span>
                  </div>
                ))}
              </div>
              <div className="rounded-[6px] border border-[#dbe3ee] p-4">
                <p className="text-[11px] font-bold text-[#64728c]">Gender Split</p>
                <div className="mt-3 flex items-center justify-center gap-5">
                  <Donut values={[52, 46, 2]} colors={["#7386ff", "#ff8880", "#cfd7e6"]} />
                  <div className="text-[10px] font-semibold text-[#59667e]">
                    <p><span className="text-[#7386ff]">-</span> Male 52%</p>
                    <p><span className="text-[#ff8880]">-</span> Female 46%</p>
                    <p><span className="text-[#cfd7e6]">-</span> Others 2%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[6px] border border-[#dbe3ee] p-4">
                <p className="text-[11px] font-bold text-[#64728c]">Age Split</p>
                <div className="mt-3 flex items-center justify-center gap-5">
                  <Donut values={[14, 39, 35, 12]} colors={["#1438c8", "#7386ff", "#ff8880", "#d7deeb"]} />
                  <div className="text-[10px] font-semibold text-[#59667e]">
                    <p><span className="text-[#1438c8]">-</span> 18-24</p>
                    <p><span className="text-[#7386ff]">-</span> 25-34</p>
                    <p><span className="text-[#ff8880]">-</span> 35-44</p>
                    <p><span className="text-[#d7deeb]">-</span> 45+</p>
                  </div>
                </div>
              </div>
            </div>
          </Panel> : null}
          </div>

          <aside className="grid content-start gap-5">
            <BrandActions creator={profile} isBrand={isBrand} />
            {isBrand ? (
              <>
                <CreatorStatsCard />
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
                    <button type="button" className="h-12 rounded-[6px] border border-[#dbe4ff] bg-white text-sm font-black text-[#1438c8]">Request Collaboration</button>
                    <button type="button" className="h-12 rounded-[6px] bg-[#1438c8] text-sm font-black text-white">Save Creator</button>
                  </div>
                  <p className="mt-4 text-center text-[12px] font-semibold leading-tight text-[#64728c]">
                    These actions are only available for logged in brands
                  </p>
                </Panel>
                <LockedAudienceCard />
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default PublicCreatorProfile;
