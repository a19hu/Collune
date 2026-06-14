import React from 'react';
import { DollarSign, Download, Printer, Search } from 'lucide-react';
import type { StudentFeeBill } from '../../types';

type FeeManagementViewProps = {
  fees: StudentFeeBill[];
  feesSubTab: 'ledger' | 'monthly' | 'history';
  selectedFeeMonth: string;
  feeSearchQuery: string;
  feeCategoryFilter: string;
  totalBilled: number;
  totalCollected: number;
  setFeesSubTab: (value: 'ledger' | 'monthly' | 'history') => void;
  setSelectedFeeMonth: (value: string) => void;
  setFeeSearchQuery: (value: string) => void;
  setFeeCategoryFilter: (value: string) => void;
  onToggleBillStatus: (bill: StudentFeeBill) => void;
  onPrintReceipt: (bill: StudentFeeBill) => void;
  showToast: (message: string) => void;
};

const feeCategories = ['Tuition Fee', 'Transport Fee', 'Sports Fee', 'Exam Fee', 'Library Fee'];

export const FeeManagementView: React.FC<FeeManagementViewProps> = ({
  fees,
  feesSubTab,
  selectedFeeMonth,
  feeSearchQuery,
  feeCategoryFilter,
  totalBilled,
  totalCollected,
  setFeesSubTab,
  setSelectedFeeMonth,
  setFeeSearchQuery,
  setFeeCategoryFilter,
  onToggleBillStatus,
  onPrintReceipt,
  showToast,
}) => {
  const visibleFees = fees.filter((bill) => {
    const query = feeSearchQuery.toLowerCase();
    const matchesSearch = bill.studentName.toLowerCase().includes(query) || bill.studentId.toLowerCase().includes(query);
    const matchesCategory = feeCategoryFilter === 'All' || bill.feeType === feeCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const scopedFees =
    selectedFeeMonth === 'all' ? fees : fees.filter((fee) => fee.dueDate.includes(`-${selectedFeeMonth}-`));
  const scopedBilled = scopedFees.reduce((sum, item) => sum + item.amount, 0);
  const scopedCollected = scopedFees
    .filter((fee) => fee.status === 'Paid')
    .reduce((sum, item) => sum + item.amount, 0);
  const collectionRate = scopedBilled > 0 ? Math.round((scopedCollected / scopedBilled) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" /> Institutional Fee Ledger
          </h1>
          <p className="text-slate-500 text-xs text-slate-400">Verify billing status, log outstanding liabilities, and view printable student fee receipts</p>
        </div>

        <div className="inline-flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto font-mono text-[10px] font-bold shrink-0">
          {[
            ['ledger', 'INVOICE LEDGER'],
            ['monthly', 'MONTHLY FEE REPORT'],
            ['history', 'PAYMENT HISTORY LOGS'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFeesSubTab(id as FeeManagementViewProps['feesSubTab'])}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                feesSubTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Aggregate Billings</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            ${feesSubTab === 'monthly' && selectedFeeMonth !== 'all' ? scopedBilled : totalBilled}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Collections Settle</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ${feesSubTab === 'monthly' && selectedFeeMonth !== 'all' ? scopedCollected : totalCollected}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left font-sans">
          <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Arrears Outstanding</div>
          <div className="text-2xl font-extrabold text-red-500 mt-1">
            ${feesSubTab === 'monthly' && selectedFeeMonth !== 'all' ? scopedBilled - scopedCollected : totalBilled - totalCollected}
          </div>
        </div>
      </div>

      {feesSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices by student name or Id..."
                value={feeSearchQuery}
                onChange={(e) => setFeeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none transition-colors font-sans"
              />
            </div>
            <select
              value={feeCategoryFilter}
              onChange={(e) => setFeeCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
            >
              <option value="All">All Invoices</option>
              {feeCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 space-y-4">
            <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">Settle invoice list</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider bg-slate-50/50">
                    <th className="p-3">Invoice ID</th><th className="p-3">Student Target</th><th className="p-3">Level</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3">Due</th><th className="p-3">Status</th><th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFees.map((bill) => (
                    <tr key={bill.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{bill.id}</td>
                      <td className="p-3 font-extrabold text-slate-900">{bill.studentName}</td>
                      <td className="p-3">{bill.className}</td>
                      <td className="p-3 text-slate-500 font-mono text-[10px] uppercase">{bill.feeType}</td>
                      <td className="p-3 font-black text-slate-900">${bill.amount}</td>
                      <td className="p-3 text-slate-400 font-mono">{bill.dueDate}</td>
                      <td className="p-3">
                        <button
                          onClick={() => onToggleBillStatus(bill)}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold cursor-pointer ${
                            bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : bill.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bill.status}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        {bill.status === 'Paid' ? (
                          <button onClick={() => onPrintReceipt(bill)} className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer">
                            <Printer className="w-3.5 h-3.5" /> Print Receipt
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">No receipt active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {feesSubTab === 'monthly' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-left space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 font-mono uppercase tracking-wider">Select Month of Assessment</h3>
              <p className="text-slate-400 text-[11px]">Compare expected billings against real-time collections for the chosen period</p>
            </div>
            <select value={selectedFeeMonth} onChange={(e) => setSelectedFeeMonth(e.target.value)} className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 text-xs rounded-xl focus:outline-none focus:border-indigo-500 font-mono font-bold">
              <option value="all">Full Academic Term</option>
              <option value="05">May 2026</option>
              <option value="06">June 2026</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-semibold">COLLECTION PROGRESS RATE:</span>
              <span className="font-black text-indigo-600 text-xs">{collectionRate}% MATCHED</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Category Collections Breakdown</h4>
              {feeCategories.map((category) => {
                const categoryBills = scopedFees.filter((bill) => bill.feeType === category);
                const categoryBilled = categoryBills.reduce((sum, bill) => sum + bill.amount, 0);
                const categoryCollected = categoryBills.filter((bill) => bill.status === 'Paid').reduce((sum, bill) => sum + bill.amount, 0);
                if (categoryBilled === 0) return null;
                return <div key={category} className="flex justify-between py-1 text-[11px]"><span className="font-extrabold">{category}</span><span className="font-mono">${categoryCollected} / ${categoryBilled}</span></div>;
              })}
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-2">Status Count Analytics</h4>
              {['Paid', 'Pending', 'Overdue'].map((status) => <div key={status} className="flex justify-between py-1 text-[11px]"><span className="font-extrabold">{status}</span><span className="font-mono">{scopedFees.filter((bill) => bill.status === status).length} invoices</span></div>)}
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button onClick={() => showToast(`✓ Generated Monthly Fee Report Sheet for Month Code: ${selectedFeeMonth}. Simulated dispatch completed.`)} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> Print Monthly Summary
            </button>
          </div>
        </div>
      )}

      {feesSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-4 space-y-4 text-left">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">Settled Chronological Ledger</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Audit log of cleared invoices, electronic receipt numbers, and payment methodologies</p>
            </div>
            <button onClick={() => showToast('✓ Initiating transaction history dump... CSV format downloaded.')} className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-705 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer">
              <Download className="w-3 h-3" /> Export Transaction Dump
            </button>
          </div>
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider bg-slate-50/50">
                  <th className="p-3">Payment Date</th><th className="p-3">Receipt No</th><th className="p-3">Student Name</th><th className="p-3">Fee Category</th><th className="p-3">Methodology</th><th className="p-3 text-right">Settled Sum</th>
                </tr>
              </thead>
              <tbody>
                {fees.filter((fee) => fee.status === 'Paid').map((bill) => (
                  <tr key={bill.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 text-slate-700">
                    <td className="p-3 font-mono text-slate-500">{bill.paidDate || bill.dueDate}</td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{bill.receiptNo || 'REC-8841'}</td>
                    <td className="p-3 font-extrabold text-slate-900">{bill.studentName}</td>
                    <td className="p-3 text-slate-500">{bill.feeType}</td>
                    <td className="p-3 font-mono text-[10px] uppercase">{bill.paymentMethod || 'GPay'}</td>
                    <td className="p-3 text-right font-black text-emerald-600">${bill.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
