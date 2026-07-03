import type { LucideIcon } from "lucide-react";
import { BookOpen, BriefcaseBusiness, Dumbbell, GraduationCap, Leaf, Shirt, ShoppingBag } from "lucide-react";

import type { CampaignApi, CreatorCampaignDetailApi, CreatorCampaignListItemApi } from "../../../types";

export type MarketplaceCampaign = {
  id: string;
  brandId?: string;
  brandName: string;
  brandType: string;
  brandLogoUrl: string;
  brandInitials: string;
  brandIcon: LucideIcon;
  brandIconClassName: string;
  postedAt: string;
  title: string;
  status: string;
  description: string;
  objective: string;
  deliverables: Array<{ title: string; detail: string; icon: "instagram" | "message" }>;
  deadline: string;
  deadlineShort: string;
  applicationsCloseLabel: string;
  postedOn: string;
  platform: string;
  timeline: Array<{ title: string; date: string }>;
  requirements: Array<{ label: string; value: string; icon: LucideIcon }>;
  creativeDirection: string[];
  references: Array<{ title: string; image: string }>;
  applied?: boolean;
  source: "api";
};

const referenceImages = [
  "https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=500&q=80",
  "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=500&q=80",
];

const brandIconRules: Array<{ match: string[]; icon: LucideIcon; className: string; type: string }> = [
  { match: ["finance", "financial", "fintech"], icon: BriefcaseBusiness, className: "bg-[#2258c7] text-white", type: "Fintech Startup" },
  { match: ["food", "health", "wellness"], icon: Leaf, className: "bg-[#ffb36b] text-white", type: "Food & Lifestyle" },
  { match: ["education", "exam", "study"], icon: GraduationCap, className: "bg-[#20242b] text-white", type: "Education Brand" },
  { match: ["fashion", "summer"], icon: Shirt, className: "bg-[#0f7f74] text-white", type: "Fashion Brand" },
  { match: ["beverage", "brew", "coffee"], icon: ShoppingBag, className: "bg-[#8d0013] text-white", type: "Beverage Brand" },
  { match: ["fitness", "sport"], icon: Dumbbell, className: "bg-[#7f16c5] text-white", type: "Fitness Brand" },
];

export function mapCampaignToMarketplace(campaign: CampaignApi): MarketplaceCampaign {
  const brandName = campaign.brand_detail?.company_name || "Brand";
  const brand = getBrandPresentation(`${brandName} ${campaign.title} ${campaign.category}`);
  const deadline = formatDate(campaign.deadline || campaign.end_date) || "Deadline not set";
  const platform = normalizePlatform(campaign.platforms?.[0]);
  const closeInDays = campaign.status_summary?.applications_close_in_days;
  const applicationsCloseLabel = closeInDays ? `Applications close in ${closeInDays} days` : "Applications close in 8 days";

  return {
    id: campaign.campaign_id,
    brandId: campaign.brand,
    brandName,
    brandType: campaign.brand_detail?.industry || brand.type,
    brandLogoUrl: campaign.brand_detail?.logo_url || "",
    brandInitials: getInitials(brandName),
    brandIcon: brand.icon,
    brandIconClassName: brand.className,
    postedAt: formatPostedAt(campaign.created_at),
    title: campaign.title,
    status: campaign.status === "ACTIVE" ? "Open Applications" : campaign.status.replaceAll("_", " "),
    description: campaign.brief || campaign.objective || "Campaign details are available in the full brief.",
    objective: campaign.objective || campaign.brief || "Campaign objective has not been added yet.",
    deliverables: getDeliverables(campaign),
    deadline,
    deadlineShort: deadline,
    applicationsCloseLabel,
    postedOn: formatDate(campaign.created_at) || "Recently",
    platform,
    timeline: [
      { title: "Applications Close", date: deadline },
      { title: "Creators Selected", date: formatDate(campaign.start_date) || "After review" },
      { title: "Content Submission", date: formatDate(campaign.end_date) || "To be confirmed" },
      { title: "Campaign End", date: formatDate(campaign.end_date || campaign.deadline) || "To be confirmed" },
    ],
    requirements: [
      { label: "Looking For", value: campaign.category || "Creators", icon: BookOpen },
      { label: "Audience", value: campaign.audience_type || "Target audience not set", icon: BookOpen },
      { label: "Minimum Followers", value: campaign.minimum_followers ? `${campaign.minimum_followers.toLocaleString()}+` : "Not specified", icon: BookOpen },
      { label: "Languages", value: campaign.language_preference || "Any", icon: BookOpen },
      { label: "Location", value: campaign.location || "Any location", icon: BookOpen },
      { label: "Content Style", value: campaign.content_style || "Authentic, Relatable", icon: BookOpen },
    ],
    creativeDirection: (campaign.creative_direction || "Content should feel authentic, practical, and aligned with the campaign objective.")
      .split("\n")
      .filter(Boolean),
    references: referenceImages.map((image, index) => ({
      image,
      title: index === 1 ? "Instagram Carousel" : index === 3 ? "YouTube Video" : "Instagram Reel",
    })),
    applied: false,
    source: "api",
  };
}

