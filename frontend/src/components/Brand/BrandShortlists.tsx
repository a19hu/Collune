import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getBrandShortlist,
  getBrandShortlists,
  getCreatorsList,
  updateBrandShortlist,
} from "../../lib/authApi";
import { ShortlistDetail } from "./Shortlists/ShortlistDetail";
import { ShortlistList } from "./Shortlists/ShortlistList";
import {
  mapCreatorApiToShortlistCreator,
  mapShortlistApiToItem,
  statusApiValues,
  type ShortlistItem,
  type ShortlistStatus,
} from "./Shortlists/shortlistData";

type SortKey = "recent" | "name" | "creators";
const pageSize = 6;

export function BrandShortlists() {
  const { shortlistId } = useParams();
  const navigate = useNavigate();
  const [shortlists, setShortlists] = useState<ShortlistItem[]>([]);
  const [selectedShortlist, setSelectedShortlist] = useState<ShortlistItem | null>(null);
  const [activeTab, setActiveTab] = useState<"All Shortlists" | ShortlistStatus>("All Shortlists");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPurposeEditing, setIsPurposeEditing] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [isOrderReversed, setIsOrderReversed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShortlists = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getBrandShortlists(page, pageSize);
      const items = response.shortlists.map(mapShortlistApiToItem);
      setShortlists(items);
      setTotalPages(Math.max(1, response.total_pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load shortlists.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shortlistId) return;
    void loadShortlists();
  }, [page, shortlistId]);

  useEffect(() => {
    if (!shortlistId) {
      setSelectedShortlist(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError("");
    getBrandShortlist(shortlistId)
      .then((shortlist) => {
        if (!mounted) return;
        setSelectedShortlist(mapShortlistApiToItem(shortlist));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load shortlist.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [shortlistId]);

  const persistSelected = async (updater: (shortlist: ShortlistItem) => ShortlistItem) => {
    if (!selectedShortlist || !shortlistId) return;
    const next = updater(selectedShortlist);
    setSelectedShortlist(next);
    setShortlists((items) => items.map((item) => item.id === shortlistId ? next : item));
    try {
      const saved = await updateBrandShortlist(shortlistId, {
        title: next.title,
        status: statusApiValues[next.status],
        purpose: next.purpose,
        notes: next.notes,
        platforms: next.platforms,
        categories: next.categories,
        audience: next.audience,
        budget_range: next.budgetRange,
        timeline: next.timeline,
        creators: next.creators.map((creator) => creator.id),
      });
      const mapped = mapShortlistApiToItem(saved);
      setSelectedShortlist(mapped);
      setShortlists((items) => items.map((item) => item.id === shortlistId ? mapped : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shortlist.");
      if (shortlistId) {
        getBrandShortlist(shortlistId).then((shortlist) => setSelectedShortlist(mapShortlistApiToItem(shortlist))).catch(() => undefined);
      }
    }
  };

  const openShortlist = (shortlist: ShortlistItem) => {
    navigate(`/brand/shortlists/${shortlist.id}`);
    setSearch("");
    setIsPurposeEditing(false);
    setIsNotesEditing(false);
  };

  const backToList = () => {
    navigate("/brand/shortlists");
    setSearch("");
    setIsPurposeEditing(false);
    setIsNotesEditing(false);
  };

  const submitToCollune = () => {
    void persistSelected((shortlist) => ({
      ...shortlist,
      status: "Submitted",
      updatedAt: "Updated today",
      updatedRank: 0,
    }));
    setActiveTab("Submitted");
  };

  const saveChanges = () => {
    setIsPurposeEditing(false);
    setIsNotesEditing(false);
    void persistSelected((shortlist) => ({ ...shortlist, updatedAt: "Updated today", updatedRank: 0 }));
  };

  const removeCreator = (creatorId: string) => {
    void persistSelected((shortlist) => ({
      ...shortlist,
      creators: shortlist.creators.filter((creator) => creator.id !== creatorId),
      updatedAt: "Updated today",
      updatedRank: 0,
    }));
  };

  const discoverCreators = async () => {
    setSearch("");
    setIsOrderReversed(false);
    if (!selectedShortlist) return;
    try {
      const creators = await getCreatorsList();
      const nextCreator = creators.find((creator) => !selectedShortlist.creators.some((item) => item.id === creator.creator_id));
      if (!nextCreator) return;
      void persistSelected((shortlist) => ({
        ...shortlist,
        creators: [{ ...mapCreatorApiToShortlistCreator(nextCreator, shortlist.creators.length), added: "Added today" }, ...shortlist.creators],
        updatedAt: "Updated today",
        updatedRank: 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load creators.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      

      {error ? <p className="mb-6 rounded-lg bg-[#ffe9e9] px-4 py-3 text-sm font-semibold text-[#d23b3b]">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm font-semibold text-[#657084]">Loading shortlists...</p>
      ) : shortlistId && selectedShortlist ? (
        <ShortlistDetail
          shortlist={selectedShortlist}
          search={search}
          isPurposeEditing={isPurposeEditing}
          isNotesEditing={isNotesEditing}
          isOrderReversed={isOrderReversed}
          onBack={backToList}
          onDiscover={() => void discoverCreators()}
          onSearch={setSearch}
          onEditPurpose={() => setIsPurposeEditing((value) => !value)}
          onEditNotes={() => setIsNotesEditing((value) => !value)}
          onPurposeChange={(value) => {
            setSelectedShortlist((item) => item ? { ...item, purpose: value } : item);
            setShortlists((items) => items.map((item) => item.id === shortlistId ? { ...item, purpose: value } : item));
          }}
          onNotesChange={(value) => {
            setSelectedShortlist((item) => item ? { ...item, notes: value } : item);
            setShortlists((items) => items.map((item) => item.id === shortlistId ? { ...item, notes: value } : item));
          }}
          onSave={saveChanges}
          onSubmit={submitToCollune}
          onToggleOrder={() => setIsOrderReversed((value) => !value)}
          onRemoveCreator={removeCreator}
        />
      ) : (
        <>
          <ShortlistList
            shortlists={shortlists}
            activeTab={activeTab}
            sort={sort}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setPage(1);
            }}
            onSortChange={(nextSort) => {
              setSort(nextSort);
              setPage(1);
            }}
            onCreate={() => navigate("/brand/shortlists/new_create")}
            onOpen={openShortlist}
          />
          {!isLoading && shortlists.length > 0 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
        </>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  const visiblePages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      {visiblePages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${page === item ? "border-[#4b5dff] bg-[#4b5dff] text-white" : "border-[#dce4ef] text-[#63728a]"}`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="grid h-10 w-10 place-items-center rounded-lg border border-[#dce4ef] text-[#63728a] disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
