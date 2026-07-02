import {
  ArrowRight,
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  CheckCircle,
  Eye,
  Lock,
  Send,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getCreatorDashboard, type CreatorDashboardApi } from "../../lib/authApi";
import { Panel } from "@/src/HtmlComponents/BrandCard";
import { UnderReviewDashboard } from "./UnderReviewDashboard";

type DashboardContext = { isVerified?: boolean };

const campaignImages = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
];

const metricCards = [
  { label: "Profile Views", value: "127", change: "↑ 18% vs last 7 days", icon: Eye, color: "bg-[#ebe5ff] text-[#4635ff]" },
  { label: "Brand Requests", value: "4", change: "↑ 33% vs last 7 days", icon: Users, color: "bg-[#cbf8df] text-[#00b980]" },
  { label: "Campaign Applications", value: "8", change: "↑ 14% vs last 7 days", icon: Send, color: "bg-[#fff0dd] text-[#ff9f1c]" },
  { label: "Profile Completion", value: "100%", change: "Excellent! 🎉", icon: CheckCircle, color: "bg-[#ebe5ff] text-[#4635ff]" },
];

function buildMetricCards(dashboard?: CreatorDashboardApi | null) {
  return [
    { ...metricCards[0], value: String(dashboard?.profile_view ?? 0) },
    { ...metricCards[1], value: String(dashboard?.brand_requests ?? 0) },
    { ...metricCards[2], value: String(dashboard?.campaign_applications ?? 0) },
    { ...metricCards[3], value: `${dashboard?.profile_completion ?? 0}%` },
  ];
}

const campaigns = [
  {
    title: "Fintech Startup",
    price: "₹25,000 - ₹40,000",
    copy: "Looking for creators who can simplify finance for millennials.",
    tag: "Business & Finance",
    tagColor: "bg-[#8b74ff]",
    deadline: "28 May 2024",
    image: campaignImages[0],
  },
  {
    title: "Food Brand",
    price: "₹15,000 - ₹30,000",
    copy: "Promote healthy eating and balanced lifestyle.",
    tag: "Lifestyle",
    tagColor: "bg-[#0eb783]",
    deadline: "26 May 2024",
    image: campaignImages[1],
  },
  {
    title: "Skincare Brand",
    price: "₹20,000 - ₹35,000",
    copy: "Create authentic content for daily skincare routine.",
    tag: "Beauty",
    tagColor: "bg-[#ec4899]",
    deadline: "30 May 2024",
    image: campaignImages[2],
  },
];

// const activity = [
//   { icon: Eye, color: "bg-[#ebe5ff] text-[#4635ff]", text: 'Brand "Fintech Startup" viewed your profile', time: "2 hours ago" },
//   { icon: Bell, color: "bg-[#fff0dd] text-[#ff9f1c]", text: 'Campaign "Skincare Brand" deadline approaching in 3 days', time: "5 hours ago" },
//   { icon: ShoppingBag, color: "bg-[#cbf8df] text-[#00b980]", text: 'New campaign "Travel App" matches your niche', time: "1 day ago" },
// ];

const quickActions = [
  { icon: UserRound, title: "Edit Profile", copy: "Update your information" },
  { icon: Eye, title: "View Public Profile", copy: "See how brands see you" },
  { icon: ShoppingBag, title: "Browse Campaigns", copy: "Explore new opportunities" },
  { icon: UserRound, title: "Update Portfolio", copy: "Add or edit your work" },
];


