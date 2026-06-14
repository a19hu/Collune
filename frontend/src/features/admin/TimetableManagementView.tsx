import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import type { SchoolClass, SchoolTeacher, TimetablePeriod } from '../../types';

type TimetableManagementViewProps = {
  classes: SchoolClass[];
  teachers: SchoolTeacher[];
  timetable: TimetablePeriod[];
  selectedTimetableClass: string;
  showAddPeriodForm: boolean;
  addDay: TimetablePeriod['day'];
  addTimeSlot: string;
  addSubjectName: string;
  addTeacherName: string;
  addClassName: string;
  editingPeriodId: string | null;
  editDay: TimetablePeriod['day'];
  editTimeSlot: string;
  editSubjectName: string;
  editTeacherName: string;
  setSelectedTimetableClass: (value: string) => void;
  setShowAddPeriodForm: (value: boolean) => void;
  setAddDay: (value: TimetablePeriod['day']) => void;
  setAddTimeSlot: (value: string) => void;
  setAddSubjectName: (value: string) => void;
  setAddTeacherName: (value: string) => void;
  setAddClassName: (value: string) => void;
  setEditingPeriodId: (value: string | null) => void;
  setEditDay: (value: TimetablePeriod['day']) => void;
  setEditTimeSlot: (value: string) => void;
  setEditSubjectName: (value: string) => void;
  setEditTeacherName: (value: string) => void;
  submitAddPeriod: (event: React.FormEvent) => void;
  startEditPeriod: (period: TimetablePeriod) => void;
  saveEditPeriod: (id: string) => void;
  deletePeriod: (id: string, name: string) => void;
};

const timetableDays: TimetablePeriod['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayOrder: Record<TimetablePeriod['day'], number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const TimetableManagementView: React.FC<TimetableManagementViewProps> = ({
  classes,
  teachers,
  timetable,
  selectedTimetableClass,
  showAddPeriodForm,
  addDay,
  addTimeSlot,
  addSubjectName,
  addTeacherName,
  addClassName,
  editingPeriodId,
  editDay,
  editTimeSlot,
  editSubjectName,
  editTeacherName,
  setSelectedTimetableClass,
  setShowAddPeriodForm,
  setAddDay,
  setAddTimeSlot,
  setAddSubjectName,
  setAddTeacherName,
  setAddClassName,
  setEditingPeriodId,
  setEditDay,
  setEditTimeSlot,
  setEditSubjectName,
  setEditTeacherName,
  submitAddPeriod,
  startEditPeriod,
  saveEditPeriod,
  deletePeriod,
}) => {
  const uniqueClasses = Array.from(new Set(classes.map((schoolClass) => schoolClass.name)));
  const filteredTimetable = timetable.filter((period) => period.className === selectedTimetableClass);
  const sortedFilteredTimetable = [...filteredTimetable].sort((a, b) => {
    const dayDiff = dayOrder[a.day] - dayOrder[b.day];
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Lecture Schedule</h1>
          <p className="text-slate-500 text-xs text-slate-400">Renders weekly lesson timings, mentor alignments, and subject blocks class-wise</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cohort:</span>
            <select
              value={selectedTimetableClass}
              onChange={(e) => {
                setSelectedTimetableClass(e.target.value);
                setAddClassName(e.target.value);
              }}
              className="px-3.5 py-1.5 bg-white border border-slate-205 rounded-xl text-xs font-bold font-sans cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {uniqueClasses.map((schoolClass) => (
                <option key={schoolClass} value={schoolClass}>{schoolClass}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setShowAddPeriodForm(!showAddPeriodForm);
              setAddClassName(selectedTimetableClass);
            }}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {showAddPeriodForm ? 'Cancel Add' : '+ Add Period Slot'}
          </button>
        </div>
      </div>

      {showAddPeriodForm && (
        <form onSubmit={submitAddPeriod} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in text-xs font-sans">
          <div className="flex justify-between items-center border-b border-slate-205 pb-3">
            <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Create New Timetable Period</h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">Target: {addClassName}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Day of Week</label>
              <select
                value={addDay}
                onChange={(e) => setAddDay(e.target.value as TimetablePeriod['day'])}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
              >
                {timetableDays.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Time Slot</label>
              <input
                type="text"
                value={addTimeSlot}
                onChange={(e) => setAddTimeSlot(e.target.value)}
                placeholder="e.g. 09:00 AM - 09:45 AM"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Subject Course</label>
              <input
                type="text"
                value={addSubjectName}
                onChange={(e) => setAddSubjectName(e.target.value)}
                placeholder="e.g. Physics"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Assigned Mentor</label>
              <select
                value={addTeacherName}
                onChange={(e) => setAddTeacherName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                required
              >
                <option value="">-- Choose Mentor --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Class Cohort</label>
              <select
                value={addClassName}
                onChange={(e) => setAddClassName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                required
              >
                {uniqueClasses.map((schoolClass) => (
                  <option key={schoolClass} value={schoolClass}>{schoolClass}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddPeriodForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Dismiss Form
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Save Periodic Entry
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                <th className="p-3.5">Assigned Target Day</th>
                <th className="p-3.5">Time Period Slot</th>
                <th className="p-3.5">Lecture Course</th>
                <th className="p-3.5">Subject Teacher</th>
                <th className="p-3.5 text-right">Roster Options</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredTimetable.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-mono text-[11px]">
                    No lecture periods defined for {selectedTimetableClass} yet. Click '+ Add Period Slot' to add one.
                  </td>
                </tr>
              ) : (
                sortedFilteredTimetable.map((period) => {
                  const isEditing = editingPeriodId === period.id;
                  if (isEditing) {
                    return (
                      <tr key={period.id} className="border-b border-indigo-100 bg-indigo-50/20">
                        <td className="p-3">
                          <select
                            value={editDay}
                            onChange={(e) => setEditDay(e.target.value as TimetablePeriod['day'])}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold w-full font-mono text-indigo-600 focus:outline-none"
                          >
                            {timetableDays.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editTimeSlot}
                            onChange={(e) => setEditTimeSlot(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-mono w-full focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editSubjectName}
                            onChange={(e) => setEditSubjectName(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-sans font-bold w-full focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={editTeacherName}
                            onChange={(e) => setEditTeacherName(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-sans w-full focus:outline-none"
                          >
                            <option value="">-- Choose Mentor --</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => saveEditPeriod(period.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPeriodId(null)}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={period.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3.5 font-extrabold text-indigo-600 font-mono text-[11px]">{period.day}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{period.timeSlot}</td>
                      <td className="p-3.5 font-bold text-slate-950">{period.subjectName}</td>
                      <td className="p-3.5 font-sans text-slate-600">{period.teacherName}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                        <div className="flex justify-end gap-3.5 items-center">
                          <span className="text-slate-400 text-[9px] uppercase tracking-wider font-mono bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-150">{period.className}</span>
                          <button
                            onClick={() => startEditPeriod(period)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5 inline text-indigo-500" /> Edit
                          </button>
                          <button
                            onClick={() => deletePeriod(period.id, `${period.subjectName} (${period.day})`)}
                            className="text-red-500 hover:text-red-700 hover:underline inline-flex items-center gap-1 cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline text-red-400" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
