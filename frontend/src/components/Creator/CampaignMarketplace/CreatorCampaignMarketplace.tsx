import { useEffect, useMemo, useState } from "react";

import {
  applyToCampaign,
  getCampaignApplications,
  getCreatorCampaigns,
} from "../../../lib/authApi";
import { CampaignMarketplaceDetail } from "./CampaignMarketplaceDetail";
import { CampaignMarketplaceList } from "./CampaignMarketplaceList";
import { mapCreatorCampaignToMarketplace, type MarketplaceCampaign } from "./marketplaceData";

type View = "list" | "detail";

export function CreatorCampaignMarketplace() {
  const [view, setView] = useState<View>("list");
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");
    Promise.all([getCreatorCampaigns(), getCampaignApplications().catch(() => [])])
      .then(([items, applications]) => {
        if (!mounted) return;
        setAppliedIds(applications.map((application) => application.campaign));
        const mapped = items.map(mapCreatorCampaignToMarketplace);
        setCampaigns(mapped);
        if (mapped[0]) setSelectedId(mapped[0].id);
      })
      .catch((err) => {
        if (!mounted) return;
        setCampaigns([]);
        setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || campaigns[0],
    [campaigns, selectedId],
  );

  const openCampaign = async (campaign: MarketplaceCampaign) => {
    setSelectedId(campaign.id);
    setView("detail");
  };

  const applyForCampaign = async () => {
    if (!selectedCampaign || appliedIds.includes(selectedCampaign.id) || isApplying) return;
    setIsApplying(true);
    setApplyError("");
    try {
      const application = await applyToCampaign(selectedCampaign.id);
      setAppliedIds((ids) => ids.includes(application.campaign) ? ids : [...ids, application.campaign]);
      const items = await getCreatorCampaigns();
      setCampaigns(items.map(mapCreatorCampaignToMarketplace));
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Unable to apply to this campaign.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {view === "detail" && selectedCampaign ? (
        <CampaignMarketplaceDetail
          campaign={selectedCampaign}
          hasApplied={appliedIds.includes(selectedCampaign.id)}
          isApplying={isApplying}
          applyError={applyError}
          onApply={applyForCampaign}
        />
      ) : (
        <CampaignMarketplaceList campaigns={campaigns} isLoading={isLoading} error={error} onOpen={openCampaign} />
      )}
    </div>
  );
}
