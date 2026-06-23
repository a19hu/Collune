import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

import {
  getBrandShortlists,
  updateBrandShortlist,
  type BrandShortlistApi,
  type CreatorProfileApi,
} from "../../../lib/authApi";

function creatorName(creator: CreatorProfileApi) {
  return creator.display_name || creator.user?.name || "Creator";
}

function shortlistCreatorIds(shortlist: BrandShortlistApi) {
  return new Set((shortlist.creators || []).map(String));
}

export function AddCreatorToShortlistModal({
  creator,
  isOpen,
  onClose,
}: {
  creator: CreatorProfileApi;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [shortlists, setShortlists] = useState<BrandShortlistApi[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const creatorId = creator.creator_id;

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setIsLoading(true);
    setError("");
    setSuccess("");
    setSelectedIds([]);

    getBrandShortlists()
      .then((items) => {
        if (mounted) setShortlists(items);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load shortlists.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const availableShortlists = useMemo(
    () => shortlists.filter((shortlist) => !shortlistCreatorIds(shortlist).has(creatorId)),
    [creatorId, shortlists],
  );

  const toggleShortlist = (shortlistId: string) => {
    setSelectedIds((ids) => ids.includes(shortlistId) ? ids.filter((id) => id !== shortlistId) : [...ids, shortlistId]);
  };

  const addToSelectedShortlists = async () => {
    if (!selectedIds.length || isSaving) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const selectedShortlists = shortlists.filter((shortlist) => selectedIds.includes(shortlist.shortlist_id));
      const saved = await Promise.all(
        selectedShortlists.map((shortlist) => {
          const currentCreatorIds = (shortlist.creators || []).map(String);
          const creators = currentCreatorIds.includes(creatorId) ? currentCreatorIds : [...currentCreatorIds, creatorId];
          return updateBrandShortlist(shortlist.shortlist_id, { creators });
        }),
      );

      setShortlists((items) => items.map((item) => saved.find((shortlist) => shortlist.shortlist_id === item.shortlist_id) || item));
      setSelectedIds([]);
      setSuccess(`${creatorName(creator)} added to ${saved.length} shortlist${saved.length === 1 ? "" : "s"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add creator to shortlist.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-8">
      <section className="w-full max-w-xl rounded-xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#e5ebf3] p-6">
          <div>
            <h2 className="text-xl font-black text-[#1d2430]">Add to Shortlist</h2>
            <p className="mt-2 text-sm font-medium text-[#65758f]">
              Choose one or multiple shortlists for {creatorName(creator)}.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-[#65758f]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[420px] overflow-y-auto p-6">
          {error ? <p className="mb-4 rounded-lg bg-[#ffe9e9] px-4 py-3 text-sm font-semibold text-[#d23b3b]">{error}</p> : null}
          {success ? <p className="mb-4 rounded-lg bg-[#e8f8ef] px-4 py-3 text-sm font-semibold text-[#0b9150]">{success}</p> : null}

          {isLoading ? (
            <div className="grid min-h-40 place-items-center text-sm font-semibold text-[#65758f]">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading shortlists...
              </span>
            </div>
          ) : shortlists.length ? (
            <div className="grid gap-3">
              {shortlists.map((shortlist) => {
                const alreadyAdded = shortlistCreatorIds(shortlist).has(creatorId);
                const isSelected = selectedIds.includes(shortlist.shortlist_id);

                return (
                  <button
                    key={shortlist.shortlist_id}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => toggleShortlist(shortlist.shortlist_id)}
                    className={`flex items-center justify-between gap-4 rounded-lg border p-4 text-left ${
                      alreadyAdded
                        ? "border-[#e5ebf3] bg-[#f6f7fa] opacity-70"
                        : isSelected
                          ? "border-[#4b22ff] bg-[#f7f4ff]"
                          : "border-[#e5ebf3] bg-white hover:border-[#4b22ff]"
                    }`}
                  >
                    <span>
                      <strong className="block text-sm font-black text-[#1d2430]">{shortlist.title}</strong>
                      <span className="mt-1 block text-sm font-medium text-[#7d8aa0]">
                        {(shortlist.creators || []).length} creators • {alreadyAdded ? "Already added" : shortlist.status}
                      </span>
                    </span>
                    <span className={`grid h-6 w-6 place-items-center rounded-md border ${isSelected || alreadyAdded ? "border-[#4b22ff] bg-[#4b22ff] text-white" : "border-[#cbd5e1] text-transparent"}`}>
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg bg-[#f6f7fa] px-4 py-5 text-center text-sm font-semibold text-[#65758f]">
              No shortlists found. Create a shortlist first, then add creators to it.
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ebf3] p-6">
          <p className="text-sm font-semibold text-[#65758f]">
            {availableShortlists.length} shortlist{availableShortlists.length === 1 ? "" : "s"} available
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="h-11 rounded-lg border border-[#d8e2fb] px-5 text-sm font-black text-[#173ca8]">
              Close
            </button>
            <button
              type="button"
              disabled={!selectedIds.length || isSaving}
              onClick={addToSelectedShortlists}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#173ca8] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add to Selected
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
