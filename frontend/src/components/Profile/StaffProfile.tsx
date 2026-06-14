import {
  createStaffSalaryPayment,
  deleteStaff,
  getStaffAttendance,
  getStaffMember,
  getStaffSalaryPayments,
  updateStaff,
  type StaffApi,
  type StaffAttendanceApi,
  type StaffPayload,
  type StaffSalaryPaymentApi,
} from "@/src/lib/authApi";
import { ArrowLeft, BriefcaseBusiness, CalendarCheck, CreditCard, Edit3, Save, Trash2, UserRound, X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type StaffEditForm = {
  name: string;
  email: string;
  phone_no: string;
  employee_id: string;
  department: string;
  designation: string;
  join_date: string;
  salary: string;
  status: boolean;
  country: string;
  state: string;
  city: string;
  pincode: string;
  full_address: string;
};

const toEditForm = (staff: StaffApi): StaffEditForm => ({
  name: staff.user.name || staff.user.username || "",
  email: staff.user.email || "",
  phone_no: staff.user.phone_no || "",
  employee_id: staff.employee_id || "",
  department: staff.department || "",
  designation: staff.designation || "",
  join_date: staff.join_date || "",
  salary: staff.salary || "0",
  status: staff.status,
  country: staff.address?.country || "India",
  state: staff.address?.state || "",
  city: staff.address?.city || "",
  pincode: staff.address?.pincode || "",
  full_address: staff.address?.full_address || "",
});

const StaffProfile = () => {
  const navigate = useNavigate();
  const { staffId } = useParams();
  const numericStaffId = Number(staffId);
  const [staff, setStaff] = useState<StaffApi | null>(null);
  const [payments, setPayments] = useState<StaffSalaryPaymentApi[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendanceApi[]>([]);
  const [editForm, setEditForm] = useState<StaffEditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStaff = async () => {
      if (!Number.isFinite(numericStaffId)) {
        setIsLoading(false);
        return;
      }

      try {
        const [profileResponse, paymentResponse, attendanceResponse] = await Promise.all([
          getStaffMember(numericStaffId),
          getStaffSalaryPayments(numericStaffId),
          getStaffAttendance(numericStaffId),
        ]);
        if (!isMounted) return;
        setStaff(profileResponse.staff);
        setEditForm(toEditForm(profileResponse.staff));
        setPayments(paymentResponse.salary_payments);
        setAttendance(attendanceResponse.attendance);
      } catch (error: any) {
        if (isMounted) setMessage(error?.message || "Unable to load staff profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadStaff();

    return () => {
      isMounted = false;
    };
  }, [numericStaffId]);

  const displayName = useMemo(() => staff?.user.name || staff?.user.username || "Staff Profile", [staff]);
  const totalPaid = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0), [payments]);
  const presentDays = useMemo(() => attendance.filter((item) => item.status === "PRESENT").length, [attendance]);
  const addressLine = staff?.address
    ? [staff.address.full_address, staff.address.city, staff.address.state, staff.address.pincode, staff.address.country].filter(Boolean).join(", ")
    : "";

  const saveStaff = async (event: FormEvent) => {
    event.preventDefault();
    if (!staff || !editForm) return;

    try {
      setIsSaving(true);
      const payload: StaffPayload = {
        user: {
          name: editForm.name,
          email: editForm.email,
          phone_no: editForm.phone_no,
        },
        employee_id: editForm.employee_id,
        department: editForm.department,
        designation: editForm.designation,
        join_date: editForm.join_date,
        salary: editForm.salary,
        status: editForm.status,
        address: {
          country: editForm.country,
          state: editForm.state,
          city: editForm.city,
          pincode: editForm.pincode,
          full_address: editForm.full_address,
        },
      };
      const response = await updateStaff(staff.id, payload);
      setStaff(response.staff);
      setEditForm(toEditForm(response.staff));
      setMessage("Staff profile updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update staff profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeStaff = async () => {
    if (!staff) return;

    try {
      await deleteStaff(staff.id);
      navigate("/admin/staff");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete staff profile.");
    }
  };

  const recordPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!staff || !paymentAmount) return;

    try {
      const response = await createStaffSalaryPayment(staff.id, {
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_ref: paymentReference,
        status: "PAID",
        notes: paymentNotes,
      });
      setPayments((current) => [response.salary_payment, ...current]);
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      setMessage("Staff salary payment recorded.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to record salary payment.");
    }
  };

  if (isLoading) return <div className="text-sm text-slate-500">Loading staff profile...</div>;

  if (!staff) {
    return (
      <div className="space-y-4 text-left">
        <BackButton onClick={() => navigate("/admin/staff")} label="Back to staff" />
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-500">Staff profile not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BackButton onClick={() => navigate("/admin/staff")} label="Back to staff" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditForm(toEditForm(staff))} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100">
            <Edit3 className="w-4 h-4" />
            Edit Staff
          </button>
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100">
            <Trash2 className="w-4 h-4" />
            Delete Staff
          </button>
        </div>
      </div>

      {message && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">{message}</div>}

      {showDeleteConfirm && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="text-sm font-black text-red-800">Delete {displayName}?</div>
          <p className="text-xs text-red-700">This removes the staff login and linked staff profile records.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 rounded-xl bg-white border border-red-100 text-xs font-bold text-slate-700">Cancel</button>
            <button type="button" onClick={removeStaff} className="px-3 py-2 rounded-xl bg-red-600 text-xs font-bold text-white">Confirm Delete</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-4">
            <img
              referrerPolicy="no-referrer"
              src={staff.profile_image || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">{displayName}</h1>
              <p className="text-[11px] text-slate-500 font-mono truncate">{staff.employee_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <MiniStat label="Department" value={staff.department || "N/A"} />
            <MiniStat label="Status" value={staff.status ? "Active" : "Inactive"} />
            <MiniStat label="Paid" value={totalPaid.toFixed(0)} />
            <MiniStat label="Present" value={presentDays} />
          </div>

          <Panel title="Contact">
            <Info label="Email" value={staff.user.email} />
            <Info label="Phone" value={staff.user.phone_no} />
            <Info label="Address" value={addressLine || "No address recorded"} />
          </Panel>
        </aside>

        <main className="space-y-5">
          {editForm && (
            <Panel title="Edit Staff Profile">
              <form onSubmit={saveStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <EditInput label="Name" value={editForm.name} onChange={(value) => setEditForm({ ...editForm, name: value })} />
                  <EditInput label="Email" type="email" value={editForm.email} onChange={(value) => setEditForm({ ...editForm, email: value })} />
                  <EditInput label="Phone" value={editForm.phone_no} onChange={(value) => setEditForm({ ...editForm, phone_no: value })} />
                  <EditInput label="Employee ID" value={editForm.employee_id} onChange={(value) => setEditForm({ ...editForm, employee_id: value })} />
                  <EditInput label="Department" value={editForm.department} onChange={(value) => setEditForm({ ...editForm, department: value })} />
                  <EditInput label="Designation" value={editForm.designation} onChange={(value) => setEditForm({ ...editForm, designation: value })} />
                  <EditInput label="Join Date" type="date" value={editForm.join_date} onChange={(value) => setEditForm({ ...editForm, join_date: value })} />
                  <EditInput label="Salary" type="number" value={editForm.salary} onChange={(value) => setEditForm({ ...editForm, salary: value })} />
                  <EditSelect label="Status" value={editForm.status ? "Active" : "Inactive"} onChange={(value) => setEditForm({ ...editForm, status: value === "Active" })} options={["Active", "Inactive"]} />
                  <EditInput label="Country" value={editForm.country} onChange={(value) => setEditForm({ ...editForm, country: value })} />
                  <EditInput label="State" value={editForm.state} onChange={(value) => setEditForm({ ...editForm, state: value })} />
                  <EditInput label="City" value={editForm.city} onChange={(value) => setEditForm({ ...editForm, city: value })} />
                  <EditInput label="Pincode" value={editForm.pincode} onChange={(value) => setEditForm({ ...editForm, pincode: value })} />
                  <label className="md:col-span-3 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase">Full Address</span>
                    <textarea rows={3} value={editForm.full_address} onChange={(event) => setEditForm({ ...editForm, full_address: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500" />
                  </label>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setEditForm(toEditForm(staff))} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
                    <X className="w-4 h-4" />
                    Reset
                  </button>
                  <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white disabled:opacity-60">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </Panel>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Panel title="Staff Details" icon={<UserRound className="w-4 h-4" />}>
              <DetailGrid>
                <Info label="Department" value={staff.department} />
                <Info label="Designation" value={staff.designation} />
                <Info label="Join Date" value={staff.join_date} />
                <Info label="Salary" value={staff.salary} />
                <Info label="Created" value={new Date(staff.created_at).toLocaleDateString()} />
                <Info label="Updated" value={new Date(staff.updated_at).toLocaleDateString()} />
              </DetailGrid>
            </Panel>

            <Panel title="Work Summary" icon={<BriefcaseBusiness className="w-4 h-4" />}>
              <DetailGrid>
                <Info label="Total Salary Paid" value={totalPaid.toFixed(2)} />
                <Info label="Payment Records" value={payments.length} />
                <Info label="Attendance Records" value={attendance.length} />
                <Info label="Present Days" value={presentDays} />
                <Info label="Latest Status" value={attendance[0]?.status || "N/A"} />
                <Info label="Role Status" value={staff.status ? "Active" : "Inactive"} />
              </DetailGrid>
            </Panel>
          </div>

          <Panel title="Salary Payment Section" icon={<CreditCard className="w-4 h-4" />}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <DetailGrid>
                <Info label="Monthly Salary" value={staff.salary} />
                <Info label="Total Paid" value={totalPaid.toFixed(2)} />
                <Info label="Transactions" value={payments.length} />
              </DetailGrid>
              <form onSubmit={recordPayment} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
                <div className="text-xs font-black text-emerald-800 font-mono uppercase">Record Payment</div>
                <input value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} type="number" min="1" placeholder="Amount" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <input value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} type="date" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none">
                  {["Cash", "Card", "GPay", "NetBanking"].map((mode) => <option key={mode}>{mode}</option>)}
                </select>
                <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Reference" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Notes" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <button type="submit" className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Save Payment</button>
              </form>
            </div>
            <DataTable
              columns={["Date", "Method", "Reference", "Status", "Amount"]}
              empty="No salary payments recorded."
              rows={payments.map((payment) => [
                payment.payment_date,
                payment.payment_method,
                payment.transaction_ref || "N/A",
                payment.status,
                payment.amount,
              ])}
            />
          </Panel>

          <Panel title="Attendance Section" icon={<CalendarCheck className="w-4 h-4" />}>
            <DataTable
              columns={["Date", "Status", "Remarks"]}
              empty="No attendance records found."
              rows={attendance.map((item) => [item.attendance_date, item.status, item.remarks || "N/A"])}
            />
          </Panel>
        </main>
      </div>
    </div>
  );
};

const BackButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} className="inline-flex w-fit items-center gap-2 text-xs font-bold text-indigo-600">
    <ArrowLeft className="w-4 h-4" />
    {label}
  </button>
);

const Panel = ({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
      {icon}
      <h2 className="text-xs font-extrabold text-indigo-600 font-mono uppercase tracking-wider">{title}</h2>
    </div>
    {children}
  </section>
);

const DetailGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">{children}</div>
);

const Info = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
    <div className="text-[9px] font-mono uppercase text-slate-400">{label}</div>
    <div className="mt-1 break-words text-xs font-bold text-slate-900">{value || "N/A"}</div>
  </div>
);

const MiniStat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
    <div className="text-[9px] font-mono uppercase text-slate-400">{label}</div>
    <div className="mt-1 text-sm font-black text-slate-900">{value}</div>
  </div>
);

const EditInput = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) => (
  <label className="space-y-1">
    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase">{label}</span>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500" />
  </label>
);

const EditSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
  <label className="space-y-1">
    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </label>
);

const DataTable = ({ columns, rows, empty }: { columns: string[]; rows: Array<Array<string | number>>; empty: string }) => (
  <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full text-left text-xs">
      <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-mono">
        <tr>{columns.map((column) => <th key={column} className="p-3">{column}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length > 0 ? rows.map((row, index) => (
          <tr key={index} className="border-t border-slate-100">
            {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="p-3 font-semibold text-slate-700">{cell}</td>)}
          </tr>
        )) : (
          <tr><td colSpan={columns.length} className="p-4 text-center text-slate-500">{empty}</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

export default StaffProfile;
