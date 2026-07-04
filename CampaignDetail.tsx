import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DollarSign,
  Edit3,
  Eye,
  FileText,
  Linkedin,
  Megaphone,
  MoreHorizontal,
  Play,
  Star,
  Target,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import { getCampaignApplications } from "../../../lib/authApi";
import type { CampaignApplicationApi, CreatorProfileApi } from "../../../types";
import { CampaignPanel } from "./CampaignUi";
import type { CampaignCardItem } from "./campaignData";

type Accent = "violet" | "orange" | "green" | "blue" | "muted";

const accentClasses: Record<Accent, { icon: string; chip: string; soft: string }> = {
  violet: { icon: "bg-[#eee8ff] text-[#4b22ff]", chip: "bg-[#f0eaff] text-[#4b22ff]", soft: "bg-[#f7f4ff]" },
  orange: { icon: "bg-[#fff3db] text-[#f29a00]", chip: "bg-[#fff5d8] text-[#a66c00]", soft: "bg-[#fffaf0]" },
  green: { icon: "bg-[#e2f8ec] text-[#2fbe74]", chip: "bg-[#daf8e8] text-[#0b9150]", soft: "bg-[#f2fbf6]" },
  blue: { icon: "bg-[#e5f0ff] text-[#2c74d6]", chip: "bg-[#dbeafe] text-[#1f5fbf]", soft: "bg-[#f5f9ff]" },
  muted: { icon: "bg-[#f3f6fa] text-[#a7b3c4]", chip: "bg-[#f3f6fa] text-[#7f8da3]", soft: "bg-[#f8fafc]" },
};

const platformStyles: Record<string, string> = {
  Instagram: "bg-[#ff4d86] text-white",
  YouTube: "bg-[#ff0000] text-white",
  LinkedIn: "bg-[#116bc1] text-white",
};

const creatorFallbackImages = [creatorOne, creatorTwo, creatorThree];

function StatusBadge({ status }: { status: CampaignCardItem["status"] }) {
  return (
    <span className="inline-flex h-8 items-center rounded-lg bg-[#e8f8ef] px-4 text-sm font-black text-[#28b76f]">
      {status}
    </span>
  );
}

