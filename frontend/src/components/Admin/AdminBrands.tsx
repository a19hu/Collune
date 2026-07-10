import { useEffect, useMemo, useState } from "react";

import { getAdminBrands, updateAdminVerification } from "../../lib/authApi";
import type { AdminBrandTableItem } from "../../types";
import { AdminPanel, AdminSectionHeader } from "./AdminUi";

type VerificationValue = "PENDING" | "VERIFIED";

export function AdminBrands() {
  const [brands, setBrands] = useState<AdminBrandTableItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, VerificationValue>>({});
  const [savingId, setSavingId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getAdminBrands()
      .then((items) => {
        if (!mounted) return;
        setBrands(items);
        setDrafts(
          Object.fromEntries(items.map((item) => [item.id, item.verification])),
        );
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load brands.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const hasRows = useMemo(() => brands.length > 0, [brands.length]);

  async function handleSave(brandId: string) {
    const verification = drafts[brandId];
    if (!verification) return;

    setSavingId(brandId);
    setError("");
    try {
      await updateAdminVerification("brands", brandId, verification);
      setBrands((current) =>
        current.map((brand) =>
          brand.id === brandId ? { ...brand, verification } : brand,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update brand verification.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <AdminSectionHeader title="Brands" copy="Review brand registrations, company details, verification state, and account visibility." />
      {isLoading ? <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">Loading brands...</p> : null}
      {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-black text-[#b42318]">{error}</p> : null}
      {!isLoading && !error && !hasRows ? (
        <p className="rounded-xl border border-[#dfe5ee] bg-white p-5 text-sm font-black text-[#657084]">No brands found.</p>
      ) : null}
      {!isLoading && hasRows ? (
        <AdminPanel className="overflow-hidden">
          <div className="grid border-b border-[#edf1fb] bg-[#f7f9ff] px-5 py-4 text-xs font-black uppercase text-[#657084]" style={{ gridTemplateColumns: "1.3fr 1fr 1fr 0.85fr 1.3fr 0.75fr" }}>
            <span>Brand</span>
            <span>Industry</span>
            <span>Contact</span>
            <span>Visibility</span>
            <span>Verification</span>
            <span>Campaigns</span>
          </div>
          <div className="divide-y divide-[#edf1fb]">
            {brands.map((brand) => {
              const draft = drafts[brand.id] ?? brand.verification;
              const isDirty = draft !== brand.verification;
              const isSaving = savingId === brand.id;

              return (
                <div key={brand.id} className="grid items-center gap-3 px-5 py-4 text-sm text-[#334260]" style={{ gridTemplateColumns: "1.3fr 1fr 1fr 0.85fr 1.3fr 0.75fr" }}>
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#1d203a]">{brand.name}</p>
                    <p className="truncate text-xs font-semibold text-[#7a8496]">{brand.email}</p>
                  </div>
                  <span className="truncate font-semibold">{brand.industry || "-"}</span>
                  <span className="truncate font-semibold">{brand.phone || "-"}</span>
                  <span className="font-semibold">{brand.visibility ? "Visible" : "Hidden"}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={draft}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [brand.id]: event.target.value as VerificationValue }))
                      }
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#d6def3] bg-white px-3 text-sm font-semibold text-[#243a73]"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSave(brand.id)}
                      disabled={!isDirty || isSaving}
                      className="h-10 shrink-0 rounded-lg bg-[#2448bd] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#c6d1f1]"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                  <span className="font-semibold">{brand.campaigns_count}</span>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}

export default AdminBrands;
