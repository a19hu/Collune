import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Boxes, Eye, Instagram, Megaphone, Radio, Star, Youtube } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { CampaignPanel, CampaignSection, SelectInput, TextArea, TextInput, UploadBox } from "./CampaignUi";
import { deliverablePrices, platforms } from "./campaignData";
import { createCampaign, getBrandCampaignDetail, reviewCampaign, updateBrandCampaign } from "../../../lib/authApi";
import type { BrandCampaignDetailApi, CampaignPayload, CampaignReviewResponse } from "../../../types";
import { RegisterError } from "../../../HtmlComponents/RegisterFormParts";

type CampaignFormState = Omit<CampaignPayload, "minimum_followers" | "deliverable_pricing" | "platforms"> & {
  minimum_followers: string;
  platforms: string[];
  deliverable_pricing: Record<string, string>;
};

const initialForm: CampaignFormState = {
  title: "",
  internal_reference_name: "",
  brief: "",
  objective: "",
  deliverables: "",
  brand_requirements: "",
  creative_direction: "",
  tone_of_communication: "",
  content_references: "",
  platforms: ["INSTAGRAM"],
  category: "",
  audience_type: "",
  location: "",
  minimum_followers: "",
  language_preference: "",
  content_style: "",
  additional_preferences: "",
  total_budget: "",
  budget_range: "",
  compensation_type: "",
  deliverable_pricing: Object.fromEntries(deliverablePrices.map((item) => [item, ""])),
  start_date: "",
  end_date: "",
  deadline: "",
  status: "ACTIVE",
};

const budgetRanges = ["$0 - $10K", "$10K - $50K", "$50K - $100K", "$100K+"];
const compensationTypes = ["Per Deliverable", "Fixed Fee", "Performance Bonus", "Hybrid"];
const categories = ["Fashion", "Finance", "Lifestyle", "Beauty", "Travel", "Technology", "Food"];
const audienceTypes = ["Gen Z", "Millennials", "Working Professionals", "Parents", "Small Business Owners"];
const locations = ["India", "United States", "United Kingdom", "Global"];
const languages = ["English", "Hindi", "Tamil", "Telugu", "Bengali"];
const contentStyles = ["Educational", "Product Review", "Storytelling", "Tutorial", "UGC"];

function mapCampaignDetailToForm(campaign: BrandCampaignDetailApi): CampaignFormState {
  return {
    title: campaign.title || "",
    internal_reference_name: campaign.internal_reference_name || "",
    brief: campaign.brief || "",
    objective: campaign.objective || campaign.brief || "",
    deliverables: campaign.deliverables || "",
    brand_requirements: campaign.brand_requirements || "",
    creative_direction: campaign.creative_direction || "",
    tone_of_communication: campaign.tone_of_communication || "",
    content_references: campaign.content_references || "",
    platforms: campaign.platforms?.length ? campaign.platforms : ["INSTAGRAM"],
    category: campaign.category || "",
    audience_type: campaign.audience_type || "",
    location: campaign.location || "",
    minimum_followers: String(campaign.minimum_followers || ""),
    language_preference: campaign.language_preference || "",
    content_style: campaign.content_style || "",
    additional_preferences: campaign.additional_preferences || "",
    total_budget: String(campaign.total_budget || ""),
    budget_range: campaign.budget_range || "",
    compensation_type: campaign.compensation_type || "",
    deliverable_pricing: campaign.deliverable_pricing || Object.fromEntries(deliverablePrices.map((item) => [item, ""])),
    start_date: campaign.start_date || "",
    end_date: campaign.end_date || "",
    deadline: campaign.deadline || "",
    status: "ACTIVE",
  };
}

