import { useEffect, useState } from "react";
import { type Transaction, getTransactionHistory } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface TransactionHistoryProps {
  token: string;
  className?: string;
}

export function TransactionHistory({ token, className }: TransactionHistoryProps) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTransactionHistory(token);
      setItems(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div
      className={`space-y-4 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-lg ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-xs font-medium text-amber-600">History</p>
          <h3 className="text-lg font-semibold text-gray-900">Recent transfers</h3>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={load}
          disabled={loading}
          className="bg-amber-500 text-white hover:bg-amber-600"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      )}

      <div className="space-y-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-900">
                ₹{parseFloat(t.amount).toFixed(2)}
              </span>
              <span
                className={`text-xs font-medium ${
                  t.transaction_type === "DEBIT"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {t.transaction_type}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              From #{t.sender_account} → #{t.receiver_account}
            </p>
            <p className="text-[11px] text-gray-500">
              {new Date(t.created_at).toLocaleString()}{" "}
              {t.is_fraud && <span className="text-red-600">• flagged</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

