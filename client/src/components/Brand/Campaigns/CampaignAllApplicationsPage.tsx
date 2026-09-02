import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Instagram, Linkedin, Loader2, Play, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import { showProjectToast } from "../../../HtmlComponents/HtmlRoster";
import { getBrandCampaignDetail, updateCampaignApplicationStatus } from "../../../lib/authApi";
import type { BrandCampaignDetailApi, CampaignApplicationApi, CreatorProfileApi } from "../../../types";
import { CampaignPanel } from "./CampaignUi";

const fallbackImages = [creatorOne, creatorTwo, creatorThree];

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

type StatusFilter = "ALL" | CampaignApplicationApi["status"];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "APPLIED", label: "Applied" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

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

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "LinkedIn") return <Linkedin className="h-4 w-4" />;
  if (platform === "YouTube") return <Play className="h-4 w-4 fill-current" />;
  return <Instagram className="h-4 w-4" />;
}

function ApplicationRow({
  application,
  index,
  isUpdating,
  onOpenProfile,
  onUpdateStatus,
}: {
  application: CampaignApplicationApi;
  index: number;
  isUpdating: boolean;
  onOpenProfile: (creatorId: string) => void;
  onUpdateStatus: (application: CampaignApplicationApi, status: "ACCEPTED" | "REJECTED") => void;
}) {
  const creator = application.creator_detail;
  const platform = getPrimaryPlatform(creator);
  const platformClass = platformClasses[platform] || "bg-[#4b22ff] text-white";
  const image = creator?.profile_image_url || fallbackImages[index % fallbackImages.length];

  return (
    <CampaignPanel className="flex flex-wrap items-center gap-5 p-5">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#eef2f7]">
        <img src={image} alt={creator?.display_name || "Creator"} className="h-full w-full object-cover" />
        <span className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-md ${platformClass}`}>
          <PlatformIcon platform={platform} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="truncate text-base font-black text-[#1d2430]">
            {creator?.display_name || creator?.user?.name || "Creator"}
          </h3>
          <span className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-black ${statusClasses[application.status]}`}>
            {application.status.charAt(0) + application.status.slice(1).toLowerCase()}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-[#7d8aa0]">
          {creator?.category || "Creator"} • {creator?.location || "Location not set"}
        </p>
        <p className="mt-1 text-xs font-medium text-[#97a3b7]">
          Applied on {formatDate(application.created_at)} • {formatFollowers(creator?.audience_size)} followers
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {application.status === "APPLIED" ? (
          <>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(application, "ACCEPTED")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#12a563] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(application, "REJECTED")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#f3c6c6] bg-white px-4 text-sm font-black text-[#d23b3b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenProfile(creator?.creator_id || application.creator)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-4 text-sm font-black text-[#303948]"
        >
          View Profile <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </CampaignPanel>
  );
}

export function CampaignAllApplicationsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<BrandCampaignDetailApi | null>(null);
  const [applications, setApplications] = useState<CampaignApplicationApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [updatingApplicationId, setUpdatingApplicationId] = useState("");

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

  const filteredApplications = useMemo(
    () => (statusFilter === "ALL" ? applications : applications.filter((application) => application.status === statusFilter)),
    [applications, statusFilter],
  );

  async function handleUpdateStatus(application: CampaignApplicationApi, nextStatus: "ACCEPTED" | "REJECTED") {
    if (!campaignId || updatingApplicationId) return;

    setUpdatingApplicationId(application.application_id);
    try {
      const response = await updateCampaignApplicationStatus(campaignId, application.application_id, nextStatus);
      setApplications((items) =>
        items.map((item) => (item.application_id === application.application_id ? response.application : item)),
      );
      showProjectToast(
        "success",
        nextStatus === "ACCEPTED" ? "Application accepted" : "Application rejected",
        `${application.creator_detail?.display_name || "Creator"} has been ${nextStatus.toLowerCase()}.`,
      );
    } catch (err) {
      showProjectToast(
        "error",
        "Update failed",
        err instanceof Error ? err.message : "Unable to update the application status.",
      );
    } finally {
      setUpdatingApplicationId("");
    }
  }

  return (
    <div className="grid gap-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/brand/campaigns/${campaignId}`)}
            className="inline-flex items-center gap-2 text-sm font-black text-[#4b22ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaign
          </button>
          <h1 className="mt-4 text-[30px] font-black text-[#1d2430]">All Applications</h1>
          <p className="mt-2 text-sm font-medium text-[#7d8aa0]">
            Every creator who applied to {campaign?.title || campaign?.name || "this campaign"}.
          </p>
        </div>
        <span className="inline-flex h-11 items-center rounded-full bg-[#f0eaff] px-5 text-sm font-black text-[#4b22ff]">
          {applications.length} applications
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`h-10 rounded-lg px-4 text-sm font-black transition ${
              statusFilter === filter.value ? "bg-[#4b22ff] text-white" : "border border-[#dfe7f2] bg-white text-[#303948]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#d23b3b]">{error}</CampaignPanel>
      ) : isLoading ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">Loading applications...</CampaignPanel>
      ) : filteredApplications.length ? (
        <div className="grid gap-4">
          {filteredApplications.map((application, index) => (
            <ApplicationRow
              key={application.application_id}
              application={application}
              index={index}
              isUpdating={updatingApplicationId === application.application_id}
              onOpenProfile={(creatorId) => navigate(`/creators/${creatorId}`)}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      ) : (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">No applications match this filter.</CampaignPanel>
      )}
    </div>
  );
}
