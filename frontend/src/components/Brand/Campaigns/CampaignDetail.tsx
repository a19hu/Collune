import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, CheckCircle, Clock3, Eye, Megaphone, Star, Users } from "lucide-react";

import { CampaignPanel } from "./CampaignUi";
import type { CampaignCardItem } from "./campaignData";

function DetailMetric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <CampaignPanel className="p-5">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef2ff] text-[#4b22ff]">{icon}</span>
        <div>
          <p className="text-sm font-medium text-[#6d7b92]">{label}</p>
          <strong className="mt-1 block text-2xl font-black text-[#1d2430]">{value}</strong>
        </div>
      </div>
    </CampaignPanel>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-[#edf1f6] py-4 last:border-b-0">
      <p className="text-sm font-semibold text-[#8793a8]">{label}</p>
      <div className="mt-1 text-[15px] font-semibold leading-relaxed text-[#1d2430]">{value}</div>
    </div>
  );
}

export function CampaignDetail({ campaign, onBack }: { campaign: CampaignCardItem; onBack: () => void }) {
  const Icon = campaign.icon;

  return (
    <div className="grid gap-6">
      <button type="button" onClick={onBack} className="inline-flex w-max items-center gap-2 text-sm font-black text-[#2f16ff]">
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </button>

      <CampaignPanel className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#edf1f6] p-7">
          <div className="flex items-start gap-5">
            <span className={`grid h-14 w-14 place-items-center rounded-xl ${campaign.iconClassName}`}>
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[28px] font-black tracking-normal text-[#1d2430]">{campaign.title}</h2>
                <span className="rounded-lg bg-[#e8f8ef] px-4 py-1.5 text-sm font-black text-[#12a563]">{campaign.status}</span>
              </div>
              <p className="mt-3 max-w-3xl text-base font-medium leading-relaxed text-[#63728a]">{campaign.objective}</p>
            </div>
          </div>
          <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#173ca8] px-5 text-sm font-black text-white">
            <Megaphone className="h-4 w-4" />
            Edit Campaign
          </button>
        </div>

        <div className="grid gap-6 p-7 xl:grid-cols-[1fr_0.7fr]">
          <div>
            <div className="grid gap-4 md:grid-cols-3">
              <DetailMetric label="Applications" value={campaign.applications} icon={<Users className="h-5 w-5" />} />
              <DetailMetric label="Recommended" value={campaign.recommended} icon={<Star className="h-5 w-5" />} />
              <DetailMetric label="Visibility" value="Public" icon={<Eye className="h-5 w-5" />} />
            </div>

            <CampaignPanel className="mt-6 p-6">
              <h3 className="text-xl font-black text-[#1d2430]">Campaign Overview</h3>
              <div className="mt-4">
                <InfoRow label="Objective" value={campaign.objective} />
                <InfoRow label="Budget Range" value={campaign.budget} />
                <InfoRow label="Timeline" value={campaign.timeline} />
                <InfoRow
                  label="Platforms"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {campaign.platforms.map((platform) => (
                        <span key={platform} className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-black text-[#2f16ff]">{platform}</span>
                      ))}
                    </div>
                  }
                />
                <InfoRow label="Creator Category" value={campaign.category} />
              </div>
            </CampaignPanel>
          </div>

          <div className="grid gap-6">
            <CampaignPanel className="p-6">
              <h3 className="text-xl font-black text-[#1d2430]">Activity Timeline</h3>
              <div className="mt-5 grid gap-5">
                {[
                  ["Campaign updated", campaign.updatedAt, CheckCircle],
                  ["Applications reviewed", "12 creators shortlisted", Users],
                  ["Next report", "Due in 3 days", CalendarDays],
                ].map(([title, copy, ActivityIcon]) => {
                  const IconComponent = ActivityIcon as typeof CheckCircle;
                  return (
                    <div key={title as string} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0edff] text-[#4b22ff]">
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-black text-[#1d2430]">{title as string}</p>
                        <p className="mt-1 text-sm font-medium text-[#63728a]">{copy as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CampaignPanel>

            <CampaignPanel className="p-6">
              <h3 className="text-xl font-black text-[#1d2430]">Publishing Status</h3>
              <div className="mt-5 flex items-center gap-4 rounded-xl bg-[#f6f8fb] p-4">
                <Clock3 className="h-6 w-6 text-[#4b22ff]" />
                <div>
                  <p className="font-black text-[#1d2430]">Active and receiving applications</p>
                  <p className="mt-1 text-sm font-medium text-[#63728a]">Creators can discover and apply to this campaign.</p>
                </div>
              </div>
            </CampaignPanel>
          </div>
        </div>
      </CampaignPanel>
    </div>
  );
}
