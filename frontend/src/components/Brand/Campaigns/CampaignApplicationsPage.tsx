import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Instagram,
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
import { useNavigate, useParams } from "react-router-dom";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import {
  getBrandCampaignDetail,
} from "../../../lib/authApi";
import type { BrandCampaignDetailApi, CampaignApplicationApi, CreatorProfileApi } from "../../../types";
import { AddCreatorToShortlistModal } from "../Shortlists/AddCreatorToShortlistModal";
import { CampaignPanel } from "./CampaignUi";

const fallbackImages = [creatorOne, creatorTwo, creatorThree];

type Accent = "violet" | "orange" | "green" | "blue" | "muted";

const accentClasses: Record<Accent, { icon: string; chip: string }> = {
  violet: { icon: "bg-[#eee8ff] text-[#4b22ff]", chip: "bg-[#f0eaff] text-[#4b22ff]" },
  orange: { icon: "bg-[#fff3db] text-[#f29a00]", chip: "bg-[#fff5d8] text-[#a66c00]" },
  green: { icon: "bg-[#e2f8ec] text-[#2fbe74]", chip: "bg-[#daf8e8] text-[#0b9150]" },
  blue: { icon: "bg-[#e5f0ff] text-[#2c74d6]", chip: "bg-[#dbeafe] text-[#1f5fbf]" },
  muted: { icon: "bg-[#f3f6fa] text-[#a7b3c4]", chip: "bg-[#f3f6fa] text-[#7f8da3]" },
};

const statusClasses: Record<CampaignApplicationApi["status"], string> = {
  APPLIED: "bg-[#eaf0ff] text-[#173ca8]",
  ACCEPTED: "bg-[#e8f8ef] text-[#12a563]",
  REJECTED: "bg-[#ffe9e9] text-[#d23b3b]",
};

const platformClasses: Record<string, string> = {
  Instagram: "bg-[#ff4d86] text-white",
  YouTube: "bg-[#ff0000] text-white",
  LinkedIn: "bg-[#116bc1] text-white",
};

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

