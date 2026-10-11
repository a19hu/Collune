import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
import { showProjectToast } from "../../../HtmlComponents/HtmlRoster";

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
      showProjectToast("success", "Application sent", "Your campaign application has been submitted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to apply to this campaign.";
      setApplyError(message);
      showProjectToast("error", "Application failed", message);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
          <p className="mt-4 text-sm font-black text-ink-strong">Loading campaign...</p>
        </div>
      </Panel>
    );
  }

  if (error || !campaign) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <h2 className="text-xl font-black text-ink-strong">Campaign could not be loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-ink-muted">{error || "Campaign not found."}</p>
          <button type="button" onClick={() => navigate("/creator/marketplace")} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-primary px-5 text-sm font-black text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-7">

      <Panel className="relative h-64 overflow-hidden bg-brand-accent-soft p-0 md:h-80">
        {campaign.coverImage ? <img src={campaign.coverImage} alt={`${campaign.title} cover`} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-7 text-white">
          <p className="text-sm font-semibold opacity-90">Campaign</p>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">{campaign.title}</h1>
        </div>
      </Panel>

      <Panel className="p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 gap-5">
            <Link to={`/brands/${campaign.brandId}`} className="shrink-0 transition hover:scale-105" aria-label={`View ${campaign.brandName}`}>
              <BrandAvatar campaign={campaign} size="h-16 w-16" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={`/brands/${campaign.brandId}`} className="text-lg font-black text-ink-strong transition hover:text-brand-primary">{campaign.brandName}</Link>
                <CheckCircle2 className="h-4 w-4 fill-[#5168ff] text-white" />
              </div>
              <p className="text-sm font-medium text-ink-muted">{campaign.brandType}</p>
              <h1 className="mt-6 text-[30px] font-black leading-tight tracking-normal text-ink-strong">{campaign.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <StatusBadge>{hasApplied ? "Application Sent" : campaign.status}</StatusBadge>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
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
            className="inline-flex h-12 items-center gap-3 rounded-lg bg-brand-primary px-8 text-base font-black text-white shadow-[0_8px_16px_rgba(81,104,255,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
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
            <p className="text-sm font-medium leading-relaxed text-ink-muted">{campaign.objective}</p>
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

          <DetailSection title="4. Pricing & Compensation">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-surface-subtle p-4"><p className="text-xs font-semibold text-ink-muted">Total Budget</p><p className="mt-1 text-lg font-black text-ink-strong">{campaign.budget}</p></div>
              <div className="rounded-lg bg-surface-subtle p-4"><p className="text-xs font-semibold text-ink-muted">Compensation Type</p><p className="mt-1 text-lg font-black text-ink-strong">{campaign.compensationType}</p></div>
              {Object.entries(campaign.deliverablePricing || {}).filter(([, price]) => price).map(([deliverable, price]) => <div key={deliverable} className="rounded-lg bg-surface-subtle p-4"><p className="text-xs font-semibold text-ink-muted">{deliverable}</p><p className="mt-1 text-lg font-black text-ink-strong">₹{Number(price).toLocaleString("en-IN")}</p></div>)}
            </div>
          </DetailSection>

          <DetailSection title="5. Creator Requirements">
            <div className="grid gap-4 md:grid-cols-3">
              {campaign.requirements.map((item) => <RequirementCard key={item.label} item={item} />)}
            </div>
          </DetailSection>

          <DetailSection title="6. Creative Direction">
            <div className="grid gap-3">
              {campaign.creativeDirection.map((line) => (
                <p key={line} className="text-sm font-medium leading-relaxed text-ink-muted">{line}</p>
              ))}
            </div>
          </DetailSection>

          {/* <DetailSection title="6. Content References">
            <div className="grid gap-4 md:grid-cols-4">
              {campaign.references.map((item) => <ReferenceCard key={`${item.title}-${item.image}`} item={item} />)}
            </div>
          </DetailSection> */}

          <BrandBlock campaign={campaign} hasApplied={hasApplied} isApplying={isApplying} onApply={applyForCampaign} />
        </div>

        <OverviewCard campaign={campaign} />
      </div>
    </div>
  );
}