export function mapCreatorCampaignToMarketplace(campaign: CreatorCampaignListItemApi): MarketplaceCampaign {
  const brandName = campaign.brand_name || "Brand";
  const brand = getBrandPresentation(`${brandName} ${campaign.title} ${campaign.objective}`);
  const deadline = formatDate(campaign.deadline) || "Deadline not set";

  return {
    id: campaign.id,
    brandId: campaign.brand_id,
    brandName,
    brandType: brand.type,
    brandLogoUrl: campaign.brand_logo || "",
    brandInitials: getInitials(brandName),
    brandIcon: brand.icon,
    brandIconClassName: brand.className,
    postedAt: formatPostedAt(campaign.posted_at),
    title: campaign.title,
    status: "Open Applications",
    description: campaign.objective || "Campaign details are available in the full brief.",
    objective: campaign.objective || "Campaign objective has not been added yet.",
    deliverables: [
      { title: "Creator content", detail: "Details shared by brand", icon: "instagram" },
      { title: "Campaign post", detail: "Format to be confirmed", icon: "instagram" },
      { title: "Brand update", detail: "Timeline to be confirmed", icon: "message" },
    ],
    deadline,
    deadlineShort: deadline,
    applicationsCloseLabel: deadline === "Deadline not set" ? "Applications open" : `Apply before ${deadline}`,
    postedOn: formatDate(campaign.posted_at) || "Recently",
    platform: "Instagram",
    timeline: [
      { title: "Applications Close", date: deadline },
      { title: "Creators Selected", date: "After review" },
      { title: "Content Submission", date: "To be confirmed" },
      { title: "Campaign End", date: deadline },
    ],
    requirements: [
      { label: "Looking For", value: "Creators", icon: BookOpen },
      { label: "Audience", value: "Target audience not set", icon: BookOpen },
      { label: "Minimum Followers", value: "Not specified", icon: BookOpen },
      { label: "Languages", value: "Any", icon: BookOpen },
      { label: "Location", value: "Any location", icon: BookOpen },
      { label: "Content Style", value: "Authentic, Relatable", icon: BookOpen },
    ],
    creativeDirection: [campaign.objective || "Create authentic content aligned with the campaign objective."],
    references: referenceImages.map((image, index) => ({
      image,
      title: index === 1 ? "Instagram Carousel" : index === 3 ? "YouTube Video" : "Instagram Reel",
    })),
    applied: false,
    source: "api",
  };
}

