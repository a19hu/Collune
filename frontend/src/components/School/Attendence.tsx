import HtmlInput from "@/src/HtmlComponents/HtmlInput";
import { ClassFilter } from "@/src/HtmlComponents/HtmlSelect";
import {
    getClasses,
    getStaff,
    getStaffAttendance,
    getStudentAttendances,
    getStudents,
    getTeacherAttendance,
    getTeachers,
    upsertStaffAttendance,
    upsertStudentAttendance,
    upsertTeacherAttendance,
    type AttendanceStatusApi,
    type ClassApi,
    type StaffApi,
    type StudentListApi,
    type TeacherApi,
} from "@/src/lib/authApi";
import { CalendarDays, CheckCircle2, Loader2, Save, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type AttendanceMode = "students" | "teachers" | "staff";
type AttendanceRow = {
    id: string;
    backendId: string | number;
    name: string;
    meta: string;
    status: AttendanceStatusApi;
    remarks: string;
};

const today = new Date().toISOString().slice(0, 10);
const statuses: AttendanceStatusApi[] = ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"];

const statusClass: Record<AttendanceStatusApi, string> = {
    PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ABSENT: "bg-red-50 text-red-700 border-red-100",
    LEAVE: "bg-amber-50 text-amber-700 border-amber-100",
    HALF_DAY: "bg-cyan-50 text-cyan-700 border-cyan-100",
};

const modeLabels: Record<AttendanceMode, string> = {
    students: "Students",
    teachers: "Teachers",
    staff: "Staff",
};

const getStudentName = (student: StudentListApi) => `${student.first_name} ${student.last_name}`.trim() || student.admission_no;
const classToken = (schoolClass: ClassApi) => `${schoolClass.class_name}-${schoolClass.section}`;
const studentBelongsToClass = (schoolClass: ClassApi, student: StudentListApi) => {
    return [schoolClass.class_id, schoolClass.class_name, classToken(schoolClass)].includes(student.class_id);
};

const Attendence = () => {
    const params = useParams();
    const initialMode = ["students", "teachers", "staff"].includes(String(params.type)) ? params.type as AttendanceMode : "students";
    const [mode, setMode] = useState<AttendanceMode>(initialMode);
    const [attendanceDate, setAttendanceDate] = useState(today);
    const [classes, setClasses] = useState<ClassApi[]>([]);
    const [students, setStudents] = useState<StudentListApi[]>([]);
    const [teachers, setTeachers] = useState<TeacherApi[]>([]);
    const [staff, setStaff] = useState<StaffApi[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [rows, setRows] = useState<AttendanceRow[]>([]);
    const [message, setMessage] = useState("");
    const [isBootLoading, setIsBootLoading] = useState(true);
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadBaseData = async () => {
            try {
                const [classResponse, studentResponse, teacherResponse, staffResponse] = await Promise.all([
                    getClasses(),
                    getStudents(),
                    getTeachers(),
                    getStaff(),
                ]);
                if (!isMounted) return;
                setClasses(classResponse.classes);
                setStudents(studentResponse.students);
                setTeachers(teacherResponse.teachers);
                setStaff(staffResponse.staff);
            } catch (error: any) {
                if (isMounted) setMessage(error?.message || "Unable to load attendance data.");
            } finally {
                if (isMounted) setIsBootLoading(false);
            }
        };

        void loadBaseData();
        return () => {
            isMounted = false;
        };

    }, []);

    const selectedClass = useMemo(
        () => classes.find((schoolClass) => schoolClass.class_id === selectedClassId) || null,
        [classes, selectedClassId],
    );

    const visibleStudents = useMemo(() => {
        if (!selectedClass) {
            return [...students].sort((a, b) => a.roll_no.localeCompare(b.roll_no));
        }
        const allowedClassIds = new Set([selectedClass.class_id, selectedClass.class_name, classToken(selectedClass)]);
        return students
            .filter((student) => allowedClassIds.has(student.class_id))
            .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
    }, [selectedClass, students]);

    const updateRow = (rowId: string, patch: Partial<AttendanceRow>) => {
        setRows((currentRows) => currentRows.map((row) => row.id === rowId ? { ...row, ...patch } : row));
    };

    const changeMode = (nextMode: AttendanceMode) => {
        setMode(nextMode);
        setRows([]);
        setMessage("");
    };

    useEffect(() => {
        if (selectedClassId && !classes.some((schoolClass) => schoolClass.class_id === selectedClassId)) {
            setSelectedClassId("");
            setRows([]);
        }
    }, [classes, selectedClassId]);

    const loadStudentRegister = async () => {
        const response = await getStudentAttendances();
        const attendanceForDate = response.attendance.filter((item) => item.attendance_date === attendanceDate);
        setRows(visibleStudents.map((student) => {
            const record = attendanceForDate.find((item) => item.student === student.user);
            const studentClass = classes.find((schoolClass) => studentBelongsToClass(schoolClass, student));
            return {
                id: student.user,
                backendId: student.user,
                name: getStudentName(student),
                meta: `${studentClass ? classToken(studentClass) : student.class_id || "Class N/A"} | Roll ${student.roll_no || "N/A"} | ${student.admission_no}`,
                status: record?.status || "PRESENT",
                remarks: record?.remarks || "",
            };
        }));
        setMessage(visibleStudents.length ? "Student register loaded." : "No students found.");
    };

    const loadTeacherRegister = async () => {
        const loadedRows = await Promise.all(teachers.map(async (teacher) => {
            const response = await getTeacherAttendance(teacher.teacher_id);
            const record = response.attendance.find((item) => item.attendance_date === attendanceDate);
            return {
                id: teacher.teacher_id,
                backendId: teacher.teacher_id,
                name: teacher.user.name || teacher.user.username,
                meta: `${teacher.employee_id} | ${teacher.specialization || teacher.qualification || "Instructor"}`,
                status: record?.status || "PRESENT",
                remarks: record?.remarks || "",
            };
        }));
        setRows(loadedRows);
        setMessage(loadedRows.length ? "Teacher register loaded." : "No teachers found.");
    };

    const loadStaffRegister = async () => {
        const loadedRows = await Promise.all(staff.map(async (staffMember) => {
            const response = await getStaffAttendance(staffMember.id);
            const record = response.attendance.find((item) => item.attendance_date === attendanceDate);
            return {
                id: String(staffMember.id),
                backendId: staffMember.id,
                name: staffMember.user.name || staffMember.user.username,
                meta: `${staffMember.employee_id} | ${staffMember.department || "Staff"} | ${staffMember.designation || "General"}`,
                status: record?.status || "PRESENT",
                remarks: record?.remarks || "",
            };
        }));
        setRows(loadedRows);
        setMessage(loadedRows.length ? "Staff register loaded." : "No staff members found.");
    };

    const loadRegister = async () => {
        setIsRegisterLoading(true);
        setMessage("");
        try {
            if (mode === "students") await loadStudentRegister();
            if (mode === "teachers") await loadTeacherRegister();
            if (mode === "staff") await loadStaffRegister();
        } catch (error: any) {
            setMessage(error?.message || "Unable to load attendance register.");
        } finally {
            setIsRegisterLoading(false);
        }
    };

    const saveRegister = async () => {
        if (!rows.length) {
            setMessage("Load a register before saving attendance.");
            return;
        }
        setIsSaving(true);
        setMessage("");
        try {
            if (mode === "students") {
                await Promise.all(rows.map((row) => upsertStudentAttendance({
                    student: String(row.backendId),
                    attendance_date: attendanceDate,
                    status: row.status,
                    remarks: row.remarks,
                })));
            }
            if (mode === "teachers") {
                await Promise.all(rows.map((row) => upsertTeacherAttendance(String(row.backendId), {
                    attendance_date: attendanceDate,
                    status: row.status,
                    remarks: row.remarks,
                })));
            }
            if (mode === "staff") {
                await Promise.all(rows.map((row) => upsertStaffAttendance(Number(row.backendId), {
                    attendance_date: attendanceDate,
                    status: row.status,
                    remarks: row.remarks,
                })));
            }
            setMessage(`${modeLabels[mode]} attendance saved for ${attendanceDate}.`);
        } catch (error: any) {
            setMessage(error?.message || `Unable to save ${modeLabels[mode].toLowerCase()} attendance.`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Management</h1>
                <p className="text-slate-500 text-xs">Mark and update student, teacher, and staff daily attendance.</p>
            </div>

            {message && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">
                    {message}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(modeLabels) as AttendanceMode[]).map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => changeMode(item)}
                                className={`px-4 py-2 rounded-xl text-xs font-black border ${mode === item ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                {modeLabels[item]}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-3 items-end">
                        <HtmlInput
                            divClass='space-y-1'
                            labelClass="space-y-1 block"
                            inputClass="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                            label='Date'
                            value={attendanceDate}
                            onChange={(e) => {
                                setAttendanceDate(e.target.value);
                                setRows([]);
                            }}
                            type='date'
                        />

                        {mode === "students" && (
                            <ClassFilter
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                id="filter-students-class"
                                selectClassName="w-full min-w-44 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none disabled:opacity-60"
                                label="Class"
                            />
                        )}

                        <button
                            type="button"
                            onClick={loadRegister}
                            disabled={isBootLoading || isRegisterLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black disabled:opacity-60"
                        >
                            {isRegisterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                            {isRegisterLoading ? "Loading..." : "Load Register"}
                        </button>
                        <button
                            type="button"
                            onClick={saveRegister}
                            disabled={isSaving || rows.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black disabled:opacity-60"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {isSaving ? "Saving..." : "Save Attendance"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
                            {modeLabels[mode]} Register
                        </h2>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 font-mono">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {attendanceDate}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                <th className="p-4">Name</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isBootLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading attendance setup...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Load a register to start marking attendance.</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                    <td className="p-4 font-extrabold text-slate-900">{row.name}</td>
                                    <td className="p-4 font-mono text-[11px] text-slate-500">{row.meta}</td>
                                    <td className="p-4">
                                        <select
                                            value={row.status}
                                            onChange={(event) => updateRow(row.id, { status: event.target.value as AttendanceStatusApi })}
                                            className={`px-3 py-1.5 rounded-xl border text-xs font-black outline-none ${statusClass[row.status]}`}
                                        >
                                            {statuses.map((status) => (
                                                <option key={status} value={status}>{status.replace("_", " ")}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            value={row.remarks}
                                            onChange={(event) => updateRow(row.id, { remarks: event.target.value })}
                                            placeholder="Optional notes"
                                            className="w-full min-w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {rows.length > 0 && (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {rows.length} {modeLabels[mode].toLowerCase()} ready to save.
                </div>
            )}
        </div>
    );
};


export default Attendence;
