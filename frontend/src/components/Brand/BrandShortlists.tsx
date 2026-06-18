import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { PrimaryButton } from "./Shortlists/ShortlistUi";
import { ShortlistDetail } from "./Shortlists/ShortlistDetail";
import { ShortlistList } from "./Shortlists/ShortlistList";
import { createNewShortlist, initialShortlists, suggestedCreators, type ShortlistItem, type ShortlistStatus } from "./Shortlists/shortlistData";

type View = "list" | "detail";
type SortKey = "recent" | "name" | "creators";

export function BrandShortlists() {
  const [view, setView] = useState<View>("list");
  const [shortlists, setShortlists] = useState<ShortlistItem[]>(initialShortlists);
  const [selectedId, setSelectedId] = useState(initialShortlists[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"All Shortlists" | ShortlistStatus>("All Shortlists");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [isPurposeEditing, setIsPurposeEditing] = useState(false);
  const [isNotesEditing, setIsNotesEditing] = useState(false);
  const [isOrderReversed, setIsOrderReversed] = useState(false);
  const [sequence, setSequence] = useState(1);

  const selectedShortlist = useMemo(
    () => shortlists.find((shortlist) => shortlist.id === selectedId) || shortlists[0],
    [selectedId, shortlists],
  );

  const updateSelected = (updater: (shortlist: ShortlistItem) => ShortlistItem) => {
    setShortlists((items) => items.map((item) => item.id === selectedId ? updater(item) : item));
  };

  const createShortlist = () => {
    const nextSequence = sequence + 1;
    const next = createNewShortlist(nextSequence);
    setSequence(nextSequence);
    setShortlists((items) => [next, ...items]);
    setSelectedId(next.id);
    setSearch("");
    setView("detail");
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
    updateSelected((shortlist) => ({
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
    updateSelected((shortlist) => ({ ...shortlist, updatedAt: "Updated today", updatedRank: 0 }));
  };

  const removeCreator = (creatorId: string) => {
    updateSelected((shortlist) => ({
      ...shortlist,
      creators: shortlist.creators.filter((creator) => creator.id !== creatorId),
      updatedAt: "Updated today",
      updatedRank: 0,
    }));
  };

  const discoverCreators = () => {
    setSearch("");
    setIsOrderReversed(false);
    updateSelected((shortlist) => {
      const nextCreator = suggestedCreators.find((creator) => !shortlist.creators.some((item) => item.id === creator.id));
      if (!nextCreator) return shortlist;
      return {
        ...shortlist,
        creators: [{ ...nextCreator, added: "Added today" }, ...shortlist.creators],
        updatedAt: "Updated today",
        updatedRank: 0,
      };
    });
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

      {view === "detail" && selectedShortlist ? (
        <ShortlistDetail
          shortlist={selectedShortlist}
          search={search}
          isPurposeEditing={isPurposeEditing}
          isNotesEditing={isNotesEditing}
          isOrderReversed={isOrderReversed}
          onBack={backToList}
          onDiscover={discoverCreators}
          onSearch={setSearch}
          onEditPurpose={() => setIsPurposeEditing((value) => !value)}
          onEditNotes={() => setIsNotesEditing((value) => !value)}
          onPurposeChange={(value) => updateSelected((shortlist) => ({ ...shortlist, purpose: value }))}
          onNotesChange={(value) => updateSelected((shortlist) => ({ ...shortlist, notes: value }))}
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
