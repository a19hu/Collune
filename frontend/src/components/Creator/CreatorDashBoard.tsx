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
import { getCreatorDashboard } from "../../lib/authApi";
import type { CreatorDashboardApi } from "../../types";
import { Panel } from "@/src/HtmlComponents/BrandCard";
import { UnderReviewDashboard } from "./UnderReviewDashboard";

type DashboardContext = { isVerified?: boolean };

const fallbackCampaignImage = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80";

const metricCards = [
  { label: "Recommended Campaigns", value: "0", icon: ShoppingBag, color: "bg-[#ebe5ff] text-[#4635ff]" },
  { label: "Connected Platforms", value: "0", icon: Users, color: "bg-[#cbf8df] text-[#00b980]" },
  { label: "Campaign Applications", value: "8", icon: Send, color: "bg-[#fff0dd] text-[#ff9f1c]" },
  { label: "Profile Completion", value: "100%", icon: CheckCircle, color: "bg-[#ebe5ff] text-[#4635ff]" },
];

function buildMetricCards(dashboard?: CreatorDashboardApi | null) {
  return [
    { ...metricCards[0], value: String(dashboard?.campaigns?.length ?? 0) },
    { ...metricCards[1], value: String(dashboard?.connected_platforms ?? 0) },
    { ...metricCards[2], value: String(dashboard?.campaign_applications ?? 0) },
    { ...metricCards[3], value: `${dashboard?.profile_completion ?? 0}%` },
  ];
}

const chartPeriods = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

function buildChartPolyline(points: NonNullable<CreatorDashboardApi["recommended_campaigns_chart"]>) {
  if (!points.length) return "";
  const maxValue = Math.max(...points.map((point) => point.recommended_campaigns), 1);
  const width = 465;
  const step = points.length > 1 ? width / (points.length - 1) : 0;

  return points
    .map((point, index) => {
      const x = 35 + step * index;
      const y = 135 - (point.recommended_campaigns / maxValue) * 105;
      return `${x},${y}`;
    })
    .join(" ");
}

type RecommendedCampaign = NonNullable<CreatorDashboardApi["campaigns"]>[number];

