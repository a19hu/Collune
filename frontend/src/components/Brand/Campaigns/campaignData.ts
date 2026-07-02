import {
  BadgeDollarSign,
  Boxes,
  Heart,
  Megaphone,
  Plane,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import type { CampaignApi } from "../../../types";
import { formatUpdatedAt } from "@/src/HtmlComponents/BrandCard";

export type CampaignStatus = "Active" | "Draft" | "Paused" | "Reviewing" | "Completed";

export type CampaignCardItem = {
  id: string;
  title: string;
  status: CampaignStatus;
  applications: number;
  recommended: number;
  updatedAt: string;
  updatedRank: number;
  budget: string;
  objective: string;
  deliverables: string;
  requirements: string;
  compensationType: string;
  audienceType: string;
  languagePreference: string;
  contentStyle: string;
  additionalPreferences: string;
  timeline: string;
  platforms: string[];
  category: string;
  createdAtRaw: string;
  updatedAtRaw: string;
  deadline?: string;
  progressSteps?: Array<{
    title: string;
    status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
    displayDate: string;
    sortOrder: number;
  }>;
  icon: LucideIcon;
  iconClassName: string;
};

const statusLabels: Record<CampaignApi["status"], CampaignStatus> = {
  ACTIVE: "Active",
  DRAFT: "Draft",
  PAUSED: "Paused",
  REVIEWING: "Reviewing",
  COMPLETED: "Completed",
};

const categoryIcons: Array<{ match: string[]; icon: LucideIcon; className: string }> = [
  { match: ["finance", "financial", "fintech"], icon: Boxes, className: "bg-[#dbeafe] text-[#2563eb]" },
  { match: ["health", "wellness"], icon: Heart, className: "bg-[#ffe1f1] text-[#df2f75]" },
  { match: ["travel"], icon: Plane, className: "bg-[#fff5b8] text-[#d58c00]" },
  { match: ["beauty", "fashion", "lifestyle"], icon: Sparkles, className: "bg-[#fff0f7] text-[#d72f86]" },
  { match: ["launch", "awareness", "product"], icon: Megaphone, className: "bg-[#f1d9ff] text-[#7c3cff]" },
];

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getUpdatedRank(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : -time;
}

function getCampaignIcon(campaign: CampaignApi) {
  const searchable = `${campaign.category} ${campaign.title}`.toLowerCase();
  return categoryIcons.find((item) => item.match.some((keyword) => searchable.includes(keyword))) || {
    icon: Boxes,
    className: "bg-[#d1fadf] text-[#08a85f]",
  };
}

function getTimeline(campaign: CampaignApi) {
  const start = formatDate(campaign.start_date);
  const end = formatDate(campaign.end_date || campaign.deadline);
  if (start && end) return `${start} - ${end}`;
  return start || end || "Timeline not set";
}

export function mapCampaignApiToCard(campaign: CampaignApi): CampaignCardItem {
  const icon = getCampaignIcon(campaign);

  return {
    id: campaign.campaign_id,
    title: campaign.title,
    status: statusLabels[campaign.status] || "Draft",
    applications: campaign.status_summary?.applications_received ?? campaign.applications_count ?? 0,
    recommended: campaign.status_summary?.recommended_creators ?? 0,
    updatedAt: formatUpdatedAt(campaign.updated_at),
    updatedRank: getUpdatedRank(campaign.updated_at),
    budget: campaign.budget_range || (Number(campaign.total_budget) ? `$${Number(campaign.total_budget).toLocaleString()}` : "Budget not set"),
    objective: campaign.objective || campaign.brief || "Campaign objective not set.",
    deliverables: campaign.deliverables || "Deliverables not set.",
    requirements: campaign.brand_requirements || campaign.additional_preferences || "Requirements not set.",
    compensationType: campaign.compensation_type || "Compensation not set",
    audienceType: campaign.audience_type || "Audience not set",
    languagePreference: campaign.language_preference || "Language not set",
    contentStyle: campaign.content_style || "Content style not set",
    additionalPreferences: campaign.additional_preferences || "",
    timeline: getTimeline(campaign),
    platforms: campaign.platforms || [],
    category: campaign.category || "General",
    createdAtRaw: campaign.created_at,
    updatedAtRaw: campaign.updated_at,
    deadline: campaign.deadline || campaign.end_date,
    progressSteps: (campaign.progress_steps || []).map((step) => ({
      title: step.title,
      status: step.status,
      displayDate: step.display_date,
      sortOrder: step.sort_order,
    })),
    icon: icon.icon,
    iconClassName: icon.className,
  };
}

export const platforms = [
  { label: "Instagram", value: "instagram", color: "text-[#ff4d86]" },
  { label: "YouTube", value: "youtube", color: "text-[#ff0000]" },
  { label: "LinkedIn", value: "linkedin", color: "text-[#116bc1]" },
];

export const deliverablePrices = [
  "Instagram Post",
  "Instagram Reel",
  "YouTube Video",
  "LinkedIn Post",
  "Stories / Mentions",
];

export const reviewStats = [
  {
    icon: BadgeDollarSign,
    title: "Estimated Creator Matches",
    value: "250 - 350",
    copy: "Based on your requirements",
    className: "bg-[#f5f6fa] text-[#563bff]",
  },
  {
    icon: Boxes,
    title: "Campaign Visibility",
    value: "Public",
    copy: "Visible to all eligible creators on selected platforms",
    className: "bg-[#f5f6fa] text-[#4b82ff]",
  },
];
