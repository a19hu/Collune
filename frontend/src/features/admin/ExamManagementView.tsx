import React from 'react';
import { Plus } from 'lucide-react';
import type { SaaSSchool, SchoolClass, SchoolExam, ExamResult } from '../../types';
import type { SubjectApi } from '../../lib/authApi';

type ExamManagementViewProps = {
  currentSchool: SaaSSchool;
  classes: SchoolClass[];
  subjects: SubjectApi[];
  exams: SchoolExam[];
  examResults: ExamResult[];
  examResultsSelection: SchoolExam | null;
  showAddExam: boolean;
  editingExamId: string | null;
  classFormName: string;
  classFormSection: string;
  classFormYear: string;
  editingClassId: string | null;
  subjectFormName: string;
  subjectFormCode: string;
  subjectFormDescription: string;
  editingSubjectId: string | null;
  examFormName: string;
  examFormSubject: string;
  examFormClassName: string;
  examFormDate: string;
  examFormStartTime: string;
  examFormEndTime: string;
  examFormMaxMarks: number;
  examFormRoom: string;
  setClassFormName: (value: string) => void;
  setClassFormSection: (value: string) => void;
  setClassFormYear: (value: string) => void;
  setSubjectFormName: (value: string) => void;
  setSubjectFormCode: (value: string) => void;
  setSubjectFormDescription: (value: string) => void;
  setExamFormName: (value: string) => void;
  setExamFormSubject: (value: string) => void;
  setExamFormClassName: (value: string) => void;
  setExamFormDate: (value: string) => void;
  setExamFormStartTime: (value: string) => void;
  setExamFormEndTime: (value: string) => void;
  setExamFormMaxMarks: (value: number) => void;
  setExamFormRoom: (value: string) => void;
  setShowAddExam: (value: boolean) => void;
  setEditingExamId: (value: string | null) => void;
  setExamResultsSelection: (value: SchoolExam | null) => void;
  saveClassForm: (event: React.FormEvent) => void;
  resetClassForm: () => void;
  editClass: (schoolClass: SchoolClass) => void;
  removeClass: (schoolClass: SchoolClass) => void;
  saveSubjectForm: (event: React.FormEvent) => void;
  resetSubjectForm: () => void;
  editSubject: (subject: SubjectApi) => void;
  removeSubject: (subject: SubjectApi) => void;
  openAddExamForm: () => void;
  openEditExamForm: (exam: SchoolExam) => void;
  saveExamForm: (event: React.FormEvent) => void;
  deleteExam: (examId: string, label: string) => void;
  applyIndianBoardExamTimetable: (term: 'Mid-Term' | 'Final') => void;
  showToast: (message: string) => void;
};

