import { getAdminShortlists } from "@/src/lib/authApi";
import { AdminSectionHeader, AdminTablePlaceholder } from "./AdminUi";
import { useEffect, useMemo, useState } from "react";
import { AdminShortlistTableItem } from "@/src/types";

export function AdminShortlists() {
    const [shortlists, setShortlists] = useState<AdminShortlistTableItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
  
    useEffect(() => {
      let mounted = true;
  
      getAdminShortlists()
        .then((items) => {
          if (mounted) setShortlists(items);
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
  
    const rows = useMemo(() => shortlists.map((shortlist) => ({
      Shortlist: shortlist.title,
      Brand: shortlist.brand,
      Date: formatDateRange(shortlist.start_date, shortlist.end_date),
      Creators: String(shortlist.creators_count ?? 0),
    })), [shortlists]);
  return (
    <div>

      <AdminSectionHeader title="Shortlists" copy="Track brand shortlists, selected creators, submission status, and moderation needs." />
      {isLoading ? <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">Loading shortlists...</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">No shortlists found.</p>
      ) : null}
      {!isLoading && !error && rows.length > 0 ? (
      <AdminTablePlaceholder
        columns={["Shortlist", "Brand", "Date", "Creators"]}
        rows={rows}
      />
      ) : null}
    </div>
  );
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "-";
  if (!startDate) return `Until ${endDate}`;
  if (!endDate) return `From ${startDate}`;
  return `${startDate} to ${endDate}`;
}

export default AdminShortlists;
