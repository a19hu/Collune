import {
  CheckCircle2,
  FileText,
  Heart,
  Send,
  type LucideIcon,
} from "lucide-react";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import creatorFour from "../../../assets/collune/creator-4.png";
import type { BrandShortlistApi, BrandShortlistStatusApi, CreatorProfileApi } from "../../../lib/authApi";

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

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Updated today";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "Updated 1 week ago" : `Updated ${weeks} weeks ago`;
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

export const suggestedCreators: ShortlistCreator[] = [
  {
    id: "riya-sharma",
    name: "Riya Sharma",
    category: "Lifestyle Creator",
    followers: "120K",
    engagement: "4.8%",
    added: "Added today",
    platform: "Instagram",
    image: creatorOne,
  },
  {
    id: "karan-mehta",
    name: "Karan Mehta",
    category: "Fashion Creator",
    followers: "85K",
    engagement: "5.2%",
    added: "Added today",
    platform: "YouTube",
    image: creatorTwo,
  },
  {
    id: "neha-verma",
    name: "Neha Verma",
    category: "Lifestyle Creator",
    followers: "78K",
    engagement: "4.3%",
    added: "Added 1 day ago",
    platform: "Instagram",
    image: creatorThree,
  },
  {
    id: "aditya-rao",
    name: "Aditya Rao",
    category: "Travel & Lifestyle",
    followers: "65K",
    engagement: "6.1%",
    added: "Added 2 days ago",
    platform: "YouTube",
    image: creatorFour,
  },
  {
    id: "ananya-iyer",
    name: "Ananya Iyer",
    category: "Fashion Creator",
    followers: "58K",
    engagement: "4.0%",
    added: "Added 2 days ago",
    platform: "Instagram",
    image: creatorThree,
  },
];

export const initialShortlists: ShortlistItem[] = [
  {
    id: "summer-campaign-creators",
    title: "Summer Campaign Creators",
    creators: suggestedCreators,
    status: "Draft",
    updatedAt: "Updated today",
    updatedRank: 1,
    createdAt: "Jun 12, 2025",
    purpose: "Looking for engaging lifestyle and fashion creators who can showcase our new summer collection to a Gen Z and millennial audience.",
    notes: "We prefer creators with strong engagement rates and authentic content style. Open to Instagram Reels and YouTube Shorts.",
    platforms: ["Instagram", "YouTube"],
    categories: "Lifestyle, Fashion",
    audience: "Gen Z, Millennials",
    budgetRange: "$10K - $30K",
    timeline: "Jul 1 - Aug 31, 2025",
    icon: FileText,
    iconClassName: "bg-[#ebe5ff] text-[#6a75ff]",
  },
  {
    id: "fintech-outreach",
    title: "Fintech Outreach",
    creators: suggestedCreators.slice(0, 5),
    status: "Outreach In Progress",
    updatedAt: "Updated yesterday",
    updatedRank: 2,
    createdAt: "Jun 8, 2025",
    purpose: "Find finance educators and business creators who can explain our app in a simple, credible way.",
    notes: "Prioritize creators with audience trust and prior fintech content.",
    platforms: ["Instagram", "LinkedIn"],
    categories: "Fintech, Business",
    audience: "Young professionals",
    budgetRange: "$15K - $35K",
    timeline: "Jun 20 - Jul 30, 2025",
    icon: Send,
    iconClassName: "bg-[#ccf8e0] text-[#00a875]",
  },
  {
    id: "q2-tech-campaign",
    title: "Q2 Tech Campaign",
    creators: suggestedCreators.slice(0, 3),
    status: "Submitted",
    updatedAt: "Updated 2 days ago",
    updatedRank: 3,
    createdAt: "Jun 5, 2025",
    purpose: "Submit a refined creator shortlist for a B2B technology campaign.",
    notes: "Need LinkedIn-first creators with strong demo ability.",
    platforms: ["YouTube", "LinkedIn"],
    categories: "Technology, SaaS",
    audience: "Founders, Operators",
    budgetRange: "$20K - $40K",
    timeline: "Jul 5 - Aug 5, 2025",
    icon: Send,
    iconClassName: "bg-[#dbeafe] text-[#2f6df6]",
  },
  {
    id: "lifestyle-creators",
    title: "Lifestyle Creators",
    creators: suggestedCreators.slice(0, 4),
    status: "Draft",
    updatedAt: "Updated 3 days ago",
    updatedRank: 4,
    createdAt: "Jun 3, 2025",
    purpose: "Collect lifestyle creators for upcoming seasonal campaigns.",
    notes: "Creators should have polished visuals and reliable posting cadence.",
    platforms: ["Instagram"],
    categories: "Lifestyle",
    audience: "Urban shoppers",
    budgetRange: "$8K - $18K",
    timeline: "Jul 15 - Aug 15, 2025",
    icon: Heart,
    iconClassName: "bg-[#ffe1f1] text-[#df2f75]",
  },
  {
    id: "wellness-brand-partners",
    title: "Wellness Brand Partners",
    creators: suggestedCreators,
    status: "Completed",
    updatedAt: "Updated 1 week ago",
    updatedRank: 5,
    createdAt: "May 25, 2025",
    purpose: "Build a trusted group of wellness creators for long-term partnerships.",
    notes: "Completed shortlist for approved campaign partners.",
    platforms: ["Instagram", "YouTube"],
    categories: "Wellness, Health",
    audience: "Health-conscious adults",
    budgetRange: "$12K - $25K",
    timeline: "Jun 1 - Jun 30, 2025",
    icon: CheckCircle2,
    iconClassName: "bg-[#ccf8e0] text-[#00a875]",
  },
];

export function createNewShortlist(sequence: number): ShortlistItem {
  return {
    ...initialShortlists[0],
    id: `new-shortlist-${sequence}`,
    title: `New Shortlist ${sequence}`,
    creators: [],
    status: "Draft",
    updatedAt: "Updated today",
    updatedRank: 0,
    createdAt: "Today",
    purpose: "Describe the type of creators you want Collune to reach out to.",
    notes: "",
  };
}
