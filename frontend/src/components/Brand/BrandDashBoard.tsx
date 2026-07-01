import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Flag,
  Loader2,
  MoreVertical,
  Plus,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getBrandDashboard, type BrandDashboardApi, type BrandProfileApi } from "../../lib/authApi";
import { BrandCard, Panel, StatusPill } from "@/src/HtmlComponents/BrandCard";

type Metric = {
  label: string;
  value: number;
  link: string;
  icon: LucideIcon;
};

const BrandDashBoard = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandDashboardApi | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const result = await getBrandDashboard();
        console.log("result", result);
        if (!mounted) return;
        setBrand(result)
      } catch (error) {
        console.error("Failed to load brand dashboard", error);
        if (!mounted) return;
        setBrand(null);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);


  const brandName = brand?.company_name || "Brand";


  const metrics: Metric[] = [
    { label: "Active Campaigns", value: brand?.no_of_active_campaigns || 0, link: "/brand/campaigns", icon: Flag },
    { label: "Shortlists Submitted", value: brand?.no_of_active_shortlists || 0, link: "/brand/shortlists", icon: Star },
    { label: "Collaborations Active", value: brand?.collaborations_active || 0, link: "/brand/shortlists", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="mb-12 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#173ca8] font-semibold">Welcome {brandName}!</h1>
        </div>
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
        {metrics.map((metric) => <Panel className="min-h-[224px] p-7">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ebe5ff] text-[#6a75ff]">
            <metric.icon className="h-6 w-6" />
          </span>
          <p className="mt-6 text-base font-medium text-[#657084]">{metric.label}</p>
          <strong className="mt-3 block text-[46px] font-black leading-none text-black">{metric.value}</strong>
          <button type="button" onClick={() => navigate(metric.link)} className="mt-6 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
            View all {metric.label.toLowerCase().replace(" active", "s")} <ArrowRight className="h-4 w-4" />
          </button>
        </Panel>)}
      </div>

      <section className="mt-12">
        <SectionHeader title="Active Campaigns" path="/brand/campaigns" />
        <div className="grid gap-6 xl:grid-cols-4">
          {brand?.active_campaigns?.length === 0 ?
            <>
              <Panel className="grid min-h-[294px] place-items-center p-8 text-center xl:col-span-3">
                <div>
                  <h3 className="text-[21px] font-black text-black">No active campaigns</h3>
                  <p className="mx-auto mt-3 max-w-[320px] text-base font-medium leading-snug text-[#657084]">
                    Active campaigns from your backend will appear here after you publish one.
                  </p>
                </div>
              </Panel>
            </>
            :
            brand?.active_campaigns?.map((campaign, index) => (
                <BrandCard item={campaign} index={index} />
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
        <SectionHeader title="Submitted Shortlists" path="/brand/shortlists" />
        <div className="grid gap-6 xl:grid-cols-4">
          {brand?.active_shortlists?.length === 0 ?
            <>
              <Panel className="grid min-h-[294px] place-items-center p-8 text-center xl:col-span-3">
                <div>
                  <h3 className="text-[21px] font-black text-black">No submitted shortlists</h3>
                  <p className="mx-auto mt-3 max-w-[320px] text-base font-medium leading-snug text-[#657084]">
                    Submitted shortlists from your backend will appear here.
                  </p>
                </div>
              </Panel>
            </>
            :
            brand?.active_shortlists?.map((shortlist, index) => (
                <BrandCard item={shortlist} index={index} shortlist={true} />
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


function HeaderButton({ children, onClick, variant = "solid" }: { children: ReactNode; onClick: () => void; variant?: "solid" | "outline" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center gap-3 rounded-lg px-7 text-sm font-black ${variant === "solid"
        ? "bg-[#173ca8] text-white shadow-[0_8px_14px_rgba(23,60,168,0.22)]"
        : "border-2 border-[#173ca8] bg-white text-[#173ca8]"
        }`}
    >
      {children}
    </button>
  );
}


function SectionHeader({ title, path }: { title: string; path: string }) {
  const navigate = useNavigate();

  return (
    <div className="mb-7 flex items-center justify-between gap-4">
      <h3 className="text-[26px] font-black tracking-normal text-black font-bold">{title}</h3>
      <button type="button" onClick={() => navigate(path)} className="text-base font-black text-[#7b83ff]">View all</button>
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
export default BrandDashBoard;
