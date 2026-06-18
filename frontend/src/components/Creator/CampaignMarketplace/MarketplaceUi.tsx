import type { ReactNode } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Play,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { MarketplaceCampaign } from "./marketplaceData";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#dfe6f0] bg-white shadow-[0_2px_4px_rgba(20,30,60,0.02)] ${className}`}>
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

export function MarketplaceHeader({ title, userName = "Aakrit Gupta" }: { title: string; userName?: string }) {
  const initial = userName.trim()[0]?.toUpperCase() || "A";

  return (
    <header className="mb-12 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[28px] font-black tracking-normal text-[#173ca8]">{title}</h1>
      <div className="flex items-center gap-6">
        <span className="inline-flex h-8 items-center gap-2 rounded-md bg-[#cbf8df] px-4 text-sm font-black text-[#00a875]">
          <CheckCircle2 className="h-4 w-4" />
          Verified Creator
        </span>
        <button type="button" className="inline-flex items-center gap-3 text-[#173ca8]">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#173ca8] text-sm font-black text-white">{initial}</span>
          <span className="text-base font-black">{userName}</span>
          <ChevronRight className="h-4 w-4 rotate-90" />
        </button>
      </div>
    </header>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md bg-[#cbf8df] px-3 text-sm font-black text-[#00a875]">
      {children}
    </span>
  );
}

export function CampaignCard({ campaign, onOpen }: { key?: string; campaign: MarketplaceCampaign; onOpen: (campaign: MarketplaceCampaign) => void }) {
  return (
    <Panel className="min-h-[306px] p-6">
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={() => onOpen(campaign)} className="flex min-w-0 items-center gap-4 text-left">
          <BrandAvatar campaign={campaign} />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black text-[#1d2430]">{campaign.brandName}</strong>
            <span className="mt-1 block text-sm font-medium text-[#65758f]">{campaign.postedAt}</span>
          </span>
        </button>
        <button type="button" onClick={() => onOpen(campaign)} className="text-[#65758f]" aria-label={`${campaign.title} options`}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        <StatusBadge>New</StatusBadge>
      </div>
      <h2 className="mt-5 text-[22px] font-black leading-tight text-[#1d2430]">{campaign.title}</h2>
      <p className="mt-3 min-h-[48px] text-base font-medium leading-relaxed text-[#65758f]">{campaign.description}</p>

      <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#edf1f6] pt-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium leading-tight text-[#65758f]">
          <Calendar className="h-4 w-4" />
          Apply before {campaign.deadlineShort}
        </p>
        <button type="button" onClick={() => onOpen(campaign)} className="inline-flex h-14 min-w-[152px] items-center justify-center gap-3 rounded-lg border-2 border-[#5168ff] px-5 text-base font-black text-[#3048ff]">
          View<br />Campaign
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </Panel>
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
          className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${page === item ? "border-[#4b5dff] bg-[#4b5dff] text-white" : "border-[#dce4ef] text-[#63728a]"}`}
        >
          {item}
        </button>
      ))}
      <span className="px-3 text-[#63728a]">...</span>
      <button className="grid h-10 w-10 place-items-center rounded-lg border border-[#dce4ef] text-sm font-semibold text-[#63728a]">10</button>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="grid h-10 w-10 place-items-center rounded-lg border border-[#dce4ef] text-[#63728a]"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="p-7">
      <h2 className="text-xl font-black text-[#1d2430]">{title}</h2>
      <div className="mt-6">{children}</div>
    </Panel>
  );
}

export function DeliverableCard({ item }: { key?: string; item: MarketplaceCampaign["deliverables"][number] }) {
  return (
    <div className="grid min-h-[124px] place-items-center rounded-md bg-[#f7f8fb] p-5 text-center">
      {item.icon === "instagram" ? <Instagram className="h-10 w-10 text-[#ef4770]" /> : <MessageCircle className="h-10 w-10 text-[#5168ff]" />}
      <div>
        <strong className="block text-base font-black text-[#1d2430]">{item.title}</strong>
        <span className="text-sm font-medium text-[#65758f]">{item.detail}</span>
      </div>
    </div>
  );
}

export function TimelineItem({ item, icon: Icon }: { key?: string; item: MarketplaceCampaign["timeline"][number]; icon: LucideIcon }) {
  return (
    <div className="grid justify-items-center text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef2ff] text-[#5168ff]">
        <Icon className="h-5 w-5" />
      </span>
      <strong className="mt-4 block text-sm font-black text-[#1d2430]">{item.title}</strong>
      <span className="mt-1 text-sm font-medium text-[#65758f]">{item.date}</span>
    </div>
  );
}

export function RequirementCard({ item }: { key?: string; item: MarketplaceCampaign["requirements"][number] }) {
  const Icon = item.icon;
  return (
    <div className="min-h-[130px] rounded-md bg-[#f7f8fb] p-5">
      <Icon className="h-5 w-5 text-[#5168ff]" />
      <strong className="mt-5 block text-sm font-black text-[#1d2430]">{item.label}</strong>
      <p className="mt-3 text-sm font-medium leading-relaxed text-[#65758f]">{item.value}</p>
    </div>
  );
}

export function OverviewCard({ campaign }: { campaign: MarketplaceCampaign }) {
  const rows = [
    { icon: Star, label: campaign.status, sub: "Status", color: "bg-[#cbf8df] text-[#00a875]" },
    { icon: Calendar, label: "Applications Close", sub: campaign.deadline, color: "bg-[#eef2ff] text-[#5168ff]" },
    { icon: Instagram, label: "Platform", sub: campaign.platform, color: "bg-[#eef2ff] text-[#5168ff]" },
    { icon: Clock, label: "Posted On", sub: campaign.postedOn, color: "bg-[#eef2ff] text-[#5168ff]" },
  ];

  return (
    <Panel className="sticky top-6 p-6">
      <h2 className="text-xl font-black text-[#1d2430]">Campaign Overview</h2>
      <div className="mt-7 grid gap-5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-4">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${row.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <strong className="block text-sm font-black text-[#1d2430]">{row.label}</strong>
                <span className="text-sm font-medium text-[#65758f]">{row.sub}</span>
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
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#5168ff]">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-[#65758f]">{item.title}</p>
      <button type="button" className="mt-1 inline-flex items-center gap-2 text-sm font-black text-[#5168ff]">
        View Reference <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function BrandBlock({ campaign, onApply }: { campaign: MarketplaceCampaign; onApply: () => void }) {
  return (
    <DetailSection title="7. About the Brand">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <BrandAvatar campaign={campaign} size="h-14 w-14" />
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-lg font-black text-[#1d2430]">{campaign.brandName}</strong>
              <CheckCircle2 className="h-4 w-4 fill-[#5168ff] text-white" />
            </div>
            <p className="text-sm font-medium text-[#65758f]">{campaign.brandType}</p>
            <p className="mt-1 text-sm font-medium text-[#65758f]">Helping young Indians make better financial decisions.</p>
          </div>
        </div>
        <button type="button" className="inline-flex h-11 items-center gap-3 rounded-lg border border-[#5168ff] px-8 text-sm font-black text-[#5168ff]">
          View Brand Profile <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-md bg-[#f7f8fb] p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef2ff] text-[#5168ff]">
            <Star className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-base font-black text-[#1d2430]">Ready to collaborate?</strong>
            <p className="mt-1 text-sm font-medium text-[#65758f]">If this campaign is a good fit, apply now and start your collaboration journey with {campaign.brandName}.</p>
          </div>
        </div>
        <button type="button" onClick={onApply} className="inline-flex h-12 items-center gap-3 rounded-lg bg-[#5168ff] px-8 text-base font-black text-white shadow-[0_8px_16px_rgba(81,104,255,0.25)]">
          Apply To Campaign <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </DetailSection>
  );
}

export const timelineIcons = [Calendar, BriefcaseBusiness, BriefcaseBusiness, MessageCircle];
