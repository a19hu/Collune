import { CheckCircle2, FileText, Send, type LucideIcon } from "lucide-react";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import creatorFour from "../../../assets/collune/creator-4.png";
import type { BrandShortlistApi, BrandShortlistStatusApi, CreatorListItemApi, CreatorProfileApi } from "../../../types";
import { formatUpdatedAt } from "@/src/HtmlComponents/BrandCard";

export type ShortlistStatus = "Draft" | "Submitted" | "Outreach In Progress" | "Completed";

export type ShortlistCreator = {
  id: string;
  name: string;
  category: string;
  followers: string;
  engagement: string;
  added: string;
  platform: "Instagram" | "YouTube" | "LinkedIn";
  image: string;
};

export type ShortlistItem = {
  id: string;
  title: string;
  creators: ShortlistCreator[];
  status: ShortlistStatus;
  updatedAt: string;
  updatedRank: number;
  createdAt: string;
  purpose: string;
  notes: string;
  platforms: ShortlistCreator["platform"][];
  categories: string;
  audience: string;
  budgetRange: string;
  timeline: string;
  icon: LucideIcon;
  iconClassName: string;
};

const apiStatusLabels: Record<BrandShortlistStatusApi, ShortlistStatus> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
};

export const statusApiValues: Record<ShortlistStatus, BrandShortlistStatusApi> = {
  Draft: "DRAFT",
  Submitted: "SUBMITTED",
  "Outreach In Progress": "SUBMITTED",
  Completed: "SUBMITTED",
};

const iconRules: Array<{ match: ShortlistStatus; icon: LucideIcon; className: string }> = [
  { match: "Draft", icon: FileText, className: "bg-[#ebe5ff] text-[#6a75ff]" },
  { match: "Submitted", icon: Send, className: "bg-[#dbeafe] text-[#2f6df6]" },
  { match: "Outreach In Progress", icon: Send, className: "bg-[#ccf8e0] text-[#00a875]" },
  { match: "Completed", icon: CheckCircle2, className: "bg-[#ccf8e0] text-[#00a875]" },
];

const fallbackImages = [creatorOne, creatorTwo, creatorThree, creatorFour];

function normalizePlatform(value?: string): ShortlistCreator["platform"] {
  if (value === "YOUTUBE" || value === "YouTube") return "YouTube";
  if (value === "LINKEDIN" || value === "LinkedIn") return "LinkedIn";
  return "Instagram";
}

function formatFollowers(value?: number) {
  if (!value) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Today";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

type ShortlistCreatorApi = CreatorProfileApi | CreatorListItemApi;

function getPlatformData(creator: ShortlistCreatorApi) {
  if ("platform_data" in creator) return creator.platform_data || [];
  return (creator as CreatorProfileApi).social_accounts || [];
}

function getEngagement(creator: ShortlistCreatorApi) {
  const engagement = getPlatformData(creator).find((account) => typeof account.engagement_rate === "number")?.engagement_rate;
  return typeof engagement === "number" ? `${engagement.toFixed(1)}%` : "N/A";
}

export function mapCreatorApiToShortlistCreator(creator: ShortlistCreatorApi, index: number): ShortlistCreator {
  const platforms = getPlatformData(creator);
  const platform = platforms[0] ? ("name" in platforms[0] ? platforms[0].name : platforms[0].platform) : undefined;
  const followers = "total_followers" in creator ? creator.total_followers : creator.audience_size;
  return {
    id: creator.creator_id,
    name: creator.display_name || ("user" in creator ? creator.user?.name : "") || "Creator",
    category: creator.category || "Creator",
    followers: formatFollowers(followers),
    engagement: getEngagement(creator),
    added: "Added to shortlist",
    platform: normalizePlatform(platform),
    image: ("profile_image_url" in creator ? creator.profile_image_url : creator.profile_image) || fallbackImages[index % fallbackImages.length],
  };
}

export function mapShortlistApiToItem(shortlist: BrandShortlistApi): ShortlistItem {
  const status = apiStatusLabels[shortlist.status] || "Draft";
  const icon = iconRules.find((item) => item.match === status) || iconRules[0];
  const updatedTime = new Date(shortlist.updated_at).getTime();

  return {
    id: shortlist.shortlist_id,
    title: shortlist.title,
    creators: (shortlist.creator_details || []).map(mapCreatorApiToShortlistCreator),
    status,
    updatedAt: formatUpdatedAt(shortlist.updated_at),
    updatedRank: Number.isNaN(updatedTime) ? Number.MAX_SAFE_INTEGER : -updatedTime,
    createdAt: formatDate(shortlist.created_at),
    purpose: shortlist.purpose,
    notes: shortlist.notes,
    platforms: (shortlist.platforms || []).map(normalizePlatform),
    categories: shortlist.categories,
    audience: shortlist.audience,
    budgetRange: shortlist.budget_range,
    timeline: shortlist.timeline,
    icon: icon.icon,
    iconClassName: icon.className,
  };
}

export const shortlistStatusOptions: Array<"All Shortlists" | ShortlistStatus> = [
  "All Shortlists",
  "Draft",
  "Submitted",
  "Outreach In Progress",
  "Completed",
];
