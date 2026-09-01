import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Panel } from "../../HtmlComponents/BrandCard";
import { CreatorCard } from "../../HtmlComponents/CreatorCard";
import { showProjectToast } from "../../HtmlComponents/HtmlRoster";
import { getBrandSavedCreators, removeBrandSavedCreator } from "../../lib/authApi";
import type { BrandSavedCreatorApi } from "../../types";

function mapSavedCreatorToCard(savedCreator: BrandSavedCreatorApi) {
  const creator = savedCreator.creator;
  return {
    ...creator,
    creator_id: creator.id,
    category: creator.niche,
    profile_image: creator.profile_photo,
  };
}

export default function SavedCreators() {
  const navigate = useNavigate();
  const [savedCreators, setSavedCreators] = useState<BrandSavedCreatorApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    getBrandSavedCreators()
      .then((data) => {
        if (!mounted) return;
        setSavedCreators(data.creators);
      })
      .catch((err) => {
        if (!mounted) return;
        setSavedCreators([]);
        setError(err instanceof Error ? err.message : "Unable to load saved creators.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const removeCreator = async (savedCreator: BrandSavedCreatorApi) => {
    const creatorId = savedCreator.creator.id;
    if (!creatorId) return;

    setRemovingId(savedCreator.saved_id);
    setError("");
    try {
      await removeBrandSavedCreator(creatorId);
      setSavedCreators((items) => items.filter((item) => item.saved_id !== savedCreator.saved_id));
      showProjectToast("info", "Creator removed", "The creator has been removed from your saved list.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove saved creator.";
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
          <p className="mt-4 text-sm font-black text-[#1d2430]">Loading saved creators...</p>
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#d23b3b]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">Saved creators could not be loaded</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">{error}</p>
        </div>
      </Panel>
    );
  }

  if (!savedCreators.length) {
    return (
      <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
        <div>
          <AlertCircle className="mx-auto h-8 w-8 text-[#5168ff]" />
          <h2 className="mt-4 text-xl font-black text-[#1d2430]">No saved creators yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">
            Creators you save will appear here.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {savedCreators.map((savedCreator, index) => {
        const creator = mapSavedCreatorToCard(savedCreator);
        return (
          <div key={index} className="space-y-3">
            <CreatorCard
              creator={creator}
              index={index}
              isBrand
              isSaved
              isSaving={removingId === savedCreator.saved_id}
              onToggleSaved={() => removeCreator(savedCreator)}
            />
            <button
              type="button"
              onClick={() => navigate(`/brand/chat?creatorId=${savedCreator.creator.id}`)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d8e3ff] bg-white text-sm font-black text-[#3556b8]"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with creator
            </button>
          </div>
        );
      })}
    </div>
  );
}
