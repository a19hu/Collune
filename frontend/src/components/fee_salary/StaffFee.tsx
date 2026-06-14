import { getStaff, getStaffSalaryPayments, type StaffSalaryPaymentApi } from "@/src/lib/authApi";
import { useEffect, useState } from "react";

const StaffFee = () => {
    const [payments, setPayments] = useState<Array<StaffSalaryPaymentApi & { staffName: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadPayments = async () => {
            try {
                const staffResponse = await getStaff();
                const paymentResults = await Promise.allSettled(
                    staffResponse.staff.map(async (staffMember) => {
                        const response = await getStaffSalaryPayments(staffMember.id);
                        return response.salary_payments.map((payment) => ({
                            ...payment,
                            staffName: staffMember.user.name || staffMember.user.username,
                        }));
                    }),
                );
                if (!isMounted) return;
                setPayments(paymentResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadPayments();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Salary</h1>
                <p className="text-slate-500 text-xs">Support staff salary payment records.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                <th className="p-4">Staff</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Method</th>
                                <th className="p-4">Reference</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-4 text-slate-400">Loading staff salary records...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-slate-400">No staff salary records found.</td></tr>
                            ) : payments.map((payment) => (
                                <tr key={payment.payment_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-900">{payment.staffName}</td>
                                    <td className="p-4 font-mono">{payment.payment_date}</td>
                                    <td className="p-4">{payment.payment_method}</td>
                                    <td className="p-4 font-mono">{payment.transaction_ref || "N/A"}</td>
                                    <td className="p-4 text-right font-mono text-emerald-600">{payment.amount}</td>
                                    <td className="p-4 text-center">{payment.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StaffFee;
