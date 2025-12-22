import { useEffect, useMemo, useState } from "react";
import {
  type Account,
  type CreateAccountPayload,
  createAccount,
  getAccounts,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountsPanelProps {
  token: string;
  className?: string;
}

export function AccountsPanel({ token, className }: AccountsPanelProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<CreateAccountPayload["account_type"]>(
    "SAVINGS",
  );

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active),
    [accounts],
  );

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccounts(token);
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await createAccount({ account_type: newType }, token);
      setAccounts((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-medium text-amber-600">Accounts</p>
          <h2 className="text-xl font-semibold text-gray-900">
            Choose or create an account
          </h2>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="bg-amber-500 text-white hover:bg-amber-600"
          onClick={fetchAccounts}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {loading && <p className="text-sm text-gray-500">Loading accounts...</p>}
        {!loading && activeAccounts.length === 0 && (
          <p className="text-sm text-gray-500">
            No active accounts yet. Create one below.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {activeAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"
            >
              <p className="text-xs uppercase tracking-wide text-amber-700">
                {account.account_type}
              </p>
              <p className="text-sm font-semibold text-gray-900 break-all">
                {account.account_number}
              </p>
              <p className="text-sm text-gray-600">
                Balance: ₹{parseFloat(account.balance).toFixed(2)}
              </p>
              <p className="text-[11px] text-gray-500">
                Created: {new Date(account.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Create a new account
            </p>
            <p className="text-xs text-gray-500">
              Backend requires an account type.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={newType}
            onChange={(e) =>
              setNewType(e.target.value as CreateAccountPayload["account_type"])
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="SAVINGS">Savings</option>
            <option value="CURRENT">Current</option>
            <option value="FIXED_DEPOSIT">Fixed Deposit</option>
          </select>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {creating ? "Creating..." : "Create account"}
          </Button>
        </div>
      </div>
    </div>
  );
}

