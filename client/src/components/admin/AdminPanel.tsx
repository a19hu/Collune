import { useState } from "react";
import { approveLoan, type ApproveLoanPayload } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface AdminPanelProps {
  token: string;
  className?: string;
}

export function AdminPanel({ token, className }: AdminPanelProps) {
  const [loanId, setLoanId] = useState<number | "">("");
  const [action, setAction] = useState<ApproveLoanPayload["action"]>("APPROVED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!loanId) {
        throw new Error("Enter a loan ID");
      }
      const res = await approveLoan(Number(loanId), { action }, token);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve/reject");
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
        <p className="text-xs font-medium text-amber-600">Admin</p>
        <h3 className="text-lg font-semibold text-gray-900">
          Approve / Reject loans
        </h3>
        <p className="text-sm text-gray-500">
          Use superuser credentials to log in, then process loans by ID.
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
          <span>Loan ID</span>
          <input
            type="number"
            value={loanId}
            onChange={(e) => setLoanId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., 12"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span>Action</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ApproveLoanPayload["action"])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
          </select>
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 text-white hover:bg-amber-600"
        disabled={loading}
      >
        {loading ? "Processing..." : "Submit"}
      </Button>
    </form>
  );
}

