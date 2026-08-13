import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Panel } from "../../HtmlComponents/BrandCard";
import { CreatorCard } from "../../HtmlComponents/CreatorCard";
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove saved creator.");
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
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {savedCreators.map((savedCreator, index) => {
        const creator = mapSavedCreatorToCard(savedCreator);
        return (
          <div
            key={creator.creator_id || creator.username || `${creator.display_name}-${index}`}
            // className="overflow-hidden rounded-lg"
          >
            <CreatorCard
              creator={creator}
              index={index}
            />
            <button
              type="button"
              onClick={() => removeCreator(savedCreator)}
              disabled={removingId === savedCreator.saved_id}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-b-lg border border-t-0 border-[#f3b7b7] bg-white px-4 text-[13px] font-black text-[#b42318] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removingId === savedCreator.saved_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Unsave Creator
            </button>
          </div>
        );
      })}
    </div>
  );
}
