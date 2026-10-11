import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  WalletCards,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Play,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { MarketplaceCampaign } from "./marketplaceData";
import { SocialPlatformIcon } from "../../Shared/SocialPlatformIcon";
import { CreatorCampaignCard } from "../../../HtmlComponents/BrandCard";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border-default bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
      {children}
    </section>
  );
}

export function BrandAvatar({ campaign, size = "h-12 w-12" }: { campaign: MarketplaceCampaign; size?: string }) {
  const Icon = campaign.brandIcon;

  if (campaign.brandLogoUrl) {
    return <img src={campaign.brandLogoUrl} alt={campaign.brandName} className={`${size} rounded-full object-cover`} />;
  }

  return (
    <span className={`grid shrink-0 place-items-center rounded-full text-xs font-black ${size} ${campaign.brandIconClassName}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}


export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md bg-[#cbf8df] px-3 text-sm font-black text-[#00a875]">
      {children}
    </span>
  );
}

export function CampaignCard({ campaign }: { key?: string; campaign: MarketplaceCampaign; }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/creator/marketplace/${campaign.id}`);
  };
  return (
    <>
    <CreatorCampaignCard
      title={campaign.title}
      objective={campaign.description}
      coverImage={campaign.coverImage}
      brand={{ brand_id: campaign.brandId || "", company_name: campaign.brandName, logo_url: campaign.brandLogoUrl || null }}
      status="Featured"
      meta={`Apply before ${campaign.deadlineShort}`}
      onOpen={handleClick}
    />
    {/*
    <Panel className="min-h-[306px] p-6">
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={handleClick} className="flex min-w-0 items-center gap-4 text-left">
          <BrandAvatar campaign={campaign} />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black text-ink-strong">{campaign.brandName}</strong>
            <span className="mt-1 block text-sm font-medium text-ink-muted">{campaign.postedAt}</span>
          </span>
        </button>
        <button type="button" onClick={handleClick} className="text-ink-muted" aria-label={`${campaign.title} options`}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        <StatusBadge>New</StatusBadge>
      </div>
      <h2 className="mt-5 text-[22px] font-black leading-tight text-ink-strong">{campaign.title}</h2>
      <p className="mt-3 min-h-[48px] text-base font-medium leading-relaxed text-ink-muted">{campaign.description}</p>

      <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#edf1f6] pt-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium leading-tight text-ink-muted">
          <Calendar className="h-4 w-4" />
          Apply before {campaign.deadlineShort}
        </p>
        <button type="button" onClick={handleClick} className="inline-flex h-14 min-w-[152px] items-center justify-center gap-3 rounded-lg border-2 border-brand-primary px-5 text-base font-black text-brand-primary">
          View<br />Campaign
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </Panel>*/}
    </>
  );
}