function formatFollowers(value?: number) {
  if (!value) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getRelativeUpdated(value?: string) {
  if (!value) return "Last updated not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last updated not set";
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Last updated today";
  if (diffDays === 1) return "Last updated yesterday";
  return `Last updated ${diffDays} days ago`;
}

function getDaysUntil(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);
  if (days < 0) return "Closed";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatBudget(campaign: BrandCampaignDetailApi) {
  if (campaign.budget_range) return campaign.budget_range;
  const total = Number(campaign.total_budget);
  return total ? `$${total.toLocaleString()}` : "Budget not set";
}

function formatTimeline(campaign: BrandCampaignDetailApi) {
  const start = formatDate(campaign.start_date);
  const end = formatDate(campaign.end_date || campaign.deadline);
  if (start !== "Not set" && end !== "Not set") return `${start} - ${end}`;
  return start !== "Not set" ? start : end;
}

function formatStatus(status?: string) {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getEngagement(creator?: CreatorProfileApi) {
  const engagement = creator?.social_accounts?.find((account) => typeof account.engagement_rate === "number")?.engagement_rate;
  return typeof engagement === "number" ? `${engagement.toFixed(1)}%` : "N/A";
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "LinkedIn") return <Linkedin className="h-4 w-4" />;
  if (platform === "YouTube") return <Play className="h-4 w-4 fill-current" />;
  return <Instagram className="h-4 w-4" />;
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="inline-flex h-8 items-center rounded-lg bg-[#e8f8ef] px-4 text-sm font-black text-[#28b76f]">
      {formatStatus(status)}
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

function ApplicationProfileCard({
  application,
  index,
  onAddToShortlist,
  onOpenProfile,
}: {
  key?: string;
  application: CampaignApplicationApi;
  index: number;
  onAddToShortlist: (creator: CreatorProfileApi) => void;
  onOpenProfile: (creatorId: string) => void;
}) {
  const creator = application.creator_detail;
  const platform = getPrimaryPlatform(creator);
  const platformClass = platformClasses[platform] || "bg-[#4b22ff] text-white";
  const image = creator?.profile_image_url || fallbackImages[index % fallbackImages.length];

  return (
    <CampaignPanel className="overflow-hidden">
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative aspect-[1.2/1] bg-[#eef2f7] md:aspect-auto">
          <img src={image} alt={creator?.display_name || "Creator"} className="h-full w-full object-cover" />
          <span className={`absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-lg ${platformClass}`}>
            <PlatformIcon platform={platform} />
          </span>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-black leading-tight text-[#1d2430]">
                {creator?.display_name || creator?.user?.name || "Creator"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[#7d8aa0]">
                {creator?.category || "Creator"} • {creator?.location || "Location not set"}
              </p>
            </div>
            <span className={`rounded-lg px-3 py-1.5 text-xs font-black ${statusClasses[application.status]}`}>
              {application.status}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <CreatorStat value={formatFollowers(creator?.audience_size)} label="Followers" />
            <CreatorStat value={getEngagement(creator)} label="Eng. Rate" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {creator?.portfolio_url ? (
              <button
                type="button"
                onClick={() => window.open(creator.portfolio_url, "_blank", "noopener,noreferrer")}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4b22ff] px-4 text-sm font-black text-white"
              >
                Portfolio <ExternalLink className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenProfile(creator?.creator_id || application.creator)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-4 text-sm font-black text-[#303948]"
            >
              View Profile <ExternalLink className="h-4 w-4" />
            </button>
            {creator ? (
              <button
                type="button"
                onClick={() => onAddToShortlist(creator)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-4 text-sm font-black text-[#1438c8]"
              >
                Add to Shortlist
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </CampaignPanel>
  );
}

function CreatorStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-[#f6f7fa] p-4">
      <strong className="block text-xl font-black leading-tight text-[#1d2430]">{value}</strong>
      <span className="mt-1 block text-sm font-semibold text-[#8390a5]">{label}</span>
    </div>
  );
}

function FeedbackPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <CampaignPanel className="grid min-h-[260px] place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0eaff] text-[#4b22ff]">
          <Users className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-black text-[#1d2430]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[420px] text-sm font-medium leading-relaxed text-[#63728a]">{copy}</p>
      </div>
    </CampaignPanel>
  );
}

export function CampaignApplicationsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<BrandCampaignDetailApi | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationApi[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfileApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    if (!campaignId) {
      setError("Campaign id is missing.");
      setIsLoading(false);
      return;
    }

    getBrandCampaignDetail(campaignId)
      .then((campaignData) => {
        if (!mounted) return;
        setCampaign(campaignData);
        setApplications(campaignData.applications || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load campaign applications.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const campaignApplications = useMemo(
    () => applications,
    [applications],
  );
  const acceptedApplications = useMemo(
    () => campaignApplications.filter((application) => application.status === "ACCEPTED"),
    [campaignApplications],
  );
  const overviewRows = useMemo(() => {
    if (!campaign) return [];
    return [
      {
        label: "Objective",
        icon: <Target className="h-5 w-5" />,
        value: campaign.objective || campaign.brief || "Campaign objective not set.",
      },
      {
        label: "Deliverables",
        icon: <FileText className="h-5 w-5" />,
        value: campaign.deliverables || "Deliverables not set.",
      },
      {
        label: "Timeline",
        icon: <CalendarDays className="h-5 w-5" />,
        value: formatTimeline(campaign),
      },
      {
        label: "Platforms",
        icon: <ClipboardCheck className="h-5 w-5" />,
        value: campaign.platforms || [],
      },
      {
        label: "Budget Range",
        icon: <WalletCards className="h-5 w-5" />,
        value: formatBudget(campaign),
      },
      {
        label: "Creator Compensation",
        icon: <DollarSign className="h-5 w-5" />,
        value: campaign.compensation_type || "Compensation not set",
      },
      {
        label: "Target Audience",
        icon: <Users className="h-5 w-5" />,
        value: campaign.audience_type || "Audience not set",
      },
      {
        label: "Key Requirements",
        icon: <CheckCircle2 className="h-5 w-5" />,
        value: campaign.brand_requirements || campaign.additional_preferences || "Requirements not set.",
      },
    ];
  }, [campaign]);
  const matchingFocus = useMemo(() => {
    if (!campaign) return [];
    return [
      { label: campaign.category, icon: Target, accent: "violet" as Accent },
      { label: campaign.audience_type, icon: Users, accent: "blue" as Accent },
      { label: campaign.content_style, icon: FileText, accent: "green" as Accent },
      { label: campaign.language_preference, icon: Linkedin, accent: "orange" as Accent },
    ].filter((item) => item.label);
  }, [campaign]);
  const progressSteps = useMemo(() => {
    const rawSteps = (campaign as (BrandCampaignDetailApi & {
      progress_steps?: Array<{
        title: string;
        status: "COMPLETED" | "IN_PROGRESS" | "UPCOMING";
        display_date: string;
        sort_order: number;
      }>;
    }) | null)?.progress_steps;

    if (rawSteps?.length) {
      return [...rawSteps].sort((a, b) => a.sort_order - b.sort_order).map((step) => ({
        title: step.title,
        detail: step.display_date || step.status.replaceAll("_", " ").toLowerCase(),
        icon: step.status === "COMPLETED" ? Check : step.status === "IN_PROGRESS" ? BarChart3 : Clock3,
        accent: step.status === "COMPLETED" ? "green" as Accent : step.status === "IN_PROGRESS" ? "violet" as Accent : "muted" as Accent,
      }));
    }

    return [
      { title: "Campaign Published", detail: formatDate(campaign?.created_at), icon: Check, accent: "green" as Accent },
      { title: "Applications Open", detail: formatDate(campaign?.created_at), icon: FileText, accent: "violet" as Accent },
      { title: "Review In Progress", detail: campaignApplications.length ? "In Progress" : "Upcoming", icon: BarChart3, accent: campaignApplications.length ? "blue" as Accent : "muted" as Accent },
      { title: "Creators Recommended", detail: acceptedApplications.length ? "In Progress" : "Upcoming", icon: Star, accent: acceptedApplications.length ? "orange" as Accent : "muted" as Accent },
      { title: "Collaborations Started", detail: acceptedApplications.length ? "In Progress" : "Upcoming", icon: Users, accent: acceptedApplications.length ? "green" as Accent : "muted" as Accent },
    ];
  }, [acceptedApplications.length, campaign, campaignApplications.length]);
  const activityItems = useMemo(
    () => [
      ...campaignApplications.slice(0, 3).map((application) => ({
        title: `${application.creator_detail?.display_name || application.creator_detail?.user?.name || "Creator"} applied to this campaign`,
        time: formatDate(application.created_at),
        icon: Users,
        accent: "violet" as Accent,
      })),
      ...(campaign ? [{
        title: "Campaign details updated",
        time: formatDate(campaign.updated_at),
        icon: Edit3,
        accent: "green" as Accent,
      }] : []),
    ],
    [campaign, campaignApplications],
  );

  return (
    <div className="grid gap-8 pb-8">
      {campaign ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-5">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#eee8ff] text-[#4b22ff]">
                <Target className="h-8 w-8" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-[34px] font-black leading-tight tracking-normal text-[#1d2430]">
                    {campaign.title || campaign.name || "Campaign Details"}
                  </h1>
                  <StatusBadge status={campaign.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#7d8aa0]">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Created on {formatDate(campaign.created_at)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{getRelativeUpdated(campaign.updated_at)}</span>
                  <span>•</span>
                  <span>Campaign ID: {campaign.campaign_id || campaign.id}</span>
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
          </header>

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
                          {row.value.length ? row.value.map((platform) => {
                            const normalized = normalizePlatform(platform);
                            return (
                              <span key={platform} className={`grid h-7 min-w-7 place-items-center rounded-md px-2 text-xs font-black ${platformClasses[normalized] || "bg-[#eef2ff] text-[#4b22ff]"}`}>
                                {normalized === "Instagram" ? "IG" : normalized === "YouTube" ? "YT" : normalized === "LinkedIn" ? "in" : normalized}
                              </span>
                            );
                          }) : "Platforms not set"}
                        </div>
                      ) : row.value}
                    </OverviewRow>
                  ))}
                </div>
              </CampaignPanel>

              <section>
                <SectionTitle title="Campaign Applications" copy="Creator profiles that applied to this campaign." />
                {error ? (
                  <FeedbackPanel title="Unable to load applications" copy={error} />
                ) : isLoading ? (
                  <FeedbackPanel title="Loading applications" copy="Fetching creator profiles for this campaign." />
                ) : campaignApplications.length ? (
                  <div className="grid gap-5">
                    {campaignApplications.map((application, index) => (
                      <ApplicationProfileCard
                        key={application.application_id}
                        application={application}
                        index={index}
                        onAddToShortlist={setSelectedCreator}
                        onOpenProfile={(creatorId) => navigate(`/creators/${creatorId}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <FeedbackPanel title="No applications yet" copy="Creator applications will appear here when creators apply to this campaign." />
                )}
              </section>

              <CampaignPanel className="p-7">
                <SectionTitle title="Campaign Progress" copy="See where your campaign stands in the overall process." />
                <div className="flex flex-wrap justify-between gap-5">
                  {progressSteps.map(({ title, detail, icon, accent }) => (
                    <ProgressStep key={title} title={title} detail={detail} icon={icon} accent={accent} />
                  ))}
                </div>
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
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[22px] font-black tracking-normal text-[#1d2430]">Campaign Status</h2>
                    <p className="mt-6 text-base font-medium text-[#7d8aa0]">Track the progress of your campaign.</p>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>

                <div className="grid gap-4">
                  <StatusMetric label="Applications Received" value={campaignApplications.length} copy={`${campaignApplications.length} applications from creators`} icon={<Users className="h-5 w-5" />} accent="violet" />
                  <StatusMetric label="Recommended Creators" value={campaign.recommended_creators_count || acceptedApplications.length} copy="Shortlisted by Collune" icon={<Star className="h-5 w-5" />} accent="orange" />
                  <StatusMetric label="Collaborations Started" value={acceptedApplications.length} copy="Accepted creators" icon={<Users className="h-5 w-5" />} accent="green" />
                </div>

                <div className="mt-7 grid gap-4">
                  <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Campaign Created" value={formatDate(campaign.created_at)} />
                  <MetaRow icon={<Clock3 className="h-4 w-4" />} label="Last Updated" value={getRelativeUpdated(campaign.updated_at).replace("Last updated ", "")} />
                  <MetaRow icon={<CalendarDays className="h-4 w-4" />} label="Applications Close In" value={getDaysUntil(campaign.deadline || campaign.end_date)} />
                </div>

                <button
                  type="button"
                  className="mt-7 h-12 w-full rounded-lg border-2 border-[#4b22ff] bg-white text-base font-black text-[#4b22ff]"
                >
                  View Applications ({campaignApplications.length})
                </button>
              </CampaignPanel>

              <CampaignPanel className="p-7">
                <SectionTitle title="Creator Categories Being Matched" copy="Categories that Collune is focusing on for this campaign." />
                {matchingFocus.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {matchingFocus.map((item) => (
                      <CategoryPill key={`${item.label}-${item.accent}`} label={item.label} icon={item.icon} accent={item.accent} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-[#7d8aa0]">No creator categories have been added yet.</p>
                )}
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
        </>
      ) : null}
      {!campaign && error ? <FeedbackPanel title="Unable to load applications" copy={error} /> : null}
      {!campaign && isLoading ? <FeedbackPanel title="Loading applications" copy="Fetching creator profiles for this campaign." /> : null}
      {selectedCreator ? (
        <AddCreatorToShortlistModal
          creator={selectedCreator}
          isOpen={Boolean(selectedCreator)}
          onClose={() => setSelectedCreator(null)}
        />
      ) : null}
    </div>
  );
}
