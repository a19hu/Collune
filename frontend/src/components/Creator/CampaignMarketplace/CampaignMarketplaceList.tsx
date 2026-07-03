import { useEffect, useState } from "react";

import { AlertCircle, Loader2, Search } from "lucide-react";

import { applyToCampaign, getCreatorCampaigns, saveCreatorCampaign } from "@/src/lib/authApi";
import type { CreatorCampaignListParams } from "@/src/types";
import { CampaignActionCard, Panel } from "./MarketplaceUi";
import { mapCreatorCampaignToMarketplace, type MarketplaceCampaign } from "./marketplaceData";

type SortKey = NonNullable<CreatorCampaignListParams["sort"]>;

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently Added" },
  { value: "deadline", label: "Deadline" },
  { value: "brand", label: "Brand Name" },
];

const pageSize = 6;

function ListPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-semibold ${page === item ? "border-[#4b5dff] bg-[#4b5dff] text-white" : "border-[#dce4ef] text-[#63728a]"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function CampaignMarketplaceList() {
  const [campaigns, setCampaigns] = useState<MarketplaceCampaign[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");

    getCreatorCampaigns({ page, pageSize, search, sort })
      .then((data) => {
        if (!mounted) return;
        setCampaigns(data.campaigns.map(mapCreatorCampaignToMarketplace));
        setTotalPages(data.total_pages);
        setTotalCount(data.count);
      })
      .catch((err) => {
        if (!mounted) return;
        setCampaigns([]);
        setTotalPages(1);
        setTotalCount(0);
        setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page, search, sort]);

  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => setOpenMenuId("");
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [openMenuId]);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  const updateCampaign = (campaignId: string, updates: Partial<MarketplaceCampaign>) => {
    setCampaigns((items) => items.map((item) => item.id === campaignId ? { ...item, ...updates } : item));
  };

  const onApply = async (campaign: MarketplaceCampaign) => {
    if (campaign.applied || applyingId) return;
    setApplyingId(campaign.id);
    try {
      await applyToCampaign(campaign.id);
      updateCampaign(campaign.id, { applied: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply to this campaign.");
    } finally {
      setApplyingId("");
    }
  };

  const onSave = async (campaign: MarketplaceCampaign) => {
    if (campaign.saved || savingId) return;
    setSavingId(campaign.id);
    try {
      await saveCreatorCampaign(campaign.id);
      updateCampaign(campaign.id, { saved: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save this campaign.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-black text-[#65758f]">
          {isLoading ? "Loading campaigns..." : `${totalCount} active campaigns`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa8bd]" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search campaigns..."
              className="h-10 w-[240px] rounded-lg border border-[#dfe6f0] bg-white px-9 text-sm font-medium text-[#1d2430] outline-none placeholder:text-[#9aa8bd]"
            />
          </label>
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
      ) : campaigns.length === 0 ? (
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
          {campaigns.map((campaign) => (
            <CampaignActionCard
              key={campaign.id}
              campaign={campaign}
              onApply={onApply}
              onSave={onSave}
              isApplying={applyingId === campaign.id}
              isSaving={savingId === campaign.id}
              isMenuOpen={openMenuId === campaign.id}
              onMenuToggle={(campaignId) => setOpenMenuId((current) => campaignId && current !== campaignId ? campaignId : "")}
            />
          ))}
        </div>
      )}

      {!isLoading && !error ? <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}
