import { useState } from "react";
import { type LoanApplyPayload, applyLoan } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface LoanApplyFormProps {
  token: string;
  className?: string;
}

export function LoanApplyForm({ token, className }: LoanApplyFormProps) {
  const [form, setForm] = useState<LoanApplyPayload>({
    loan_type: "PERSONAL",
    amount: 50000,
    tenure_months: 12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emi, setEmi] = useState<number | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "amount" || name === "tenure_months" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEmi(null);
    try {
      const res = await applyLoan(form, token);
      setSuccess(res.message);
      setEmi(res.emi);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loan apply failed");
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
        <p className="text-xs font-medium text-amber-600">Loans</p>
        <h3 className="text-lg font-semibold text-gray-900">Apply for a loan</h3>
        <p className="text-sm text-gray-500">
          Interest rate is fixed at 12% per backend logic; EMI is calculated server-side.
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
      {emi != null && (
        <p className="text-sm text-gray-800">
          Estimated EMI: <strong>₹{emi.toFixed(2)}</strong>
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1 text-sm text-gray-700">
          <span>Loan type</span>
          <select
            name="loan_type"
            value={form.loan_type}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="PERSONAL">Personal</option>
            <option value="HOME">Home</option>
            <option value="EDUCATION">Education</option>
            <option value="CAR">Car</option>
          </select>
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span>Amount</span>
          <input
            type="number"
            name="amount"
            min={1000}
            step={1000}
            value={form.amount}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </label>

        <label className="space-y-1 text-sm text-gray-700">
          <span>Tenure (months)</span>
          <input
            type="number"
            name="tenure_months"
            min={1}
            max={360}
            value={form.tenure_months}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
        </label>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-500 text-white hover:bg-amber-600"
        disabled={loading}
      >
        {loading ? "Submitting..." : "Apply"}
      </Button>
    </form>
  );
}

