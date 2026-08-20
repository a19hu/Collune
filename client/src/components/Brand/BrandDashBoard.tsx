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

import { deleteBrandCampaign, getBrandDashboard } from "../../lib/authApi";
import type { BrandDashboardApi, BrandProfileApi } from "../../types";
import { BrandCard, Panel, StatusPill, type BrandCardItem } from "@/src/HtmlComponents/BrandCard";
import { DeleteCampaignModal } from "./BrandCampaigns";

type Metric = {
  label: string;
  value: number;
  link: string;
  icon: LucideIcon;
  ctaLabel: string;
};

const BrandDashBoard = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandDashboardApi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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


  const metrics: Metric[] = [
    { label: "Active Campaigns", value: brand?.no_of_active_campaigns || 0, link: "/brand/campaigns", icon: Flag, ctaLabel: "View all campaigns" },
    { label: "Shortlists Submitted", value: brand?.no_of_active_shortlists || 0, link: "/brand/shortlists", icon: Star, ctaLabel: "View all shortlists" },
    { label: "Collaborations Active", value: brand?.collaborations_active || 0, link: "/brand/shortlists", icon: Users, ctaLabel: "View all collaborations" },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBrandCampaign(deleteTarget.id);
      setBrand((current) => current ? {
        ...current,
        no_of_active_campaigns: Math.max(0, current.no_of_active_campaigns - 1),
        active_campaigns: current.active_campaigns.filter((campaign) => campaign.id !== deleteTarget.id),
      } : current);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete campaign", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
<>
      <div className="grid gap-6 xl:grid-cols-3">
        {metrics.map((metric) => <Panel className="min-h-[224px] p-7">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ebe5ff] text-[#6a75ff]">
            <metric.icon className="h-6 w-6" />
          </span>
          <p className="mt-6 text-base font-medium text-[#657084]">{metric.label}</p>
          <strong className="mt-3 block text-[46px] font-black leading-none text-black">{metric.value}</strong>
          <button type="button" onClick={() => navigate(metric.link)} className="mt-6 inline-flex items-center gap-2 text-base font-black text-[#7b83ff]">
            {metric.ctaLabel} <ArrowRight className="h-4 w-4" />
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
                <BrandCard
                  item={campaign}
                  index={index}
                  onEdit={(item) => navigate(`/brand/campaigns/${item.id}/edit`)}
                  onDelete={setDeleteTarget}
                />
            ))}
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
        </div>
      </section>
      <DeleteCampaignModal
        campaign={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

function SectionHeader({ title, path }: { title: string; path: string }) {
  const navigate = useNavigate();

  return (
    <div className="mb-7 flex items-center justify-between gap-4">
      <h3 className="text-[26px] font-black tracking-normal text-black font-bold">{title}</h3>
      <button type="button" onClick={() => navigate(path)} className="text-base font-black text-[#7b83ff]">View all</button>
    </div>
  );
}

export default BrandDashBoard;