export const ExamManagementView: React.FC<ExamManagementViewProps> = ({
  currentSchool,
  classes,
  subjects,
  exams,
  examResults,
  examResultsSelection,
  showAddExam,
  editingExamId,
  classFormName,
  classFormSection,
  classFormYear,
  editingClassId,
  subjectFormName,
  subjectFormCode,
  subjectFormDescription,
  editingSubjectId,
  examFormName,
  examFormSubject,
  examFormClassName,
  examFormDate,
  examFormStartTime,
  examFormEndTime,
  examFormMaxMarks,
  examFormRoom,
  setClassFormName,
  setClassFormSection,
  setClassFormYear,
  setSubjectFormName,
  setSubjectFormCode,
  setSubjectFormDescription,
  setExamFormName,
  setExamFormSubject,
  setExamFormClassName,
  setExamFormDate,
  setExamFormStartTime,
  setExamFormEndTime,
  setExamFormMaxMarks,
  setExamFormRoom,
  setShowAddExam,
  setEditingExamId,
  setExamResultsSelection,
  saveClassForm,
  resetClassForm,
  editClass,
  removeClass,
  saveSubjectForm,
  resetSubjectForm,
  editSubject,
  removeSubject,
  openAddExamForm,
  openEditExamForm,
  saveExamForm,
  deleteExam,
  applyIndianBoardExamTimetable,
  showToast,
}) => (
  <div className="space-y-6 animate-fade-in text-left">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examination Hub</h1>
        <p className="text-slate-500 text-xs text-slate-400">Review evaluation timetables, midterm papers, and generate student result cards</p>
        <p className="text-[11px] text-indigo-600 font-mono mt-1">Board Standard: {currentSchool.board} - Indian-style schedule patterns</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openAddExamForm}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Exam
        </button>
        <button
          onClick={() => applyIndianBoardExamTimetable('Mid-Term')}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
        >
          Load Indian Mid-Term
        </button>
        <button
          onClick={() => applyIndianBoardExamTimetable('Final')}
          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
        >
          Load Indian Final
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Class Master</h3>
          <p className="text-[11px] text-slate-400">Create classes before assigning students, attendance, or exams.</p>
        </div>
        <form onSubmit={saveClassForm} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input value={classFormName} onChange={(e) => setClassFormName(e.target.value)} placeholder="Class Name" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input value={classFormSection} onChange={(e) => setClassFormSection(e.target.value)} placeholder="Section" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input value={classFormYear} onChange={(e) => setClassFormYear(e.target.value)} placeholder="Academic Year" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer flex-1">{editingClassId ? 'Update' : 'Add'}</button>
            {editingClassId && <button type="button" onClick={resetClassForm} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel</button>}
          </div>
        </form>
        <div className="max-h-56 overflow-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs font-semibold">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase">
              <tr><th className="p-2">Class</th><th className="p-2">Section</th><th className="p-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {classes.map(item => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-2 font-bold">{item.name}</td>
                  <td className="p-2 font-mono">{item.section}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => editClass(item)} className="px-2 py-1 rounded border border-slate-200 text-[10px] font-bold cursor-pointer">Edit</button>
                      <button onClick={() => void removeClass(item)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 text-[10px] font-bold cursor-pointer">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && <tr><td colSpan={3} className="p-5 text-center text-slate-400 font-mono">No backend classes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Subject Master</h3>
          <p className="text-[11px] text-slate-400">Subjects are used by exam timetable and grading APIs.</p>
        </div>
        <form onSubmit={saveSubjectForm} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input value={subjectFormName} onChange={(e) => setSubjectFormName(e.target.value)} placeholder="Subject Name" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input value={subjectFormCode} onChange={(e) => setSubjectFormCode(e.target.value)} placeholder="Code" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input value={subjectFormDescription} onChange={(e) => setSubjectFormDescription(e.target.value)} placeholder="Description" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer flex-1">{editingSubjectId ? 'Update' : 'Add'}</button>
            {editingSubjectId && <button type="button" onClick={resetSubjectForm} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer">Cancel</button>}
          </div>
        </form>
        <div className="max-h-56 overflow-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs font-semibold">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase">
              <tr><th className="p-2">Subject</th><th className="p-2">Code</th><th className="p-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {subjects.map(subject => (
                <tr key={subject.subject_id} className="border-t border-slate-100">
                  <td className="p-2 font-bold">{subject.subject_name}</td>
                  <td className="p-2 font-mono">{subject.subject_code}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => editSubject(subject)} className="px-2 py-1 rounded border border-slate-200 text-[10px] font-bold cursor-pointer">Edit</button>
                      <button onClick={() => void removeSubject(subject)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 text-[10px] font-bold cursor-pointer">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && <tr><td colSpan={3} className="p-5 text-center text-slate-400 font-mono">No backend subjects yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {showAddExam && (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-black text-slate-900">{editingExamId ? 'Edit Exam Timetable Entry' : 'Add New Exam Timetable Entry'}</h3>
          <button onClick={() => { setShowAddExam(false); setEditingExamId(null); }} className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
        </div>
        <form onSubmit={saveExamForm} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <input value={examFormName} onChange={(e) => setExamFormName(e.target.value)} placeholder="Exam Name (e.g. Mid-Term)" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <select value={examFormSubject} onChange={(e) => setExamFormSubject(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">
            <option value="">Select Subject</option>
            {subjects.map(subject => <option key={subject.subject_id} value={subject.subject_name}>{subject.subject_name}</option>)}
          </select>
          <select value={examFormClassName} onChange={(e) => setExamFormClassName(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none">
            {Array.from(new Set(classes.map(c => c.name))).map(cn => <option key={cn}>{cn}</option>)}
            {!Array.from(new Set(classes.map(c => c.name))).includes('Class 10') && <option>Class 10</option>}
          </select>
          <input type="date" value={examFormDate} onChange={(e) => setExamFormDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input type="time" value={examFormStartTime} onChange={(e) => setExamFormStartTime(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input type="time" value={examFormEndTime} onChange={(e) => setExamFormEndTime(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input type="number" min="1" value={examFormMaxMarks} onChange={(e) => setExamFormMaxMarks(Number(e.target.value))} placeholder="Maximum Marks" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <input value={examFormRoom} onChange={(e) => setExamFormRoom(e.target.value)} placeholder="Room / Hall" className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold outline-none" />
          <div className="flex items-center gap-2">
            <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">
              {editingExamId ? 'Update Exam' : 'Save Exam'}
            </button>
          </div>
        </form>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      {exams.map((ex) => (
        <div key={ex.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">{ex.id}</span>
              <span className="text-xs font-mono text-slate-400">{ex.date}</span>
            </div>
            <h3 className="font-extrabold text-sm text-slate-950">{ex.examName}</h3>
            <div className="text-xs text-indigo-700 font-extrabold">{ex.subject} - {ex.className}</div>
            <div className="text-[10px] text-slate-500 font-mono">Venue: {ex.room}</div>
          </div>

          <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400">Total Score: {ex.maximumMarks} Max</span>
            <div className="flex items-center gap-2">
              <button onClick={() => openEditExamForm(ex)} className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold cursor-pointer">Edit</button>
              <button onClick={() => deleteExam(ex.id, `${ex.examName} - ${ex.subject}`)} className="px-2 py-1 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold cursor-pointer">Del</button>
              <button
                id={`btn-exam-report-${ex.id}`}
                onClick={() => {
                  const sMatch = examResults.filter(r => r.examId === ex.id);
                  if (sMatch.length > 0) {
                    setExamResultsSelection(ex);
                  } else {
                    showToast('No grades reported for this exam yet.');
                  }
                }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                View Report »
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {examResultsSelection && (
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left space-y-4 animate-fade-in">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="font-extrabold text-sm">{examResultsSelection.examName} - {examResultsSelection.subject} Roster</h4>
          <button onClick={() => setExamResultsSelection(null)} className="text-xs text-slate-500 hover:underline">Close List</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                <th className="p-3">Student Name</th>
                <th className="p-3 font-sans">Marks Scored</th>
                <th className="p-3">Assessment Remarks</th>
                <th className="p-3 text-right">Result Pass/Fail</th>
              </tr>
            </thead>
            <tbody>
              {examResults.filter(r => r.examId === examResultsSelection.id).map(res => (
                <tr key={res.id} className="border-b border-slate-50">
                  <td className="p-3 font-extrabold text-slate-905">{res.studentName}</td>
                  <td className="p-3 font-mono font-black text-indigo-600">{res.marksObtained} / {examResultsSelection.maximumMarks}</td>
                  <td className="p-3 text-slate-500 text-xs italic">"{res.remarks}"</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      res.status === 'Pass' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-550/10 text-red-500'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
