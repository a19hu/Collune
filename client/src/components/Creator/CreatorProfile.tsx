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
  Trash2,
  Twitter,
  Upload,
  UserRound,
  Youtube,
} from "lucide-react";
import {
  getFacebookConnectUrl,
  getCreatorProfile,
  createCreatorPortfolio,
  createCreatorPricing,
  deleteCreatorPortfolio,
  deleteCreatorPricing,
  getCreatorPortfolio,
  getCreatorPricing,
  getInstagramConnectUrl,
  getXConnectUrl,
  getYouTubeConnectUrl,
  updateCreatorProfile,
  updateCreatorPortfolio,
  updateCreatorPricing,
} from "../../lib/authApi";
import type { CreatorListPlatformApi, CreatorPortfolioApi, CreatorProfileApi, CreatorSocialMediaPricingApi, CreatorSocialPlatform } from "../../types";
import { AddressComposer, formatLocationParts, getLocationDisplayValue, parseLocationParts } from "../../pages/StepsCreatorRegister";
import { showProjectToast } from "../../HtmlComponents/HtmlRoster";

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

type NewPortfolioForm = { title: string; sub_title: string; link: string; image: File | null; video: File | null };
type NewPricingForm = Omit<CreatorSocialMediaPricingApi, "id">;

const emptyPortfolioForm: NewPortfolioForm = { title: "", sub_title: "", link: "", image: null, video: null };
const emptyPricingForm: NewPricingForm = { social_media_name: "", social_media_pricing: 0, is_visible: false };

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
  const [portfolio, setPortfolio] = useState<CreatorPortfolioApi[]>([]);
  const [pricing, setPricing] = useState<CreatorSocialMediaPricingApi[]>([]);
  const [newPortfolio, setNewPortfolio] = useState<NewPortfolioForm>(emptyPortfolioForm);
  const [newPricing, setNewPricing] = useState<NewPricingForm>(emptyPricingForm);
  const [portfolioMediaUpdates, setPortfolioMediaUpdates] = useState<Record<string, { image: File | null; video: File | null }>>({});
  const [isManagingPortfolio, setIsManagingPortfolio] = useState(false);
  const [isManagingPricing, setIsManagingPricing] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    Promise.all([getCreatorProfile(), getCreatorPortfolio(), getCreatorPricing()])
      .then(([data, portfolioItems, pricingItems]) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toEditForm(data));
        setPortfolio(portfolioItems);
        setPricing(pricingItems);

        const params = new URLSearchParams(window.location.search);
        const connected = ["instagram", "youtube", "facebook", "x"].find((key) => params.get(key) === "connected");
        const failed = ["instagram", "youtube", "facebook", "x"].find((key) => params.get(key) === "error");
        if (connected) {
          setMessage(`${connected.toUpperCase()} connected.`);
          showProjectToast("success", "Platform connected", `${connected.toUpperCase()} connected successfully.`);
        }
        if (failed) {
          const message = `${failed.toUpperCase()} connection failed. Please try again.`;
          setError(message);
          showProjectToast("error", "Connection failed", message);
        }
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

  useEffect(() => {
    const section = window.location.hash.slice(1);
    if (!section) return;
    const timer = window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(section);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const platformRows = useMemo(() => (profile ? getPlatformRows(profile) : []), [profile]);
  const totalFollowers = profile?.total_followers ?? platformRows.reduce((sum, item) => sum + (item.followers || 0), 0);
  const avatar = profile?.profile_image_url || profile?.profile_image || "";
  const publicProfileUrl = profile ? `/creators/${profile.creator_id}` : "";

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function goToSection(section: string) {
    setActiveSection(section);
    window.history.replaceState(null, "", `#${section}`);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      showProjectToast("success", "Profile updated", "Your creator profile has been saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update creator profile.";
      setError(message);
      showProjectToast("error", "Profile update failed", message);
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
      const message = err instanceof Error ? err.message : `Unable to connect ${platform}.`;
      setError(message);
      showProjectToast("error", "Connection failed", message);
      setConnectingPlatform("");
    }
  }

  async function addPortfolio() {
    if (!newPortfolio.title.trim() && !newPortfolio.image && !newPortfolio.video && !newPortfolio.link.trim()) return;
    setIsManagingPortfolio(true);
    try {
      const body = new FormData();
      body.append("title", newPortfolio.title);
      body.append("sub_title", newPortfolio.sub_title);
      body.append("link", newPortfolio.link);
      if (newPortfolio.image) body.append("image", newPortfolio.image);
      if (newPortfolio.video) body.append("video", newPortfolio.video);
      const item = await createCreatorPortfolio(body);
      setPortfolio((current) => [item, ...current]);
      setNewPortfolio(emptyPortfolioForm);
      showProjectToast("success", "Portfolio item added", "Your work is ready for your public profile.");
    } catch (err) {
      showProjectToast("error", "Could not add portfolio item", err instanceof Error ? err.message : "Please try again.");
    } finally { setIsManagingPortfolio(false); }
  }

  async function savePortfolioItem(item: CreatorPortfolioApi) {
    setIsManagingPortfolio(true);
    try {
      const body = new FormData();
      body.append("title", item.title);
      body.append("sub_title", item.sub_title);
      body.append("link", item.link);
      const mediaUpdate = portfolioMediaUpdates[item.id];
      if (mediaUpdate?.image) body.append("image", mediaUpdate.image);
      if (mediaUpdate?.video) body.append("video", mediaUpdate.video);
      const updated = await updateCreatorPortfolio(item.id, body);
      setPortfolio((current) => current.map((value) => value.id === updated.id ? updated : value));
      setPortfolioMediaUpdates((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
      showProjectToast("success", "Portfolio item updated", "Changes saved.");
    } catch (err) { showProjectToast("error", "Could not update portfolio", err instanceof Error ? err.message : "Please try again."); }
    finally { setIsManagingPortfolio(false); }
  }

  async function removePortfolioItem(id: string) {
    setIsManagingPortfolio(true);
    try { await deleteCreatorPortfolio(id); setPortfolio((current) => current.filter((item) => item.id !== id)); }
    catch (err) { showProjectToast("error", "Could not delete portfolio item", err instanceof Error ? err.message : "Please try again."); }
    finally { setIsManagingPortfolio(false); }
  }

  async function addPricing() {
    if (!newPricing.social_media_name.trim()) return;
    setIsManagingPricing(true);
    try {
      const item = await createCreatorPricing({ ...newPricing, social_media_pricing: Number(newPricing.social_media_pricing) || 0 });
      setPricing((current) => [...current, item]); setNewPricing(emptyPricingForm);
    } catch (err) { showProjectToast("error", "Could not add pricing", err instanceof Error ? err.message : "Please try again."); }
    finally { setIsManagingPricing(false); }
  }

  async function savePricingItem(item: CreatorSocialMediaPricingApi) {
    setIsManagingPricing(true);
    try {
      const updated = await updateCreatorPricing(item.id, { social_media_name: item.social_media_name, social_media_pricing: Number(item.social_media_pricing) || 0, is_visible: item.is_visible });
      setPricing((current) => current.map((value) => value.id === updated.id ? updated : value));
    } catch (err) { showProjectToast("error", "Could not update pricing", err instanceof Error ? err.message : "Please try again."); }
    finally { setIsManagingPricing(false); }
  }

  async function removePricingItem(id: string) {
    setIsManagingPricing(true);
    try { await deleteCreatorPricing(id); setPricing((current) => current.filter((item) => item.id !== id)); }
    catch (err) { showProjectToast("error", "Could not delete pricing", err instanceof Error ? err.message : "Please try again."); }
    finally { setIsManagingPricing(false); }
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

          <nav className="sticky top-3 z-10 overflow-x-auto rounded-[8px] border border-[#dce4f0] bg-white p-2 shadow-sm" aria-label="Creator profile sections">
            <div className="flex min-w-max gap-1">
              {[
                ["profile", "Profile"],
                ["content", "Content"],
                ["social", "Social Accounts"],
                ["portfolio", "Portfolio"],
                ["pricing", "Pricing"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToSection(id)}
                  className={`rounded-[6px] px-4 py-2 text-sm font-black transition ${activeSection === id ? "bg-[#173ca8] text-white shadow-sm" : "text-[#63708a] hover:bg-[#eef4ff] hover:text-[#173ca8]"}`}
                >
                  {label}
                  {id === "portfolio" && portfolio.length ? <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${activeSection === id ? "bg-white/20" : "bg-[#dce7ff] text-[#173ca8]"}`}>{portfolio.length}</span> : null}
                  {id === "pricing" && pricing.length ? <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${activeSection === id ? "bg-white/20" : "bg-[#dce7ff] text-[#173ca8]"}`}>{pricing.length}</span> : null}
                </button>
              ))}
            </div>
          </nav>

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

          <Card className="p-5" id="contact">
            <h2 className="text-xl font-black text-[#172554]">Contact Information</h2>
            <p className="mt-1 text-sm font-semibold text-[#63708a]">These details come from the account used to register your creator profile.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Contact Person", profile.contact_person_name],
                ["Work Email", profile.work_email],
                ["Phone Number", profile.contact_phone],
                ["WhatsApp Number", profile.whatsapp_number],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-2">
                  <FieldLabel>{label}</FieldLabel>
                  <p className="min-h-11 rounded-md border border-[#d7deea] bg-[#f8faff] px-3 py-2.5 text-sm font-semibold text-[#25304a]">{value || "Not provided"}</p>
                </div>
              ))}
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

          <Card className="p-5" id="portfolio">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#172554]">Portfolio</h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">Add work samples that appear on your public profile.</p>
              </div>
              <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#173ca8]">{portfolio.length} item{portfolio.length === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-5 grid gap-3 rounded-[6px] bg-[#f8faff] p-4 md:grid-cols-2">
              <TextInput label="Title" value={newPortfolio.title} onChange={(title) => setNewPortfolio((value) => ({ ...value, title }))} placeholder="Campaign title" />
              <TextInput label="Subtitle" value={newPortfolio.sub_title} onChange={(sub_title) => setNewPortfolio((value) => ({ ...value, sub_title }))} placeholder="Brand or campaign" />
              <TextInput label="External link" value={newPortfolio.link} onChange={(link) => setNewPortfolio((value) => ({ ...value, link }))} placeholder="https://..." />
              <div className="grid gap-2">
                <FieldLabel>Media</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-xs font-black text-[#173ca8]">Image<input type="file" accept="image/*" className="hidden" onChange={(event) => setNewPortfolio((value) => ({ ...value, image: event.target.files?.[0] || null }))} /></label>
                  <label className="cursor-pointer rounded-[6px] border border-[#d7deea] bg-white px-3 py-2 text-xs font-black text-[#173ca8]">Video<input type="file" accept=".mp4,.mov,.avi,.webm,video/*" className="hidden" onChange={(event) => setNewPortfolio((value) => ({ ...value, video: event.target.files?.[0] || null }))} /></label>
                  <span className="self-center text-xs font-semibold text-[#63708a]">{newPortfolio.image?.name || newPortfolio.video?.name || "Optional"}</span>
                </div>
              </div>
              <button type="button" onClick={() => void addPortfolio()} disabled={isManagingPortfolio} className="h-11 self-end rounded-[6px] bg-[#2447bd] px-4 text-sm font-black text-white disabled:opacity-60">Add portfolio item</button>
            </div>
            <div className="mt-4 grid gap-3">
              {portfolio.length ? portfolio.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-[6px] border border-[#dbe3ee] p-4 md:grid-cols-[96px_1fr_auto]">
                  <div className="aspect-square overflow-hidden rounded-[5px] bg-[#eef4ff]">{item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" /> : item.video_url ? <video src={item.video_url} className="h-full w-full object-cover" muted /> : null}</div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input value={item.title} onChange={(event) => setPortfolio((current) => current.map((value) => value.id === item.id ? { ...value, title: event.target.value } : value))} aria-label="Portfolio title" className="h-10 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
                    <input value={item.sub_title} onChange={(event) => setPortfolio((current) => current.map((value) => value.id === item.id ? { ...value, sub_title: event.target.value } : value))} aria-label="Portfolio subtitle" className="h-10 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
                    <input value={item.link} onChange={(event) => setPortfolio((current) => current.map((value) => value.id === item.id ? { ...value, link: event.target.value } : value))} aria-label="Portfolio link" className="h-10 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
                    <label className="cursor-pointer rounded-[6px] border border-dashed border-[#b8c7e2] px-3 py-2 text-xs font-bold text-[#173ca8]">Replace image<input type="file" accept="image/*" className="hidden" onChange={(event) => setPortfolioMediaUpdates((current) => ({ ...current, [item.id]: { image: event.target.files?.[0] || null, video: null } }))} /></label>
                    <label className="cursor-pointer rounded-[6px] border border-dashed border-[#b8c7e2] px-3 py-2 text-xs font-bold text-[#173ca8]">Replace video<input type="file" accept=".mp4,.mov,.avi,.webm,video/*" className="hidden" onChange={(event) => setPortfolioMediaUpdates((current) => ({ ...current, [item.id]: { image: null, video: event.target.files?.[0] || null } }))} /></label>
                    {portfolioMediaUpdates[item.id]?.image || portfolioMediaUpdates[item.id]?.video ? <span className="self-center text-xs font-semibold text-[#067647]">New media selected</span> : null}
                  </div>
                  <div className="flex gap-2"><button type="button" onClick={() => void savePortfolioItem(item)} disabled={isManagingPortfolio} className="rounded-[6px] border border-[#c9d7ff] px-3 text-xs font-black text-[#173ca8]">Save</button><button type="button" onClick={() => void removePortfolioItem(item.id)} disabled={isManagingPortfolio} className="rounded-[6px] border border-[#f5c2c7] px-3 text-[#b42318]"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              )) : <p className="text-sm font-semibold text-[#63708a]">No portfolio items yet.</p>}
            </div>
          </Card>

          <Card className="p-5" id="pricing">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-[#172554]">Social media pricing</h2>
                <p className="mt-1 text-sm font-semibold text-[#63708a]">Toggle visibility to control which rates are shown publicly.</p>
              </div>
              <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#173ca8]">{pricing.filter((item) => item.is_visible).length} public</span>
            </div>
            <div className="mt-5 grid gap-3 rounded-[6px] bg-[#f8faff] p-4 md:grid-cols-[1fr_180px_auto_auto]">
              <input value={newPricing.social_media_name} onChange={(event) => setNewPricing((value) => ({ ...value, social_media_name: event.target.value }))} placeholder="Instagram Reel" className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
              <input type="number" min="0" value={newPricing.social_media_pricing} onChange={(event) => setNewPricing((value) => ({ ...value, social_media_pricing: Number(event.target.value) }))} placeholder="Price" className="h-11 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
              <label className="inline-flex items-center gap-2 text-sm font-bold text-[#25304a]"><input type="checkbox" checked={newPricing.is_visible} onChange={(event) => setNewPricing((value) => ({ ...value, is_visible: event.target.checked }))} /> Visible publicly</label>
              <button type="button" onClick={() => void addPricing()} disabled={isManagingPricing} className="h-11 rounded-[6px] bg-[#2447bd] px-4 text-sm font-black text-white disabled:opacity-60">Add price</button>
            </div>
            <div className="mt-4 grid gap-3">
              {pricing.length ? pricing.map((item) => <div key={item.id} className="grid items-center gap-3 rounded-[6px] border border-[#dbe3ee] p-4 md:grid-cols-[1fr_180px_auto_auto]">
                <input value={item.social_media_name} onChange={(event) => setPricing((current) => current.map((value) => value.id === item.id ? { ...value, social_media_name: event.target.value } : value))} className="h-10 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
                <input type="number" min="0" value={item.social_media_pricing} onChange={(event) => setPricing((current) => current.map((value) => value.id === item.id ? { ...value, social_media_pricing: Number(event.target.value) } : value))} className="h-10 rounded-[6px] border border-[#d7deea] px-3 text-sm" />
                <label className="inline-flex items-center gap-2 text-sm font-bold text-[#25304a]"><input type="checkbox" checked={item.is_visible} onChange={(event) => setPricing((current) => current.map((value) => value.id === item.id ? { ...value, is_visible: event.target.checked } : value))} /> Visible</label>
                <div className="flex gap-2"><button type="button" onClick={() => void savePricingItem(item)} disabled={isManagingPricing} className="rounded-[6px] border border-[#c9d7ff] px-3 py-2 text-xs font-black text-[#173ca8]">Save</button><button type="button" onClick={() => void removePricingItem(item.id)} disabled={isManagingPricing} className="rounded-[6px] border border-[#f5c2c7] px-3 text-[#b42318]"><Trash2 className="h-4 w-4" /></button></div>
              </div>) : <p className="text-sm font-semibold text-[#63708a]">No pricing entries yet.</p>}
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