function IconBox({ icon, accent = "muted", className = "" }: { icon: ReactNode; accent?: Accent; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-xl ${accentClasses[accent].icon} ${className || "h-12 w-12"}`}>
      {icon}
    </span>
  );
}

function SectionTitle({ title, copy, action }: { title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[22px] font-black tracking-normal text-[#1d2430]">{title}</h2>
        {copy ? <p className="mt-2 text-base font-medium text-[#7a879c]">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

function OverviewRow({ icon, label, children }: { key?: string; icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <IconBox icon={icon} className="h-10 w-10 rounded-lg" />
      <div className="min-w-0">
        <p className="font-black text-[#303948]">{label}</p>
        <div className="mt-1 text-[15px] font-medium leading-snug text-[#71809a]">{children}</div>
      </div>
    </div>
  );
}

function StatusMetric({ label, value, copy, icon, accent }: { label: string; value: number; copy: string; icon: ReactNode; accent: Accent }) {
  return (
    <div className="rounded-lg bg-[#f6f7fa] p-5">
      <div className="flex items-center gap-4">
        <IconBox icon={icon} accent={accent} className="h-11 w-11" />
        <div>
          <p className="text-sm font-bold text-[#8995a8]">{label}</p>
          <strong className="block text-3xl font-black leading-tight text-[#1d2430]">{value}</strong>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-[#7d8aa0]">{copy}</p>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[15px]">
      <span className="inline-flex items-center gap-2 font-medium text-[#8290a5]">
        {icon}
        {label}
      </span>
      <strong className="text-right font-black text-[#303948]">{value}</strong>
    </div>
  );
}

type CreatorCardItem = {
  id: string;
  name: string;
  role: string;
  followers: string;
  engagement: string;
  image: string;
  platform: string;
  status: CampaignApplicationApi["status"];
};

function formatFollowers(value?: number) {
  if (!value) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(value);
}

function formatDateTime(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getDaysUntil(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Closed";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function normalizePlatform(value?: string) {
  if (value === "YOUTUBE") return "YouTube";
  if (value === "LINKEDIN") return "LinkedIn";
  if (value === "INSTAGRAM") return "Instagram";
  return value || "Instagram";
}

function getPrimaryPlatform(creator?: CreatorProfileApi) {
  return normalizePlatform(
    creator?.social_accounts?.find((account) => account.is_connected)?.platform || creator?.social_accounts?.[0]?.platform,
  );
}

function getEngagement(creator?: CreatorProfileApi) {
  const engagement = creator?.social_accounts?.find((account) => typeof account.engagement_rate === "number")?.engagement_rate;
  return typeof engagement === "number" ? `${engagement.toFixed(1)}%` : "N/A";
}

function mapApplicationToCreator(application: CampaignApplicationApi, index: number): CreatorCardItem {
  const creator = application.creator_detail;
  return {
    id: application.application_id,
    name: creator?.display_name || creator?.user?.name || "Creator",
    role: creator?.category || "Creator",
    followers: formatFollowers(creator?.audience_size),
    engagement: getEngagement(creator),
    image: creator?.profile_image_url || creatorFallbackImages[index % creatorFallbackImages.length],
    platform: getPrimaryPlatform(creator),
    status: application.status,
  };
}

function CreatorCard({ creator }: { key?: string; creator: CreatorCardItem }) {
  const platformClass = platformStyles[creator.platform] || "bg-[#4b22ff] text-white";

  return (
    <CampaignPanel className="overflow-hidden">
      <div className="relative aspect-[1.02/1] bg-[#eef2f7]">
        <img src={creator.image} alt={creator.name} className="h-full w-full object-cover" />
        <span className={`absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-lg ${platformClass}`}>
          {creator.platform === "LinkedIn" ? <Linkedin className="h-4 w-4" /> : creator.platform === "YouTube" ? <Play className="h-4 w-4 fill-current" /> : <Eye className="h-4 w-4" />}
        </span>
        <button type="button" className="absolute right-3 top-3 text-white drop-shadow" aria-label={`${creator.name} options`}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black leading-tight text-[#1d2430]">{creator.name}</h3>
            <p className="mt-2 text-sm font-medium text-[#8390a5]">{creator.role}</p>
          </div>
          <span className="rounded-md bg-[#eee8ff] px-2.5 py-1 text-xs font-black text-[#4b22ff]">Recommended</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <CreatorStat value={creator.followers} label="Followers" />
          <CreatorStat value={creator.engagement} label="Eng. Rate" />
        </div>
        <button type="button" className="mt-5 text-sm font-black text-[#4b22ff]">View Profile -&gt;</button>
      </div>
    </CampaignPanel>
  );
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <CampaignPanel className="p-7 text-center">
      <h3 className="text-lg font-black text-[#1d2430]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[420px] text-sm font-medium leading-relaxed text-[#7d8aa0]">{copy}</p>
    </CampaignPanel>
  );
}

function CreatorStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-base font-black text-[#63728a]">{value}</strong>
      <span className="text-sm font-medium text-[#8390a5]">{label}</span>
    </div>
  );
}

function CategoryPill({ label, icon: Icon, accent }: { key?: string; label: string; icon: LucideIcon; accent: Accent }) {
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black ${accentClasses[accent].chip}`}>
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function ProgressStep({ title, detail, icon: Icon, accent }: { key?: string; title: string; detail: string; icon: LucideIcon; accent: Accent }) {
  return (
    <div className="grid min-w-[120px] flex-1 justify-items-center text-center">
      <IconBox icon={<Icon className="h-5 w-5" />} accent={accent} className="h-14 w-14 rounded-full" />
      <p className="mt-3 text-sm font-black leading-tight text-[#303948]">{title}</p>
      <span className="mt-1 text-sm font-medium text-[#7d8aa0]">{detail}</span>
    </div>
  );
}

function ActivityItem({ title, time, icon: Icon, accent }: { key?: string; title: string; time: string; icon: LucideIcon; accent: Accent }) {
  return (
    <div className="flex gap-4">
      <IconBox icon={<Icon className="h-5 w-5" />} accent={accent} className="h-11 w-11 rounded-lg" />
      <div className="min-w-0">
        <p className="font-black text-[#303948]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#7d8aa0]">{time}</p>
      </div>
    </div>
  );
}

export function CampaignDetail({ campaign }: { campaign: CampaignCardItem; onBack: () => void }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<CampaignApplicationApi[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState("");
  const CampaignIcon = campaign.icon;
  const campaignApplications = useMemo(
    () => applications.filter((application) => application.campaign === campaign.id),
    [applications, campaign.id],
  );
  const applicationCount = isLoadingApplications ? campaign.applications : campaignApplications.length;
  const recommendedCreators = useMemo(
    () => campaignApplications.filter((application) => application.status === "ACCEPTED").map(mapApplicationToCreator),
    [campaignApplications],
  );
  const collaborationCount = campaignApplications.filter((application) => application.status === "ACCEPTED").length;
  const dynamicProgressSteps = useMemo(
    () => (campaign.progressSteps || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((step) => ({
        title: step.title,
        detail: step.displayDate || step.status.replaceAll("_", " ").toLowerCase(),
        icon: step.status === "COMPLETED" ? Check : step.status === "IN_PROGRESS" ? BarChart3 : Clock3,
        accent: step.status === "COMPLETED" ? "green" : step.status === "IN_PROGRESS" ? "violet" : "muted",
      })),
    [campaign.progressSteps],
  );
  const activityItems = useMemo(
    () => [
      ...campaignApplications.slice(0, 3).map((application) => ({
        title: `${application.creator_detail?.display_name || "Creator"} applied to this campaign`,
        time: formatDateTime(application.created_at),
        icon: Users,
        accent: "violet" as Accent,
      })),
      {
        title: "Campaign details updated",
        time: formatDateTime(campaign.updatedAtRaw),
        icon: Edit3,
        accent: "green" as Accent,
      },
    ],
    [campaignApplications, campaign.updatedAtRaw],
  );
  const matchingFocus = [
    { label: campaign.category, icon: Target, accent: "violet" as Accent },
    { label: campaign.audienceType, icon: Users, accent: "blue" as Accent },
    { label: campaign.contentStyle, icon: FileText, accent: "green" as Accent },
    { label: campaign.languagePreference, icon: Linkedin, accent: "orange" as Accent },
  ].filter((item) => item.label && !["General", "Audience not set", "Content style not set", "Language not set"].includes(item.label));

  useEffect(() => {
    let mounted = true;
    setIsLoadingApplications(true);
    setApplicationsError("");
    getCampaignApplications()
      .then((items) => {
        if (!mounted) return;
        setApplications(items);
      })
      .catch((err) => {
        if (!mounted) return;
        setApplicationsError(err instanceof Error ? err.message : "Unable to load campaign applications.");
      })
      .finally(() => {
        if (mounted) setIsLoadingApplications(false);
      });
    return () => {
      mounted = false;
    };
  }, [campaign.id]);

  const overviewRows = [
    {
      label: "Objective",
      icon: <Target className="h-5 w-5" />,
      value: campaign.objective,
    },
    {
      label: "Deliverables",
      icon: <FileText className="h-5 w-5" />,
      value: campaign.deliverables,
    },
    {
      label: "Timeline",
      icon: <CalendarDays className="h-5 w-5" />,
      value: campaign.timeline,
    },
    {
      label: "Platforms",
      icon: <ClipboardCheck className="h-5 w-5" />,
      value: campaign.platforms,
    },
    {
      label: "Budget Range",
      icon: <WalletCards className="h-5 w-5" />,
      value: campaign.budget,
    },
    {
      label: "Creator Compensation",
      icon: <DollarSign className="h-5 w-5" />,
      value: campaign.compensationType,
    },
    {
      label: "Target Audience",
      icon: <Users className="h-5 w-5" />,
      value: campaign.audienceType,
    },
    {
      label: "Key Requirements",
      icon: <CheckCircle2 className="h-5 w-5" />,
      value: campaign.requirements,
    },
  ];

  return (
    <div className="grid gap-8 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-5">
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${campaign.iconClassName}`}>
            <CampaignIcon className="h-8 w-8" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-[34px] font-black leading-tight tracking-normal text-[#1d2430]">{campaign.title}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#7d8aa0]">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Created on {formatDateTime(campaign.createdAtRaw)}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{campaign.updatedAt}</span>
              <span>•</span>
              <span>Campaign ID: {campaign.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-5 text-sm font-black text-[#303948]">
            <Edit3 className="h-4 w-4" />
            Edit Campaign
          </button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-lg border border-[#dfe7f2] bg-white text-[#63728a]" aria-label="Campaign options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-8">
          <CampaignPanel className="p-7">
            <SectionTitle
              title="Campaign Overview"
              copy="A summary of your campaign brief and requirements."
              action={<button type="button" className="text-sm font-black text-[#4b22ff]">Edit</button>}
            />
            <div className="grid gap-5">
              {overviewRows.map((row) => (
                <OverviewRow key={row.label} icon={row.icon} label={row.label}>
                  {Array.isArray(row.value) ? (
                    <div className="flex flex-wrap gap-2">
                      {row.value.map((platform) => (
                        <span key={platform} className={`grid h-7 min-w-7 place-items-center rounded-md px-2 text-xs font-black ${platformStyles[platform] || "bg-[#eef2ff] text-[#4b22ff]"}`}>
                          {platform === "Instagram" ? "IG" : platform === "YouTube" ? "YT" : platform === "LinkedIn" ? "in" : platform}
                        </span>
                      ))}
                    </div>
                  ) : row.value}
                </OverviewRow>
              ))}
            </div>
          </CampaignPanel>

          <section>
            <SectionTitle
              title="Recommended Creators"
              copy="Creators recommended by Collune based on your requirements."
              action={<button type="button" className="text-sm font-black text-[#4b22ff]">View all recommendations -&gt;</button>}
            />
            {applicationsError ? (
              <EmptyPanel title="Unable to load recommendations" copy={applicationsError} />
            ) : isLoadingApplications ? (
              <EmptyPanel title="Loading recommendations" copy="Fetching recommended creators for this campaign." />
            ) : recommendedCreators.length ? (
              <div className="grid gap-5 md:grid-cols-3">
                {recommendedCreators.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}
              </div>
            ) : (
              <EmptyPanel title="No recommended creators yet" copy="Accepted campaign applications will appear here as recommended creators." />
            )}
          </section>

          <CampaignPanel className="p-7">
            <SectionTitle title="Campaign Progress" copy="See where your campaign stands in the overall process." />
            {dynamicProgressSteps.length ? (
              <div className="flex flex-wrap justify-between gap-5">
                {dynamicProgressSteps.map(({ title, detail, icon, accent }) => (
                  <ProgressStep key={title} title={title} detail={detail} icon={icon} accent={accent} />
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-[#7d8aa0]">No progress steps have been added for this campaign.</p>
            )}
          </CampaignPanel>

          <CampaignPanel className="p-7">
            <SectionTitle title="Activity Feed" copy="Latest updates and activity on your campaign." />
            <div className="grid gap-5">
              {activityItems.map(({ title, time, icon, accent }) => (
                <ActivityItem key={`${title}-${time}`} title={title} time={time} icon={icon} accent={accent} />
              ))}
            </div>
          </CampaignPanel>
        </div>

        <aside className="grid h-max gap-7">
          <CampaignPanel className="p-7">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-black tracking-normal text-[#1d2430]">Campaign Status</h2>
                <p className="mt-6 text-base font-medium text-[#7d8aa0]">Track the progress of your campaign.</p>
              </div>
              <StatusBadge status={campaign.status} />
            </div>

            <div className="grid gap-4">
              <StatusMetric label="Applications Received" value={campaign.applications} copy={`${campaign.applications} applications from creators`} icon={<Users className="h-5 w-5" />} accent="violet" />
              <StatusMetric label="Recommended Creators" value={campaign.recommended} copy="Shortlisted by Collune" icon={<Star className="h-5 w-5" />} accent="orange" />
              <StatusMetric label="Collaborations Started" value={collaborationCount} copy="Accepted creators" icon={<Users className="h-5 w-5" />} accent="green" />
            </div>

            <div className="mt-7 grid gap-4">
              <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Campaign Created" value={formatDateTime(campaign.createdAtRaw)} />
              <MetaRow icon={<Clock3 className="h-4 w-4" />} label="Last Updated" value={campaign.updatedAt} />
              <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Applications Close In" value={getDaysUntil(campaign.deadline)} />
            </div>

            <button
              type="button"
              onClick={() => navigate(`/brand/campaigns/${campaign.id}/applications`)}
              className="mt-7 h-12 w-full rounded-lg border-2 border-[#4b22ff] bg-white text-base font-black text-[#4b22ff]"
            >
              View Applications ({applicationCount})
            </button>
          </CampaignPanel>

          <section className="rounded-xl bg-[#eee8ff] p-7">
            <div className="flex gap-5">
              <IconBox icon={<Megaphone className="h-6 w-6" />} accent="violet" className="h-14 w-14 rounded-full" />
              <div>
                <h2 className="text-xl font-black leading-tight text-[#1d2430]">Need more creators or want to make changes?</h2>
                <p className="mt-4 text-base font-medium leading-relaxed text-[#7d8aa0]">You can edit your campaign details or adjust requirements to improve match quality.</p>
                <button type="button" className="mt-5 h-12 rounded-lg bg-[#4b22ff] px-8 text-base font-black text-white">Edit Campaign</button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
