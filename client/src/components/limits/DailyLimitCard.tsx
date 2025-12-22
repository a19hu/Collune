import { useEffect, useState } from "react";
import { type Account, getAccounts, getDailyLimit } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface DailyLimitCardProps {
  token: string;
  className?: string;
}

export function DailyLimitCard({ token, className }: DailyLimitCardProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [limit, setLimit] = useState<Awaited<
    ReturnType<typeof getDailyLimit>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAccounts(token);
        setAccounts(res);
        if (res.length > 0) setSelectedId(res[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      }
    };
    load();
  }, [token]);

  const fetchLimit = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getDailyLimit(selectedId, token);
      setLimit(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch limit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`space-y-4 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-lg ${className ?? ""}`}
    >
      {/* <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs font-medium text-amber-600">Limits</p>
          <h3 className="text-lg font-semibold text-gray-900">
            Daily transfer limit
          </h3>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={fetchLimit}
          disabled={loading || !selectedId}
          className="bg-amber-500 text-white hover:bg-amber-600"
        >
          {loading ? "Checking..." : "Check"}
        </Button>
      </div> */}

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          <span>Select account</span>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.account_type} • {a.account_number}
              </option>
            ))}
          </select>
        </label>

        {limit && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-gray-800">
            <p>
              Remaining: <strong>₹{limit.remaining.toFixed(2)}</strong> / ₹
              {limit.daily_limit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">
              Used today: ₹{limit.used_today.toFixed(2)} • Tx count:{" "}
              {limit.transaction_count}
            </p>
            <p className="text-xs text-gray-600">
              Max single transaction: ₹{limit.max_single_transaction.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

