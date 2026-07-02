import { CheckCircle2, FileText, Send, type LucideIcon } from "lucide-react";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import creatorFour from "../../../assets/collune/creator-4.png";
import type { BrandShortlistApi, BrandShortlistStatusApi, CreatorProfileApi } from "../../../lib/authApi";
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
  OUTREACH_IN_PROGRESS: "Outreach In Progress",
  COMPLETED: "Completed",
};

export const statusApiValues: Record<ShortlistStatus, BrandShortlistStatusApi> = {
  Draft: "DRAFT",
  Submitted: "SUBMITTED",
  "Outreach In Progress": "OUTREACH_IN_PROGRESS",
  Completed: "COMPLETED",
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

function getEngagement(creator: CreatorProfileApi) {
  const engagement = creator.social_accounts?.find((account) => typeof account.engagement_rate === "number")?.engagement_rate;
  return typeof engagement === "number" ? `${engagement.toFixed(1)}%` : "N/A";
}

export function mapCreatorApiToShortlistCreator(creator: CreatorProfileApi, index: number): ShortlistCreator {
  const platform = creator.social_accounts?.find((account) => account.is_connected)?.platform || creator.social_accounts?.[0]?.platform;
  return {
    id: creator.creator_id,
    name: creator.display_name || creator.user?.name || "Creator",
    category: creator.category || "Creator",
    followers: formatFollowers(creator.audience_size),
    engagement: getEngagement(creator),
    added: "Added to shortlist",
    platform: normalizePlatform(platform),
    image: creator.profile_image_url || fallbackImages[index % fallbackImages.length],
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
