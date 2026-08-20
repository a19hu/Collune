import { useState,useMemo,ReactNode,useEffect } from "react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { CampaignPanel } from "./Campaigns/CampaignUi";
import { deleteBrandCampaign, getBrandCampaigns } from "@/src/lib/authApi";
import { BrandCard, type BrandCardItem } from "@/src/HtmlComponents/BrandCard";
import type { BrandCampaignListItemApi } from "@/src/types";

function sortCampaigns(items: BrandCampaignListItemApi[], sort: SortKey) {
  return [...items].sort((a, b) => {
    if (sort === "applications") return b.applications_received_count - a.applications_received_count;
    if (sort === "recommended") return b.recommended_creators_count - a.recommended_creators_count;
    if (sort === "title") return a.name.localeCompare(b.name);
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

type SortKey = "recent" | "applications" | "recommended" | "title";

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently Updated" },
  { value: "applications", label: "Most Applications" },
  { value: "recommended", label: "Most Recommended" },
  { value: "title", label: "Campaign Name" },
];

const pageSize = 6;
const loadingCards = Array.from({ length: 5 }, (_, index) => index);

export const BrandCampaigns = () => {
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [campaigns, setCampaigns] = useState<BrandCampaignListItemApi[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<BrandCardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const sortedCampaigns = useMemo(() => sortCampaigns(campaigns, sort), [campaigns, sort]);
  const pageCampaigns = sortedCampaigns;

    const loadCampaigns = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getBrandCampaigns(page, pageSize);
      setCampaigns(response.campaigns);
      setTotalPages(Math.max(1, response.total_pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, [page]);

  const onSortChange = (value: SortKey) => {
    setSort(value);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError("");
    try {
      await deleteBrandCampaign(deleteTarget.id);
      setCampaigns((items) => items.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete campaign.");
    } finally {
      setIsDeleting(false);
    }
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
        {error ? <p className="xl:col-span-3 rounded-lg bg-[#fff1f1] px-4 py-3 text-sm font-black text-[#d23b3b]">{error}</p> : null}
        {isLoading ? loadingCards.map((index) => <LoadingCampaignCard key={index} index={index} />) : null}
        {!isLoading && pageCampaigns.length === 0 ? (
          <FeedbackPanel title="No campaigns yet" copy="Create a campaign and it will appear here with applications and recommendations from the backend." />
        ) : null}
        {pageCampaigns.map((item,index) => (
         <BrandCard
          item={item}
          index={index}
          listvisible={true}
          onEdit={(campaign) => navigate(`/brand/campaigns/${campaign.id}/edit`)}
          onDelete={setDeleteTarget}
         />
        ))}
      </div>

      {!isLoading && sortedCampaigns.length > 0 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}

      <p className="mt-8 text-center text-sm font-medium text-[#63728a]">
        Campaigns help you attract the right creators and build meaningful collaborations.{" "}
        <Link to="/#how-it-works" className="font-black text-[#2f16ff] transition hover:text-[#173fb5]">Learn how campaigns work</Link>
      </p>
      <DeleteCampaignModal
        campaign={deleteTarget}
        isDeleting={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export function DeleteCampaignModal({
  campaign,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  campaign: BrandCardItem | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0d1633]/45 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_24px_70px_rgba(13,22,51,0.22)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#fff1f1] text-[#d23b3b]">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-center text-xl font-black text-[#1d2430]">Delete campaign?</h2>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm font-medium leading-relaxed text-[#63728a]">
          This will permanently delete <strong>{campaign.name}</strong>. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="h-10 rounded-lg border border-[#dce4ef] px-5 text-sm font-black text-[#303948] disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="h-10 rounded-lg bg-[#d23b3b] px-5 text-sm font-black text-white disabled:opacity-60">
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
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


function FeedbackPanel({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <CampaignPanel className="grid min-h-[286px] place-items-center p-8 text-center xl:col-span-2">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0eaff] text-[#4b22ff]">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-xl font-black text-[#1d2430]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[360px] text-sm font-medium leading-relaxed text-[#63728a]">{copy}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </CampaignPanel>
  );
}

function LoadingCampaignCard({ index }: { key?: number; index: number }) {
  return (
    <CampaignPanel className="min-h-[286px] p-6">
      <div className="flex items-start justify-between">
        <span className="h-12 w-12 animate-pulse rounded-xl bg-[#eef2f7]" />
        <span className="h-5 w-5 animate-pulse rounded bg-[#eef2f7]" />
      </div>
      <div className="mt-7 h-6 w-4/5 animate-pulse rounded bg-[#eef2f7]" />
      <div className="mt-4 h-7 w-20 animate-pulse rounded-lg bg-[#eef2f7]" />
      <div className="mt-7 grid grid-cols-2 gap-4">
        <span className="h-11 animate-pulse rounded bg-[#eef2f7]" />
        <span className="h-11 animate-pulse rounded bg-[#eef2f7]" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#e4ebf4] pt-5">
        <span className="h-4 w-28 animate-pulse rounded bg-[#eef2f7]" />
        <span className="h-4 w-24 animate-pulse rounded bg-[#eef2f7]" />
      </div>
      <span className="sr-only">Loading campaign {index + 1}</span>
    </CampaignPanel>
  );
}
