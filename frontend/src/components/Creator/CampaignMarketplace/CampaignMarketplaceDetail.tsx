import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { applyToCampaign, getCampaignApplications, getCreatorCampaignDetail } from "../../../lib/authApi";
import {
  BrandAvatar,
  BrandBlock,
  DeliverableCard,
  DetailSection,
  OverviewCard,
  Panel,
  ReferenceCard,
  RequirementCard,
  StatusBadge,
  TimelineItem,
  timelineIcons,
} from "./MarketplaceUi";
import { mapCreatorCampaignDetailToMarketplace, type MarketplaceCampaign } from "./marketplaceData";

export function CampaignMarketplaceDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<MarketplaceCampaign | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    if (!campaignId) {
      setError("Campaign id is missing.");
      setIsLoading(false);
      return;
    }

    Promise.all([
      getCreatorCampaignDetail(campaignId),
      getCampaignApplications().catch(() => []),
    ])
      .then(([detail, applications]) => {
        if (!mounted) return;
        const mappedCampaign = mapCreatorCampaignDetailToMarketplace(detail);
        setCampaign(mappedCampaign);
        setAppliedIds([
          ...applications.map((application) => application.campaign),
          ...(mappedCampaign.applied ? [mappedCampaign.id] : []),
        ]);
      })
      .catch((err) => {
        if (!mounted) return;
        setCampaign(null);
        setError(err instanceof Error ? err.message : "Unable to load campaign.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const hasApplied = Boolean(campaign && appliedIds.includes(campaign.id));
  const applyLabel = hasApplied ? "Applied" : isApplying ? "Applying..." : "Apply To Campaign";

  const applyForCampaign = async () => {
    if (!campaign || hasApplied || isApplying) return;
    setIsApplying(true);
    setApplyError("");
    try {
      await applyToCampaign(campaign.id);
      setAppliedIds((ids) => ids.includes(campaign.id) ? ids : [...ids, campaign.id]);
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Unable to apply to this campaign.");
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#5168ff]" />
          <p className="mt-4 text-sm font-black text-[#1d2430]">Loading campaign...</p>
        </div>
      </Panel>
    );
  }

  if (error || !campaign) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <h2 className="text-xl font-black text-[#1d2430]">Campaign could not be loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">{error || "Campaign not found."}</p>
          <button type="button" onClick={() => navigate("/creator/marketplace")} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#5168ff] px-5 text-sm font-black text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-7">

      <Panel className="p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 gap-5">
            <BrandAvatar campaign={campaign} size="h-16 w-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-[#1d2430]">{campaign.brandName}</h2>
                <CheckCircle2 className="h-4 w-4 fill-[#5168ff] text-white" />
              </div>
              <p className="text-sm font-medium text-[#65758f]">{campaign.brandType}</p>
              <h1 className="mt-6 text-[30px] font-black leading-tight tracking-normal text-[#1d2430]">{campaign.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge>{hasApplied ? "Application Sent" : campaign.status}</StatusBadge>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#65758f]">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {campaign.applicationsCloseLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={applyForCampaign}
            disabled={hasApplied || isApplying}
            className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#5168ff] px-8 text-base font-black text-white shadow-[0_8px_16px_rgba(81,104,255,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {applyLabel} {!isApplying ? <ArrowRight className="h-5 w-5" /> : null}
          </button>
        </div>
        {applyError ? <p className="mt-4 text-sm font-semibold text-[#d23b3b]">{applyError}</p> : null}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-6">
          <DetailSection title="1. Campaign Objective">
            <p className="text-sm font-medium leading-relaxed text-[#65758f]">{campaign.objective}</p>
          </DetailSection>

          <DetailSection title="2. Deliverables">
            <div className="grid gap-4 md:grid-cols-3">
              {campaign.deliverables.map((item) => <DeliverableCard key={item.title} item={item} />)}
            </div>
          </DetailSection>

          <DetailSection title="3. Timeline">
            <div className="grid gap-5 md:grid-cols-4">
              {campaign.timeline.map((item, index) => (
                <TimelineItem key={item.title} item={item} icon={timelineIcons[index % timelineIcons.length]} />
              ))}
            </div>
          </DetailSection>

          <DetailSection title="4. Creator Requirements">
            <div className="grid gap-4 md:grid-cols-3">
              {campaign.requirements.map((item) => <RequirementCard key={item.label} item={item} />)}
            </div>
          </DetailSection>

          <DetailSection title="5. Creative Direction">
            <div className="grid gap-3">
              {campaign.creativeDirection.map((line) => (
                <p key={line} className="text-sm font-medium leading-relaxed text-[#65758f]">{line}</p>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="6. Content References">
            <div className="grid gap-4 md:grid-cols-4">
              {campaign.references.map((item) => <ReferenceCard key={`${item.title}-${item.image}`} item={item} />)}
            </div>
          </DetailSection>

          <BrandBlock campaign={campaign} hasApplied={hasApplied} isApplying={isApplying} onApply={applyForCampaign} />
        </div>

        <OverviewCard campaign={campaign} />
      </div>
    </div>
  );
}
