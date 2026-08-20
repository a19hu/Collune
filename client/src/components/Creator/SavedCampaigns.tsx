import { AlertCircle, ArrowRight, Bookmark, Calendar, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "../../HtmlComponents/BrandCard";
import { getCreatorSavedCampaigns, removeSavedCampaign } from "../../lib/authApi";
import type { CreatorSavedCampaignApi } from "../../types";
import { showProjectToast } from "../../HtmlComponents/HtmlRoster";

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function SavedCampaignCard({
  savedCampaign,
  onRemove,
  isRemoving,
}: {
  key?: string;
  savedCampaign: CreatorSavedCampaignApi;
  onRemove: (savedCampaign: CreatorSavedCampaignApi) => void;
  isRemoving?: boolean;
}) {
  const navigate = useNavigate();
  const campaign = savedCampaign.campaign;

  return (
    <Panel className="min-h-[240px] p-6">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <span className="inline-flex h-8 items-center gap-2 rounded-md bg-[#eef2ff] px-3 text-sm font-black text-[#5168ff]">
            <Bookmark className="h-4 w-4 fill-current" />
            Saved
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
          onClick={() => onRemove(savedCampaign)}
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

export function SavedCampaigns() {
  const [savedCampaigns, setSavedCampaigns] = useState<CreatorSavedCampaignApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    getCreatorSavedCampaigns()
      .then((data) => {
        if (!mounted) return;
        setSavedCampaigns(data.campaigns);
      })
      .catch((err) => {
        if (!mounted) return;
        setSavedCampaigns([]);
        setError(err instanceof Error ? err.message : "Unable to load saved campaigns.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const removeCampaign = async (savedCampaign: CreatorSavedCampaignApi) => {
    setRemovingId(savedCampaign.saved_id);
    setError("");
    try {
      await removeSavedCampaign(savedCampaign.campaign.id);
      setSavedCampaigns((items) => items.filter((item) => item.saved_id !== savedCampaign.saved_id));
      showProjectToast("info", "Campaign removed", "The campaign has been removed from your saved list.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove saved campaign.";
      setError(message);
      showProjectToast("error", "Remove failed", message);
    } finally {
      setRemovingId("");
    }
  };

  if (isLoading) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#5168ff]" />
          <p className="mt-4 text-sm font-black text-[#1d2430]">Loading saved campaigns...</p>
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#d23b3b]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">Saved campaigns could not be loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">{error}</p>
        </div>
      </Panel>
    );
  }

  if (!savedCampaigns.length) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#5168ff]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">No saved campaigns yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">
            Saved campaigns from the marketplace will appear here.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {savedCampaigns.map((savedCampaign) => (
        <SavedCampaignCard
          key={savedCampaign.saved_id}
          savedCampaign={savedCampaign}
          onRemove={removeCampaign}
          isRemoving={removingId === savedCampaign.saved_id}
        />
      ))}
    </div>
  );
}

export default SavedCampaigns;
