import { ArrowRight, BriefcaseBusiness, CheckCircle2 } from "lucide-react";

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
import type { MarketplaceCampaign } from "./marketplaceData";

export function CampaignMarketplaceDetail({
  campaign,
  hasApplied,
  onApply,
}: {
  campaign: MarketplaceCampaign;
  hasApplied: boolean;
  onApply: () => void;
}) {
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
            onClick={onApply}
            className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#5168ff] px-8 text-base font-black text-white shadow-[0_8px_16px_rgba(81,104,255,0.25)]"
          >
            {hasApplied ? "Applied" : "Apply To Campaign"} <ArrowRight className="h-5 w-5" />
          </button>
        </div>
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

          <BrandBlock campaign={campaign} onApply={onApply} />
        </div>

        <OverviewCard campaign={campaign} />
      </div>
    </div>
  );
}
