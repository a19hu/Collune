import { ClassFilter } from "@/src/HtmlComponents/HtmlSelect";
import {
    createExam,
    createExamTimetable,
    deleteExam,
    deleteExamTimetable,
    getClasses,
    getExamTimetableMarks,
    getExamTimetables,
    getExams,
    getStudents,
    getSubjects,
    getTeachers,
    upsertExamTimetableMark,
    type ClassApi,
    type ExamApi,
    type ExamTimetableApi,
    type StudentListApi,
    type StudentMarkApi,
    type SubjectApi,
    type TeacherApi,
} from "@/src/lib/authApi";
import { CalendarDays, ClipboardList, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type MarkDraft = {
    marks_obtained: string;
    grade: string;
    remarks: string;
};

const today = new Date().toISOString().slice(0, 10);
const currentAcademicYear = "2026-27";

const classToken = (schoolClass: ClassApi) => `${schoolClass.class_name}-${schoolClass.section}`;
const studentBelongsToClass = (student: StudentListApi, schoolClass: ClassApi) => {
    return [schoolClass.class_id, schoolClass.class_name, classToken(schoolClass)].includes(student.class_id);
};
const studentName = (student: StudentListApi) => `${student.first_name} ${student.last_name}`.trim() || student.admission_no;

const ExamTimeTable = () => {
    const [exams, setExams] = useState<ExamApi[]>([]);
    const [timetables, setTimetables] = useState<ExamTimetableApi[]>([]);
    const [classes, setClasses] = useState<ClassApi[]>([]);
    const [subjects, setSubjects] = useState<SubjectApi[]>([]);
    const [teachers, setTeachers] = useState<TeacherApi[]>([]);
    const [students, setStudents] = useState<StudentListApi[]>([]);
    const [selectedTimetableId, setSelectedTimetableId] = useState("");
    const [marks, setMarks] = useState<StudentMarkApi[]>([]);
    const [markDrafts, setMarkDrafts] = useState<Record<string, MarkDraft>>({});
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingExam, setIsSavingExam] = useState(false);
    const [isSavingTimetable, setIsSavingTimetable] = useState(false);
    const [isSavingMarks, setIsSavingMarks] = useState(false);

    const [examName, setExamName] = useState("");
    const [academicYear, setAcademicYear] = useState(currentAcademicYear);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [timetableExam, setTimetableExam] = useState("");
    const [timetableClass, setTimetableClass] = useState("");
    const [timetableSubject, setTimetableSubject] = useState("");
    const [timetableTeacher, setTimetableTeacher] = useState("");
    const [examDate, setExamDate] = useState(today);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("12:00");
    const [maxMarks, setMaxMarks] = useState("100");
    const [passingMarks, setPassingMarks] = useState("35");
    const [roomNo, setRoomNo] = useState("");
    const [instructions, setInstructions] = useState("");

    const selectedTimetable = useMemo(
        () => timetables.find((entry) => entry.timetable_id === selectedTimetableId) || null,
        [selectedTimetableId, timetables],
    );
    const selectedClass = useMemo(
        () => classes.find((schoolClass) => schoolClass.class_id === selectedTimetable?.school_class) || null,
        [classes, selectedTimetable],
    );
    const timetableStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students
            .filter((student) => studentBelongsToClass(student, selectedClass))
            .sort((a, b) => a.roll_no.localeCompare(b.roll_no));
    }, [selectedClass, students]);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [examRes, timetableRes, classRes, subjectRes, teacherRes, studentRes] = await Promise.all([
                getExams(),
                getExamTimetables(),
                getClasses(),
                getSubjects(),
                getTeachers(),
                getStudents(),
            ]);
            setExams(examRes.exams);
            setTimetables(timetableRes.exam_timetables);
            setClasses(classRes.classes);
            setSubjects(subjectRes.subjects);
            setTeachers(teacherRes.teachers);
            setStudents(studentRes.students);
            setTimetableExam((current) => current || examRes.exams[0]?.exam_id || "");
            setTimetableSubject((current) => current || subjectRes.subjects[0]?.subject_id || "");
            setTimetableTeacher((current) => current || teacherRes.teachers[0]?.teacher_id || "");
            setSelectedTimetableId((current) => current || timetableRes.exam_timetables[0]?.timetable_id || "");
        } catch (error: any) {
            setMessage(error?.message || "Unable to load exam data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadAll();
    }, []);

    useEffect(() => {
        if (!selectedTimetableId) {
            setMarks([]);
            setMarkDrafts({});
            return;
        }

        let isMounted = true;
        getExamTimetableMarks(selectedTimetableId)
            .then((response) => {
                if (!isMounted) return;
                setMarks(response.marks);
                const nextDrafts: Record<string, MarkDraft> = {};
                response.marks.forEach((mark) => {
                    nextDrafts[mark.student] = {
                        marks_obtained: mark.marks_obtained,
                        grade: mark.grade || "",
                        remarks: mark.remarks || "",
                    };
                });
                setMarkDrafts(nextDrafts);
            })
            .catch((error: any) => setMessage(error?.message || "Unable to load marks."));

        return () => {
            isMounted = false;
        };
    }, [selectedTimetableId]);

    const saveExam = async (event: FormEvent) => {
        event.preventDefault();
        setIsSavingExam(true);
        setMessage("");
        try {
            const response = await createExam({
                exam_name: examName,
                academic_year: academicYear,
                start_date: startDate,
                end_date: endDate,
                status: "SCHEDULED",
            });
            setExams((current) => [response.exam, ...current]);
            setTimetableExam(response.exam.exam_id);
            setExamName("");
            setMessage("Exam created.");
        } catch (error: any) {
            setMessage(error?.message || "Unable to create exam.");
        } finally {
            setIsSavingExam(false);
        }
    };

    const saveTimetable = async (event: FormEvent) => {
        event.preventDefault();
        setIsSavingTimetable(true);
        setMessage("");
        console.log('this is class',timetableClass)
        try {
            const response = await createExamTimetable({
                exam: timetableExam,
                school_class: timetableClass,
                subject: timetableSubject,
                teacher: timetableTeacher || null,
                exam_date: examDate,
                start_time: startTime,
                end_time: endTime,
                max_marks: maxMarks,
                passing_marks: passingMarks,
                room_no: roomNo,
                instructions,
            });
            setTimetables((current) => [...current, response.exam_timetable]);
            setSelectedTimetableId(response.exam_timetable.timetable_id);
            setMessage("Exam timetable entry created.");
        } catch (error: any) {
            setMessage(error?.message || "Unable to create timetable entry.");
        } finally {
            setIsSavingTimetable(false);
        }
    };

    const removeTimetable = async (timetableId: string) => {
        try {
            await deleteExamTimetable(timetableId);
            setTimetables((current) => current.filter((entry) => entry.timetable_id !== timetableId));
            if (selectedTimetableId === timetableId) setSelectedTimetableId("");
            setMessage("Timetable entry deleted.");
        } catch (error: any) {
            setMessage(error?.message || "Unable to delete timetable entry.");
        }
    };

    const removeExam = async (examId: string) => {
        try {
            await deleteExam(examId);
            setExams((current) => current.filter((exam) => exam.exam_id !== examId));
            setMessage("Exam deleted.");
        } catch (error: any) {
            setMessage(error?.message || "Unable to delete exam.");
        }
    };

    const updateMarkDraft = (studentId: string, patch: Partial<MarkDraft>) => {
        setMarkDrafts((current) => ({
            ...current,
            [studentId]: {
                marks_obtained: current[studentId]?.marks_obtained || "",
                grade: current[studentId]?.grade || "",
                remarks: current[studentId]?.remarks || "",
                ...patch,
            },
        }));
    };

    const saveMarks = async () => {
        if (!selectedTimetable) {
            setMessage("Select a timetable entry before saving marks.");
            return;
        }

        setIsSavingMarks(true);
        setMessage("");
        try {
            const saved = await Promise.all(
                timetableStudents
                    .filter((student) => markDrafts[student.user]?.marks_obtained)
                    .map((student) => {
                        const draft = markDrafts[student.user];
                        return upsertExamTimetableMark(selectedTimetable.timetable_id, {
                            student: student.user,
                            marks_obtained: draft.marks_obtained,
                            grade: draft.grade,
                            remarks: draft.remarks,
                        });
                    }),
            );
            setMarks(saved.map((item) => item.mark));
            setMessage("Marks saved.");
        } catch (error: any) {
            setMessage(error?.message || "Unable to save marks.");
        } finally {
            setIsSavingMarks(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examination Hub</h1>
                <p className="text-slate-500 text-xs">Create exams, schedule timetable entries, and enter student marks.</p>
            </div>

            {message && <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700">{message}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <form onSubmit={saveExam} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <SectionTitle icon={<ClipboardList className="w-4 h-4" />} title="Create Exam" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Exam Name" value={examName} onChange={setExamName} required />
                        <Input label="Academic Year" value={academicYear} onChange={setAcademicYear} required />
                        <Input label="Start Date" type="date" value={startDate} onChange={setStartDate} />
                        <Input label="End Date" type="date" value={endDate} onChange={setEndDate} />
                    </div>
                    <button disabled={isSavingExam} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white disabled:opacity-60">
                        {isSavingExam ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Save Exam
                    </button>
                </form>

                <form onSubmit={saveTimetable} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <SectionTitle icon={<CalendarDays className="w-4 h-4" />} title="Schedule Timetable" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select label="Exam" value={timetableExam} onChange={setTimetableExam} options={exams.map((exam) => ({ label: exam.exam_name, value: exam.exam_id }))} />
                        <ClassFilter
                            value={timetableClass}
                            onChange={(e) => setTimetableClass(e.target.value)}
                            id="filter-students-class"
                            selectClassName="w-full min-w-44 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold outline-none disabled:opacity-60"
                            label="Class"
                        />
                        <Select label="Subject" value={timetableSubject} onChange={setTimetableSubject} options={subjects.map((item) => ({ label: item.subject_name, value: item.subject_id }))} />
                        <Input label="Exam Date" type="date" value={examDate} onChange={setExamDate} />
                        <Input label="Room" value={roomNo} onChange={setRoomNo} />
                        <Input label="Start Time" type="time" value={startTime} onChange={setStartTime} />
                        <Input label="End Time" type="time" value={endTime} onChange={setEndTime} />
                        <Input label="Max Marks" type="number" value={maxMarks} onChange={setMaxMarks} />
                        <Input label="Passing Marks" type="number" value={passingMarks} onChange={setPassingMarks} />
                        <label className="space-y-1 md:col-span-2">
                            <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">Instructions</span>
                            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </label>
                    </div>
                    <button disabled={isSavingTimetable || !timetableExam || !timetableClass || !timetableSubject} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-xs font-bold text-white disabled:opacity-60">
                        {isSavingTimetable ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Save Timetable
                    </button>
                </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <SectionTitle icon={<CalendarDays className="w-4 h-4" />} title="Timetable Entries" />
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold text-slate-700">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                <th className="p-4">Exam</th>
                                <th className="p-4">Class</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timetables.length === 0 ? (
                                <tr><td colSpan={6} className="p-5 text-center text-slate-400">No exam timetable entries found.</td></tr>
                            ) : timetables.map((entry) => (
                                <tr key={entry.timetable_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-900">{entry.exam_detail?.exam_name || entry.exam}</td>
                                    <td className="p-4">{entry.class_detail ? classToken(entry.class_detail) : entry.school_class}</td>
                                    <td className="p-4">{entry.subject_detail?.subject_name || entry.subject}</td>
                                    <td className="p-4 font-mono">{entry.exam_date}</td>
                                    <td className="p-4 font-mono">{entry.start_time} - {entry.end_time}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setSelectedTimetableId(entry.timetable_id)} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold mr-2">Marks</button>
                                        <button onClick={() => void removeTimetable(entry.timetable_id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100">
                        <SectionTitle icon={<ClipboardList className="w-4 h-4" />} title="Exam List" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {exams.length === 0 ? <div className="p-4 text-xs text-slate-400">No exams found.</div> : exams.map((exam) => (
                            <div key={exam.exam_id} className="p-4 flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-black text-slate-900">{exam.exam_name}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{exam.academic_year} | {exam.status}</div>
                                </div>
                                <button onClick={() => void removeExam(exam.exam_id)} className="p-2 rounded-lg bg-rose-50 text-rose-700">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <SectionTitle icon={<Save className="w-4 h-4" />} title="Marks Entry" />
                        <button onClick={saveMarks} disabled={!selectedTimetable || isSavingMarks} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white disabled:opacity-60">
                            {isSavingMarks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Marks
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-semibold text-slate-700">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-mono text-[9px]">
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Roll</th>
                                    <th className="p-4">Marks</th>
                                    <th className="p-4">Grade</th>
                                    <th className="p-4">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!selectedTimetable ? (
                                    <tr><td colSpan={5} className="p-5 text-center text-slate-400">Select a timetable entry to enter marks.</td></tr>
                                ) : timetableStudents.length === 0 ? (
                                    <tr><td colSpan={5} className="p-5 text-center text-slate-400">No students found for this class.</td></tr>
                                ) : timetableStudents.map((student) => {
                                    const draft = markDrafts[student.user] || { marks_obtained: "", grade: "", remarks: "" };
                                    const existing = marks.find((mark) => mark.student === student.user);
                                    return (
                                        <tr key={student.user} className="border-b border-slate-100">
                                            <td className="p-4 font-bold text-slate-900">{studentName(student)} {existing && <span className="ml-2 text-[9px] text-emerald-600">Saved</span>}</td>
                                            <td className="p-4 font-mono">{student.roll_no || "N/A"}</td>
                                            <td className="p-4"><input type="number" min="0" max={selectedTimetable.max_marks} value={draft.marks_obtained} onChange={(event) => updateMarkDraft(student.user, { marks_obtained: event.target.value })} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></td>
                                            <td className="p-4"><input value={draft.grade} onChange={(event) => updateMarkDraft(student.user, { grade: event.target.value })} className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></td>
                                            <td className="p-4"><input value={draft.remarks} onChange={(event) => updateMarkDraft(student.user, { remarks: event.target.value })} className="w-full min-w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs" /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 font-mono">
        <span className="text-indigo-600">{icon}</span>
        {title}
    </div>
);

const Input = ({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) => (
    <label className="space-y-1">
        <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
        <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
    </label>
);

const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) => (
    <label className="space-y-1">
        <span className="text-[10px] font-extrabold text-slate-500 block font-mono uppercase">{label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {options.length === 0 ? <option value="">No options</option> : options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
    </label>
);

export default ExamTimeTable;
