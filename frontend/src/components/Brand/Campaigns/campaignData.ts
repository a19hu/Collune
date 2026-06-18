import {
  BadgeDollarSign,
  Boxes,
  CircuitBoard,
  Heart,
  Megaphone,
  Plane,
  ShoppingBag,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export type CampaignStatus = "Active" | "Draft" | "Paused";

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
  timeline: string;
  platforms: string[];
  category: string;
  icon: LucideIcon;
  iconClassName: string;
};

export const campaigns: CampaignCardItem[] = [
  {
    id: "financial-literacy",
    title: "Financial Literacy Campaign",
    status: "Active",
    applications: 23,
    recommended: 12,
    updatedAt: "Updated today",
    updatedRank: 1,
    budget: "$25K - $50K",
    objective: "Help young audiences understand saving, credit, and investment basics through practical creator-led explainers.",
    timeline: "Jun 20, 2025 - Jul 20, 2025",
    platforms: ["Instagram", "YouTube"],
    category: "Finance",
    icon: Boxes,
    iconClassName: "bg-[#dbeafe] text-[#2563eb]",
  },
  {
    id: "summer-product",
    title: "Summer Product Launch",
    status: "Active",
    applications: 15,
    recommended: 8,
    updatedAt: "Updated 2 days ago",
    updatedRank: 2,
    budget: "$10K - $30K",
    objective: "Introduce the new summer product range with bright launch content and creator demos.",
    timeline: "Jun 10, 2025 - Jul 05, 2025",
    platforms: ["Instagram", "LinkedIn"],
    category: "Lifestyle",
    icon: Boxes,
    iconClassName: "bg-[#d1fadf] text-[#08a85f]",
  },
  {
    id: "fintech-awareness",
    title: "Fintech Awareness Drive",
    status: "Active",
    applications: 31,
    recommended: 14,
    updatedAt: "Updated 3 days ago",
    updatedRank: 3,
    budget: "$30K - $60K",
    objective: "Drive awareness for a fintech app using short, clear creator content for first-time users.",
    timeline: "Jun 15, 2025 - Aug 01, 2025",
    platforms: ["Instagram", "YouTube", "LinkedIn"],
    category: "Fintech",
    icon: Megaphone,
    iconClassName: "bg-[#f1d9ff] text-[#7c3cff]",
  },
  {
    id: "health-wellness",
    title: "Health & Wellness Campaign",
    status: "Active",
    applications: 18,
    recommended: 9,
    updatedAt: "Updated 5 days ago",
    updatedRank: 5,
    budget: "$15K - $35K",
    objective: "Promote approachable wellness habits and daily product routines with trusted lifestyle creators.",
    timeline: "Jul 01, 2025 - Jul 30, 2025",
    platforms: ["Instagram", "YouTube"],
    category: "Health",
    icon: Heart,
    iconClassName: "bg-[#ffe1f1] text-[#df2f75]",
  },
  {
    id: "travel-collune",
    title: "Travel With Collune",
    status: "Active",
    applications: 12,
    recommended: 6,
    updatedAt: "Updated 1 week ago",
    updatedRank: 7,
    budget: "$8K - $20K",
    objective: "Tell compact travel stories that position Collune as a partner for destination-led campaigns.",
    timeline: "Aug 05, 2025 - Sep 05, 2025",
    platforms: ["Instagram"],
    category: "Travel",
    icon: Plane,
    iconClassName: "bg-[#fff5b8] text-[#d58c00]",
  },
  {
    id: "beauty-drop",
    title: "Beauty Drop Campaign",
    status: "Draft",
    applications: 6,
    recommended: 11,
    updatedAt: "Updated 2 weeks ago",
    updatedRank: 14,
    budget: "$12K - $28K",
    objective: "Build excitement for a new skincare drop with honest routine videos and before-after stories.",
    timeline: "Sep 01, 2025 - Sep 28, 2025",
    platforms: ["Instagram", "YouTube"],
    category: "Beauty",
    icon: Sparkles,
    iconClassName: "bg-[#fff0f7] text-[#d72f86]",
  },
  {
    id: "food-festival",
    title: "Food Festival Push",
    status: "Active",
    applications: 27,
    recommended: 18,
    updatedAt: "Updated 4 days ago",
    updatedRank: 4,
    budget: "$18K - $42K",
    objective: "Bring regional food creators into a short campaign around festival offers and family dining.",
    timeline: "Oct 01, 2025 - Oct 20, 2025",
    platforms: ["Instagram"],
    category: "Food",
    icon: Utensils,
    iconClassName: "bg-[#fff0dd] text-[#ef8a00]",
  },
  {
    id: "saas-growth",
    title: "SaaS Growth Stories",
    status: "Paused",
    applications: 9,
    recommended: 7,
    updatedAt: "Updated 10 days ago",
    updatedRank: 10,
    budget: "$20K - $45K",
    objective: "Collect B2B creator stories explaining practical productivity wins for small teams.",
    timeline: "Nov 01, 2025 - Dec 01, 2025",
    platforms: ["LinkedIn", "YouTube"],
    category: "Technology",
    icon: CircuitBoard,
    iconClassName: "bg-[#e9f2ff] text-[#2463d8]",
  },
  {
    id: "holiday-sale",
    title: "Holiday Sale Blast",
    status: "Draft",
    applications: 4,
    recommended: 10,
    updatedAt: "Updated 3 weeks ago",
    updatedRank: 21,
    budget: "$35K - $70K",
    objective: "Prepare a high-visibility creator campaign for holiday gifting and limited-time bundles.",
    timeline: "Dec 01, 2025 - Dec 24, 2025",
    platforms: ["Instagram", "YouTube"],
    category: "Retail",
    icon: ShoppingBag,
    iconClassName: "bg-[#e9e4ff] text-[#5138ee]",
  },
];

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
