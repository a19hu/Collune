import { useState } from "react";
import { Plus } from "lucide-react";

import { CampaignCreateForm } from "./Campaigns/CampaignCreateForm";
import { CampaignDetail } from "./Campaigns/CampaignDetail";
import { CampaignList } from "./Campaigns/CampaignList";
import type { CampaignCardItem } from "./Campaigns/campaignData";

type CampaignView = "list" | "create" | "detail";

export const BrandCampaigns = () => {
  const [view, setView] = useState<CampaignView>("list");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCardItem | null>(null);
  const isCreateView = view === "create";
  const isDetailView = view === "detail";

  const openCampaign = (campaign: CampaignCardItem) => {
    setSelectedCampaign(campaign);
    setView("detail");
  };

  const showList = () => {
    setSelectedCampaign(null);
    setView("list");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black tracking-normal text-[#173ca8]">
            {isCreateView ? "Create new campaign" : isDetailView ? selectedCampaign?.title : "Campaigns"}
          </h1>
        </div>

        {isCreateView || isDetailView ? (
          <button
            type="button"
            onClick={showList}
            className="h-11 rounded-lg border border-[#d8e2fb] px-5 text-sm font-black text-[#173ca8]"
          >
            Back to Campaigns
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setView("create")}
            className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#173ca8] px-7 text-sm font-black text-white shadow-[0_8px_14px_rgba(23,60,168,0.22)]"
          >
            <Plus className="h-5 w-5" />
            Create Campaign
          </button>
        )}
      </header>

      {isCreateView ? <CampaignCreateForm onCreated={showList} /> : isDetailView && selectedCampaign ? (
        <CampaignDetail campaign={selectedCampaign} onBack={showList} />
      ) : (
        <CampaignList onCreate={() => setView("create")} onSelect={openCampaign} />
      )}
    </div>
  );
};
