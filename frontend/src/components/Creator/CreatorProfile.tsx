import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Instagram,
  Loader2,
  MapPin,
  Save,
  Twitter,
  Upload,
  UserRound,
  Youtube,
} from "lucide-react";
import {
  getFacebookConnectUrl,
  getCreatorProfile,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  updateCreatorProfile,
} from "../../lib/authApi";
import type { CreatorListPlatformApi, CreatorProfileApi, CreatorSocialPlatform } from "../../types";
import { AddressComposer, formatLocationParts, getLocationDisplayValue, parseLocationParts } from "../../pages/StepsCreatorRegister";

type EditForm = {
  category: string;
  location: string;
  languages: string;
  collaboration_preferences: string;
  work_with: string;
  bio: string;
  about: string;
  gender: string;
  is_profile_visible: boolean;
  profile_image: File | null;
};

const platformMeta: Record<CreatorSocialPlatform, { label: string; color: string; Icon: typeof Instagram }> = {
  INSTAGRAM: { label: "Instagram", color: "bg-[#e1306c]", Icon: Instagram },
  YOUTUBE: { label: "YouTube", color: "bg-[#ff0000]", Icon: Youtube },
  FACEBOOK: { label: "Facebook", color: "bg-[#1877f2]", Icon: Globe2 },
  X: { label: "X", color: "bg-[#111827]", Icon: Twitter },
};

function compactNumber(value?: number) {
  const safeValue = Number(value || 0);
  if (safeValue >= 1000000) return `${(safeValue / 1000000).toFixed(safeValue % 1000000 === 0 ? 0 : 1)}M`;
  if (safeValue >= 1000) return `${(safeValue / 1000).toFixed(safeValue % 1000 === 0 ? 0 : 1)}K`;
  return String(safeValue);
}

function listToCsv(value?: string[]) {
  return (value || []).join(", ");
}

function csvToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toEditForm(profile: CreatorProfileApi): EditForm {
  const location = profile.location || formatLocationParts({
    country: profile.country || "",
    state: profile.state || "",
    district: profile.district || "",
    city: profile.city || "",
    postalCode: profile.postalCode || "",
    streetAddress: profile.streetAddress || "",
  });
  return {
    category: profile.category || "",
    location,
    languages: listToCsv(profile.languages),
    collaboration_preferences: listToCsv(profile.collaboration_preferences),
    work_with: listToCsv(profile.work_with),
    bio: profile.bio || "",
    about: profile.about || "",
    gender: profile.gender || "",
    is_profile_visible: profile.is_profile_visible ?? true,
    profile_image: null,
  };
}

function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-[8px] border border-[#dce4f0] bg-white ${className}`}>{children}</section>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-black uppercase tracking-wide text-[#63708a]">{children}</span>;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm font-semibold text-[#25304a] outline-none focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="resize-none rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-sm font-semibold leading-relaxed text-[#25304a] outline-none focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      />
    </label>
  );
}

function getPlatformRows(profile: CreatorProfileApi): CreatorListPlatformApi[] {
  if (profile.platform_data?.length) return profile.platform_data;
  return (profile.social_accounts || []).map((account) => ({
    name: account.platform,
    followers: account.followers || 0,
    engagement_rate: account.engagement_rate,
    view_count: account.view_count,
    media_count: account.media_count,
  }));
}

