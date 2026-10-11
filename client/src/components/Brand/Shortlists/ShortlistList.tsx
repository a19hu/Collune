import { Info, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { shortlistStatusOptions, type ShortlistItem, type ShortlistStatus } from "./shortlistData";
import { BrandCard, type BrandCardItem, type CampaignBrand } from "@/src/HtmlComponents/BrandCard";

type SortKey = "recent" | "name" | "creators";

const sortLabels: Record<SortKey, string> = {
  recent: "Recently Updated",
  name: "Name",
  creators: "Most Creators",
};

function sortShortlists(items: ShortlistItem[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === "name") return a.title.localeCompare(b.title);
    if (sort === "creators") return b.creators.length - a.creators.length;
    return a.updatedRank - b.updatedRank;
  });
}

function shortlistToBrandCardItem(shortlist: ShortlistItem): BrandCardItem {
  return {
    id: shortlist.id,
    name: shortlist.title,
    status: shortlist.status,
    objective: shortlist.purpose || shortlist.notes || "A curated list of creators for this brand.",
    cover_image: shortlist.creators[0]?.image || null,
    creators_count: shortlist.creators.length,
  };
}

export function getVisibleShortlists(items: ShortlistItem[], tab: "All Shortlists" | ShortlistStatus, sort: SortKey) {
  const filtered = tab === "All Shortlists" ? items : items.filter((item) => item.status === tab);
  return sortShortlists(filtered, sort);
}

export function ShortlistList({
  shortlists,
  activeTab,
  sort,
  onTabChange,
  onSortChange,
  onCreate,
  onOpen,
  brand,
}: {
  shortlists: ShortlistItem[];
  activeTab: "All Shortlists" | ShortlistStatus;
  sort: SortKey;
  onTabChange: (tab: "All Shortlists" | ShortlistStatus) => void;
  onSortChange: (sort: SortKey) => void;
  onCreate: () => void;
  onOpen: (item: ShortlistItem) => void;
  brand?: CampaignBrand;
}) {
  const visibleShortlists = getVisibleShortlists(shortlists, activeTab, sort);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {shortlistStatusOptions.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`h-10 rounded-full px-6 text-sm font-black transition ${activeTab === tab ? "bg-[#dfe7ff] text-brand-primary" : "text-ink-muted hover:bg-[#f4f6fb]"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
          Sort by:
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="rounded-lg border border-transparent bg-white px-2 py-2 font-black text-ink-strong outline-none"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>{sortLabels[key]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* <NewShortlistCard onCreate={onCreate} /> */}
        {visibleShortlists.map((shortlist) => (
          <BrandCard
            key={shortlist.id}
            item={shortlistToBrandCardItem(shortlist)}
            index={0}
            shortlist
            brand={brand}
            onEdit={() => onOpen(shortlist)}
          />
        ))}
        {visibleShortlists.length === 0 ? (
          <div className="grid min-h-[296px] place-items-center rounded-xl border border-[#dfe5ee] bg-white p-8 text-center xl:col-span-2">
            <div>
              <Plus className="mx-auto h-10 w-10 text-brand-primary" />
              <h2 className="mt-4 text-xl font-black text-black">No shortlists in this status</h2>
              <p className="mt-2 text-sm font-medium text-ink-muted">Create a new shortlist or switch tabs to view another status.</p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-12 flex flex-wrap items-center justify-center gap-2 text-center text-sm font-medium text-ink-muted">
        <Info className="h-4 w-4" />
        Shortlists help our team understand the type of creators you're looking for.
        <Link to="/#how-it-works" className="font-black text-brand-primary transition hover:text-[#5e69ff]">Learn how shortlists work -&gt;</Link>
      </p>
    </div>
  );
}
