import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../contexts/AuthContext";
import {
  applyToCampaign,
  getCampaign,
  getCampaignApplications,
  getCampaigns,
  getCampaignStatusSummaries,
} from "../../../lib/authApi";
import type { CampaignStatusSummaryApi } from "../../../types";
import { CampaignMarketplaceDetail } from "./CampaignMarketplaceDetail";
import { CampaignMarketplaceList } from "./CampaignMarketplaceList";
import { applyStatusSummaries, mapCampaignToMarketplace, type MarketplaceCampaign } from "./marketplaceData";

type View = "list" | "detail";

export function CreatorCampaignMarketplace() {
  const { currentUser } = useAuth();
  const [view, setView] = useState<View>("list");
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [statusSummaries, setStatusSummaries] = useState<CampaignStatusSummaryApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");
    Promise.all([getCampaigns(), getCampaignStatusSummaries().catch(() => []), getCampaignApplications().catch(() => [])])
      .then(([items, summaries, applications]) => {
        if (!mounted) return;
        setStatusSummaries(summaries);
        setAppliedIds(applications.map((application) => application.campaign));
        const mapped = applyStatusSummaries(items, summaries).map(mapCampaignToMarketplace);
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
    try {
      const detail = await getCampaign(campaign.id);
      const [withSummary] = applyStatusSummaries([detail], statusSummaries);
      const mapped = mapCampaignToMarketplace(withSummary);
      setCampaigns((items) => items.map((item) => item.id === mapped.id ? mapped : item));
    } catch {
      // Keep the list payload if the detail request is unavailable.
    }
  };

  const applyForCampaign = async () => {
    if (!selectedCampaign || appliedIds.includes(selectedCampaign.id) || isApplying) return;
    setIsApplying(true);
    setApplyError("");
    try {
      const application = await applyToCampaign(selectedCampaign.id);
      setAppliedIds((ids) => ids.includes(application.campaign) ? ids : [...ids, application.campaign]);
      const [items, summaries] = await Promise.all([getCampaigns(), getCampaignStatusSummaries().catch(() => statusSummaries)]);
      setStatusSummaries(summaries);
      setCampaigns(applyStatusSummaries(items, summaries).map(mapCampaignToMarketplace));
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