function PlatformSelector({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (platform: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {platforms.map((platform) => {
        const isSelected = selected.includes(platform.value);
        const Icon = platform.value === "INSTAGRAM" ? Instagram : platform.value === "YOUTUBE" ? Youtube : platform.value === "X" ? Radio : Eye;
        return (
          <button
            key={platform.value}
            type="button"
            onClick={() => onToggle(platform.value)}
            className={`flex h-14 items-center justify-between rounded-lg border px-4 text-left ${isSelected ? "border-[#4b22ff] bg-[#f8f5ff] ring-2 ring-[#4b22ff]/10" : "border-[#dce5f2] bg-white"}`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-black text-[#334054]">
              <Icon className={`h-5 w-5 ${platform.color}`} />
              {platform.label}
            </span>
            <span className={`grid h-5 w-5 place-items-center rounded border ${isSelected ? "border-[#4b22ff] bg-[#4b22ff]" : "border-[#dce5f2]"}`}>
              {isSelected ? <span className="h-2 w-2 rounded-sm bg-white" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DeliverablePricing({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (name: string, amount: string) => void;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-[#e2e9f2]">
      {deliverablePrices.map((item, index) => (
        <div key={item} className={`grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 ${index % 2 ? "bg-[#f7f9fc]" : "bg-white"}`}>
          <span className="text-sm font-semibold text-[#475166]">{item}</span>
          <label className="flex items-center gap-2 text-sm font-black text-[#7f8da3]">
            $
            <input
              value={value[item] || ""}
              onChange={(event) => onChange(item, event.target.value)}
              className="h-9 w-24 rounded-md border border-[#dce5f2] px-3 text-sm font-semibold outline-none placeholder:text-[#a8b4c5]"
              placeholder={index === 0 ? "e.g. 300" : index === 1 ? "e.g. 700" : index === 2 ? "e.g. 1800" : "e.g. 400"}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

function buildCampaignPayload(form: CampaignFormState): CampaignPayload {
  return {
    ...form,
    brief: form.objective,
    minimum_followers: Number(form.minimum_followers || 0),
    deadline: form.end_date || undefined,
  };
}

function ReviewCard({
  form,
  review,
  isLoadingReview,
}: {
  form: CampaignFormState;
  review: CampaignReviewResponse | null;
  isLoadingReview: boolean;
}) {
  const suggestedCategories = review?.suggested_creator_categories ?? [];

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <h3 className="text-sm font-black text-[#475166]">Campaign Summary</h3>
        <dl className="mt-5 grid gap-4 text-sm">
          {[
            ["Campaign Name", form.title || "Not set"],
            ["Objective", form.objective || "Not set"],
            ["Timeline", form.start_date && form.end_date ? `${form.start_date} - ${form.end_date}` : "Not set"],
            ["Platforms", form.platforms.join(", ") || "Not set"],
            ["Budget Range", form.budget_range || "Not set"],
            ["Compensation Type", form.compensation_type || "Not set"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-semibold text-[#8a98ad]">{label}</dt>
              <dd className="mt-1 font-medium text-[#1d2430]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl bg-[#f6f7fb] p-5">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f5f6fa] text-[#563bff]">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#8a98ad]">Estimated Creator Matches</p>
              <strong className="mt-1 block text-2xl font-black text-[#1d2430]">
                {isLoadingReview ? "Checking..." : review?.estimated_creator_matches ?? 0}
              </strong>
              <p className="mt-1 text-xs font-medium text-[#8a98ad]">Based on platform, category, location, language and minimum followers.</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-[#f6f7fb] p-5">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#ffc0c9] text-[#4b82ff]">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#8a98ad]">Campaign Visibility</p>
              <strong className="mt-1 block text-2xl font-black text-[#1d2430]">
                Public</strong>
              <p className="mt-1 text-xs font-medium text-[#8a98ad]">Visible to all eligible creators on selected platforms.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#f6f7fb] p-5">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff0c7] text-[#e7a000]">
              <Star className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-[#8a98ad]">Suggested Creator Categories</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestedCategories.length ? suggestedCategories.map((category) => (
                  <span key={category.name} className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#475166]">
                    {category.name} ({category.matches})
                  </span>
                )) : (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#475166]">
                    No category matches yet
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignCreateForm({ onCreated }: { onCreated?: () => void }) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(campaignId);
  const [form, setForm] = useState<CampaignFormState>(initialForm);
  const [brandGuidelines, setBrandGuidelines] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [review, setReview] = useState<CampaignReviewResponse | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(Boolean(campaignId));
  const reviewPayload = useMemo(() => buildCampaignPayload(form), [form]);

  useEffect(() => {
    if (!campaignId) return;
    let mounted = true;
    setIsLoadingCampaign(true);
    setError("");

    getBrandCampaignDetail(campaignId)
      .then((campaign) => {
        if (!mounted) return;
        setForm(mapCampaignDetailToForm(campaign));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load campaign.");
      })
      .finally(() => {
        if (mounted) setIsLoadingCampaign(false);
      });

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const onFieldChange = (field: keyof CampaignFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const togglePlatform = (platform: string) => {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  };

  const setDeliverablePrice = (name: string, amount: string) => {
    setForm((current) => ({
      ...current,
      deliverable_pricing: { ...current.deliverable_pricing, [name]: amount },
    }));
  };

  const onBrandGuidelinesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0] ?? null;
    if (file && file.type !== "application/pdf") {
      setBrandGuidelines(null);
      setError("Brand guidelines must be a PDF file.");
      event.target.value = "";
      return;
    }
    setBrandGuidelines(file);
  };

  const onCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0] ?? null;
    if (file && !["image/png", "image/jpeg"].includes(file.type)) {
      setCoverImage(null);
      setError("Cover image must be a PNG or JPG file.");
      event.target.value = "";
      return;
    }
    setCoverImage(file);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoadingReview(true);
      reviewCampaign(reviewPayload)
        .then(setReview)
        .catch(() => setReview(null))
        .finally(() => setIsLoadingReview(false));
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [reviewPayload]);

  const submitCampaign = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      if (campaignId) {
        await updateBrandCampaign(campaignId, reviewPayload, brandGuidelines, coverImage);
        navigate(`/brand/campaigns/${campaignId}`);
      } else {
        await createCampaign(reviewPayload, brandGuidelines, coverImage);
        onCreated?.();
        navigate("/brand/campaigns");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not publish campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto grid gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        void submitCampaign();
      }}
    >
      {isLoadingCampaign ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">Loading campaign...</CampaignPanel>
      ) : null}
      <CampaignSection index={1} title="Campaign Title" copy="Give your campaign a clear name and internal reference.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextInput label="Campaign Name" required placeholder="Enter campaign name" value={form.title} onChange={onFieldChange("title")} />
          <TextInput label="Internal Reference Name (Optional)" placeholder="e.g. SummerCampaign_June2025" value={form.internal_reference_name} onChange={onFieldChange("internal_reference_name")} />
        </div>
      </CampaignSection>

      <CampaignSection index={2} title="Campaign Description" copy="Provide all the essential details about your campaign.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextArea label="Objective" required placeholder="What is the main goal of this campaign?" value={form.objective} onChange={onFieldChange("objective")} />
          <TextArea label="Deliverables" required placeholder="What do you expect creators to deliver?" value={form.deliverables} onChange={onFieldChange("deliverables")} />
          <TextArea label="Brand Requirements" required placeholder="What are the must-haves for creators?" value={form.brand_requirements} onChange={onFieldChange("brand_requirements")} />
          <TextArea label="Creative Direction" required placeholder="Share your creative vision and expectations." value={form.creative_direction} onChange={onFieldChange("creative_direction")} />
          <TextArea label="Tone of Communication" required placeholder="How should creators communicate in content?" value={form.tone_of_communication} onChange={onFieldChange("tone_of_communication")} />
          <UploadBox
            label="Cover Image (PNG or JPG)"
            accept="image/png,image/jpeg"
            fileName={coverImage?.name}
            helpText="Upload a campaign cover in PNG or JPG format."
            onChange={onCoverImageChange}
          />
          <UploadBox
            label="Brand Guidelines (PDF only)"
            accept="application/pdf"
            fileName={brandGuidelines?.name}
            helpText="Only PDF files are accepted."
            onChange={onBrandGuidelinesChange}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Start Date" required placeholder="Start date" type="date" value={form.start_date} onChange={onFieldChange("start_date")} />
            <TextInput label="End Date" required placeholder="End date" type="date" value={form.end_date} onChange={onFieldChange("end_date")} />
          </div>
        </div>
      </CampaignSection>

      <CampaignSection index={3} title="Platform Selection" copy="Select the platforms where you want this campaign to be active.">
        <PlatformSelector selected={form.platforms} onToggle={togglePlatform} />
      </CampaignSection>

      <CampaignSection index={4} title="Budget Setup" copy="Define your budget and creator compensation preferences.">
        <div className="grid gap-5 md:grid-cols-3">
          <TextInput label="Total Budget" required placeholder="e.g. 50000" prefix="$" value={form.total_budget} onChange={onFieldChange("total_budget")} />
          <SelectInput label="Budget Range" required placeholder="Select budget range" value={form.budget_range} onChange={onFieldChange("budget_range")} options={budgetRanges} />
          <SelectInput label="Creator Compensation Type" required placeholder="Select compensation type" value={form.compensation_type} onChange={onFieldChange("compensation_type")} options={compensationTypes} />
        </div>
        <h3 className="mt-6 text-sm font-black text-[#475166]">Deliverable-wise Pricing</h3>
        <p className="text-xs font-medium text-[#8a98ad]">Define your budget for each deliverable.</p>
        <DeliverablePricing value={form.deliverable_pricing} onChange={setDeliverablePrice} />
      </CampaignSection>

      <CampaignSection index={5} title="Creator Requirements" copy="Tell us what kind of creator(s) you're looking for.">
        <div className="grid gap-5 md:grid-cols-3">
          <SelectInput label="Niche / Category" required placeholder="Select niche" value={form.category} onChange={onFieldChange("category")} options={categories} />
          <SelectInput label="Audience Type" required placeholder="Select audience type" value={form.audience_type} onChange={onFieldChange("audience_type")} options={audienceTypes} />
          <SelectInput label="Location" placeholder="Select location" value={form.location} onChange={onFieldChange("location")} options={locations} />
          <TextInput label="Minimum Followers" required placeholder="e.g. 10000" value={form.minimum_followers} onChange={onFieldChange("minimum_followers")} />
          <SelectInput label="Language Preference" required placeholder="Select language" value={form.language_preference} onChange={onFieldChange("language_preference")} options={languages} />
          <SelectInput label="Content Style" required placeholder="Select content style" value={form.content_style} onChange={onFieldChange("content_style")} options={contentStyles} />
        </div>
        <div className="mt-5">
          <TextArea label="Additional Preferences (Optional)" placeholder="Any other preferences or specific requirements?" value={form.additional_preferences} onChange={onFieldChange("additional_preferences")} />
        </div>
      </CampaignSection>

      <CampaignSection index={6} title="Campaign Review" copy="Review your campaign details before publishing.">
        <ReviewCard form={form} review={review} isLoadingReview={isLoadingReview} />
      </CampaignSection>

      <CampaignSection index={7} title={isEditing ? "Save Campaign" : "Publish Campaign"} copy={isEditing ? "Save your changes to update this campaign." : "Once you publish, your campaign will be visible to creators and applications will start coming in."}>
        <RegisterError message={error} className="mb-5" />
        <button type="submit" disabled={isSubmitting} className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#4b22ff] px-10 text-sm font-black text-white shadow-[0_12px_20px_rgba(75,34,255,0.18)] disabled:cursor-not-allowed disabled:opacity-70">
          <Megaphone className="h-5 w-5" />
          {isSubmitting ? (isEditing ? "Saving..." : "Publishing...") : (isEditing ? "Save Campaign" : "Publish Campaign")}
        </button>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[#7e8da5]">
          <Eye className="h-4 w-4" />
          You can't edit the platform and total budget after publishing.
        </p>
      </CampaignSection>
    </form>
  );
}
