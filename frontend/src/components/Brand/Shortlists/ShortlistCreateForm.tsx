import { useEffect, useState, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { createBrandShortlist, getBrandShortlist, updateBrandShortlist } from "../../../lib/authApi";
import type { BrandShortlistPayload } from "../../../types";
import { CampaignPanel, CampaignSection, SelectInput, TextArea, TextInput } from "../Campaigns/CampaignUi";

type ShortlistFormState = {
  title: string;
  purpose: string;
  notes: string;
  platforms: string[];
  categories: string;
  audience: string;
  budget_range: string;
  timeline: string;
};

const initialForm: ShortlistFormState = {
  title: "",
  purpose: "",
  notes: "",
  platforms: [],
  categories: "",
  audience: "",
  budget_range: "",
  timeline: "",
};

const platformOptions = ["INSTAGRAM", "YOUTUBE", "LINKEDIN"];
const categoryOptions = ["Business", "Finance", "Education", "Lifestyle", "Fashion", "Beauty", "Technology", "Travel"];
const audienceOptions = ["Students", "Young professionals", "Parents", "Founders", "Creators", "Finance enthusiasts"];
const budgetRanges = ["$1K - $5K", "$5K - $10K", "$10K - $50K", "$50K+"];

function mapPayloadToForm(shortlist: BrandShortlistPayload): ShortlistFormState {
  return {
    title: shortlist.title || "",
    purpose: shortlist.purpose || "",
    notes: shortlist.notes || "",
    platforms: shortlist.platforms || [],
    categories: shortlist.categories || "",
    audience: shortlist.audience || "",
    budget_range: shortlist.budget_range || "",
    timeline: shortlist.timeline || "",
  };
}

function buildPayload(form: ShortlistFormState): BrandShortlistPayload {
  return {
    title: form.title.trim(),
    status: "DRAFT",
    purpose: form.purpose.trim(),
    notes: form.notes.trim(),
    platforms: form.platforms,
    categories: form.categories,
    audience: form.audience,
    budget_range: form.budget_range,
    timeline: form.timeline,
    creators: [],
  };
}

export function ShortlistCreateForm() {
  const { shortlistId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(shortlistId);
  const [form, setForm] = useState<ShortlistFormState>(initialForm);
  const [creatorIds, setCreatorIds] = useState<string[]>([]);
  const [status, setStatus] = useState<BrandShortlistPayload["status"]>("DRAFT");
  const [isLoading, setIsLoading] = useState(Boolean(shortlistId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shortlistId) return;
    let mounted = true;
    setIsLoading(true);
    setError("");

    getBrandShortlist(shortlistId)
      .then((shortlist) => {
        if (!mounted) return;
        setForm(mapPayloadToForm(shortlist));
        setCreatorIds(shortlist.creators || []);
        setStatus(shortlist.status);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load shortlist.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [shortlistId]);

  const onFieldChange = (field: keyof ShortlistFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const togglePlatform = (platform: string) => {
    setError("");
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  };

  const submitShortlist = async () => {
    if (!form.title.trim()) {
      setError("Shortlist name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const payload = buildPayload(form);
      if (shortlistId) {
        await updateBrandShortlist(shortlistId, { ...payload, status, creators: creatorIds });
        navigate(`/brand/shortlists/${shortlistId}`);
      } else {
        const created = await createBrandShortlist(payload);
        navigate(`/brand/shortlists/${created.shortlist_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shortlist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto grid gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        void submitShortlist();
      }}
    >
      {isLoading ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">Loading shortlist...</CampaignPanel>
      ) : null}

      <CampaignSection index={1} title="Shortlist Title" copy="Give this creator shortlist a clear name.">
        <TextInput label="Shortlist Name" required placeholder="Enter shortlist name" value={form.title} onChange={onFieldChange("title")} />
      </CampaignSection>

      <CampaignSection index={2} title="Shortlist Description" copy="Share the creator brief and notes for Collune.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="Purpose" required placeholder="Describe the type of creators you want Collune to reach out to." value={form.purpose} onChange={onFieldChange("purpose")} />
          <TextArea label="Notes for Collune" placeholder="Add any internal notes or creator preferences." value={form.notes} onChange={onFieldChange("notes")} />
        </div>
      </CampaignSection>

      <CampaignSection index={3} title="Platform Selection" copy="Select platforms for this shortlist.">
        <div className="flex flex-wrap gap-3">
          {platformOptions.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => togglePlatform(platform)}
              className={`h-11 rounded-lg border px-5 text-sm font-black ${form.platforms.includes(platform) ? "border-[#4b22ff] bg-[#f0eaff] text-[#4b22ff]" : "border-[#dce5f2] bg-white text-[#63728a]"}`}
            >
              {platform}
            </button>
          ))}
        </div>
      </CampaignSection>

      <CampaignSection index={4} title="Creator Requirements" copy="Tell us what kind of creators this shortlist should contain.">
        <div className="grid gap-5 md:grid-cols-3">
          <SelectInput label="Categories" required placeholder="Select category" value={form.categories} onChange={onFieldChange("categories")} options={categoryOptions} />
          <SelectInput label="Audience" required placeholder="Select audience" value={form.audience} onChange={onFieldChange("audience")} options={audienceOptions} />
          <SelectInput label="Budget Range" placeholder="Select budget range" value={form.budget_range} onChange={onFieldChange("budget_range")} options={budgetRanges} />
          <TextInput label="Campaign Timeline" placeholder="e.g. Jun 20, 2025 - Jul 20, 2025" value={form.timeline} onChange={onFieldChange("timeline")} />
        </div>
      </CampaignSection>

      <CampaignSection index={5} title={isEditing ? "Save Shortlist" : "Create Shortlist"} copy={isEditing ? "Save your changes to update this shortlist." : "Create this shortlist, then add creators from the detail page."}>
        {error ? <p className="mb-5 rounded-lg bg-[#ffe9e9] px-4 py-3 text-sm font-semibold text-[#d23b3b]">{error}</p> : null}
        <button type="submit" disabled={isSubmitting || isLoading} className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#4b22ff] px-10 text-sm font-black text-white shadow-[0_12px_20px_rgba(75,34,255,0.18)] disabled:cursor-not-allowed disabled:opacity-70">
          <Send className="h-5 w-5" />
          {isSubmitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Shortlist" : "Create Shortlist")}
        </button>
      </CampaignSection>
    </form>
  );
}
