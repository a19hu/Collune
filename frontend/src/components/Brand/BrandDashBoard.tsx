import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle,
  Clock3,
  Eye,
  FileText,
  Lock,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  ShoppingBag,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";

type DashboardContext = { isVerified?: boolean; mode?: "creator" | "brand" };

const creators = [
  {
    name: "Aakrit Gupta",
    niche: "Business & Finance",
    audience: "120K",
    rate: "₹25,000",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Riya Mehta",
    niche: "Lifestyle",
    audience: "85K",
    rate: "₹18,000",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Kabir Anand",
    niche: "Technology",
    audience: "210K",
    rate: "₹40,000",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  },
];

const metricCards = [
  { label: "Campaign Views", value: "2.4K", change: "↑ 22% vs last 7 days", icon: Eye, color: "bg-[#ebe5ff] text-[#4635ff]" },
  { label: "Creator Applications", value: "48", change: "↑ 31% vs last 7 days", icon: Users, color: "bg-[#cbf8df] text-[#00b980]" },
  { label: "Active Campaigns", value: "6", change: "↑ 12% vs last 7 days", icon: Megaphone, color: "bg-[#fff0dd] text-[#ff9f1c]" },
  { label: "Profile Completion", value: "100%", change: "Excellent! 🎉", icon: CheckCircle, color: "bg-[#ebe5ff] text-[#4635ff]" },
];

const campaignCards = [
  {
    title: "Fintech Awareness",
    budget: "₹2.5L Budget",
    copy: "Find finance creators who can explain investment products clearly.",
    status: "Active",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Healthy Food Launch",
    budget: "₹1.8L Budget",
    copy: "Invite food and lifestyle creators for a new product launch.",
    status: "Reviewing",
    image: "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Skincare Routine",
    budget: "₹3.2L Budget",
    copy: "Shortlist beauty creators for authentic daily routine content.",
    status: "Draft",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
  },
];

const activity = [
  { icon: UserPlus, color: "bg-[#ebe5ff] text-[#4635ff]", text: 'Creator "Aakrit Gupta" applied to Fintech Awareness', time: "2 hours ago" },
  { icon: MessageCircle, color: "bg-[#fff0dd] text-[#ff9f1c]", text: 'Riya Mehta replied to your campaign request', time: "5 hours ago" },
  { icon: ShoppingBag, color: "bg-[#cbf8df] text-[#00b980]", text: "New creators match your Technology campaign", time: "1 day ago" },
];

const quickActions = [
  { icon: Plus, title: "Create Campaign", copy: "Launch a new creator brief" },
  { icon: Users, title: "Browse Creators", copy: "Find creators by niche" },
  { icon: FileText, title: "Review Applications", copy: "See creator proposals" },
  { icon: Building2, title: "Edit Company Profile", copy: "Update brand information" },
];

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[#e1e5ec] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
      {children}
    </section>
  );
}

function ClockIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#2f31e7]">
      <span className="h-2 w-px bg-[#2f31e7]" />
    </span>
  );
}

function LockedPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <Panel className="grid min-h-[348px] place-items-center p-8 text-center">
      <div>
        <Lock className="mx-auto h-12 w-12 text-[#8b7cff]" />
        <h3 className="mt-7 text-xl font-black text-[#343b4d]">{title}</h3>
        <p className="mx-auto mt-4 max-w-sm text-[15px] font-medium leading-snug text-[#6f7889]">{copy}</p>
        <button className="mt-7 h-12 rounded-lg border-2 border-[#2f31e7] px-8 text-sm font-black text-[#2f31e7]">
          Learn More
        </button>
      </div>
    </Panel>
  );
}

