import { useMemo, useState,useEffect } from "react";

import { AlertCircle, Calendar, ChevronRight, Loader2, MoreHorizontal } from "lucide-react";

import { BrandAvatar, CampaignCard, Pagination, Panel, StatusBadge } from "./MarketplaceUi";
import type { MarketplaceCampaign } from "./marketplaceData";
import { getCreatorCampaigns } from "@/src/lib/authApi";

type SortKey = "recent" | "deadline" | "brand";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently Added" },
  { value: "deadline", label: "Deadline" },
  { value: "brand", label: "Brand Name" },
];

const pageSize = 6;

function sortCampaigns(items: MarketplaceCampaign[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === "brand") return a.brandName.localeCompare(b.brandName);
    if (sort === "deadline") return a.deadline.localeCompare(b.deadline);
    return a.postedAt.localeCompare(b.postedAt);
  });
}

export function CampaignMarketplaceList() {
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [campaignsData, setCampaignsData] = useState<MarketplaceCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const onSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  useEffect(async () => {
    const campaigns = await getCreatorCampaigns()
    setCampaignsData(campaigns)
  }, []);


  return (
    <div>
      <div className="mb-6 flex items-center justify-end">
        <label className="inline-flex items-center gap-3 text-sm font-medium text-[#65758f]">
          Sort by
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="h-10 rounded-lg border border-[#dfe6f0] bg-white px-4 text-sm font-medium text-[#1d2430] outline-none"
          >
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {isLoading ? (
        <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
          <div>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#5168ff]" />
            <p className="mt-4 text-sm font-black text-[#1d2430]">Loading campaigns...</p>
          </div>
        </Panel>
      ) : error ? (
        <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
          <div>
            <AlertCircle className="mx-auto h-8 w-8 text-[#d23b3b]" />
            <h2 className="mt-4 text-xl font-black text-[#1d2430]">Campaigns could not be loaded</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">{error}</p>
          </div>
        </Panel>
      ) : campaignsData.length === 0 ? (
        <Panel className="grid min-h-[306px] place-items-center p-8 text-center">
          <div>
            <AlertCircle className="mx-auto h-8 w-8 text-[#5168ff]" />
            <h2 className="mt-4 text-xl font-black text-[#1d2430]">No campaigns available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#65758f]">
              Active brand campaigns from the backend will appear here.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {campaignsData.map((campaign) => (
             <Panel className="min-h-[306px] p-6">
      <div className="flex items-start justify-between gap-4">
        <button type="button" 
        // onClick={() => onOpen(campaign)}
         className="flex min-w-0 items-center gap-4 text-left">
          <BrandAvatar campaign={campaign} />
          <span className="min-w-0">
            <strong className="block truncate text-base font-black text-[#1d2430]">{campaign.brandName}</strong>
            <span className="mt-1 block text-sm font-medium text-[#65758f]">{campaign.postedAt}</span>
          </span>
        </button>
        {/* <button type="button" onClick={() => onOpen(campaign)} className="text-[#65758f]" aria-label={`${campaign.title} options`}>
          <MoreHorizontal className="h-5 w-5" />
        </button> */}
      </div>

      <div className="mt-6">
        <StatusBadge>New</StatusBadge>
      </div>
      <h2 className="mt-5 text-[22px] font-black leading-tight text-[#1d2430]">{campaign.title}</h2>
      <p className="mt-3 min-h-[48px] text-base font-medium leading-relaxed text-[#65758f]">{campaign.description}</p>

      <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#edf1f6] pt-4">
        <p className="inline-flex items-center gap-2 text-sm font-medium leading-tight text-[#65758f]">
          <Calendar className="h-4 w-4" />
          Apply before {campaign.deadlineShort}
        </p>
        <button type="button" 
        // onClick={() => onOpen(campaign)}
         className="inline-flex h-14 min-w-[152px] items-center justify-center gap-3 rounded-lg border-2 border-[#5168ff] px-5 text-base font-black text-[#3048ff]">
          View<br />Campaign
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </Panel>
          ))}
        </div>
      )}

      {/* {!isLoading && !error && sortedCampaigns.length > 0 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null} */}
    </div>
  );
}
