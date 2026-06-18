import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Ellipsis, Plus, Star, Users } from "lucide-react";

import { CampaignPanel } from "./CampaignUi";
import { campaigns, type CampaignCardItem } from "./campaignData";

type SortKey = "recent" | "applications" | "recommended" | "title";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently Updated" },
  { value: "applications", label: "Most Applications" },
  { value: "recommended", label: "Most Recommended" },
  { value: "title", label: "Campaign Name" },
];

const pageSize = 5;

function StatusBadge({ status }: { status: CampaignCardItem["status"] }) {
  return (
    <span className="inline-flex h-7 items-center rounded-lg bg-[#e8f8ef] px-4 text-sm font-semibold text-[#12a563]">
      {status}
    </span>
  );
}

function NewCampaignCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button type="button" onClick={onCreate} className="text-left">
      <CampaignPanel className="grid min-h-[286px] place-items-center p-8 text-center transition hover:border-[#4b22ff] hover:shadow-sm">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f0eaff] text-[#4b22ff]">
            <Plus className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-xl font-black text-[#1d2430]">New Campaign</h2>
          <p className="mx-auto mt-3 max-w-[250px] text-base font-medium leading-snug text-[#63728a]">
            Create a campaign and start receiving creator applications.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#2f16ff]">
            Create Campaign <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </CampaignPanel>
    </button>
  );
}

function CampaignCard({ item, onSelect }: { key?: string; item: CampaignCardItem; onSelect: (campaign: CampaignCardItem) => void }) {
  const Icon = item.icon;

  return (
    <CampaignPanel className="min-h-[286px] p-6 transition hover:border-[#4b22ff] hover:shadow-sm">
      <div className="flex items-start justify-between">
        <button type="button" onClick={() => onSelect(item)} className={`grid h-12 w-12 place-items-center rounded-xl ${item.iconClassName}`}>
          <Icon className="h-6 w-6" />
        </button>
        <button type="button" className="text-[#68778f]" aria-label="Campaign options">
          <Ellipsis className="h-5 w-5" />
        </button>
      </div>

      <button type="button" onClick={() => onSelect(item)} className="mt-6 block text-left">
        <h2 className="text-xl font-black text-[#1d2430]">{item.title}</h2>
      </button>
      <div className="mt-3">
        <StatusBadge status={item.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-[#4b22ff]" />
          <div>
            <strong className="block text-2xl font-black leading-none text-[#101827]">{item.applications}</strong>
            <span className="text-sm font-medium text-[#697995]">Applications</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Star className="h-5 w-5 text-[#ff9f00]" />
          <div>
            <strong className="block text-2xl font-black leading-none text-[#101827]">{item.recommended}</strong>
            <span className="text-sm font-medium text-[#697995]">Recommended</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[#e4ebf4] pt-5">
        <span className="text-sm font-medium text-[#63728a]">{item.updatedAt}</span>
        <button type="button" onClick={() => onSelect(item)} className="inline-flex items-center gap-2 text-sm font-black text-[#2f16ff]">
          View Campaign <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </CampaignPanel>
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

function sortCampaigns(items: CampaignCardItem[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === "applications") return b.applications - a.applications;
    if (sort === "recommended") return b.recommended - a.recommended;
    if (sort === "title") return a.title.localeCompare(b.title);
    return a.updatedRank - b.updatedRank;
  });
}

export function CampaignList({ onCreate, onSelect }: { onCreate: () => void; onSelect: (campaign: CampaignCardItem) => void }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const sortedCampaigns = useMemo(() => sortCampaigns(campaigns, sort), [sort]);
  const totalPages = Math.ceil(sortedCampaigns.length / pageSize);
  const pageCampaigns = sortedCampaigns.slice((page - 1) * pageSize, page * pageSize);

  const onSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-end">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-[#60708a]">
          Sort by:
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="rounded-lg border border-[#dce4ef] bg-white px-3 py-2 font-black text-[#1d2430] outline-none"
          >
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {page === 1 ? <NewCampaignCard onCreate={onCreate} /> : null}
        {pageCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} item={campaign} onSelect={onSelect} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <p className="mt-8 text-center text-sm font-medium text-[#63728a]">
        Campaigns help you attract the right creators and build meaningful collaborations.{" "}
        <a href="#" className="font-black text-[#2f16ff]">Learn how campaigns work</a>
      </p>
    </div>
  );
}