export function CreatorProfile() {
  const [profile, setProfile] = useState<CreatorProfileApi | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    getCreatorProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toEditForm(data));

        const params = new URLSearchParams(window.location.search);
        const connected = ["instagram", "youtube", "facebook", "x"].find((key) => params.get(key) === "connected");
        const failed = ["instagram", "youtube", "facebook", "x"].find((key) => params.get(key) === "error");
        if (connected) setMessage(`${connected.toUpperCase()} connected.`);
        if (failed) setError(`${failed.toUpperCase()} connection failed. Please try again.`);
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

  const platformRows = useMemo(() => (profile ? getPlatformRows(profile) : []), [profile]);
  const totalFollowers = profile?.total_followers ?? platformRows.reduce((sum, item) => sum + (item.followers || 0), 0);
  const avatar = profile?.profile_image_url || profile?.profile_image || "";
  const publicProfileUrl = profile ? `/creators/${profile.creator_id}` : "";

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveProfile() {
    if (!form) return;
    setIsSaving(true);
    setError("");
    setMessage("");

    const body = new FormData();
    const address = parseLocationParts(form.location);
    body.append("category", form.category);
    body.append("location", form.location);
    body.append("country", address.country);
    body.append("state", address.state);
    body.append("district", address.district);
    body.append("city", address.city);
    body.append("postalCode", address.postalCode);
    body.append("streetAddress", address.streetAddress);
    body.append("languages", JSON.stringify(csvToList(form.languages)));
    body.append("collaboration_preferences", JSON.stringify(csvToList(form.collaboration_preferences)));
    body.append("work_with", JSON.stringify(csvToList(form.work_with)));
    body.append("bio", form.bio);
    body.append("about", form.about);
    body.append("gender", form.gender);
    body.append("is_profile_visible", String(form.is_profile_visible));
    if (form.profile_image) body.append("profile_image", form.profile_image);

    try {
      const updated = await updateCreatorProfile(body);
      setProfile(updated);
      setForm(toEditForm(updated));
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update creator profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function connectSocial(platform: "instagram" | "youtube" | "facebook" | "x") {
    setConnectingPlatform(platform);
    setError("");
    try {
      const response =
        platform === "instagram"
          ? await getInstagramConnectUrl()
          : platform === "youtube"
            ? await getYouTubeConnectUrl()
            : platform === "facebook"
              ? await getFacebookConnectUrl()
              : await getXConnectUrl();
      window.location.href = response.auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to connect ${platform}.`);
      setConnectingPlatform("");
    }
  }

  if (isLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[8px] border border-[#dce4f0] bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-[#2447bd]" />
      </div>
    );
  }

  if (!profile || !form) {
    return <Card className="p-6 text-sm font-semibold text-[#b42318]">{error || "No creator profile found."}</Card>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-3 text-[#25304a]">
      <div className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="grid gap-4">
          {error ? <div className="rounded-[6px] border border-[#f3b7b7] bg-[#fff5f5] px-4 py-3 text-sm font-semibold text-[#b42318]">{error}</div> : null}
          {message ? <div className="rounded-[6px] border border-[#b7ebca] bg-[#f0fff5] px-4 py-3 text-sm font-semibold text-[#067647]">{message}</div> : null}

          <Card className="overflow-hidden">
            <div className="bg-[#172554] px-6 py-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white/15">
                    {avatar ? <img src={avatar} alt={profile.display_name} className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8 text-white" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-black">{profile.display_name || "Creator"}</h1>
                    <p className="mt-1 text-sm font-semibold text-white/75">{form.category || "Category not added"} · {getLocationDisplayValue(form.location) || "Location not added"}</p>
                  </div>
                </div>
                <div className="rounded-[8px] bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => updateField("is_profile_visible", !form.is_profile_visible)}
                    className={`h-10 rounded-[6px] px-4 text-sm font-black ${form.is_profile_visible ? "bg-[#ddfbea] text-[#067647]" : "bg-[#fee4e2] text-[#b42318]"}`}
                  >
                    {form.is_profile_visible ? "Profile Visible" : "Profile Hidden"}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">Visibility</span>
                <p className="mt-2 text-sm font-semibold text-[#25304a]">
                  {form.is_profile_visible ? "Brands and visitors can discover this profile." : "This profile is hidden from public and brand discovery."}
                </p>
              </div>
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">Followers</span>
                <strong className="mt-2 block text-2xl font-black text-[#173ca8]">{compactNumber(totalFollowers)}</strong>
              </div>
              <div className="rounded-[8px] bg-[#eef4ff] p-4">
                <span className="text-xs font-black uppercase text-[#63708a]">Profile State</span>
                <strong className="mt-2 block text-lg font-black text-[#173ca8]">{profile.verified ? "Verified" : "Under Review"}</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5" id="profile">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#172554]">Profile data</h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">Only fields accepted by CreatorProfileView are editable here.</p>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[6px] border border-[#d7deea] bg-white px-3 text-sm font-black text-[#173ca8]">
                <Upload className="h-4 w-4" />
                {form.profile_image ? "Image selected" : "Profile image"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => updateField("profile_image", event.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextInput label="Category" value={form.category} onChange={(value) => updateField("category", value)} placeholder="Political Commentary" />
              <TextInput label="Languages" value={form.languages} onChange={(value) => updateField("languages", value)} placeholder="Hindi, English" />
              <TextInput label="Collaboration preferences" value={form.collaboration_preferences} onChange={(value) => updateField("collaboration_preferences", value)} placeholder="Sponsored Posts, UGC Content" />
            </div>
            <div className="mt-4">
              <AddressComposer location={form.location} onChange={(value) => updateField("location", value)} />
            </div>
          </Card>

          <Card className="p-5" id="content">
            <h2 className="text-xl font-black text-[#172554]">Content</h2>
            <div className="mt-5 grid gap-4">
              <TextArea label="Bio" value={form.bio} onChange={(value) => updateField("bio", value)} rows={4} placeholder="Short summary shown on your profile." />
              <TextArea label="About" value={form.about} onChange={(value) => updateField("about", value)} rows={6} placeholder="Longer profile story, audience, and content direction." />
            </div>
          </Card>

          <Card className="p-5" id="social">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#172554]">Social accounts</h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">Connected metrics are read from the backend profile response.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["instagram", "youtube", "facebook", "x"] as const).map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    disabled={Boolean(connectingPlatform)}
                    onClick={() => void connectSocial(platform)}
                    className="inline-flex h-9 items-center gap-2 rounded-[6px] bg-[#172554] px-3 text-xs font-black uppercase text-white disabled:opacity-60"
                  >
                    {connectingPlatform === platform ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Connect {platform}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {platformRows.length ? platformRows.map((item) => {
                const meta = platformMeta[item.name] || platformMeta.INSTAGRAM;
                const Icon = meta.Icon;
                return (
                  <div key={item.name} className="rounded-[6px] border border-[#dbe3ee] bg-[#fbfcff] p-4">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-[6px] text-white ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <strong className="text-sm font-black text-[#25304a]">{meta.label}</strong>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="block text-xs font-bold text-[#63708a]">Followers</span>
                        <strong className="text-lg font-black text-[#173ca8]">{compactNumber(item.followers)}</strong>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#63708a]">Engagement</span>
                        <strong className="text-lg font-black text-[#173ca8]">{Number(item.engagement_rate || 0).toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-[6px] border border-dashed border-[#cbd5e1] bg-[#fbfcff] p-5 text-sm font-semibold text-[#63708a] sm:col-span-2 lg:col-span-4">
                  No social accounts connected yet.
                </div>
              )}
            </div>
          </Card>
        </main>

        <aside className="xl:sticky xl:top-4 xl:h-fit" id="preview">
          <Card className="overflow-hidden">
            <div className="border-b border-[#e3e9f2] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#63708a]">Public preview</p>
                  <h2 className="mt-1 text-lg font-black text-[#172554]">How brands see you</h2>
                </div>
                <a
                  href={publicProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-[6px] border border-[#d7deea] text-[#173ca8]"
                  aria-label="Open public profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#eaf0ff]">
                  {avatar ? <img src={avatar} alt={profile.display_name} className="h-full w-full object-cover" /> : <UserRound className="m-5 h-10 w-10 text-[#173ca8]" />}
                  <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-white text-[#067647]">
                    {profile.verified ? <BadgeCheck className="h-5 w-5 fill-[#067647] text-white" /> : <Camera className="h-4 w-4" />}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-[#172554]">{profile.display_name || "Creator"}</h3>
                  <p className="mt-1 text-sm font-bold text-[#63708a]">{form.category || "Category not added"}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#63708a]">
                    <MapPin className="h-3.5 w-3.5" />
                    {getLocationDisplayValue(form.location) || "Location not added"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-[6px] bg-[#eef4ff] p-3 text-center">
                  <strong className="block text-lg font-black text-[#173ca8]">{compactNumber(totalFollowers)}</strong>
                  <span className="text-[10px] font-bold text-[#63708a]">Followers</span>
                </div>
                <div className="rounded-[6px] bg-[#eef4ff] p-3 text-center">
                  <strong className="block text-lg font-black text-[#173ca8]">{Number(profile.avg_eng_rate || 0).toFixed(1)}%</strong>
                  <span className="text-[10px] font-bold text-[#63708a]">Avg. Eng.</span>
                </div>
                <div className="rounded-[6px] bg-[#eef4ff] p-3 text-center">
                  <strong className="block text-lg font-black text-[#173ca8]">{compactNumber(profile.total_media_count)}</strong>
                  <span className="text-[10px] font-bold text-[#63708a]">Posts</span>
                </div>
              </div>

              <p className="mt-5 text-sm font-semibold leading-relaxed text-[#4b5873]">
                {form.bio || "Your bio preview will appear here."}
              </p>
              {form.about ? <p className="mt-3 text-sm leading-relaxed text-[#63708a]">{form.about}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ...csvToList(form.languages).slice(0, 3),
                  ...csvToList(form.collaboration_preferences).slice(0, 3),
                  ...csvToList(form.work_with).slice(0, 2),
                ].map((chip) => (
                  <span key={chip} className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#173ca8]">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-2">
                {platformRows.slice(0, 4).map((item) => {
                  const meta = platformMeta[item.name] || platformMeta.INSTAGRAM;
                  const Icon = meta.Icon;
                  return (
                    <div key={item.name} className="flex items-center justify-between rounded-[6px] border border-[#e3e9f2] px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-sm font-black text-[#25304a]">
                        <span className={`grid h-7 w-7 place-items-center rounded-[5px] text-white ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {meta.label}
                      </span>
                      <span className="text-sm font-black text-[#173ca8]">{compactNumber(item.followers)}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[#2447bd] text-sm font-black text-white disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Update Profile
              </button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default CreatorProfile;
