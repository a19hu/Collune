import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import {
  createBrandShortlist,
  getBrandShortlists,
  getCreatorsList,
  updateBrandShortlist,
} from "../../lib/authApi";
import { PrimaryButton } from "./Shortlists/ShortlistUi";
import { ShortlistDetail } from "./Shortlists/ShortlistDetail";
import { ShortlistList } from "./Shortlists/ShortlistList";
import {
  mapCreatorApiToShortlistCreator,
  mapShortlistApiToItem,
  statusApiValues,
  type ShortlistItem,
  type ShortlistStatus,
} from "./Shortlists/shortlistData";

type View = "list" | "detail";
type SortKey = "recent" | "name" | "creators";

export function BrandShortlists() {
  const [view, setView] = useState<View>("list");
  const [shortlists, setShortlists] = useState<ShortlistItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<"All Shortlists" | ShortlistStatus>("All Shortlists");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [isPurposeEditing, setIsPurposeEditing] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [isOrderReversed, setIsOrderReversed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedShortlist = useMemo(
    () => shortlists.find((shortlist) => shortlist.id === selectedId) || shortlists[0],
    [selectedId, shortlists],
  );

  const loadShortlists = async () => {
    setIsLoading(true);
    setError("");
    try {
      const items = (await getBrandShortlists()).map(mapShortlistApiToItem);
      setShortlists(items);
      setSelectedId((current) => current || items[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load shortlists.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadShortlists();
  }, []);

  const persistSelected = async (updater: (shortlist: ShortlistItem) => ShortlistItem) => {
    if (!selectedShortlist) return;
    const next = updater(selectedShortlist);
    setShortlists((items) => items.map((item) => item.id === selectedId ? next : item));
    try {
      const saved = await updateBrandShortlist(selectedId, {
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
      setShortlists((items) => items.map((item) => item.id === selectedId ? mapShortlistApiToItem(saved) : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save shortlist.");
      void loadShortlists();
    }
  };

  const createShortlist = async () => {
    setError("");
    try {
      const next = await createBrandShortlist({
        title: `New Shortlist ${shortlists.length + 1}`,
        status: "DRAFT",
        purpose: "Describe the type of creators you want Collune to reach out to.",
        notes: "",
        platforms: [],
        categories: "",
        audience: "",
        budget_range: "",
        timeline: "",
        creators: [],
      });
      const mapped = mapShortlistApiToItem(next);
      setShortlists((items) => [mapped, ...items]);
      setSelectedId(mapped.id);
      setSearch("");
      setView("detail");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create shortlist.");
    }
  };

  const openShortlist = (shortlist: ShortlistItem) => {
    setSelectedId(shortlist.id);
    setSearch("");
    setIsPurposeEditing(false);
    setIsNotesEditing(false);
    setView("detail");
  };

  const backToList = () => {
    setView("list");
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
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-black tracking-normal text-[#173ca8]">Shortlists</h1>
        <PrimaryButton variant="outline" onClick={createShortlist}>
          <Plus className="h-5 w-5" />
          Build Shortlist
        </PrimaryButton>
      </header>

      {error ? <p className="mb-6 rounded-lg bg-[#ffe9e9] px-4 py-3 text-sm font-semibold text-[#d23b3b]">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm font-semibold text-[#657084]">Loading shortlists...</p>
      ) : view === "detail" && selectedShortlist ? (
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
          onPurposeChange={(value) => setShortlists((items) => items.map((item) => item.id === selectedId ? { ...item, purpose: value } : item))}
          onNotesChange={(value) => setShortlists((items) => items.map((item) => item.id === selectedId ? { ...item, notes: value } : item))}
          onSave={saveChanges}
          onSubmit={submitToCollune}
          onToggleOrder={() => setIsOrderReversed((value) => !value)}
          onRemoveCreator={removeCreator}
        />
      ) : (
        <ShortlistList
          shortlists={shortlists}
          activeTab={activeTab}
          sort={sort}
          onTabChange={setActiveTab}
          onSortChange={setSort}
          onCreate={createShortlist}
          onOpen={openShortlist}
        />
      )}
    </div>
  );
}
