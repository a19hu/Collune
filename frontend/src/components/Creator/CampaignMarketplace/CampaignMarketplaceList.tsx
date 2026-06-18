import { useMemo, useState } from "react";

import { AlertCircle, Loader2 } from "lucide-react";

import { CampaignCard, Pagination, Panel } from "./MarketplaceUi";
import type { MarketplaceCampaign } from "./marketplaceData";

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

export function CampaignMarketplaceList({
  campaigns,
  isLoading,
  error,
  onOpen,
}: {
  campaigns: MarketplaceCampaign[];
  isLoading: boolean;
  error: string;
  onOpen: (campaign: MarketplaceCampaign) => void;
}) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const sortedCampaigns = useMemo(() => sortCampaigns(campaigns, sort), [campaigns, sort]);
  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / pageSize));
  const pageCampaigns = sortedCampaigns.slice((page - 1) * pageSize, page * pageSize);

  const onSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

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
      ) : pageCampaigns.length === 0 ? (
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
          {pageCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onOpen={onOpen} />
          ))}
        </div>
      )}

      {!isLoading && !error && sortedCampaigns.length > 0 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  );
}
