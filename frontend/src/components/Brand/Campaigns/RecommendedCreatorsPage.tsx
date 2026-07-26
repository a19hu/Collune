import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import creatorOne from "../../../assets/collune/creator-1.png";
import creatorTwo from "../../../assets/collune/creator-2.png";
import creatorThree from "../../../assets/collune/creator-3.png";
import { getBrandCampaignDetail } from "../../../lib/authApi";
import type { BrandCampaignDetailApi, BrandRecommendedCreatorApi } from "../../../types";
import { CampaignPanel } from "./CampaignUi";

const fallbackImages = [creatorOne, creatorTwo, creatorThree];

function RecommendedCreatorCard({
  creator,
  index,
  onOpenProfile,
}: {
  creator: BrandRecommendedCreatorApi;
  index: number;
  onOpenProfile: (creatorId: string) => void;
}) {
  const image = creator.profile_picture || fallbackImages[index % fallbackImages.length];

  return (
    <CampaignPanel className="overflow-hidden">
      <div className="relative aspect-[1.05/1] bg-[#eef2f7]">
        <img src={image} alt={creator.name || "Creator"} className="h-full w-full object-cover" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-[#4b22ff] px-3 py-1 text-[11px] font-black text-white">
          <Star className="h-3.5 w-3.5" />
          Collune Pick
        </span>
      </div>
      <div className="p-5">
        <h2 className="truncate text-lg font-black text-[#1d2430]">{creator.name || creator.username || "Creator"}</h2>
        <p className="mt-1 truncate text-sm font-semibold text-[#7d8aa0]">@{creator.username || "creator"}</p>
        <p className="mt-3 truncate text-sm font-medium text-[#97a3b7]">{creator.email}</p>
        <button
          type="button"
          onClick={() => onOpenProfile(creator.creator_id)}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dfe7f2] bg-white px-4 text-sm font-black text-[#303948]"
        >
          View Profile <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </CampaignPanel>
  );
}

export function RecommendedCreatorsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<BrandCampaignDetailApi | null>(null);
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
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load recommended creators.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [campaignId]);

  const recommendedCreators = useMemo(
    () => campaign?.recommended_creators || [],
    [campaign],
  );

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
          <h1 className="mt-4 text-[30px] font-black text-[#1d2430]">Recommended Creators</h1>
          <p className="mt-2 text-sm font-medium text-[#7d8aa0]">
            Collune-recommended creator profiles for {campaign?.title || campaign?.name || "this campaign"}.
          </p>
        </div>
        <span className="inline-flex h-11 items-center rounded-full bg-[#f0eaff] px-5 text-sm font-black text-[#4b22ff]">
          {recommendedCreators.length} creators
        </span>
      </div>

      {error ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#d23b3b]">{error}</CampaignPanel>
      ) : isLoading ? (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">Loading recommended creators...</CampaignPanel>
      ) : recommendedCreators.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {recommendedCreators.map((creator, index) => (
            <RecommendedCreatorCard
              key={creator.creator_id}
              creator={creator}
              index={index}
              onOpenProfile={(creatorId) => navigate(`/creators/${creatorId}`)}
            />
          ))}
        </div>
      ) : (
        <CampaignPanel className="p-8 text-center text-sm font-black text-[#63728a]">
          No recommended creators available for this campaign yet.
        </CampaignPanel>
      )}
    </div>
  );
}

export default RecommendedCreatorsPage;