function formatCampaignDeadline(value: string | null) {
  if (!value) return "Deadline not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// const activity = [
//   { icon: Eye, color: "bg-[#ebe5ff] text-[#4635ff]", text: 'Brand "Fintech Startup" viewed your profile', time: "2 hours ago" },
//   { icon: Bell, color: "bg-[#fff0dd] text-[#ff9f1c]", text: 'Campaign "Skincare Brand" deadline approaching in 3 days', time: "5 hours ago" },
//   { icon: ShoppingBag, color: "bg-[#cbf8df] text-[#00b980]", text: 'New campaign "Travel App" matches your niche', time: "1 day ago" },
// ];

const quickActions = [
  { icon: UserRound, title: "Edit Profile", copy: "Update your information", path: "/creator/profile" },
  { icon: Eye, title: "View Public Profile", copy: "See how brands see you", path: "/creator/profile" },
  { icon: ShoppingBag, title: "Browse Campaigns", copy: "Explore new opportunities", path: "/creator/marketplace" },
];


function MetricCard({ item }: { item: (typeof metricCards)[number]; key?: string }) {
  const Icon = item.icon;
  return (
    <Panel className="min-h-[200px] p-6">
      <span className={`grid h-11 w-11 place-items-center rounded-full ${item.color}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-medium text-[#6f7889]">{item.label}</p>
      <strong className="mt-3 block text-[42px] font-black leading-none text-[#1d203a]">{item.value}</strong>
    </Panel>
  );
}

function CampaignCard({ campaign, index }: { campaign: RecommendedCampaign; index: number; key?: string }) {
  const navigate = useNavigate();
  const image = campaign.cover_image || fallbackCampaignImage;
  const deadline = formatCampaignDeadline(campaign.deadline);

  return (
    <Panel className="overflow-hidden">
      <div className="relative h-48">
        <img src={image} alt="" className="h-full w-full object-cover" />
        {index < 2 ? <span className="absolute left-4 top-4 rounded-full bg-[#2f31e7] px-4 py-2 text-xs font-black text-white">New</span> : null}
        <button className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white">
          <Bookmark className="h-5 w-5 text-[#6f7889]" />
        </button>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-[#1d203a]">{campaign.title}</h3>
        <p className="mt-2 text-sm font-black uppercase tracking-wide text-[#1f22ff]">Recommended match</p>
        <p className="mt-4 min-h-[48px] text-[15px] font-medium leading-snug text-[#6f7889]">{campaign.objective || "Campaign objective not provided."}</p>
        <span className="mt-4 inline-flex rounded-full bg-[#8b74ff] px-4 py-2 text-xs font-black text-white">{campaign.looking_for || "Creators"}</span>
        <div className="mt-5 flex items-end justify-between gap-4">
          <p className="text-sm font-medium text-[#6f7889]">Deadline: {deadline}</p>
          <button type="button" onClick={() => navigate("/creator/marketplace")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2f31e7] px-4 text-sm font-black text-white">
            Apply <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function VerifiedDashboard({
  dashboard,
  chartPeriod,
  onChartPeriodChange,
}: {
  dashboard?: CreatorDashboardApi | null;
  chartPeriod: string;
  onChartPeriodChange: (period: string) => void;
}) {
  const navigate = useNavigate();
  const cards = buildMetricCards(dashboard);
  const recommendedCampaigns = dashboard?.campaigns ?? [];
  const chartData = dashboard?.recommended_campaigns_chart ?? [];
  const chartPolyline = buildChartPolyline(chartData);
  const chartLabels = chartData.filter((_, index) => {
    if (chartData.length <= 7) return true;
    return index === 0 || index === chartData.length - 1 || index % Math.ceil(chartData.length / 4) === 0;
  });

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
        {recommendedCampaigns.length ? (
          <>
            <div className="grid gap-6 xl:grid-cols-3">
              {recommendedCampaigns.map((campaign, index) => <CampaignCard key={campaign.id} campaign={campaign} index={index} />)}
            </div>
          </>
        ) : (
          <Panel className="p-8 text-center">
            <h3 className="text-lg font-black text-[#1d203a]">No matching campaigns yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#6f7889]">
              We will show recommended campaigns here when active campaigns match your profile.
            </p>
          </Panel>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.9fr_0.9fr]">

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1d203a]">Opportunity Pipeline</h2>
            <select
              value={chartPeriod}
              onChange={(event) => onChartPeriodChange(event.target.value)}
              className="rounded-lg border border-[#dfe4ed] bg-white px-4 py-2 text-sm font-medium text-[#6f7889]"
            >
              {chartPeriods.map((period) => (
                <option key={period.value} value={period.value}>{period.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-1 h-60 rounded-lg px-6 pb-4">
            <svg viewBox="0 0 520 170" className="h-full w-full">
              <path d="M35 135 H500" stroke="#dfe5f0" strokeWidth="2" />
              <path d="M35 20 V135" stroke="#dfe5f0" strokeWidth="2" />
              {chartPolyline ? (
                <polyline points={chartPolyline} fill="none" stroke="#8b7cff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
              {chartData.map((point, index) => {
                const maxValue = Math.max(...chartData.map((item) => item.recommended_campaigns), 1);
                const step = chartData.length > 1 ? 465 / (chartData.length - 1) : 0;
                const x = 35 + step * index;
                const y = 135 - (point.recommended_campaigns / maxValue) * 105;
                return <circle key={point.date} cx={x} cy={y} r="4" fill="#2f31e7" />;
              })}
              {chartLabels.map((point) => (
                <text key={point.date} x={35 + (chartData.findIndex((item) => item.date === point.date) * (chartData.length > 1 ? 465 / (chartData.length - 1) : 0))} y="158" fontSize="13" fill="#6f7889">{point.label}</text>
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
                <button key={item.title} type="button" onClick={() => navigate(item.path)} className="flex items-center gap-4 text-left">
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
  const [chartPeriod, setChartPeriod] = useState("7d");

  useEffect(() => {
    let mounted = true;

    getCreatorDashboard(chartPeriod)
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
  }, [chartPeriod]);

  if (isLoadingDashboard) {
    return <Panel className="p-8 text-sm font-black text-[#6f7889]">Loading dashboard...</Panel>;
  }

  if (dashboardError) {
    return <Panel className="p-8 text-sm font-black text-[#b42318]">{dashboardError}</Panel>;
  }

  return isVerified ? (
    <VerifiedDashboard dashboard={dashboard} chartPeriod={chartPeriod} onChartPeriodChange={setChartPeriod} />
  ) : (
    <UnderReviewDashboard dashboard={dashboard} />
  );
};

export default CreatorDashBoard;
