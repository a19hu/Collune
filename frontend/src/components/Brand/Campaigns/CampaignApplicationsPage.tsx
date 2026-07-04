import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Instagram, Linkedin, Play, Users } from "lucide-react";
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

function getEngagement(creator?: CreatorProfileApi) {
  const engagement = creator?.social_accounts?.find((account) => typeof account.engagement_rate === "number")?.engagement_rate;
  return typeof engagement === "number" ? `${engagement.toFixed(1)}%` : "N/A";
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "LinkedIn") return <Linkedin className="h-4 w-4" />;
  if (platform === "YouTube") return <Play className="h-4 w-4 fill-current" />;
  return <Instagram className="h-4 w-4" />;
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

  return (
    <div className="grid gap-8 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/brand/campaigns")}
            className="mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8e2fb] px-4 text-sm font-black text-[#173ca8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>
          <h1 className="text-[30px] font-black leading-tight tracking-normal text-[#1d2430]">
            {campaign?.title || "Campaign Applications"}
          </h1>
          <p className="mt-2 text-base font-medium text-[#7d8aa0]">
            All creator profiles that applied to this campaign.
          </p>
        </div>
        <div className="rounded-lg bg-[#f6f7fa] px-5 py-4 text-right">
          <span className="block text-sm font-bold text-[#8995a8]">Applications</span>
          <strong className="block text-3xl font-black leading-tight text-[#1d2430]">{campaignApplications.length}</strong>
        </div>
      </header>

      {campaign ? (
        <CampaignPanel className="grid gap-5 p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-xl font-black text-[#1d2430]">Campaign Details</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[#63728a]">{campaign.objective || campaign.brief || "No objective added."}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(campaign.platforms || []).map((platform) => (
                <span key={platform} className="rounded-lg bg-[#eef2ff] px-3 py-1.5 text-xs font-black text-[#173ca8]">{normalizePlatform(platform)}</span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            <DetailStat label="Budget" value={campaign.budget_range || campaign.total_budget || "Not set"} />
            <DetailStat label="Category" value={campaign.category || "Not set"} />
            <DetailStat label="Applications" value={String(campaign.applications_received_count || 0)} />
            <DetailStat label="Recommended" value={String(campaign.recommended_creators_count || 0)} />
          </div>
        </CampaignPanel>
      ) : null}

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

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#f6f7fa] px-4 py-3">
      <span className="font-semibold text-[#7d8aa0]">{label}</span>
      <strong className="text-right font-black text-[#1d2430]">{value}</strong>
    </div>
  );
}
