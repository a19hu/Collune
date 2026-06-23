import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  Globe2,
  Instagram,
  Linkedin,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Twitter,
  Upload,
  UserRound,
  X,
  Youtube,
} from "lucide-react";
import {
  getCreatorProfile,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  refreshYouTubeVideos,
  updateCreatorProfile,
  type CreatorProfileApi,
} from "../../lib/authApi";
import type { CreatorSocialPlatform } from "../../types";

type EditForm = {
  display_name: string;
  category: string;
  location: string;
  languages: string;
  collaboration_preferences: string;
  preferred_response_time: string;
  open_to_travel: boolean;
  bio: string;
  portfolio_url: string;
  audience_size: string;
  rate_min: string;
  rate_max: string;
  profile_image: File | null;
};

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

function csvToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditForm(profile: CreatorProfileApi): EditForm {
  return {
    display_name: profile.display_name || "",
    category: profile.category || "",
    location: profile.location || "",
    languages: (profile.languages || []).join(", "),
    collaboration_preferences: (profile.collaboration_preferences || []).join(", "),
    preferred_response_time: profile.preferred_response_time || "",
    open_to_travel: Boolean(profile.open_to_travel),
    bio: profile.bio || "",
    portfolio_url: profile.portfolio_url || "",
    audience_size: String(profile.audience_size || 0),
    rate_min: String(profile.rate_min || "0"),
    rate_max: String(profile.rate_max || "0"),
    profile_image: null,
  };
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

export function CreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfileApi | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [isConnectingYouTube, setIsConnectingYouTube] = useState(false);
  const [isConnectingX, setIsConnectingX] = useState(false);
  const [isRefreshingYouTube, setIsRefreshingYouTube] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getCreatorProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toEditForm(data));
        const instagramStatus = new URLSearchParams(window.location.search).get("instagram");
        const youtubeStatus = new URLSearchParams(window.location.search).get("youtube");
        const xStatus = new URLSearchParams(window.location.search).get("x");
        if (instagramStatus === "connected") setMessage("Instagram connected.");
        if (instagramStatus === "error") setError("Instagram connection failed. Please try again.");
        if (youtubeStatus === "connected") setMessage("YouTube connected.");
        if (youtubeStatus === "no_channel") setError("No YouTube channel found for this Google account.");
        if (youtubeStatus === "error") setError("YouTube connection failed. Please try again.");
        if (xStatus === "connected") setMessage("X connected.");
        if (xStatus === "error") setError("X connection failed. Please try again.");
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message || "Unable to load creator profile.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
  const youtubeAccount = useMemo(
    () => profile?.social_accounts.find((account) => account.platform === "YOUTUBE" && account.is_connected),
    [profile],
  );

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProfile() {
    if (!form) return;
    setIsSaving(true);
    setError("");
    setMessage("");

    const body = new FormData();
    body.append("display_name", form.display_name);
    body.append("category", form.category);
    body.append("location", form.location);
    body.append("languages", JSON.stringify(csvToList(form.languages)));
    body.append("collaboration_preferences", JSON.stringify(csvToList(form.collaboration_preferences)));
    body.append("preferred_response_time", form.preferred_response_time);
    body.append("open_to_travel", String(form.open_to_travel));
    body.append("bio", form.bio);
    body.append("portfolio_url", form.portfolio_url);
    body.append("audience_size", form.audience_size || "0");
    body.append("rate_min", form.rate_min || "0");
    body.append("rate_max", form.rate_max || "0");
    if (form.profile_image) body.append("profile_image", form.profile_image);

    try {
      const updated = await updateCreatorProfile(body);
      setProfile(updated);
      setForm(toEditForm(updated));
      setIsEditing(false);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update creator profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function connectInstagram() {
    setIsConnectingInstagram(true);
    setError("");
    try {
      const data = await getInstagramConnectUrl();
      window.location.href = data.auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Instagram OAuth.");
      setIsConnectingInstagram(false);
    }
  }

  async function connectYouTube() {
    setIsConnectingYouTube(true);
    setError("");
    try {
      const data = await getYouTubeConnectUrl();
      window.location.href = data.auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start YouTube OAuth.");
      setIsConnectingYouTube(false);
    }
  }

  async function connectX() {
    setIsConnectingX(true);
    setError("");
    try {
      const data = await getXConnectUrl();
      window.location.href = data.auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start X OAuth.");
      setIsConnectingX(false);
    }
  }

  async function refreshYouTube() {
    setIsRefreshingYouTube(true);
    setError("");
    setMessage("");
    try {
      const updated = await refreshYouTubeVideos();
      setProfile(updated);
      setForm(toEditForm(updated));
      setMessage("YouTube videos refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh YouTube videos.");
    } finally {
      setIsRefreshingYouTube(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[8px] border border-[#dce4f0] bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-[#1438c8]" />
      </div>
    );
  }

  if (!profile || !form) {
    return <Panel className="p-6 text-sm font-semibold text-[#b42318]">{error || "No creator profile found."}</Panel>;
  }

  const name = profile.display_name || profile.user?.name || "Creator";
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
    <div className="mx-auto max-w-[980px] bg-[#f4f7fb] p-2 text-[#25304a] sm:p-3">
      <Panel className="overflow-hidden p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[250px_1fr_auto] lg:items-start">
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
              {profile.bio || "Add a short bio so brands can understand your content style, audience, and collaboration strengths."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {["#f29bff", "#ff6a5c", "#7995ff", "#344055", "#d9dee5"].map((color) => (
                <span key={color} className="h-9 w-9 rounded-full" style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[#1438c8] px-4 text-sm font-black text-white shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Update Profile
            </button>
            <div className="rounded-[6px] border border-[#d8e0ec] bg-white px-5 py-3 text-center">
              <strong className="block text-[24px] font-black leading-none text-[#1438c8]">{profileStats.totalFollowers}</strong>
              <span className="text-[11px] font-semibold text-[#6c7790]">Followers across Platforms</span>
            </div>
          </div>
        </div>
      </Panel>

      {error ? <div className="mt-3 rounded-[6px] border border-[#f3b7b7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">{error}</div> : null}
      {message ? <div className="mt-3 rounded-[6px] border border-[#b7ebca] bg-[#f0fff5] px-4 py-3 text-sm font-semibold text-[#067647]">{message}</div> : null}

      <div className="mt-4 grid gap-4">
        <Panel className="p-5">
          <SectionTitle icon={<UserRound className="h-4 w-4 text-[#7386ff]" />} title={`About ${name.split(" ")[0] || "Creator"}`} />
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
            right={<span className="text-[11px] font-semibold text-[#7b8597]">Updated {updatedDate}</span>}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <MetricTile value={profileStats.totalFollowers} label="Total Followers" />
            <MetricTile value={profileStats.engagementRate} label="Avg. Eng. rate" />
            <MetricTile value={profileStats.reach} label="Avg. Reach" />
            <MetricTile value={profileStats.reach} label="Avg. Reach" />
            <MetricTile value={profileStats.comments} label="Avg. Comments" />
            <MetricTile value={profileStats.shares} label="Avg. Shares" />
          </div>
          <div className="mt-4 grid gap-5 rounded-[6px] bg-[#eaf1ff] p-4 md:grid-cols-2">
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
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle
            title="Platforms"
            right={
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={connectYouTube}
                  disabled={isConnectingYouTube}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#ff2f2f] px-3 text-[12px] font-black text-white disabled:opacity-60"
                >
                  {isConnectingYouTube ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                  Connect YouTube
                </button>
                <button
                  type="button"
                  onClick={connectInstagram}
                  disabled={isConnectingInstagram}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#1438c8] px-3 text-[12px] font-black text-white disabled:opacity-60"
                >
                  {isConnectingInstagram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
                  Connect Instagram
                </button>
                <button
                  type="button"
                  onClick={connectX}
                  disabled={isConnectingX}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#111827] px-3 text-[12px] font-black text-white disabled:opacity-60"
                >
                  {isConnectingX ? <Loader2 className="h-4 w-4 animate-spin" /> : <Twitter className="h-4 w-4" />}
                  Connect X
                </button>
              </div>
            }
          />
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
                        {isYouTube ? compactNumber(account.view_count || 0) : profileStats.engagementRate}
                      </strong>
                      <span className="text-[10px] font-semibold text-[#758198]">{isYouTube ? "Views" : "Eng. Rate"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {youtubeAccount ? (
          <Panel className="p-5">
            <SectionTitle
              title="YouTube Analytics"
              right={
                <button
                  type="button"
                  onClick={refreshYouTube}
                  disabled={isRefreshingYouTube}
                  className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#ff2f2f] px-3 text-[12px] font-black text-white disabled:opacity-60"
                >
                  {isRefreshingYouTube ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                  Refresh Videos
                </button>
              }
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MetricTile value={compactNumber(youtubeAccount.youtube_short_video_count || 0)} label="Shorts" />
              <MetricTile value={compactNumber(youtubeAccount.youtube_long_video_count || 0)} label="Long Videos" />
              <MetricTile value={compactNumber(youtubeAccount.view_count || 0)} label="Total Views" />
              <MetricTile value={compactNumber(youtubeAccount.media_count || 0)} label="Videos" />
            </div>
            {youtubeAccount.youtube_videos?.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {youtubeAccount.youtube_videos.slice(0, 6).map((video) => (
                  <div key={video.video_id} className="overflow-hidden rounded-[6px] border border-[#dbe3ee] bg-white">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.video_id}`}
                      title={video.title}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                    <div className="p-3">
                      <p className="line-clamp-2 text-[13px] font-black text-[#25304a]">{video.title}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#64728c]">
                        {video.content_type === "SHORT" ? "Short" : "Long video"} • {compactNumber(video.view_count)} views • {compactNumber(video.like_count)} likes • {compactNumber(video.comment_count)} comments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[6px] border border-[#dbe3ee] bg-[#f8fbff] p-4 text-sm font-semibold text-[#64728c]">
                No YouTube videos stored yet. Click Refresh Videos, or reconnect YouTube if you recently added the analytics scope.
              </div>
            )}
          </Panel>
        ) : null}

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

      {isEditing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#111827]/50 p-4">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[8px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#e3e9f2] pb-4">
              <h2 className="text-xl font-black text-[#172554]">Update Profile</h2>
              <button type="button" onClick={() => setIsEditing(false)} className="grid h-9 w-9 place-items-center rounded-[6px] border border-[#dbe3ee]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Display name
                <input value={form.display_name} onChange={(event) => updateField("display_name", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Category
                <input value={form.category} onChange={(event) => updateField("category", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Location
                <input value={form.location} onChange={(event) => updateField("location", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Audience size
                <input type="number" min="0" value={form.audience_size} onChange={(event) => updateField("audience_size", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Minimum rate
                <input type="number" min="0" value={form.rate_min} onChange={(event) => updateField("rate_min", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Maximum rate
                <input type="number" min="0" value={form.rate_max} onChange={(event) => updateField("rate_max", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Languages
                <input value={form.languages} onChange={(event) => updateField("languages", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" placeholder="Hindi, English" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Collaboration preferences
                <input value={form.collaboration_preferences} onChange={(event) => updateField("collaboration_preferences", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" placeholder="Politics, Policy" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Response time
                <input value={form.preferred_response_time} onChange={(event) => updateField("preferred_response_time", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="grid gap-1 text-sm font-bold text-[#526079]">
                Portfolio URL
                <input value={form.portfolio_url} onChange={(event) => updateField("portfolio_url", event.target.value)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-3 font-semibold text-[#25304a]" />
              </label>
              <label className="md:col-span-2 grid gap-1 text-sm font-bold text-[#526079]">
                Bio
                <textarea value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={4} className="rounded-[6px] border border-[#dbe3ee] px-3 py-2 font-semibold text-[#25304a]" />
              </label>
              <label className="flex items-center gap-3 text-sm font-bold text-[#526079]">
                <input type="checkbox" checked={form.open_to_travel} onChange={(event) => updateField("open_to_travel", event.target.checked)} className="h-4 w-4 accent-[#1438c8]" />
                Open to travel
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-[#dbe3ee] px-4 py-3 text-sm font-black text-[#1438c8]">
                <Upload className="h-4 w-4" />
                {form.profile_image ? form.profile_image.name : "Upload profile image"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => updateField("profile_image", event.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditing(false)} className="h-11 rounded-[6px] border border-[#dbe3ee] px-5 text-sm font-black text-[#526079]">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-[6px] bg-[#1438c8] px-5 text-sm font-black text-white disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default CreatorProfile;
