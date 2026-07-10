import { useEffect, useMemo, useState } from "react";

import { getAdminCreators, updateAdminVerification } from "../../lib/authApi";
import type { AdminCreatorTableItem } from "../../types";
import { AdminPanel, AdminSectionHeader } from "./AdminUi";

type VerificationValue = "PENDING" | "VERIFIED";

export function AdminCreators() {
  const [creators, setCreators] = useState<AdminCreatorTableItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, VerificationValue>>({});
  const [savingId, setSavingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getAdminCreators()
      .then((items) => {
        if (!mounted) return;
        setCreators(items);
        setDrafts(
          Object.fromEntries(items.map((item) => [item.id, item.verification])),
        );
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load creators.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const hasRows = useMemo(() => creators.length > 0, [creators.length]);

  async function handleSave(creatorId: string) {
    const verification = drafts[creatorId];
    if (!verification) return;

    setSavingId(creatorId);
    setError("");
    try {
      await updateAdminVerification("creators", creatorId, verification);
      setCreators((current) =>
        current.map((creator) =>
          creator.id === creatorId ? { ...creator, verification } : creator,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update creator verification.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <AdminSectionHeader title="Creators" copy="Review creator profiles, verification status, visibility, and social account readiness." />
      {isLoading ? <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">Loading creators...</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
      {!isLoading && !error && !hasRows ? (
        <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">No creators found.</p>
      ) : null}
      {!isLoading && hasRows ? (
        <AdminPanel className="overflow-hidden">
          <div className="grid border-b border-[#edf1fb] bg-[#f7f9ff] px-5 py-4 text-xs font-black uppercase text-[#657084]" style={{ gridTemplateColumns: "1.25fr 1.2fr 1fr 0.85fr 1.3fr" }}>
            <span>Creator</span>
            <span>Category</span>
            <span>Contact</span>
            <span>Visibility</span>
            <span>Verification</span>
          </div>
          <div className="divide-y divide-[#edf1fb]">
            {creators.map((creator) => {
              const draft = drafts[creator.id] ?? creator.verification;
              const isDirty = draft !== creator.verification;
              const isSaving = savingId === creator.id;

              return (
                <div key={creator.id} className="grid items-center gap-3 px-5 py-4 text-sm text-[#334260]" style={{ gridTemplateColumns: "1.25fr 1.2fr 1fr 0.85fr 1.3fr" }}>
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#1d203a]">{creator.name}</p>
                    <p className="truncate text-xs font-semibold text-[#7a8496]">{creator.email}</p>
                  </div>
                  <span className="truncate font-semibold">{creator.category || "-"}</span>
                  <span className="truncate font-semibold">{creator.phone || "-"}</span>
                  <span className="font-semibold">{creator.visibility ? "Visible" : "Hidden"}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={draft}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [creator.id]: event.target.value as VerificationValue }))
                      }
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#d6def3] bg-white px-3 text-sm font-semibold text-[#243a73]"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSave(creator.id)}
                      disabled={!isDirty || isSaving}
                      className="h-10 shrink-0 rounded-lg bg-[#2448bd] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#c6d1f1]"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}

export default AdminCreators;
