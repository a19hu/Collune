import { useEffect, useMemo, useState } from "react";
import { getAdminCampaigns } from "../../lib/authApi";
import type { AdminCampaignTableItem } from "../../types";
import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";

export function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState<AdminCampaignTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getAdminCampaigns()
      .then((items) => {
        if (mounted) setCampaigns(items);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load campaigns.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => campaigns.map((campaign) => ({
    Campaign: campaign.title,
    Brand: campaign.brand,
    Recommended: String(campaign.recommended_creators_count ?? 0),
    Applications: String(campaign.applications_received_count ?? 0),
  })), [campaigns]);

  return (
    <div>
      <AdminSectionHeader title="Campaigns" copy="Monitor campaign submissions, status, applications, and brand activity." />
      {isLoading ? <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">Loading campaigns...</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">No campaigns found.</p>
      ) : null}
      {!isLoading && !error && rows.length > 0 ? (
      <AdminTablePlaceholder
        columns={["Campaign", "Brand", "Recommended", "Applications"]}
        rows={rows}
      />
      ) : null}
    </div>
  );
}

export default AdminCampaigns;
