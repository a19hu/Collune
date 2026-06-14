import React, { useMemo, useState } from 'react';
import { CalendarDays, Save, Search, Users } from 'lucide-react';
import type { AttendanceRecord, SchoolClass, SchoolStaff, SchoolStudent, SchoolTeacher } from '../../types';
import {
  getStaffAttendance,
  getTeacherAttendance,
  upsertStaffAttendance,
  upsertStudentAttendance,
  upsertTeacherAttendance,
  type AttendanceStatusApi,
  type StaffAttendanceApi,
  type WorkdayAttendanceApi,
} from '../../lib/authApi';

type AttendanceMode = 'students' | 'teachers' | 'staff';
type UiAttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day';

type AttendanceRow = {
  id: string;
  backendId?: string | number;
  name: string;
  meta: string;
  status: UiAttendanceStatus;
  remarks: string;
  disabled?: boolean;
};

type AttendanceManagementViewProps = {
  students: SchoolStudent[];
  teachers: SchoolTeacher[];
  staff: SchoolStaff[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  showToast: (message: string) => void;
};

const today = new Date().toISOString().split('T')[0];

const toApiStatus = (status: UiAttendanceStatus): AttendanceStatusApi => {
  if (status === 'Absent') return 'ABSENT';
  if (status === 'Leave') return 'LEAVE';
  if (status === 'Half Day') return 'HALF_DAY';
  return 'PRESENT';
};

const toUiStatus = (status?: AttendanceStatusApi | AttendanceRecord['status']): UiAttendanceStatus => {
  if (status === 'ABSENT' || status === 'Absent') return 'Absent';
  if (status === 'LEAVE' || status === 'Leave') return 'Leave';
  if (status === 'HALF_DAY') return 'Half Day';
  return 'Present';
};

const statusClass: Record<UiAttendanceStatus, string> = {
  Present: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Absent: 'bg-red-50 text-red-700 border-red-100',
  Leave: 'bg-amber-50 text-amber-700 border-amber-100',
  'Half Day': 'bg-cyan-50 text-cyan-700 border-cyan-100',
};

export const AttendanceManagementView: React.FC<AttendanceManagementViewProps> = ({
  students,
  teachers,
  staff,
  classes,
  attendance,
  setAttendance,
  showToast,
}) => {
  const [mode, setMode] = useState<AttendanceMode>('students');
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [selectedClassName, setSelectedClassName] = useState(classes[0]?.name || 'Class 10');
  const [selectedSection, setSelectedSection] = useState(classes[0]?.section || 'A');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const uniqueClassNames = useMemo(() => Array.from(new Set(classes.map((schoolClass) => schoolClass.name))), [classes]);
  const uniqueSections = useMemo(() => {
    const sections = classes
      .filter((schoolClass) => schoolClass.name === selectedClassName)
      .map((schoolClass) => schoolClass.section);
    return Array.from(new Set(sections.length > 0 ? sections : classes.map((schoolClass) => schoolClass.section)));
  }, [classes, selectedClassName]);

  const selectedClass = classes.find((schoolClass) => schoolClass.name === selectedClassName && schoolClass.section === selectedSection);

  const updateRow = (id: string, patch: Partial<AttendanceRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const loadStudentRows = () => {
    const classStudents = students.filter(
      (student) => student.className === selectedClassName && student.section === selectedSection && student.status === 'Active',
    );

    if (classStudents.length === 0) {
      setRows([]);
      showToast(`No active students found for ${selectedClassName}-${selectedSection}.`);
      return;
    }

    setRows(
      classStudents.map((student) => {
        const record = attendance.find((item) => item.studentId === student.id && item.date === attendanceDate);
        return {
          id: student.id,
          backendId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          meta: `${student.className}-${student.section} | Roll #${student.rollNo}`,
          status: toUiStatus(record?.status),
          remarks: '',
        };
      }),
    );
    showToast(`Loaded student attendance for ${selectedClassName}-${selectedSection}.`);
  };

  const loadTeacherRows = async () => {
    setIsLoading(true);
    try {
      const loaded = await Promise.allSettled(
        teachers.map(async (teacher) => {
          if (!teacher.teacherId) {
            return {
              id: teacher.employeeId,
              name: teacher.name,
              meta: `${teacher.subject} | Missing backend teacher ID`,
              status: 'Present' as UiAttendanceStatus,
              remarks: '',
              disabled: true,
            };
          }
          const response = await getTeacherAttendance(teacher.teacherId);
          const record = response.attendance.find((item) => item.attendance_date === attendanceDate);
          return {
            id: teacher.teacherId,
            backendId: teacher.teacherId,
            name: teacher.name,
            meta: `${teacher.subject} | ${teacher.employeeId}`,
            status: toUiStatus(record?.status),
            remarks: record?.remarks || '',
          };
        }),
      );
      setRows(loaded.map((item) => (item.status === 'fulfilled' ? item.value : {
        id: crypto.randomUUID(),
        name: 'Unable to load teacher',
        meta: 'API error',
        status: 'Present',
        remarks: '',
        disabled: true,
      })));
      showToast('Loaded teacher attendance register.');
    } catch (error: any) {
      showToast(error?.message || 'Unable to load teacher attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffRows = async () => {
    setIsLoading(true);
    try {
      const loaded = await Promise.allSettled(
        staff.map(async (staffMember) => {
          if (!staffMember.id) {
            return {
              id: staffMember.employeeId,
              name: staffMember.name,
              meta: `${staffMember.department} | Missing backend staff ID`,
              status: 'Present' as UiAttendanceStatus,
              remarks: '',
              disabled: true,
            };
          }
          const response = await getStaffAttendance(staffMember.id);
          const record = response.attendance.find((item) => item.attendance_date === attendanceDate);
          return {
            id: String(staffMember.id),
            backendId: staffMember.id,
            name: staffMember.name,
            meta: `${staffMember.department} | ${staffMember.designation}`,
            status: toUiStatus(record?.status),
            remarks: record?.remarks || '',
          };
        }),
      );
      setRows(loaded.map((item) => (item.status === 'fulfilled' ? item.value : {
        id: crypto.randomUUID(),
        name: 'Unable to load staff',
        meta: 'API error',
        status: 'Present',
        remarks: '',
        disabled: true,
      })));
      showToast('Loaded staff attendance register.');
    } catch (error: any) {
      showToast(error?.message || 'Unable to load staff attendance.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegister = () => {
    if (mode === 'students') {
      loadStudentRows();
      return;
    }
    if (mode === 'teachers') {
      void loadTeacherRows();
      return;
    }
    void loadStaffRows();
  };

  const saveStudentRows = async () => {
    if (!selectedClass) {
      showToast(`No backend class found for ${selectedClassName}-${selectedSection}.`);
      return;
    }

    const savedRecords = await Promise.all(
      rows.map(async (row) => {
        const student = students.find((item) => item.id === row.id);
        const response = await upsertStudentAttendance({
          student: row.id,
          attendance_date: attendanceDate,
          status: toApiStatus(row.status),
          remarks: row.remarks,
        });
        return {
          id: response.attendance.attendance_id,
          date: response.attendance.attendance_date,
          studentId: row.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : row.name,
          className: selectedClassName,
          section: selectedSection,
          status: row.status === 'Half Day' ? 'Leave' as const : row.status,
        };
      }),
    );

    setAttendance((prev) => {
      const studentIds = rows.map((row) => row.id);
      const filtered = prev.filter((item) => !(item.date === attendanceDate && studentIds.includes(item.studentId)));
      return [...filtered, ...savedRecords];
    });
  };

  const saveTeacherRows = async () => {
    await Promise.all(
      rows
        .filter((row) => row.backendId && !row.disabled)
        .map((row) =>
          upsertTeacherAttendance(String(row.backendId), {
            attendance_date: attendanceDate,
            status: toApiStatus(row.status),
            remarks: row.remarks,
          }),
        ),
    );
  };

  const saveStaffRows = async () => {
    await Promise.all(
      rows
        .filter((row) => row.backendId && !row.disabled)
        .map((row) =>
          upsertStaffAttendance(Number(row.backendId), {
            attendance_date: attendanceDate,
            status: toApiStatus(row.status),
            remarks: row.remarks,
          }),
        ),
    );
  };

  const saveRegister = async () => {
    if (rows.length === 0) {
      showToast('Load a register before saving attendance.');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'students') await saveStudentRows();
      if (mode === 'teachers') await saveTeacherRows();
      if (mode === 'staff') await saveStaffRows();
      showToast(`✓ ${mode} attendance saved for ${attendanceDate}.`);
    } catch (error: any) {
      showToast(error?.message || `Unable to save ${mode} attendance.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <span className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
          Daily Registers
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">Attendance Management</h1>
        <p className="text-slate-500 text-xs">Mark and update student, teacher, and staff attendance from one workspace.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'students', label: 'Students' },
              { id: 'teachers', label: 'Teachers' },
              { id: 'staff', label: 'Staff' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id as AttendanceMode);
                  setRows([]);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black border cursor-pointer ${
                  mode === item.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => {
                  setAttendanceDate(event.target.value);
                  setRows([]);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {mode === 'students' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Class</label>
                  <select
                    value={selectedClassName}
                    onChange={(event) => {
                      setSelectedClassName(event.target.value);
                      setRows([]);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
                  >
                    {uniqueClassNames.map((className) => <option key={className}>{className}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(event) => {
                      setSelectedSection(event.target.value);
                      setRows([]);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none"
                  >
                    {uniqueSections.map((section) => <option key={section}>{section}</option>)}
                  </select>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={loadRegister}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Search className="w-3.5 h-3.5" />
              {isLoading ? 'Loading...' : 'Load Register'}
            </button>
            <button
              type="button"
              onClick={saveRegister}
              disabled={isSaving || rows.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
              {mode} register
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono">
            <CalendarDays className="w-3.5 h-3.5" />
            {attendanceDate}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                <th className="p-3.5">Person</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-mono text-[11px]">
                    Load a register to start marking attendance.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{row.name}</div>
                      {row.disabled && <div className="text-[10px] text-red-500 font-bold mt-0.5">Cannot save until backend ID exists</div>}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{row.meta}</td>
                    <td className="p-3.5">
                      <select
                        value={row.status}
                        disabled={row.disabled}
                        onChange={(event) => updateRow(row.id, { status: event.target.value as UiAttendanceStatus })}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-black outline-none disabled:opacity-60 ${statusClass[row.status]}`}
                      >
                        {(['Present', 'Absent', 'Leave', 'Half Day'] as UiAttendanceStatus[]).map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <input
                        value={row.remarks}
                        disabled={row.disabled}
                        onChange={(event) => updateRow(row.id, { remarks: event.target.value })}
                        placeholder="Optional notes"
                        className="w-full min-w-[180px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
