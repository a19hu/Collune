import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Linkedin,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { getBrandMe, updateBrandProfile } from "../../lib/authApi";
import type { BrandProfileApi } from "../../types";
import { showProjectToast } from "../../HtmlComponents/HtmlRoster";

type BrandProfileForm = {
  company_name: string;
  industry: string;
  website: string;
  company_size: string;
  linkedin_url: string;
  is_profile_visible: boolean;
  logo: File | null;
};

const industryOptions = ["Technology", "Consumer Brand", "Finance", "Education"];
const companySizeOptions = ["1-2", "2-10", "10-50", "50+"];

function toForm(profile: BrandProfileApi): BrandProfileForm {
  return {
    company_name: profile.company_name || "",
    industry: profile.industry || "",
    website: profile.website || "",
    company_size: profile.company_size || "",
    linkedin_url: profile.linkedin_url || "",
    is_profile_visible: profile.is_profile_visible ?? true,
    logo: null,
  };
}

function formatDate(value?: string) {
  if (!value) return "Recently updated";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently updated";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[10px] border border-[#dce4f0] bg-white ${className}`}>{children}</section>;
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7892]">{children}</span>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "url";
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-[8px] border border-[#d7deea] bg-white px-4 text-sm font-semibold text-[#25304a] outline-none transition focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-[8px] border border-[#d7deea] bg-white px-4 text-sm font-semibold text-[#25304a] outline-none transition focus:border-[#3659d7] focus:ring-4 focus:ring-[#3659d7]/10"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function BrandProfile() {
  const [profile, setProfile] = useState<BrandProfileApi | null>(null);
  const [form, setForm] = useState<BrandProfileForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    getBrandMe()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setForm(toForm(data));
        setLogoPreview(data.logo_url || "");
      })
      .catch((err: Error) => {
        if (mounted) showProjectToast("error", "Profile update failed", err.message);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!form?.logo) {
      setLogoPreview(profile?.logo_url || "");
      return;
    }

    const objectUrl = URL.createObjectURL(form.logo);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form?.logo, profile?.logo_url]);

  function updateField<K extends keyof BrandProfileForm>(key: K, value: BrandProfileForm[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    updateField("logo", file);
  }

  async function saveProfile() {
    if (!form) return;
    setIsSaving(true);

    const body = new FormData();
    body.append("company_name", form.company_name.trim());
    body.append("industry", form.industry.trim());
    body.append("website", normalizeUrl(form.website));
    body.append("company_size", form.company_size.trim());
    body.append("linkedin_url", normalizeUrl(form.linkedin_url));
    body.append("is_profile_visible", String(form.is_profile_visible));
    if (form.logo) body.append("logo", form.logo);

    try {
      const updated = await updateBrandProfile(body);
      setProfile(updated);
      setForm(toForm(updated));
      setLogoPreview(updated.logo_url || "");
      showProjectToast("success", "Profile updated", "Your brand profile has been saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update brand profile.";
      showProjectToast("error", "Profile update failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-[#3659d7]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-black">Loading brand profile...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile || !form) {
    return (
      <Card className="p-6">
        <p className="text-sm font-semibold text-[#b42318]">{"Brand profile is not available."}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#dfe7fb] bg-gradient-to-r from-[#eef4ff] via-[#f8fbff] to-[#e9f0ff] px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {logoPreview ? (
                  <img src={logoPreview} alt={profile.company_name} className="h-20 w-20 rounded-[18px] object-cover ring-4 ring-white" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-[18px] bg-[#1a43c5] text-2xl font-black text-white ring-4 ring-white">
                    {(form.company_name || profile.company_name || "BR").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#ddfbea] px-3 py-1 text-xs font-black text-[#067647]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.verification_status === "VERIFIED" ? "Verified Brand" : "Under Review"}
                  </div>
                  <h2 className="mt-3 break-words text-[28px] font-black leading-tight text-[#173ca8]">{form.company_name || "Your brand profile"}</h2>
                  <p className="mt-2 max-w-[540px] text-sm font-medium leading-relaxed text-[#62708a]">
                    Keep this profile polished so creators and your internal team always see accurate brand information.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 self-stretch rounded-[8px] bg-[#173fb5] px-5 text-sm font-black text-white transition hover:bg-[#11349b] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:self-auto"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <TextField
                label="Company Name"
                value={form.company_name}
                onChange={(value) => updateField("company_name", value)}
                placeholder="Your company name"
              />
              <SelectField
                label="Industry"
                value={form.industry}
                onChange={(value) => updateField("industry", value)}
                options={industryOptions}
                placeholder="Select industry"
              />
              <TextField
                label="Website"
                type="url"
                value={form.website}
                onChange={(value) => updateField("website", value)}
                placeholder="https://www.yourbrand.com"
              />
              <SelectField
                label="Company Size"
                value={form.company_size}
                onChange={(value) => updateField("company_size", value)}
                options={companySizeOptions}
                placeholder="Select company size"
              />
            </div>

            <TextField
              label="LinkedIn Company Page"
              type="url"
              value={form.linkedin_url}
              onChange={(value) => updateField("linkedin_url", value)}
              placeholder="https://linkedin.com/company/your-brand"
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <label className="grid gap-2">
                <Label>Brand Logo</Label>
                <div className="relative flex min-h-[136px] items-center justify-center rounded-[10px] border-2 border-dashed border-[#d7deea] bg-[#f9fbff] px-6 text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    onChange={onLogoChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Upload brand logo"
                  />
                  <div>
                    <Upload className="mx-auto h-7 w-7 text-[#6f7da0]" />
                    <p className="mt-3 text-sm font-black text-[#21314f]">{form.logo ? form.logo.name : "Upload a square logo"}</p>
                    <p className="mt-1 text-xs font-medium text-[#73819b]">PNG, JPG, or WebP works best.</p>
                  </div>
                </div>
              </label>

              <button
                type="button"
                onClick={() => updateField("is_profile_visible", !form.is_profile_visible)}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-black ${form.is_profile_visible ? "bg-[#ddfbea] text-[#067647]" : "bg-[#fee4e2] text-[#b42318]"}`}
              >
                {form.is_profile_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {form.is_profile_visible ? "Profile Visible" : "Profile Hidden"}
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7892]">Profile Health</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <strong className="block text-[42px] font-black leading-none text-[#173ca8]">{profile.profile_completion ?? 0}%</strong>
                <p className="mt-2 text-sm font-medium text-[#62708a]">Completion score based on your main brand details.</p>
              </div>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eef3ff] text-[#3659d7]">
                <Sparkles className="h-7 w-7" />
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8eefc]">
              <div className="h-full rounded-full bg-[#3659d7]" style={{ width: `${profile.profile_completion ?? 0}%` }} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7892]">Quick Snapshot</p>
            <div className="mt-5 grid gap-4">
              <div className="flex items-start gap-3 rounded-[10px] bg-[#f8faff] p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef3ff] text-[#3659d7]"><Building2 className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#7b879e]">Industry</p>
                  <p className="mt-1 text-sm font-bold text-[#1d203a]">{form.industry || "Not selected yet"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[10px] bg-[#f8faff] p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef3ff] text-[#3659d7]"><CalendarDays className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#7b879e]">Last Updated</p>
                  <p className="mt-1 text-sm font-bold text-[#1d203a]">{formatDate(profile.updated_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[10px] bg-[#f8faff] p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef3ff] text-[#3659d7]">
                  {form.is_profile_visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#7b879e]">Visibility</p>
                  <p className="mt-1 text-sm font-bold text-[#1d203a]">{form.is_profile_visible ? "Visible to creators and visitors" : "Hidden from public discovery"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7892]">External Links</p>
            <div className="mt-4 grid gap-3">
              <a
                href={normalizeUrl(form.website) || "#"}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-between rounded-[10px] border px-4 py-3 text-sm font-black ${form.website ? "border-[#dce4f0] text-[#173ca8] hover:bg-[#f8faff]" : "border-[#eef2fb] text-[#98a2b3]"}`}
              >
                <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4" /> Website</span>
                <span>{form.website ? "Open" : "Add link"}</span>
              </a>
              <a
                href={normalizeUrl(form.linkedin_url) || "#"}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-between rounded-[10px] border px-4 py-3 text-sm font-black ${form.linkedin_url ? "border-[#dce4f0] text-[#173ca8] hover:bg-[#f8faff]" : "border-[#eef2fb] text-[#98a2b3]"}`}
              >
                <span className="inline-flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</span>
                <span>{form.linkedin_url ? "Open" : "Add link"}</span>
              </a>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6b7892]">Creator Readiness</p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[#62708a]">
              Complete your company details, keep your logo current, and leave your profile visible so creators can trust your brand faster.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-[8px] bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#2647be]">
              <BadgeCheck className="h-4 w-4" />
              Verified brands usually convert better with a polished profile.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
