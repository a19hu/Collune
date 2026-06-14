import { getStudentFeeStructure, getStudents, type StudentFeeAccountApi, type StudentListApi } from "@/src/lib/authApi";
import { useEffect, useState } from "react";

const StudentFee = () => {
    const [rows, setRows] = useState<Array<{ student: StudentListApi; fee?: StudentFeeAccountApi }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadFees = async () => {
            try {
                const response = await getStudents();
                const feeResults = await Promise.allSettled(response.students.map((student) => getStudentFeeStructure(student.user)));
                if (!isMounted) return;
                setRows(response.students.map((student, index) => ({
                    student,
                    fee: feeResults[index].status === "fulfilled" ? feeResults[index].value.fee_account : undefined,
                })));
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        void loadFees();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Fees</h1>
                <p className="text-slate-500 text-xs">Student fee account balances and payment totals.</p>
            </div>
            <FeeTable isLoading={isLoading} rows={rows} />
        </div>
    );
}

const FeeTable = ({ isLoading, rows }: { isLoading: boolean; rows: Array<{ student: StudentListApi; fee?: StudentFeeAccountApi }> }) => (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                        <th className="p-4">Student</th>
                        <th className="p-4">Academic Year</th>
                        <th className="p-4 text-right">Due</th>
                        <th className="p-4 text-right">Paid</th>
                        <th className="p-4 text-right">Balance</th>
                        <th className="p-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={6} className="p-4 text-slate-400">Loading student fees...</td></tr>
                    ) : rows.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-slate-400">No student fee rows found.</td></tr>
                    ) : rows.map(({ student, fee }) => (
                        <tr key={student.user} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-900">{`${student.first_name} ${student.last_name}`.trim()}</td>
                            <td className="p-4 font-mono">{fee?.academic_year || "N/A"}</td>
                            <td className="p-4 text-right font-mono">{fee?.total_due || "0"}</td>
                            <td className="p-4 text-right font-mono text-emerald-600">{fee?.total_paid || "0"}</td>
                            <td className="p-4 text-right font-mono text-red-600">{fee?.balance || "0"}</td>
                            <td className="p-4 text-center">{fee?.status || "N/A"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default StudentFee;
