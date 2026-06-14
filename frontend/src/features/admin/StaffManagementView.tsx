import React from 'react';
import { DollarSign, Plus, Search } from 'lucide-react';
import type { SchoolStaff } from '../../types';

export type StaffPaymentRecord = {
  id: string;
  staffEmployeeId: string;
  staffName: string;
  amount: number;
  paymentDate: string;
  month: string;
  method: 'Cash' | 'Card' | 'GPay' | 'NetBanking';
  reference: string;
  notes?: string;
};

type StaffManagementViewProps = {
  staff: SchoolStaff[];
  staffPayments: StaffPaymentRecord[];
  staffSearchQuery: string;
  showStaffForm: boolean;
  editingStaffId: string | null;
  staffFormName: string;
  staffFormEmail: string;
  staffFormDepartment: SchoolStaff['department'];
  staffFormDesignation: SchoolStaff['designation'];
  staffFormPhone: string;
  staffFormSalary: number;
  staffFormJoiningDate: string;
  staffFormStatus: SchoolStaff['status'];
  staffFormAddress: string;
  showPaymentForm: boolean;
  editingPaymentId: string | null;
  paymentStaffId: string;
  paymentAmount: number;
  paymentDate: string;
  paymentMonth: string;
  paymentMethod: StaffPaymentRecord['method'];
  paymentReference: string;
  paymentNotes: string;
  setStaffSearchQuery: (value: string) => void;
  setStaffFormName: (value: string) => void;
  setStaffFormEmail: (value: string) => void;
  setStaffFormDepartment: (value: SchoolStaff['department']) => void;
  setStaffFormDesignation: (value: SchoolStaff['designation']) => void;
  setStaffFormPhone: (value: string) => void;
  setStaffFormSalary: (value: number) => void;
  setStaffFormJoiningDate: (value: string) => void;
  setStaffFormStatus: (value: SchoolStaff['status']) => void;
  setStaffFormAddress: (value: string) => void;
  setShowStaffForm: (value: boolean) => void;
  setShowPaymentForm: (value: boolean) => void;
  setPaymentStaffId: (value: string) => void;
  setPaymentAmount: (value: number) => void;
  setPaymentDate: (value: string) => void;
  setPaymentMonth: (value: string) => void;
  setPaymentMethod: (value: StaffPaymentRecord['method']) => void;
  setPaymentReference: (value: string) => void;
  setPaymentNotes: (value: string) => void;
  handleOpenAddStaff: () => void;
  handleOpenEditStaff: (staff: SchoolStaff) => void;
  handleDeleteStaff: (staff: SchoolStaff) => void;
  handleSaveStaff: (event: React.FormEvent) => void;
  handleOpenAddPayment: (staff?: SchoolStaff) => void;
  handleOpenEditPayment: (payment: StaffPaymentRecord) => void;
  handleDeletePayment: (paymentId: string) => void;
  handleSavePayment: (event: React.FormEvent) => void;
};