function UnderReviewBrandDashboard() {
  const steps = [
    ["We review your brand", "Our team checks your company details"],
    ["We verify your company", "We confirm your website and brand presence"],
    ["Your brand profile goes live", "You'll get notified once approved"],
    ["Creators can discover you", "You can launch campaigns and receive applicants"],
  ];

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="min-h-[432px] p-8">
          <div className="flex items-start justify-between">
            <h2 className="text-[22px] font-black text-[#1d203a]">Brand Verification</h2>
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e9e2ff] text-[#2f31e7]">
              <Building2 className="h-8 w-8" />
            </span>
          </div>
          <div className="mt-8 grid gap-5">
            {[
              ["Account Created", true],
              ["Company Information Added", true],
              ["Verification In Progress", false],
            ].map(([label, done]) => (
              <div key={label as string} className="flex items-start gap-4">
                {done ? <CheckCircle className="h-5 w-5 fill-[#16b989] text-white" /> : <ClockIcon />}
                <div>
                  <p className="font-semibold text-[#343b4d]">{label as string}</p>
                  {!done ? <p className="mt-1 text-sm font-medium text-[#6f7889]">Our team is reviewing your brand</p> : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-4 rounded-lg bg-[#f6f2ff] p-5">
            <CalendarDays className="h-5 w-5 text-[#2f31e7]" />
            <div>
              <p className="text-sm font-medium text-[#7a8496]">Expected completion:</p>
              <p className="font-black text-[#1d203a]">Within 24 hours</p>
            </div>
          </div>
        </Panel>

        <Panel className="min-h-[432px] p-8">
          <h2 className="text-[22px] font-black text-[#1d203a]">What happens next?</h2>
          <div className="mt-7 grid gap-5">
            {steps.map(([title, copy], index) => (
              <div key={title} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#2f31e7] text-sm font-black text-white">{index + 1}</span>
                <div>
                  <h3 className="font-black text-[#1d203a]">{title}</h3>
                  <p className="mt-1 text-sm font-medium text-[#6f7889]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="min-h-[432px] p-8 text-center">
          <h2 className="text-[22px] font-black text-[#1d203a] text-left">Complete your company profile</h2>
          <div className="mx-auto mt-16 grid h-[132px] w-[132px] place-items-center rounded-full border-[10px] border-[#2f31e7] text-center">
            <div>
              <strong className="block text-[36px] font-black text-[#2f31e7]">90%</strong>
              <span className="text-sm font-medium text-[#6f7889]">Complete</span>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-xs text-[15px] font-medium leading-snug text-[#6f7889]">
            A complete brand profile helps creators trust and respond to your campaigns.
          </p>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <LockedPanel title="Creator Marketplace" copy="Once your brand is verified, you'll be able to discover and shortlist creators." />
        <LockedPanel title="Campaign Builder" copy="Complete verification first. Once approved, you can launch briefs and invite creators." />
      </div>
    </div>
  );
}

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

function CampaignCard({ campaign, index }: { campaign: (typeof campaignCards)[number]; index: number; key?: string }) {
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
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-black text-[#1d203a]">{campaign.title}</h3>
          <span className="rounded-full bg-[#cbf8df] px-3 py-1 text-xs font-black text-[#00a875]">{campaign.status}</span>
        </div>
        <p className="mt-2 text-lg font-black text-[#1f22ff]">{campaign.budget}</p>
        <p className="mt-4 min-h-[48px] text-[15px] font-medium leading-snug text-[#6f7889]">{campaign.copy}</p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-[#6f7889]">Applicants: {index === 0 ? 18 : index === 1 ? 12 : 6}</p>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2f31e7] px-4 text-sm font-black text-white">
            Manage <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function CreatorCard({ creator, key: _key }: { creator: (typeof creators)[number]; key?: string }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center gap-4">
        <img src={creator.image} alt="" className="h-14 w-14 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-[#1d203a]">{creator.name}</h3>
          <p className="text-sm text-[#6f7889]">{creator.niche}</p>
        </div>
        <button className="rounded-lg border border-[#dfe5f0] p-2 text-[#2f31e7]">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-[#f6f7fb] p-3">
          <p className="text-[#6f7889]">Audience</p>
          <strong className="text-[#1d203a]">{creator.audience}</strong>
        </div>
        <div className="rounded-lg bg-[#f6f7fb] p-3">
          <p className="text-[#6f7889]">Starts at</p>
          <strong className="text-[#1d203a]">{creator.rate}</strong>
        </div>
      </div>
      <button className="mt-5 h-10 w-full rounded-lg bg-[#2f31e7] text-sm font-black text-white">
        Invite Creator
      </button>
    </Panel>
  );
}

function VerifiedBrandDashboard() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => <MetricCard key={item.label} item={item} />)}
      </div>

      <section>
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-[26px] font-black text-[#1d203a]">Campaign Management</h2>
          <a href="/brand-dashboard/campaigns" className="inline-flex items-center gap-2 text-sm font-black text-[#1f22ff]">
            View all campaigns <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {campaignCards.map((campaign, index) => <CampaignCard key={campaign.title} campaign={campaign} index={index} />)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
        <Panel className="p-6">
          <h2 className="text-xl font-black text-[#1d203a]">Recent<br />Activity</h2>
          <div className="mt-7 grid gap-6">
            {activity.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex gap-4">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-medium leading-snug text-[#1d203a]">{item.text}</p>
                    <p className="mt-2 text-sm text-[#6f7889]">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <a href="/brand-dashboard/activity" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#1f22ff]">
            View all activity <ArrowRight className="h-4 w-4" />
          </a>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1d203a]">Campaign Performance</h2>
            <button className="rounded-lg border border-[#dfe4ed] px-4 py-2 text-sm text-[#6f7889]">Last 7 days⌄</button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              ["Total Reach", "1.8M", "↑ 28%"],
              ["Applications", "48", "↑ 31%"],
              ["Avg. Response", "5h 20m", "↑ 16%"],
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
              <path d="M35 94 C90 75,116 88,154 55 C204 18,244 42,285 32 C335 18,364 22,406 42 C444 60,472 50,500 35" fill="none" stroke="#8b7cff" strokeDasharray="8 8" strokeWidth="4" />
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

      <section>
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-[26px] font-black text-[#1d203a]">Recommended Creators</h2>
          <a href="/brand-dashboard/creators" className="inline-flex items-center gap-2 text-sm font-black text-[#1f22ff]">
            Browse creators <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {creators.map((creator) => <CreatorCard key={creator.name} creator={creator} />)}
        </div>
      </section>
    </div>
  );
}

const BrandDashBoard = () => {
  const { isVerified = false } = useOutletContext<DashboardContext>();
  return isVerified ? <VerifiedBrandDashboard /> : <UnderReviewBrandDashboard />;
};

export default BrandDashBoard;
