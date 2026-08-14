import { useEffect, useState, type ChangeEvent } from "react";
import { Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { createBrandShortlist, getBrandShortlist, getCreatorsList, updateBrandShortlist } from "../../../lib/authApi";
import type { BrandShortlistPayload, BrandShortlistStatusApi, CreatorListItemApi } from "../../../types";
import { CampaignPanel, CampaignSection, SelectInput, TextArea, TextInput } from "../Campaigns/CampaignUi";
import { PlatformSelector } from "../Campaigns/CampaignCreateForm";
import { showProjectToast } from "../../../HtmlComponents/HtmlRoster";

type ShortlistFormState = {
  title: string;
  purpose: string;
  notes: string;
  platforms: string[];
  categories: string;
  audience: string;
  budget_range: string;
  start_date: string;
  end_date: string;
};

const initialForm: ShortlistFormState = {
  title: "",
  purpose: "",
  notes: "",
  platforms: [],
  categories: "",
  audience: "",
  budget_range: "",
  start_date: "",
  end_date: "",
};

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
    start_date: shortlist.timeline?.split(" - ")[0] || "",
    end_date: shortlist.timeline?.split(" - ")[1] || "",
  };
}

function buildPayload(form: ShortlistFormState, status: BrandShortlistStatusApi, creatorIds: string[]): BrandShortlistPayload {
  const timeline = [form.start_date, form.end_date].filter(Boolean).join(" - ");
  return {
    title: form.title.trim(),
    status,
    purpose: form.purpose.trim(),
    notes: form.notes.trim(),
    platforms: form.platforms,
    categories: form.categories,
    audience: form.audience,
    budget_range: form.budget_range,
    timeline,
    creators: creatorIds,
  };
}

export function ShortlistCreateForm() {
  const { shortlistId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(shortlistId);
  const [form, setForm] = useState<ShortlistFormState>(initialForm);
  const [creatorIds, setCreatorIds] = useState<string[]>([]);
  const [status, setStatus] = useState<BrandShortlistPayload["status"]>("DRAFT");
  const [creators, setCreators] = useState<CreatorListItemApi[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [isLoading, setIsLoading] = useState(Boolean(shortlistId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoadingCreators(true);
    getCreatorsList()
      .then((items) => {
        if (mounted) setCreators(items);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load creators.");
      })
      .finally(() => {
        if (mounted) setIsLoadingCreators(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  const toggleCreator = (creatorId: string) => {
    setError("");
    setCreatorIds((current) => (
      current.includes(creatorId)
        ? current.filter((item) => item !== creatorId)
        : [...current, creatorId]
    ));
  };

  const submitShortlist = async () => {
    if (!form.title.trim()) {
      setError("Shortlist name is required.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const payload = buildPayload(form, status || "DRAFT", creatorIds);
      if (shortlistId) {
        await updateBrandShortlist(shortlistId, payload);
        showProjectToast("success", "Shortlist updated", "Your shortlist changes have been saved.");
        navigate(`/brand/shortlists/${shortlistId}`);
      } else {
        const created = await createBrandShortlist(payload);
        showProjectToast("success", "Shortlist created", "Your shortlist has been created.");
        navigate(`/brand/shortlists/${created.shortlist_id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save shortlist.";
      setError(message);
      showProjectToast("error", "Shortlist save failed", message);
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

      <CampaignSection index={3} title="Platform Selection" copy="Select the platforms where you want this campaign to be active.">
        <PlatformSelector selected={form.platforms} onToggle={togglePlatform} />
      </CampaignSection>

      <CampaignSection index={4} title="Creator Requirements" copy="Tell us what kind of creators this shortlist should contain.">
        <div className="grid gap-5 md:grid-cols-3">
          <SelectInput label="Categories" required placeholder="Select category" value={form.categories} onChange={onFieldChange("categories")} options={categoryOptions} />
          <SelectInput label="Audience" required placeholder="Select audience" value={form.audience} onChange={onFieldChange("audience")} options={audienceOptions} />
          <SelectInput label="Budget Range" placeholder="Select budget range" value={form.budget_range} onChange={onFieldChange("budget_range")} options={budgetRanges} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Start Date" required placeholder="Start date" type="date" value={form.start_date} onChange={onFieldChange("start_date")} />
            <TextInput label="End Date" required placeholder="End date" type="date" value={form.end_date} onChange={onFieldChange("end_date")} />
          </div>
        </div>
      </CampaignSection>

      <CampaignSection index={5} title="Shortlist Creators" copy="Choose creators to save in this shortlist now.">
        {isLoadingCreators ? (
          <p className="text-sm font-black text-[#63728a]">Loading creators...</p>
        ) : creators.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {creators.map((creator) => {
              const selected = creatorIds.includes(creator.creator_id);
              return (
                <button
                  key={creator.creator_id}
                  type="button"
                  onClick={() => toggleCreator(creator.creator_id)}
                  className={`flex min-h-20 items-center gap-3 rounded-lg border p-4 text-left transition ${selected ? "border-[#4b22ff] bg-[#f0eaff]" : "border-[#dce5f2] bg-white"}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#173ca8] text-sm font-black text-white">
                    {(creator.display_name || "C").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-black text-[#1d2430]">{creator.display_name}</strong>
                    <span className="mt-1 block truncate text-xs font-semibold text-[#7d8aa0]">
                      {creator.category || "Creator"} • {creator.total_followers || 0} followers
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-black text-[#63728a]">No creators found.</p>
        )}
      </CampaignSection>

      <CampaignSection index={6} title={isEditing ? "Save Shortlist" : "Create Shortlist"} copy={isEditing ? "Save your changes to update this shortlist." : "Create this shortlist with selected creators and status."}>
        <div className="mb-5 max-w-xs">
          <SelectInput
            label="Shortlist Status"
            required
            placeholder="Select status"
            value={status}
            onChange={(event) => setStatus(event.target.value as BrandShortlistStatusApi)}
            options={["DRAFT", "SUBMITTED"]}
          />
        </div>
        {error ? <p className="mb-5 rounded-lg bg-[#ffe9e9] px-4 py-3 text-sm font-semibold text-[#d23b3b]">{error}</p> : null}
        <button type="submit" disabled={isSubmitting || isLoading || isLoadingCreators} className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#4b22ff] px-10 text-sm font-black text-white shadow-[0_12px_20px_rgba(75,34,255,0.18)] disabled:cursor-not-allowed disabled:opacity-70">
          <Send className="h-5 w-5" />
          {isSubmitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Shortlist" : "Create Shortlist")}
        </button>
      </CampaignSection>
    </form>
  );
}
