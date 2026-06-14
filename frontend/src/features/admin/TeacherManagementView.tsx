import React from 'react';
import { BookOpen, DollarSign, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import type { SchoolTeacher } from '../../types';
import type { TeacherPaymentRecord } from '../payments/types';

type TeacherManagementViewProps = {
  teachers: SchoolTeacher[];
  teacherPayments: TeacherPaymentRecord[];
  teacherSearchQuery: string;
  teacherSubjectFilter: string;
  showTeacherForm: boolean;
  editingTeacherId: string | null;
  teacherFormName: string;
  teacherFormPhone: string;
  teacherFormEmail: string;
  teacherFormQualification: string;
  teacherFormExperience: number;
  teacherFormSubject: string;
  teacherFormSalary: number;
  teacherFormJoiningDate: string;
  teacherFormStatus: boolean;
  teacherFormAddress: string;
  teacherFormPhoto: string;
  teacherFormIsClassTeacher: boolean;
  teacherFormClassAssigned: string;
  showTeacherPaymentModal: boolean;
  activeTeacherPaymentProfile: SchoolTeacher | null;
  editingTeacherPaymentId: string | null;
  teacherPaymentAmount: number;
  teacherPaymentDate: string;
  teacherPaymentMonth: string;
  teacherPaymentMethod: TeacherPaymentRecord['method'];
  teacherPaymentReference: string;
  teacherPaymentNotes: string;
  setTeacherSearchQuery: (value: string) => void;
  setTeacherSubjectFilter: (value: string) => void;
  setShowTeacherForm: (value: boolean) => void;
  setTeacherFormName: (value: string) => void;
  setTeacherFormPhone: (value: string) => void;
  setTeacherFormEmail: (value: string) => void;
  setTeacherFormQualification: (value: string) => void;
  setTeacherFormExperience: (value: number) => void;
  setTeacherFormSubject: (value: string) => void;
  setTeacherFormSalary: (value: number) => void;
  setTeacherFormJoiningDate: (value: string) => void;
  setTeacherFormStatus: (value: boolean) => void;
  setTeacherFormAddress: (value: string) => void;
  setTeacherFormPhoto: (value: string) => void;
  setTeacherFormIsClassTeacher: (value: boolean) => void;
  setTeacherFormClassAssigned: (value: string) => void;
  setShowTeacherPaymentModal: (value: boolean) => void;
  setEditingTeacherPaymentId: (value: string | null) => void;
  setTeacherPaymentAmount: (value: number) => void;
  setTeacherPaymentDate: (value: string) => void;
  setTeacherPaymentMonth: (value: string) => void;
  setTeacherPaymentMethod: (value: TeacherPaymentRecord['method']) => void;
  setTeacherPaymentReference: (value: string) => void;
  setTeacherPaymentNotes: (value: string) => void;
  handleOpenAddTeacher: () => void;
  handleOpenEditTeacher: (teacher: SchoolTeacher) => void;
  handleDeleteTeacher: (teacher: SchoolTeacher) => void;
  handleSaveTeacher: (event: React.FormEvent) => void;
  handleOpenTeacherPaymentModal: (teacher: SchoolTeacher) => void;
  handleEditTeacherPayment: (payment: TeacherPaymentRecord) => void;
  handleDeleteTeacherPayment: (paymentId: string) => void;
  handleSaveTeacherPayment: (event: React.FormEvent) => void;
};

const subjects = ['Physics', 'Mathematics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];
const paymentMethods: TeacherPaymentRecord['method'][] = ['Cash', 'Card', 'GPay', 'NetBanking'];

export const TeacherManagementView: React.FC<TeacherManagementViewProps> = ({
  teachers,
  teacherPayments,
  teacherSearchQuery,
  teacherSubjectFilter,
  showTeacherForm,
  editingTeacherId,
  teacherFormName,
  teacherFormPhone,
  teacherFormEmail,
  teacherFormQualification,
  teacherFormExperience,
  teacherFormSubject,
  teacherFormSalary,
  teacherFormJoiningDate,
  teacherFormStatus,
  teacherFormAddress,
  teacherFormPhoto,
  teacherFormIsClassTeacher,
  teacherFormClassAssigned,
  showTeacherPaymentModal,
  activeTeacherPaymentProfile,
  editingTeacherPaymentId,
  teacherPaymentAmount,
  teacherPaymentDate,
  teacherPaymentMonth,
  teacherPaymentMethod,
  teacherPaymentReference,
  teacherPaymentNotes,
  setTeacherSearchQuery,
  setTeacherSubjectFilter,
  setShowTeacherForm,
  setTeacherFormName,
  setTeacherFormPhone,
  setTeacherFormEmail,
  setTeacherFormQualification,
  setTeacherFormExperience,
  setTeacherFormSubject,
  setTeacherFormSalary,
  setTeacherFormJoiningDate,
  setTeacherFormStatus,
  setTeacherFormAddress,
  setTeacherFormPhoto,
  setTeacherFormIsClassTeacher,
  setTeacherFormClassAssigned,
  setShowTeacherPaymentModal,
  setEditingTeacherPaymentId,
  setTeacherPaymentAmount,
  setTeacherPaymentDate,
  setTeacherPaymentMonth,
  setTeacherPaymentMethod,
  setTeacherPaymentReference,
  setTeacherPaymentNotes,
  handleOpenAddTeacher,
  handleOpenEditTeacher,
  handleDeleteTeacher,
  handleSaveTeacher,
  handleOpenTeacherPaymentModal,
  handleEditTeacherPayment,
  handleDeleteTeacherPayment,
  handleSaveTeacherPayment,
}) => {
  const filteredTeachers = teachers.filter((teacher) => {
    const query = teacherSearchQuery.toLowerCase();
    const matchesSearch =
      teacher.name.toLowerCase().includes(query) ||
      teacher.subject.toLowerCase().includes(query) ||
      teacher.qualification.toLowerCase().includes(query) ||
      teacher.employeeId.toLowerCase().includes(query);
    const matchesSubject = teacherSubjectFilter === 'All' || teacher.subject === teacherSubjectFilter;
    return matchesSearch && matchesSubject;
  });
  const activePayments = activeTeacherPaymentProfile
    ? teacherPayments.filter((payment) => payment.teacherEmployeeId === activeTeacherPaymentProfile.employeeId)
    : [];

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Academic Instructors Directory
          </h1>
          <p className="text-slate-500 text-xs">Manage professional profiles, salary structures, subjects, and homeroom assignments</p>
        </div>
        <button onClick={handleOpenAddTeacher} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-colors cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Instructor
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl"><span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Mentors</span><span className="text-sm font-extrabold text-slate-900 font-mono">{teachers.length}</span></div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl"><span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Experience</span><span className="text-sm font-extrabold text-indigo-600 font-mono">{teachers.length > 0 ? (teachers.reduce((sum, t) => sum + t.experience, 0) / teachers.length).toFixed(1) : 0} Yrs</span></div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl"><span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Homeroom Assigned</span><span className="text-sm font-extrabold text-emerald-600 font-mono">{teachers.filter(t => t.classAssigned).length} Leads</span></div>
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl"><span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">Avg Monthly Wage</span><span className="text-sm font-extrabold text-rose-500 font-mono">${teachers.length > 0 ? Math.round(teachers.reduce((sum, t) => sum + t.salary, 0) / teachers.length) : 0}/Mo</span></div>
      </div>

      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search by instructor name, subject, credentials or ID..." value={teacherSearchQuery} onChange={(e) => setTeacherSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none transition-colors" />
        </div>
        <select value={teacherSubjectFilter} onChange={(e) => setTeacherSubjectFilter(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-700">
          <option value="All">All Subjects</option>
          {Array.from(new Set(teachers.map(t => t.subject))).map(subject => <option key={subject} value={subject}>{subject}</option>)}
        </select>
      </div>

      {showTeacherForm && (
        <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 space-y-4 animate-slide-up-fade">
          <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
            <h3 className="font-extrabold text-sm text-indigo-950">{editingTeacherId ? 'Update Instructor Credentials' : 'Register New Academic Mentor'}</h3>
            <button onClick={() => setShowTeacherForm(false)} className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors font-mono font-bold">Cancel</button>
          </div>
          <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            <input required value={teacherFormName} onChange={(e) => setTeacherFormName(e.target.value)} placeholder="Mentor Name" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans" />
            <input required value={teacherFormPhone} onChange={(e) => setTeacherFormPhone(e.target.value)} placeholder="Contact Phone" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono" />
            <input required type="email" value={teacherFormEmail} onChange={(e) => setTeacherFormEmail(e.target.value)} placeholder="Portal Email" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono" />
            <select value={teacherFormSubject} onChange={(e) => setTeacherFormSubject(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono">{subjects.map(subject => <option key={subject}>{subject}</option>)}</select>
            <input value={teacherFormQualification} onChange={(e) => setTeacherFormQualification(e.target.value)} placeholder="Professional License / Qualifications" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" max="50" value={teacherFormExperience} onChange={(e) => setTeacherFormExperience(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono" />
              <input type="number" min="1" value={teacherFormSalary} onChange={(e) => setTeacherFormSalary(Math.max(0, parseInt(e.target.value) || 0))} className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono" />
            </div>
            <input type="date" value={teacherFormJoiningDate} onChange={(e) => setTeacherFormJoiningDate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono" />
            <select value={teacherFormStatus ? 'ACTIVE' : 'INACTIVE'} onChange={(e) => setTeacherFormStatus(e.target.value === 'ACTIVE')} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
            <input value={teacherFormPhoto} onChange={(e) => setTeacherFormPhoto(e.target.value)} placeholder="Photo URL" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-[10px]" />
            <input value={teacherFormAddress} onChange={(e) => setTeacherFormAddress(e.target.value)} placeholder="Residential Address" className="md:col-span-2 w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans" />
            <label className="flex items-center gap-2 pt-2 text-slate-700 font-semibold cursor-pointer"><input type="checkbox" checked={teacherFormIsClassTeacher} onChange={(e) => setTeacherFormIsClassTeacher(e.target.checked)} className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" /> Lead Homeroom Teacher</label>
            <input disabled={!teacherFormIsClassTeacher} value={teacherFormClassAssigned} onChange={(e) => setTeacherFormClassAssigned(e.target.value)} placeholder="Assigned Class / Division" className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-40 font-mono" />
            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowTeacherForm(false)} className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition-colors">Close Form</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors">{editingTeacherId ? 'Update Credentials' : 'Save & Active Record'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.employeeId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <img referrerPolicy="no-referrer" src={teacher.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200'} alt={teacher.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" />
                  <div className="overflow-hidden"><h4 className="font-extrabold text-sm text-slate-950 truncate">{teacher.name}</h4><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-mono text-[9px] font-extrabold">{teacher.subject} Mentor</span></div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">ID: {teacher.employeeId}</span>
              </div>
              <p className="text-xs text-slate-600 pt-3 leading-relaxed border-t border-slate-50 mt-3"><strong>Credentials:</strong> {teacher.qualification}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-50 mt-3 font-mono text-[10px] text-slate-500">
                <div><span>EXPERIENCE:</span> <strong className="text-slate-800 font-sans block">{teacher.experience} Years</strong></div>
                <div><span>JOIN DATE:</span> <strong className="block text-slate-800">{teacher.joiningDate}</strong></div>
                <div><span>PHONE NO:</span> <strong className="block text-slate-800">{teacher.phone}</strong></div>
                <div><span>SALARY RATE:</span> <strong className="block text-emerald-600 font-black">${teacher.salary}/Mo</strong></div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-indigo-700 font-bold">{teacher.isClassTeacher ? `Lead Assigned: ${teacher.classAssigned || 'General'}` : 'Subject Mentor'}</span>
              <div className="flex gap-2">
                <button onClick={() => handleOpenTeacherPaymentModal(teacher)} className="px-2.5 py-1 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-50 rounded-lg text-emerald-700 transition-colors cursor-pointer flex items-center gap-1"><DollarSign className="w-3 h-3" /> Pay</button>
                <button onClick={() => handleOpenEditTeacher(teacher)} className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-705 transition-colors cursor-pointer flex items-center gap-1"><Edit3 className="w-3 h-3 text-indigo-500" /> Edit</button>
                <button onClick={() => void handleDeleteTeacher(teacher)} className="px-2.5 py-1 text-[11px] font-bold border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors cursor-pointer flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Del</button>
              </div>
            </div>
          </div>
        ))}
        {filteredTeachers.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-200 rounded-3xl">No matching active instructors discovered.</div>}
      </div>

      {showTeacherPaymentModal && activeTeacherPaymentProfile && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div><h3 className="text-sm font-black text-slate-900">Instructor Payments: {activeTeacherPaymentProfile.name}</h3><p className="text-[11px] text-slate-400 font-mono">{activeTeacherPaymentProfile.employeeId} - {activeTeacherPaymentProfile.subject}</p></div>
            <button onClick={() => setShowTeacherPaymentModal(false)} className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">Close</button>
          </div>
          <form onSubmit={handleSaveTeacherPayment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="number" value={teacherPaymentAmount} onChange={(e) => setTeacherPaymentAmount(Number(e.target.value))} placeholder="Amount" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="date" value={teacherPaymentDate} onChange={(e) => setTeacherPaymentDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input type="month" value={teacherPaymentMonth} onChange={(e) => setTeacherPaymentMonth(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <select value={teacherPaymentMethod} onChange={(e) => setTeacherPaymentMethod(e.target.value as TeacherPaymentRecord['method'])} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">{paymentMethods.map(method => <option key={method}>{method}</option>)}</select>
            <input value={teacherPaymentReference} onChange={(e) => setTeacherPaymentReference(e.target.value)} placeholder="Reference / Txn ID" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <input value={teacherPaymentNotes} onChange={(e) => setTeacherPaymentNotes(e.target.value)} placeholder="Notes (optional)" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
            <div className="flex items-center gap-2"><button type="submit" className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">{editingTeacherPaymentId ? 'Update Payment' : 'Add Payment'}</button>{editingTeacherPaymentId && <button type="button" onClick={() => setEditingTeacherPaymentId(null)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel Edit</button>}</div>
          </form>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs font-semibold text-slate-700">
              <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[9px]"><th className="p-3">Date</th><th className="p-3">Month</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Reference</th><th className="p-3">Notes</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>
                {activePayments.map(payment => (
                  <tr key={payment.id} className="border-b border-slate-100">
                    <td className="p-3 font-mono">{payment.paymentDate}</td><td className="p-3 font-mono">{payment.month}</td><td className="p-3 font-black text-emerald-600">${payment.amount}</td><td className="p-3">{payment.method}</td><td className="p-3 font-mono text-[10px]">{payment.reference}</td><td className="p-3 text-slate-500">{payment.notes || '-'}</td>
                    <td className="p-3"><div className="flex justify-end gap-1.5"><button onClick={() => handleEditTeacherPayment(payment)} className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold cursor-pointer">Edit</button><button onClick={() => handleDeleteTeacherPayment(payment.id)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold cursor-pointer">Del</button></div></td>
                  </tr>
                ))}
                {activePayments.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-400 font-mono text-xs">No payment history for this instructor yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