export function mapCreatorCampaignDetailToMarketplace(campaign: CreatorCampaignDetailApi): MarketplaceCampaign {
  const brandName = campaign.brand_name || "Brand";
  const brand = getBrandPresentation(`${brandName} ${campaign.title} ${campaign.category} ${campaign.objective}`);
  const deadline = formatDate(campaign.deadline) || "Deadline not set";
  const platform = normalizePlatform(campaign.platforms?.[0]);

  return {
    id: campaign.id,
    brandId: campaign.brand_id,
    brandName,
    brandType: campaign.brand_type || brand.type,
    brandLogoUrl: campaign.brand_logo || "",
    brandInitials: getInitials(brandName),
    brandIcon: brand.icon,
    brandIconClassName: brand.className,
    postedAt: formatPostedAt(campaign.posted_at),
    title: campaign.title,
    status: "Open Applications",
    description: campaign.brief || campaign.objective || "Campaign details are available in the full brief.",
    objective: campaign.objective || campaign.brief || "Campaign objective has not been added yet.",
    deliverables: getDeliverablesFromText(campaign.deliverables),
    deadline,
    deadlineShort: deadline,
    applicationsCloseLabel: deadline === "Deadline not set" ? "Applications open" : `Apply before ${deadline}`,
    postedOn: formatDate(campaign.posted_at) || "Recently",
    platform,
    timeline: [
      { title: "Applications Close", date: deadline },
      { title: "Creators Selected", date: formatDate(campaign.start_date) || "After review" },
      { title: "Content Submission", date: formatDate(campaign.end_date) || "To be confirmed" },
      { title: "Campaign End", date: formatDate(campaign.end_date || campaign.deadline) || "To be confirmed" },
    ],
    requirements: [
      { label: "Looking For", value: campaign.creator_requirements?.looking_for || campaign.category || "Creators", icon: BookOpen },
      { label: "Audience", value: campaign.creator_requirements?.audience || campaign.audience_type || "Target audience not set", icon: BookOpen },
      { label: "Minimum Followers", value: campaign.minimum_followers ? `${campaign.minimum_followers.toLocaleString()}+` : "Not specified", icon: BookOpen },
      { label: "Languages", value: campaign.language_preference || "Any", icon: BookOpen },
      { label: "Location", value: campaign.location || "Any location", icon: BookOpen },
      { label: "Content Style", value: campaign.content_style || "Authentic, Relatable", icon: BookOpen },
    ],
    creativeDirection: (campaign.creative_direction || "Content should feel authentic, practical, and aligned with the campaign objective.")
      .split("\n")
      .filter(Boolean),
    references: referenceImages.map((image, index) => ({
      image,
      title: index === 1 ? "Instagram Carousel" : index === 3 ? "YouTube Video" : "Instagram Reel",
    })),
    applied: Boolean(campaign.applied),
    source: "api",
  };
}

function getDeliverablesFromText(text: string) {
  const parts = (text || "").split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const fallback = ["Creator content", "Campaign post", "Brand update"];
  return (parts.length ? parts : fallback).map((title, index) => ({
    title,
    detail: index === 0 ? "Details shared by brand" : index === 1 ? "Format to be confirmed" : "Timeline to be confirmed",
    icon: index === 2 ? "message" as const : "instagram" as const,
  }));
}

function getDeliverables(campaign: CampaignApi) {
  const text = campaign.deliverables || "";
  const parts = text.split(/\n|,/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const fallback = ["2 Instagram Reels", "3 Instagram Stories", "1 Community Post"];
  return (parts.length ? parts : fallback).map((title, index) => ({
    title,
    detail: index === 0 ? "(30-60 sec each)" : index === 1 ? "(3-5 frames each)" : "(On feed or LinkedIn)",
    icon: index === 2 ? "message" as const : "instagram" as const,
  }));
}

function getBrandPresentation(value: string) {
  const search = value.toLowerCase();
  return brandIconRules.find((item) => item.match.some((keyword) => search.includes(keyword))) || {
    icon: BriefcaseBusiness,
    className: "bg-[#2258c7] text-white",
    type: "Brand",
  };
}

function normalizePlatform(value?: string) {
  if (!value) return "Instagram";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) || "BR").toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatPostedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Posted recently";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  return "Posted 1 week ago";
}
