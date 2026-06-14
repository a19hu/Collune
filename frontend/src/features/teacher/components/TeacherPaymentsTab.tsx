import React from 'react';
import { TeacherPaymentRecord } from '../../payments/types';

interface TeacherPaymentsTabProps {
  payments: TeacherPaymentRecord[];
}

export const TeacherPaymentsTab: React.FC<TeacherPaymentsTabProps> = ({ payments }) => {
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Total Payments</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">${totalPayments}</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Transactions</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length}</div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Latest Payment</div>
          <div className="text-lg font-extrabold text-indigo-600 mt-1">{payments[0]?.paymentDate || '-'}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-950 uppercase font-mono tracking-wider border-b border-slate-100 pb-3">
          Payment History (By School Admin)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold border border-slate-100 rounded-xl">
            <thead>
              <tr className="bg-slate-50/50 border-b text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                <th className="p-3">Payment Date</th>
                <th className="p-3">Month</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                  <td className="p-3 font-mono">{payment.paymentDate}</td>
                  <td className="p-3 font-mono">{payment.month}</td>
                  <td className="p-3 font-black text-emerald-600">${payment.amount}</td>
                  <td className="p-3">{payment.method}</td>
                  <td className="p-3 font-mono text-[10px]">{payment.reference}</td>
                  <td className="p-3 text-slate-500">{payment.notes || '-'}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-mono text-xs">
                    No payment history recorded by school admin yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