function MetricCard({ item }: { item: (typeof metricCards)[number]; key?: string }) {
  const Icon = item.icon;
  return (
    <Panel className="min-h-[238px] p-6">
      <span className={`grid h-11 w-11 place-items-center rounded-full ${item.color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-medium text-[#6f7889]">{item.label}</p>
      <strong className="mt-3 block text-[42px] font-black leading-none text-[#1d203a]">{item.value}</strong>
      <p className="mt-5 text-sm font-medium text-[#00a875]">{item.change}</p>
    </Panel>
  );
}

function CampaignCard({ campaign, index }: { campaign: (typeof campaigns)[number]; index: number; key?: string }) {
  return (
    <Panel className="overflow-hidden">
      <div className="relative h-48">
        <img src={campaign.image} alt="" className="h-full w-full object-cover" />
        {index < 2 ? <span className="absolute left-4 top-4 rounded-full bg-[#2f31e7] px-4 py-2 text-xs font-black text-white">New</span> : null}
        <button className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white">
          <Bookmark className="h-5 w-5 text-[#6f7889]" />
        </button>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-[#1d203a]">{campaign.title}</h3>
        <p className="mt-2 text-lg font-black text-[#1f22ff]">{campaign.price}</p>
        <p className="mt-4 min-h-[48px] text-[15px] font-medium leading-snug text-[#6f7889]">{campaign.copy}</p>
        <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-xs font-black text-white ${campaign.tagColor}`}>{campaign.tag}</span>
        <div className="mt-5 flex items-end justify-between gap-4">
          <p className="text-sm font-medium text-[#6f7889]">Deadline: {campaign.deadline}</p>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2f31e7] px-4 text-sm font-black text-white">
            Apply <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function VerifiedDashboard({ dashboard }: { dashboard?: CreatorDashboardApi | null }) {
  const navigate = useNavigate();
  const cards = buildMetricCards(dashboard);

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => <MetricCard key={item.label} item={item} />)}
      </div>

      <section>
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-[26px] font-black text-[#1d203a]">Campaign Marketplace</h2>
          <button type="button" onClick={() => navigate("/creator/marketplace")} className="inline-flex items-center gap-2 text-sm font-black text-[#1f22ff]">
            View all campaigns <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {campaigns.map((campaign, index) => <CampaignCard key={campaign.title} campaign={campaign} index={index} />)}
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2f31e7]" />
          <span className="h-2 w-2 rounded-full bg-[#dfe5f0]" />
          <span className="h-2 w-2 rounded-full bg-[#dfe5f0]" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.9fr_0.9fr]">

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1d203a]">Profile Performance</h2>
            <button className="rounded-lg border border-[#dfe4ed] px-4 py-2 text-sm text-[#6f7889]">Last 7 days⌄</button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              ["Profile Views", "127", "↑ 18%"],
              ["Unique Visitors", "89", "↑ 23%"],
              ["Avg. Profile Time", "1m 42s", "↑ 12%"],
            ].map(([label, value, change]) => (
              <div key={label}>
                <p className="text-sm text-[#6f7889]">{label}</p>
                <strong className="mt-3 block text-[32px] font-black text-[#1d203a]">{value}</strong>
                <p className="text-sm text-[#00a875]">{change}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 h-44 rounded-lg px-6 pb-4">
            <svg viewBox="0 0 520 170" className="h-full w-full">
              <path d="M35 135 H500" stroke="#dfe5f0" strokeWidth="2" />
              <path d="M35 20 V135" stroke="#dfe5f0" strokeWidth="2" />
              <path d="M35 76 C90 95,112 92,150 70 C202 38,240 45,280 36 C332 18,360 18,402 33 C440 45,470 47,500 49" fill="none" stroke="#8b7cff" strokeDasharray="8 8" strokeWidth="4" />
              {["10 May", "11 May", "12 May", "13 May"].map((label, index) => (
                <text key={label} x={70 + index * 120} y="158" fontSize="13" fill="#6f7889">{label}</text>
              ))}
            </svg>
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-xl font-black text-[#1d203a]">Quick Actions</h2>
          <div className="mt-7 grid gap-6">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} className="flex items-center gap-4 text-left">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ebe5ff] text-[#4635ff]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <strong className="block text-sm font-black text-[#1d203a]">{item.title}</strong>
                    <span className="text-xs text-[#6f7889]">{item.copy}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#6f7889]" />
                </button>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}


const CreatorDashBoard = () => {
  const { isVerified = false } = useOutletContext<DashboardContext>();
  const [dashboard, setDashboard] = useState<CreatorDashboardApi | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let mounted = true;

    getCreatorDashboard()
      .then((data) => {
        if (mounted) setDashboard(data);
      })
      .catch((error) => {
        if (mounted) setDashboardError(error instanceof Error ? error.message : "Unable to load dashboard.");
      })
      .finally(() => {
        if (mounted) setIsLoadingDashboard(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoadingDashboard) {
    return <Panel className="p-8 text-sm font-black text-[#6f7889]">Loading dashboard...</Panel>;
  }

  if (dashboardError) {
    return <Panel className="p-8 text-sm font-black text-[#b42318]">{dashboardError}</Panel>;
  }

  return isVerified ? <VerifiedDashboard dashboard={dashboard} /> : <UnderReviewDashboard dashboard={dashboard} />;
};

export default CreatorDashBoard;