export function CampaignActionCard({
  campaign,
  onApply,
  onSave,
  isApplying,
  isSaving,
  isMenuOpen,
  onMenuToggle,
}: {
  key?: string;
  campaign: MarketplaceCampaign;
  onApply: (campaign: MarketplaceCampaign) => void;
  onSave: (campaign: MarketplaceCampaign) => void;
  isApplying?: boolean;
  isSaving?: boolean;
  isMenuOpen?: boolean;
  onMenuToggle: (campaignId: string) => void;
}) {
  const navigate = useNavigate();
  const handleClick = () => navigate(`/creator/marketplace/${campaign.id}`);
  const applyLabel = campaign.applied ? "Applied" : isApplying ? "Applying..." : "Apply";
  const saveLabel = campaign.saved ? "Unsave" : isSaving ? "Saving..." : "Save";

  return (
    <>
    <CreatorCampaignCard
      title={campaign.title}
      objective={campaign.description}
      coverImage={campaign.coverImage}
      brand={{ brand_id: campaign.brandId || "", company_name: campaign.brandName, logo_url: campaign.brandLogoUrl || null }}
      status={campaign.applied ? "Applied" : "Open applications"}
      meta={`Apply before ${campaign.deadlineShort}`}
      onOpen={handleClick}
      actions={<>
        <button type="button" disabled={isSaving} onClick={() => onSave(campaign)} className="rounded-lg border px-3 py-2 text-xs font-bold text-brand-primary disabled:opacity-60">{saveLabel}</button>
        <button type="button" disabled={campaign.applied || isApplying} onClick={() => onApply(campaign)} className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{applyLabel}</button>
      </>}
    />
    {/*
    <Panel className="relative min-h-[306px] p-6">
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={handleClick} className="flex min-w-0 items-center gap-4 text-left">
          <BrandAvatar campaign={campaign} />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black text-ink-strong">{campaign.brandName}</strong>
            <span className="mt-1 block text-sm font-medium text-ink-muted">{campaign.postedAt}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMenuToggle(campaign.id);
          }}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-[#f1f4f8]"
          aria-label={`${campaign.title} actions`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {isMenuOpen ? (
        <div
          className="absolute right-5 top-14 z-10 w-40 rounded-lg border border-border-default bg-white p-2 shadow-[0_12px_28px_rgba(20,30,60,0.12)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            disabled={campaign.saved || isSaving}
            onClick={() => {
              onMenuToggle("");
              onSave(campaign);
            }}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-black text-ink-strong hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bookmark className={`h-4 w-4 ${campaign.saved ? "fill-current text-brand-primary" : ""}`} />
            {saveLabel}
          </button>
          <button
            type="button"
            disabled={campaign.applied || isApplying}
            onClick={() => {
              onMenuToggle("");
              onApply(campaign);
            }}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-black text-ink-strong hover:bg-[#f7f8fb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {applyLabel}
          </button>
        </div>
      ) : null}

      <div className="mt-6">
        <StatusBadge>{campaign.applied ? "Applied" : "Open Applications"}</StatusBadge>
      </div>
      <h2 className="mt-5 text-[22px] font-black leading-tight text-ink-strong">{campaign.title}</h2>
      <p className="mt-3 min-h-[48px] text-base font-medium leading-relaxed text-ink-muted">{campaign.description}</p>

      <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#edf1f6] pt-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium leading-tight text-ink-muted">
          <Calendar className="h-4 w-4" />
          Apply before {campaign.deadlineShort}
        </p>
        <button type="button" onClick={handleClick} className="inline-flex h-14 min-w-[152px] items-center justify-center gap-3 rounded-lg border-2 border-brand-primary px-5 text-base font-black text-brand-primary">
          View<br />Campaign
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </Panel>*/}
    </>
  );
}

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${page === item ? "border-[#4b5dff] bg-[#4b5dff] text-white" : "border-border-default text-ink-muted"}`}
        >
          {item}
        </button>
      ))}
      <span className="px-3 text-ink-muted">...</span>
      <button className="grid h-10 w-10 place-items-center rounded-lg border border-border-default text-sm font-semibold text-ink-muted">10</button>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="grid h-10 w-10 place-items-center rounded-lg border border-border-default text-ink-muted"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="p-7">
      <h2 className="text-xl font-black text-ink-strong">{title}</h2>
      <div className="mt-6">{children}</div>
    </Panel>
  );
}

export function DeliverableCard({ item }: { key?: string; item: MarketplaceCampaign["deliverables"][number] }) {
  return (
    <div className="grid min-h-[124px] place-items-center rounded-md bg-[#f7f8fb] p-5 text-center">
      {item.icon === "instagram" ? <SocialPlatformIcon platform="INSTAGRAM" className="h-10 w-10" /> : <MessageCircle className="h-10 w-10 text-brand-primary" />}
      <div>
        <strong className="block text-base font-black text-ink-strong">{item.title}</strong>
        <span className="text-sm font-medium text-ink-muted">{item.detail}</span>
      </div>
    </div>
  );
}

export function TimelineItem({ item, icon: Icon }: { key?: string; item: MarketplaceCampaign["timeline"][number]; icon: LucideIcon }) {
  return (
    <div className="grid justify-items-center text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-accent-soft text-brand-primary">
        <Icon className="h-5 w-5" />
      </span>
      <strong className="mt-4 block text-sm font-black text-ink-strong">{item.title}</strong>
      <span className="mt-1 text-sm font-medium text-ink-muted">{item.date}</span>
    </div>
  );
}

export function RequirementCard({ item }: { key?: string; item: MarketplaceCampaign["requirements"][number] }) {
  const Icon = item.icon;
  return (
    <div className="min-h-[130px] rounded-md bg-[#f7f8fb] p-5">
      <Icon className="h-5 w-5 text-brand-primary" />
      <strong className="mt-5 block text-sm font-black text-ink-strong">{item.label}</strong>
      <p className="mt-3 text-sm font-medium leading-relaxed text-ink-muted">{item.value}</p>
    </div>
  );
}

export function OverviewCard({ campaign }: { campaign: MarketplaceCampaign }) {
  const rows = [
    { icon: Star, label: campaign.status, sub: "Status", color: "bg-[#cbf8df] text-[#00a875]" },
    { icon: Calendar, label: "Applications Close", sub: campaign.deadline, color: "bg-brand-accent-soft text-brand-primary" },
    { icon: () => <SocialPlatformIcon platform={campaign.platform} className="h-5 w-5" />, label: "Platform", sub: campaign.platform, color: "bg-brand-accent-soft text-brand-primary" },
    { icon: WalletCards, label: "Campaign Budget", sub: campaign.budget, color: "bg-feedback-success/10 text-feedback-success" },
    { icon: BriefcaseBusiness, label: "Compensation", sub: campaign.compensationType, color: "bg-[#fff7e6] text-[#b54708]" },
    { icon: Clock, label: "Posted On", sub: campaign.postedOn, color: "bg-brand-accent-soft text-brand-primary" },
  ];

  return (
    <Panel className="sticky top-6 p-6">
      <h2 className="text-xl font-black text-ink-strong">Campaign Overview</h2>
      <div className="mt-7 grid gap-5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-4">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${row.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-sm font-black text-ink-strong">{row.label}</strong>
                <span className="text-sm font-medium text-ink-muted">{row.sub}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function ReferenceCard({ item }: { key?: string; item: MarketplaceCampaign["references"][number] }) {
  return (
    <div>
      <div className="relative aspect-[1.1/1] overflow-hidden rounded-md bg-[#eef2f7]">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-brand-primary">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-ink-muted">{item.title}</p>
      <button type="button" className="mt-1 inline-flex items-center gap-2 text-sm font-black text-brand-primary">
        View Reference <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function BrandBlock({
  campaign,
  hasApplied,
  isApplying,
  onApply,
}: {
  campaign: MarketplaceCampaign;
  hasApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
}) {
  const navigate = useNavigate();
  const applyLabel = hasApplied ? "Applied" : isApplying ? "Applying..." : "Apply To Campaign";

  return (
    <DetailSection title="6. About the Brand">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <BrandAvatar campaign={campaign} size="h-14 w-14" />
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-lg font-black text-ink-strong">{campaign.brandName}</strong>
              <CheckCircle2 className="h-4 w-4 fill-[#5168ff] text-white" />
            </div>
            <p className="text-sm font-medium text-ink-muted">{campaign.brandType}</p>
            <p className="mt-1 text-sm font-medium text-ink-muted">Helping young Indians make better financial decisions.</p>
          </div>
        </div>
        {campaign.brandId ? (
            <button
              type="button"
              onClick={() => navigate(`/brands/${campaign.brandId}`)}
              className="mx-5 h-11 items-center rounded-lg bg-[#173fb5] px-4 text-xs font-black text-white transition hover:bg-[#11349b]"
            >
              View Brand Profile
            </button>
        ) : null}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-md bg-[#f7f8fb] p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-accent-soft text-brand-primary">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-base font-black text-ink-strong">Ready to collaborate?</strong>
            <p className="mt-1 text-sm font-medium text-ink-muted">If this campaign is a good fit, apply now and start your collaboration journey with {campaign.brandName}.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={hasApplied || isApplying}
          className="inline-flex h-12 items-center gap-3 rounded-lg bg-brand-primary px-8 text-base font-black text-white shadow-[0_8px_16px_rgba(81,104,255,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {applyLabel} {!isApplying ? <ArrowRight className="h-5 w-5" /> : null}
        </button>
      </div>
    </DetailSection>
  );
}

export const timelineIcons = [Calendar, BriefcaseBusiness, BriefcaseBusiness, MessageCircle];
