import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  Flag,
  Handshake,
  MoreVertical,
  Plus,
  Rocket,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getBrandMe, getBrandShortlists, getCampaigns } from "../../lib/authApi";
import { mapCampaignApiToCard, type CampaignCardItem } from "./Campaigns/campaignData";
import { mapShortlistApiToItem, type ShortlistItem } from "./Shortlists/shortlistData";

type Metric = {
  label: string;
  value: number;
  link: string;
  icon: LucideIcon;
};

const statusClasses: Record<string, string> = {
  Open: "bg-[#cbf8df] text-[#009b67]",
  Draft: "bg-[#dce9ff] text-[#2f6df6]",
  Submitted: "bg-[#dce9ff] text-[#2f6df6]",
  "Outreach In Progress": "bg-[#ffd7a8] text-[#cf4e00]",
  Completed: "bg-[#ccf8e0] text-[#009b67]",
  "Creator Outreach In Progress": "bg-[#ffd7a8] text-[#cf4e00]",
  "Deal Discussion Ongoing": "bg-[#e9d5ff] text-[#7c2cff]",
};

const campaignIconStyles = [
  "bg-[#ebe5ff] text-[#6a75ff]",
  "bg-[#ffe1e5] text-[#ef4444]",
  "bg-[#fff0bc] text-[#d78a00]",
];

const shortlistIconStyles = [
  "bg-[#dce9ff] text-[#2f6df6]",
  "bg-[#ebe5ff] text-[#7b83ff]",
  "bg-[#ccf8e0] text-[#00a875]",
];

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#dfe5ee] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
      {children}
    </section>
  );
}

