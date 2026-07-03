import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCreatorAppliedCampaigns, removeCampaignApplication } from "../../lib/authApi";
import type { CreatorAppliedCampaignApi } from "../../types";
import { Panel } from "../../HtmlComponents/BrandCard";

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(status: CreatorAppliedCampaignApi["application_status"]) {
  return status === "ACCEPTED" ? "Accepted" : "Applied";
}

function statusClass(status: CreatorAppliedCampaignApi["application_status"]) {
  return status === "ACCEPTED" ? "bg-[#ddfbea] text-[#189661]" : "bg-[#eef2ff] text-[#5168ff]";
}

function AppliedCampaignCard({
  application,
  onRemove,
  isRemoving,
}: {
  key?: string;
  application: CreatorAppliedCampaignApi;
  onRemove: (application: CreatorAppliedCampaignApi) => void;
  isRemoving?: boolean;
}) {
  const navigate = useNavigate();
  const campaign = application.campaign;

  return (
    <Panel className="min-h-[240px] p-6">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <span className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-black ${statusClass(application.application_status)}`}>
            <CheckCircle2 className="h-4 w-4" />
            {statusLabel(application.application_status)}
          </span>
          <h2 className="mt-5 text-xl font-black leading-tight text-[#1d2430]">{campaign.title}</h2>
          <p className="mt-2 text-sm font-semibold text-[#65758f]">{campaign.brand_name} · {campaign.brand_type || "Brand"}</p>
        </div>
        {campaign.brand_logo ? (
          <img src={campaign.brand_logo} alt={campaign.brand_name} className="h-12 w-12 rounded-md object-cover" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-sm font-black text-[#5168ff]">
            {campaign.brand_name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      <p className="mt-5 min-h-[44px] text-sm font-medium leading-relaxed text-[#65758f]">
        {campaign.objective || "Campaign objective not provided."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#edf1f6] pt-4">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#65758f]">
          <Calendar className="h-4 w-4" />
          Deadline: {formatDate(campaign.deadline)}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/creator/marketplace/${campaign.id}`)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5168ff] px-4 text-sm font-black text-white"
        >
          View Campaign <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(application)}
          disabled={isRemoving}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#f3b7b7] px-4 text-sm font-black text-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Remove
        </button>
      </div>
    </Panel>
  );
}

export function AppliedCampaigns() {
  const [applications, setApplications] = useState<CreatorAppliedCampaignApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    getCreatorAppliedCampaigns()
      .then((data) => {
        if (!mounted) return;
        setApplications(data.campaigns);
      })
      .catch((err) => {
        if (!mounted) return;
        setApplications([]);
        setError(err instanceof Error ? err.message : "Unable to load applied campaigns.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const removeApplication = async (application: CreatorAppliedCampaignApi) => {
    setRemovingId(application.application_id);
    setError("");
    try {
      await removeCampaignApplication(application.campaign.id);
      setApplications((items) => items.filter((item) => item.application_id !== application.application_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove campaign application.");
    } finally {
      setRemovingId("");
    }
  };

  if (isLoading) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#5168ff]" />
          <p className="mt-4 text-sm font-black text-[#1d2430]">Loading applied campaigns...</p>
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#d23b3b]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">Applications could not be loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">{error}</p>
        </div>
      </Panel>
    );
  }

  if (!applications.length) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#5168ff]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">No applied campaigns yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">
            Campaigns you apply to or get accepted for will appear here.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {applications.map((application) => (
        <AppliedCampaignCard
          key={application.application_id}
          application={application}
          onRemove={removeApplication}
          isRemoving={removingId === application.application_id}
        />
      ))}
    </div>
  );
}

export default AppliedCampaigns;
