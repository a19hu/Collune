import {
  createStudentFeePayment,
  deleteStudentProfile,
  getStudentMarks,
  getStudentProfile,
  updateStudentProfile,
  type StudentApi,
  type StudentMarkApi,
  type StudentUpdatePayload,
} from "@/src/lib/authApi";
import { ArrowLeft, CreditCard, Edit3, GraduationCap, Save, Trash2, UserRound, X } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type EditForm = {
  first_name: string;
  last_name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  dob: string;
  blood_group: string;
  nationality: string;
  religion: string;
  category: string;
  email: string;
  phone_no: string;
  class_id: string;
  roll_no: string;
  medical_notes: string;
};

const toEditForm = (student: StudentApi): EditForm => ({
  first_name: student.first_name || "",
  last_name: student.last_name || "",
  gender: student.gender || "",
  dob: student.dob || "",
  blood_group: student.blood_group || "",
  nationality: student.nationality || "",
  religion: student.religion || "",
  category: student.category || "",
  email: student.email || student.user.email || "",
  phone_no: student.phone_no || student.user.phone_no || "",
  class_id: student.class_id || "",
  roll_no: student.roll_no || "",
  medical_notes: student.medical_notes || "",
});

const StudentProfile = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [student, setStudent] = useState<StudentApi | null>(null);
  const [marks, setMarks] = useState<StudentMarkApi[]>([]);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeDate, setFeeDate] = useState(new Date().toISOString().slice(0, 10));
  const [feeMode, setFeeMode] = useState("Cash");
  const [feeReference, setFeeReference] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStudent = async () => {
      if (!studentId) {
        setIsLoading(false);
        return;
      }

      try {
        const [profileResponse, marksResponse] = await Promise.all([
          getStudentProfile(studentId),
          getStudentMarks({ student_id: studentId }),
        ]);
        if (!isMounted) return;
        setStudent(profileResponse.student);
        setEditForm(toEditForm(profileResponse.student));
        setMarks(marksResponse.marks);
      } catch (error: any) {
        if (isMounted) setMessage(error?.message || "Unable to load student profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadStudent();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const fullName = useMemo(() => {
    if (!student) return "Student Profile";
    return `${student.first_name || ""} ${student.last_name || ""}`.trim() || "Unnamed Student";
  }, [student]);

  const addressLine = student?.address
    ? [
        student.address.address_line1,
        student.address.address_line2,
        student.address.city,
        student.address.state,
        student.address.pincode,
        student.address.country,
      ].filter(Boolean).join(", ")
    : "";

  const gradeSummary = useMemo(() => {
    const total = marks.reduce((sum, mark) => sum + Number(mark.marks_obtained || 0), 0);
    const average = marks.length > 0 ? Math.round(total / marks.length) : 0;
    const topGrade = marks[0]?.grade || "N/A";
    return { average, topGrade, count: marks.length };
  }, [marks]);

  const saveStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (!studentId || !editForm) return;

    try {
      setIsSaving(true);
      const payload: StudentUpdatePayload = {
        ...editForm,
        gender: editForm.gender || null,
        dob: editForm.dob || null,
      };
      const response = await updateStudentProfile(studentId, payload);
      setStudent(response.student);
      setEditForm(toEditForm(response.student));
      setMessage("Student profile updated.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to update student profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStudent = async () => {
    if (!studentId) return;

    try {
      await deleteStudentProfile(studentId);
      navigate("/admin/students");
    } catch (error: any) {
      setMessage(error?.message || "Unable to delete student profile.");
    }
  };

  const recordFeePayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!studentId || !feeAmount) return;

    try {
      const response = await createStudentFeePayment(studentId, {
        amount: feeAmount,
        payment_date: feeDate,
        payment_mode: feeMode,
        transaction_ref: feeReference,
      });
      setStudent((current) => current ? { ...current, fee_account: response.fee_account } : current);
      setFeeAmount("");
      setFeeReference("");
      setMessage("Fee payment recorded.");
    } catch (error: any) {
      setMessage(error?.message || "Unable to record fee payment.");
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading student profile...</div>;
  }

  if (!student) {
    return (
      <div className="space-y-4 text-left">
        <BackButton onClick={() => navigate("/admin/students")} />
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-500">
          Student profile not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in text-left">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BackButton onClick={() => navigate("/admin/students")} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditForm(toEditForm(student))}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100"
          >
            <Edit3 className="w-4 h-4" />
            Edit Student
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Delete Student
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">
          {message}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="text-sm font-black text-red-800">Delete {fullName}?</div>
          <p className="text-xs text-red-700">
            This removes the student login and linked student profile records.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 rounded-xl bg-white border border-red-100 text-xs font-bold text-slate-700">
              Cancel
            </button>
            <button type="button" onClick={deleteStudent} className="px-3 py-2 rounded-xl bg-red-600 text-xs font-bold text-white">
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-4">
            <img
              referrerPolicy="no-referrer"
              src={student.photo || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}`}
              alt={fullName}
              className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">{fullName}</h1>
              <p className="text-[11px] text-slate-500 font-mono truncate">{student.admission_no || "No admission number"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <MiniStat label="Class" value={student.class_id || "N/A"} />
            <MiniStat label="Roll" value={student.roll_no || "N/A"} />
            <MiniStat label="Status" value={student.admission?.status || "N/A"} />
            <MiniStat label="Avg" value={gradeSummary.count ? `${gradeSummary.average}` : "N/A"} />
          </div>

          <Panel title="Contact">
            <Info label="Email" value={student.email || student.user.email} />
            <Info label="Phone" value={student.phone_no || student.user.phone_no} />
            <Info label="Address" value={addressLine || "No address recorded"} />
          </Panel>
        </aside>

        <main className="space-y-5">
          {editForm && (
            <Panel title="Edit Student Profile">
              <form onSubmit={saveStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <EditInput label="First Name" value={editForm.first_name} onChange={(value) => setEditForm({ ...editForm, first_name: value })} />
                  <EditInput label="Last Name" value={editForm.last_name} onChange={(value) => setEditForm({ ...editForm, last_name: value })} />
                  <EditSelect label="Gender" value={editForm.gender} onChange={(value) => setEditForm({ ...editForm, gender: value as EditForm["gender"] })} options={["", "MALE", "FEMALE", "OTHER"]} />
                  <EditInput label="Date of Birth" type="date" value={editForm.dob} onChange={(value) => setEditForm({ ...editForm, dob: value })} />
                  <EditInput label="Blood Group" value={editForm.blood_group} onChange={(value) => setEditForm({ ...editForm, blood_group: value })} />
                  <EditInput label="Class" value={editForm.class_id} onChange={(value) => setEditForm({ ...editForm, class_id: value })} />
                  <EditInput label="Roll No" value={editForm.roll_no} onChange={(value) => setEditForm({ ...editForm, roll_no: value })} />
                  <EditInput label="Email" type="email" value={editForm.email} onChange={(value) => setEditForm({ ...editForm, email: value })} />
                  <EditInput label="Phone" value={editForm.phone_no} onChange={(value) => setEditForm({ ...editForm, phone_no: value })} />
                  <EditInput label="Nationality" value={editForm.nationality} onChange={(value) => setEditForm({ ...editForm, nationality: value })} />
                  <EditInput label="Religion" value={editForm.religion} onChange={(value) => setEditForm({ ...editForm, religion: value })} />
                  <EditInput label="Category" value={editForm.category} onChange={(value) => setEditForm({ ...editForm, category: value })} />
                  <label className="md:col-span-3 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase">Medical Notes</span>
                    <textarea
                      rows={3}
                      value={editForm.medical_notes}
                      onChange={(event) => setEditForm({ ...editForm, medical_notes: event.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </label>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setEditForm(toEditForm(student))} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
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
            <Panel title="Student Details" icon={<UserRound className="w-4 h-4" />}>
              <DetailGrid>
                <Info label="Gender" value={student.gender} />
                <Info label="DOB" value={student.dob} />
                <Info label="Blood Group" value={student.blood_group} />
                <Info label="Nationality" value={student.nationality} />
                <Info label="Religion" value={student.religion} />
                <Info label="Category" value={student.category} />
                <Info label="Medical" value={student.medical_notes || "No medical notes recorded"} wide />
              </DetailGrid>
            </Panel>

            <Panel title="Admission Details">
              <DetailGrid>
                <Info label="Type" value={student.admission?.admission_type} />
                <Info label="Applied Class" value={student.admission?.applied_for_class} />
                <Info label="Academic Year" value={student.admission?.academic_year} />
                <Info label="Admission Date" value={student.admission?.admission_date} />
                <Info label="Remarks" value={student.admission?.remarks || "No remarks"} wide />
              </DetailGrid>
            </Panel>
          </div>

          <Panel title="Fee Section" icon={<CreditCard className="w-4 h-4" />}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              <DetailGrid>
                <Info label="Academic Year" value={student.fee_account?.academic_year} />
                <Info label="Status" value={student.fee_account?.status || "Not set"} />
                <Info label="Total Due" value={student.fee_account?.total_due} />
                <Info label="Total Paid" value={student.fee_account?.total_paid} />
                <Info label="Balance" value={student.fee_account?.balance} />
                <Info label="Payments" value={student.fee_account?.payments?.length || 0} />
              </DetailGrid>
              <form onSubmit={recordFeePayment} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
                <div className="text-xs font-black text-emerald-800 font-mono uppercase">Record Payment</div>
                <input value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} type="number" min="1" placeholder="Amount" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <input value={feeDate} onChange={(event) => setFeeDate(event.target.value)} type="date" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <select value={feeMode} onChange={(event) => setFeeMode(event.target.value)} className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none">
                  {["Cash", "Card", "GPay", "NetBanking"].map((mode) => <option key={mode}>{mode}</option>)}
                </select>
                <input value={feeReference} onChange={(event) => setFeeReference(event.target.value)} placeholder="Reference" className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-semibold outline-none" />
                <button type="submit" className="w-full rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Save Payment</button>
              </form>
            </div>
            {student.fee_account?.payments && student.fee_account.payments.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-mono">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.fee_account.payments.map((payment) => (
                      <tr key={payment.payment_id} className="border-t border-slate-100">
                        <td className="p-3 font-semibold">{payment.payment_date}</td>
                        <td className="p-3">{payment.payment_mode}</td>
                        <td className="p-3">{payment.transaction_ref || "N/A"}</td>
                        <td className="p-3 text-right font-black text-emerald-700">{payment.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Exam Grade Section" icon={<GraduationCap className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <MiniStat label="Average Marks" value={gradeSummary.count ? `${gradeSummary.average}` : "N/A"} />
              <MiniStat label="Latest Grade" value={gradeSummary.topGrade} />
              <MiniStat label="Exam Records" value={gradeSummary.count} />
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-mono">
                  <tr>
                    <th className="p-3">Exam</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3 text-center">Marks</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.length > 0 ? marks.map((mark) => (
                    <tr key={mark.mark_id} className="border-t border-slate-100">
                      <td className="p-3 font-bold text-slate-900">{mark.timetable_detail?.exam_detail?.exam_name || "Exam"}</td>
                      <td className="p-3">{mark.timetable_detail?.subject_detail?.subject_name || "Subject"}</td>
                      <td className="p-3 text-center font-black">{mark.marks_obtained}</td>
                      <td className="p-3 text-center">
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-700">{mark.grade || "N/A"}</span>
                      </td>
                      <td className="p-3 text-slate-500">{mark.remarks || "No remarks"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">No exam marks recorded for this student.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </main>
      </div>
    </div>
  );
};

export const AdminStudentProfile = ({ selectedStudent, setSelectedStudent }: any) => {
  if (!selectedStudent) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-4">
      <button
        type="button"
        onClick={() => setSelectedStudent(null)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </button>
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs font-semibold text-slate-600">
        Student profile details are available in the dedicated student profile page.
      </div>
    </div>
  );
};

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="inline-flex w-fit items-center gap-2 text-xs font-bold text-indigo-600">
    <ArrowLeft className="w-4 h-4" />
    Back to students
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

const Info = ({ label, value, wide = false }: { label: string; value?: string | number | null; wide?: boolean }) => (
  <div className={`rounded-xl border border-slate-100 bg-slate-50 p-3 ${wide ? "md:col-span-2 xl:col-span-3" : ""}`}>
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
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
    />
  </label>
);

const EditSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
  <label className="space-y-1">
    <span className="text-[10px] font-extrabold text-slate-500 font-mono uppercase">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {options.map((option) => <option key={option} value={option}>{option || "Not Set"}</option>)}
    </select>
  </label>
);

export default StudentProfile;
