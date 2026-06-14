
import { getTeacherSalaryPayments, getTeachers, type TeacherSalaryPaymentApi } from "@/src/lib/authApi";
import { useEffect, useState } from "react";

const TeacherSalary = () => {
    const [payments, setPayments] = useState<Array<TeacherSalaryPaymentApi & { teacherName: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadPayments = async () => {
            try {
                const teachersResponse = await getTeachers();
                const paymentResults = await Promise.allSettled(
                    teachersResponse.teachers.map(async (teacher) => {
                        const response = await getTeacherSalaryPayments(teacher.teacher_id);
                        return response.salary_payments.map((payment) => ({
                            ...payment,
                            teacherName: teacher.user.name || teacher.user.username,
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
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teacher Salary</h1>
                <p className="text-slate-500 text-xs">Teacher salary payment records.</p>
            </div>
            <SalaryTable isLoading={isLoading} rows={payments} nameHeader="Teacher" />
        </div>
    );
}

const SalaryTable = ({ isLoading, rows, nameHeader }: { isLoading: boolean; rows: Array<TeacherSalaryPaymentApi & { teacherName: string }>; nameHeader: string }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                        <th className="p-4">{nameHeader}</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Reference</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={6} className="p-4 text-slate-400">Loading salary records...</td></tr>
                    ) : rows.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-slate-400">No salary records found.</td></tr>
                    ) : rows.map((payment) => (
                        <tr key={payment.payment_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-900">{payment.teacherName}</td>
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
);

export default TeacherSalary;
