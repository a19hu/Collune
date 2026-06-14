import React from 'react';
import { motion } from 'motion/react';
import { Printer, XCircle } from 'lucide-react';
import type { StudentFeeBill } from '../../types';

type FeeReceiptModalProps = {
  bill: StudentFeeBill;
  onClose: () => void;
  onPrint: () => void;
};

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({ bill, onClose, onPrint }) => (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white text-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full text-left space-y-6 shadow-2xl relative border border-slate-100 font-sans"
    >
      <div className="flex justify-between items-start border-b border-slate-100 pb-4">
        <div className="text-left">
          <h3 className="font-extrabold text-base tracking-tight text-slate-950">EDUCORE TRANSACTION RECEIPT</h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase">Generated from school ERP ledger</p>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{bill.receiptNo}</span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between gap-4"><span>Student Target Name:</span><strong className="text-slate-800 font-sans">{bill.studentName}</strong></div>
        <div className="flex justify-between gap-4"><span>Admission No:</span><strong className="text-slate-800">{bill.studentId}</strong></div>
        <div className="flex justify-between gap-4"><span>Billed Category:</span><strong className="text-slate-800 font-sans">{bill.feeType}</strong></div>
        <div className="flex justify-between gap-4"><span>Settlement sum:</span><strong className="text-indigo-600 text-xs font-black">${bill.amount}</strong></div>
        <div className="flex justify-between gap-4"><span>Gateway Method:</span><strong className="text-slate-700">{bill.paymentMethod}</strong></div>
        <div className="flex justify-between gap-4"><span>Transaction Date:</span><strong className="text-slate-700">{bill.paidDate}</strong></div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <button onClick={onPrint} className="py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button onClick={onClose} className="py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
          <XCircle className="w-4 h-4" /> Close
        </button>
      </div>
    </motion.div>
  </div>
);