const departments = ['Finance', 'Library', 'Administration', 'Security', 'Maintenance', 'Transport', 'IT'];
const designations = ['Accountant', 'Receptionist', 'Librarian', 'Cleaner', 'Security Guard', 'IT Staff', 'Peon', 'Driver'];
const methods: StaffPaymentRecord['method'][] = ['Cash', 'Card', 'GPay', 'NetBanking'];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staff,
  staffPayments,
  staffSearchQuery,
  showStaffForm,
  editingStaffId,
  staffFormName,
  staffFormEmail,
  staffFormDepartment,
  staffFormDesignation,
  staffFormPhone,
  staffFormSalary,
  staffFormJoiningDate,
  staffFormStatus,
  staffFormAddress,
  showPaymentForm,
  editingPaymentId,
  paymentStaffId,
  paymentAmount,
  paymentDate,
  paymentMonth,
  paymentMethod,
  paymentReference,
  paymentNotes,
  setStaffSearchQuery,
  setStaffFormName,
  setStaffFormEmail,
  setStaffFormDepartment,
  setStaffFormDesignation,
  setStaffFormPhone,
  setStaffFormSalary,
  setStaffFormJoiningDate,
  setStaffFormStatus,
  setStaffFormAddress,
  setShowStaffForm,
  setShowPaymentForm,
  setPaymentStaffId,
  setPaymentAmount,
  setPaymentDate,
  setPaymentMonth,
  setPaymentMethod,
  setPaymentReference,
  setPaymentNotes,
  handleOpenAddStaff,
  handleOpenEditStaff,
  handleDeleteStaff,
  handleSaveStaff,
  handleOpenAddPayment,
  handleOpenEditPayment,
  handleDeletePayment,
  handleSavePayment,
}) => {
  const visibleStaff = staff.filter((item) => {
    const q = staffSearchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) ||
      item.employeeId.toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      item.designation.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Staff & Operations</h1>
          <p className="text-slate-500 text-xs text-slate-400">Manage staff profiles, salary payouts, and full payment transaction history.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenAddStaff} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Staff
          </button>
          <button onClick={() => handleOpenAddPayment()} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer flex items-center gap-1.5 hover:bg-slate-50">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Add Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-[10px] font-mono uppercase text-slate-400">Active Staff</div><div className="text-2xl font-black text-slate-900">{staff.filter(s => s.status === 'Active').length}</div></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-[10px] font-mono uppercase text-slate-400">Monthly Payroll</div><div className="text-2xl font-black text-indigo-600">${staff.reduce((sum, s) => sum + s.salary, 0)}</div></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="text-[10px] font-mono uppercase text-slate-400">Payment Transactions</div><div className="text-2xl font-black text-emerald-600">{staffPayments.length}</div></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={staffSearchQuery} onChange={(e) => setStaffSearchQuery(e.target.value)} placeholder="Search staff by name, ID, designation, phone..." className="w-full bg-transparent outline-none text-xs font-semibold text-slate-800" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-504 uppercase tracking-wider font-mono text-[9px]">
                <th className="p-4">Employee Name</th><th className="p-4">Staff ID</th><th className="p-4">Department</th><th className="p-4">Designation</th><th className="p-4">Email</th><th className="p-4">Mobile</th><th className="p-4">Salary Plan</th><th className="p-4">Joining Date</th><th className="p-4 text-right">Job Status</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleStaff.map((item) => (
                <tr key={item.employeeId} className="border-b border-b-slate-100 hover:bg-slate-50/50">
                  <td className="p-4 font-extrabold text-slate-950">{item.name}</td>
                  <td className="p-4 font-mono text-indigo-600 font-bold">{item.employeeId}</td>
                  <td className="p-4 text-slate-500 font-mono uppercase tracking-wider text-[10px]">{item.department}</td>
                  <td className="p-4 font-extrabold">{item.designation}</td>
                  <td className="p-4 font-mono text-slate-600">{item.email || '-'}</td>
                  <td className="p-4 font-mono text-slate-600">{item.phone}</td>
                  <td className="p-4 font-black">${item.salary} / Month</td>
                  <td className="p-4 font-mono text-slate-600">{item.joiningDate}</td>
                  <td className="p-4 text-right"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'}`}>{item.status}</span></td>
                  <td className="p-4"><div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => handleOpenAddPayment(item)} className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold cursor-pointer">Pay</button>
                    <button onClick={() => handleOpenEditStaff(item)} className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold cursor-pointer">Edit</button>
                    <button onClick={() => void handleDeleteStaff(item)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold cursor-pointer">Del</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Payment Transaction History</h3>
          <p className="text-[11px] text-slate-400">All staff salary payment logs with edit and delete controls.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-504 uppercase tracking-wider font-mono text-[9px]">
                <th className="p-3">Date</th><th className="p-3">Month</th><th className="p-3">Staff</th><th className="p-3">Staff ID</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Notes</th><th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffPayments.map(txn => (
                <tr key={txn.id} className="border-b border-slate-100">
                  <td className="p-3 font-mono text-slate-600">{txn.paymentDate}</td><td className="p-3 font-mono text-slate-600">{txn.month}</td><td className="p-3 font-bold text-slate-900">{txn.staffName}</td><td className="p-3 font-mono text-indigo-600">{txn.staffEmployeeId}</td><td className="p-3 font-black text-emerald-600">${txn.amount}</td><td className="p-3">{txn.method}</td><td className="p-3 font-mono text-[10px]">{txn.reference}</td><td className="p-3 text-slate-500">{txn.notes || '-'}</td>
                  <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => handleOpenEditPayment(txn)} className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold cursor-pointer">Edit</button><button onClick={() => handleDeletePayment(txn.id)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold cursor-pointer">Del</button></div></td>
                </tr>
              ))}
              {staffPayments.length === 0 && <tr><td className="p-6 text-center text-slate-400 font-mono text-xs" colSpan={9}>No payment transactions recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showStaffForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h3>
          <form onSubmit={handleSaveStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input required value={staffFormName} onChange={(e) => setStaffFormName(e.target.value)} placeholder="Staff Name" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input required type="email" value={staffFormEmail} onChange={(e) => setStaffFormEmail(e.target.value)} placeholder="Portal Email" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <select value={staffFormDepartment} onChange={(e) => setStaffFormDepartment(e.target.value as SchoolStaff['department'])} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{departments.map(d => <option key={d}>{d}</option>)}</select>
            <select value={staffFormDesignation} onChange={(e) => setStaffFormDesignation(e.target.value as SchoolStaff['designation'])} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{designations.map(d => <option key={d}>{d}</option>)}</select>
            <input required value={staffFormPhone} onChange={(e) => setStaffFormPhone(e.target.value)} placeholder="Phone Number" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="number" value={staffFormSalary} onChange={(e) => setStaffFormSalary(Number(e.target.value))} placeholder="Monthly Salary" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="date" value={staffFormJoiningDate} onChange={(e) => setStaffFormJoiningDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <select value={staffFormStatus} onChange={(e) => setStaffFormStatus(e.target.value as SchoolStaff['status'])} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{['Active', 'On Leave', 'Resigned'].map(s => <option key={s}>{s}</option>)}</select>
            <input value={staffFormAddress} onChange={(e) => setStaffFormAddress(e.target.value)} placeholder="Full Address" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <div className="flex items-center gap-2"><button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">{editingStaffId ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowStaffForm(false)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel</button></div>
          </form>
        </div>
      )}

      {showPaymentForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 mb-4">{editingPaymentId ? 'Edit Payment Transaction' : 'Add Payment Transaction'}</h3>
          <form onSubmit={handleSavePayment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={paymentStaffId} onChange={(e) => setPaymentStaffId(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{staff.map(st => <option value={st.employeeId} key={st.employeeId}>{st.name} ({st.employeeId})</option>)}</select>
            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} placeholder="Amount" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="month" value={paymentMonth} onChange={(e) => setPaymentMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as StaffPaymentRecord['method'])} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{methods.map(m => <option key={m}>{m}</option>)}</select>
            <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Reference / Txn ID" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Notes (optional)" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <div className="flex items-center gap-2"><button type="submit" className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">{editingPaymentId ? 'Update' : 'Save Payment'}</button><button type="button" onClick={() => setShowPaymentForm(false)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
