import { useEffect, useState } from "react";
import {
  type Account,
  type CreateTransactionPayload,
  createTransaction,
  getAccounts,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

interface TransactionFormProps {
  token: string;
  className?: string;
}

export function TransactionForm({ token, className }: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<CreateTransactionPayload>({
    sender_account_id: 0,
    receiver_account_id: 0,
    amount: 0,
    schedule_delay: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAccounts(token);
        setAccounts(res);
        if (res.length > 0) {
          setForm((prev) => ({
            ...prev,
            sender_account_id: Number(res[0].account_number),
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      }
    };
    load();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" || name === "schedule_delay" ? Number(value) : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!form.sender_account_id || !form.receiver_account_id) {
        throw new Error("Select both sender and receiver accounts");
      }
      if (form.sender_account_id === form.receiver_account_id) {
        throw new Error("Sender and receiver must differ");
      }
      const response = await createTransaction(form, token);
      setSuccess(response.message || "Transaction submitted successfully");
      // Reset receiver and amount after successful transaction
      setForm((prev) => ({
        ...prev,
        receiver_account_id: 0,
        amount: 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-lg ${className ?? ""}`}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Send money</h3>
        <p className="text-sm text-gray-500">
          Transfer money using 11-digit account numbers.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          <span>Sender account</span>
          <select
            name="sender_account_id"
            value={form.sender_account_id}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.account_number}>
                {a.account_type} • {a.account_number}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span>Receiver account number</span>
          <input
            type="number"
            name="receiver_account_id"
            value={form.receiver_account_id || ""}
            onChange={handleChange}
            placeholder="Enter 11-digit account number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm text-gray-700">
          <span>Amount</span>
          <input
            type="number"
            name="amount"
            min={0.01}
            step="0.01"
            value={form.amount || ""}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span>Schedule delay (seconds)</span>
          <input
            type="number"
            name="schedule_delay"
            min={0}
            step={1}
            value={form.schedule_delay || 0}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 text-white hover:bg-amber-600"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Send"}
      </Button>
    </form>
  );
}