function HeaderButton({ children, onClick, variant = "solid" }: { children: ReactNode; onClick: () => void; variant?: "solid" | "outline" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center gap-3 rounded-lg px-7 text-sm font-black ${
        variant === "solid"
          ? "bg-[#173ca8] text-white shadow-[0_8px_14px_rgba(23,60,168,0.22)]"
          : "border-2 border-[#173ca8] bg-white text-[#173ca8]"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({ metric }: { key?: string; metric: Metric }) {
  const Icon = metric.icon;

  return (
    <Panel className="min-h-[224px] p-7">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ebe5ff] text-[#6a75ff]">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-6 text-base font-medium text-[#657084]">{metric.label}</p>
      <strong className="mt-3 block text-[46px] font-black leading-none text-black">{metric.value}</strong>
      <a href={metric.link} className="mt-6 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
        View all {metric.label.toLowerCase().replace(" active", "s")} <ArrowRight className="h-4 w-4" />
      </a>
    </Panel>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-7 flex items-center justify-between gap-4">
      <h2 className="text-[26px] font-black tracking-normal text-black">{title}</h2>
      <a href={href} className="text-base font-black text-[#7b83ff]">View all</a>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className={`inline-flex h-7 w-max items-center rounded-lg px-4 text-sm font-black ${statusClasses[label] || "bg-[#dce9ff] text-[#2f6df6]"}`}>
      {label}
    </span>
  );
}

function CampaignDashboardCard({ campaign, index, onOpen }: { key?: string; campaign: CampaignCardItem; index: number; onOpen: () => void }) {
  const Icon = campaign.icon;

  return (
    <Panel className="min-h-[294px] p-6">
      <div className="flex items-start justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-full ${campaignIconStyles[index % campaignIconStyles.length]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <button type="button" onClick={onOpen} className="text-[#657084]" aria-label={`${campaign.title} options`}>
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <h3 className="mt-7 min-h-[58px] text-[21px] font-black leading-snug text-black">{campaign.title}</h3>
      <div className="mt-3">
        <StatusPill label="Open" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-base text-[#657084]">
        <CardMetric value={campaign.applications} label="Applications" />
        <CardMetric value={campaign.recommended} label="Recommended" />
      </div>
      <button type="button" onClick={onOpen} className="mt-5 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
        View Campaign <ArrowRight className="h-4 w-4" />
      </button>
    </Panel>
  );
}

function ShortlistDashboardCard({ shortlist, index, onOpen }: { key?: string; shortlist: ShortlistItem; index: number; onOpen: () => void }) {
  const Icon = shortlist.icon;

  return (
    <Panel className="min-h-[244px] p-6">
      <div className="flex items-start justify-between">
        <span className={`grid h-12 w-12 place-items-center rounded-full ${shortlistIconStyles[index % shortlistIconStyles.length]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <button type="button" onClick={onOpen} className="text-[#657084]" aria-label={`${shortlist.title} options`}>
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      <h3 className="mt-7 text-[21px] font-black leading-tight text-black">{shortlist.title.replace(" Creators", "")}</h3>
      <p className="mt-4 text-base font-medium text-[#657084]">{shortlist.creators.length} Creators</p>
      <div className="mt-5">
        <StatusPill label={shortlist.status} />
      </div>
      <button type="button" onClick={onOpen} className="mt-5 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
        View Details <ArrowRight className="h-4 w-4" />
      </button>
    </Panel>
  );
}

function CardMetric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <strong className="block text-base font-medium text-[#657084]">{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CreateCard({
  title,
  copy,
  action,
  onClick,
}: {
  title: string;
  copy: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Panel className="grid min-h-[294px] place-items-center p-8 text-center transition hover:border-[#7b83ff] hover:shadow-sm">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ebe5ff] text-[#7b83ff]">
            <Plus className="h-8 w-8" />
          </span>
          <h3 className="mt-7 text-[21px] font-black text-black">{title}</h3>
          <p className="mx-auto mt-4 max-w-[250px] text-base font-medium leading-snug text-[#657084]">{copy}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
            {action} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Panel>
    </button>
  );
}

function getDashboardCampaigns(campaigns: CampaignCardItem[]) {
  return campaigns
    .filter((campaign) => campaign.status === "Active")
    .sort((a, b) => a.updatedRank - b.updatedRank)
    .slice(0, 3);
}

const fallbackCampaigns: CampaignCardItem[] = [
  {
    id: "financial-literacy",
    title: "Financial Literacy Campaign",
    status: "Active",
    applications: 23,
    recommended: 12,
    updatedAt: "Updated today",
    updatedRank: 1,
    budget: "$10K - $50K",
    objective: "Increase financial literacy awareness.",
    timeline: "Jun 20, 2025 - Jul 20, 2025",
    platforms: ["Instagram", "YouTube"],
    category: "Finance",
    icon: Flag,
    iconClassName: "bg-[#ebe5ff] text-[#6a75ff]",
  },
  {
    id: "product-launch",
    title: "Product Launch Campaign",
    status: "Active",
    applications: 18,
    recommended: 7,
    updatedAt: "Updated today",
    updatedRank: 2,
    budget: "$10K - $30K",
    objective: "Launch a new product with creators.",
    timeline: "Jul 1, 2025 - Aug 1, 2025",
    platforms: ["Instagram"],
    category: "Launch",
    icon: Rocket,
    iconClassName: "bg-[#ffe1e5] text-[#ef4444]",
  },
  {
    id: "brand-awareness",
    title: "Brand Awareness Campaign",
    status: "Active",
    applications: 15,
    recommended: 6,
    updatedAt: "Updated today",
    updatedRank: 3,
    budget: "$15K - $35K",
    objective: "Grow brand awareness.",
    timeline: "Jul 10, 2025 - Aug 20, 2025",
    platforms: ["LinkedIn"],
    category: "Brand",
    icon: BriefcaseBusiness,
    iconClassName: "bg-[#fff0bc] text-[#d78a00]",
  },
];

const BrandDashBoard = () => {
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState("Acme Labs");
  const [campaigns, setCampaigns] = useState<CampaignCardItem[]>([]);
  const [shortlists, setShortlists] = useState<ShortlistItem[]>([]);

  useEffect(() => {
    let mounted = true;

    getBrandMe()
      .then((brand) => {
        if (mounted) setBrandName(brand.company_name || "Acme Labs");
      })
      .catch(() => undefined);

    getCampaigns()
      .then((items) => {
        if (mounted) setCampaigns(items.map(mapCampaignApiToCard));
      })
      .catch(() => {
        if (mounted) setCampaigns([]);
      });

    getBrandShortlists()
      .then((items) => {
        if (mounted) setShortlists(items.map(mapShortlistApiToItem));
      })
      .catch(() => {
        if (mounted) setShortlists([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleCampaigns = useMemo(() => {
    const activeCampaigns = getDashboardCampaigns(campaigns);
    return activeCampaigns.length ? activeCampaigns : fallbackCampaigns;
  }, [campaigns]);

  const submittedShortlists = useMemo(
    () => shortlists.filter((shortlist) => shortlist.status !== "Draft").sort((a, b) => a.updatedRank - b.updatedRank).slice(0, 3),
    [shortlists],
  );
  const activeCollaborations = useMemo(
    () => shortlists.filter((shortlist) => shortlist.status === "Outreach In Progress").length,
    [shortlists],
  );

  const metrics: Metric[] = [
    { label: "Active Campaigns", value: visibleCampaigns.length, link: "/brand/campaigns", icon: Flag },
    { label: "Shortlists Submitted", value: shortlists.filter((shortlist) => shortlist.status !== "Draft").length, link: "/brand/shortlists", icon: Star },
    { label: "Collaborations Active", value: activeCollaborations, link: "/brand/shortlists", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
        <h1 className="text-[28px] font-black tracking-normal text-[#173ca8]">Welcome {brandName}!</h1>
        <div className="flex flex-wrap items-center gap-3">
          <HeaderButton onClick={() => navigate("/brand/campaigns")}>
            <Plus className="h-5 w-5" />
            Create Campaign
          </HeaderButton>
          <HeaderButton onClick={() => navigate("/brand/shortlists")} variant="outline">
            <Plus className="h-5 w-5" />
            Build Shortlist
          </HeaderButton>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
      </div>

      <section className="mt-12">
        <SectionHeader title="Active Campaigns" href="/brand/campaigns" />
        <div className="grid gap-6 xl:grid-cols-4">
          {visibleCampaigns.map((campaign, index) => (
            <CampaignDashboardCard key={campaign.id} campaign={campaign} index={index} onOpen={() => navigate("/brand/campaigns")} />
          ))}
          <CreateCard
            title="Create New Campaign"
            copy="Launch a campaign and find the right creators."
            action="Get Started"
            onClick={() => navigate("/brand/campaigns")}
          />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeader title="Submitted Shortlists" href="/brand/shortlists" />
        <div className="grid gap-6 xl:grid-cols-4">
          {submittedShortlists.map((shortlist, index) => (
            <ShortlistDashboardCard key={shortlist.id} shortlist={shortlist} index={index} onOpen={() => navigate("/brand/shortlists")} />
          ))}
          <CreateCard
            title="Build a Shortlist"
            copy="Discover creators and build your custom shortlist."
            action="Discover Creators"
            onClick={() => navigate("/brand/shortlists")}
          />
        </div>
      </section>
    </div>
  );
};

export default BrandDashBoard;
