import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  DollarSign,
  GraduationCap,
  LogOut,
  UserCheck2,
} from 'lucide-react';
import {
  UserAccount,
  SchoolStudent,
  SchoolExam,
  ExamResult,
  TimetablePeriod,
  toUnifiedUserProfile,
} from '../types';
import { TeacherPaymentRecord } from '../features/payments/types';
import { TeacherPaymentsTab } from '../features/teacher/components/TeacherPaymentsTab';
import { ProfileSummaryGrid } from '../features/profiles/components/ProfileSummaryGrid';
import {
  getExamTimetables,
  getStudentMarks,
  getTeacherSalaryPaymentsMe,
  upsertExamTimetableMark,
  type ExamTimetableApi,
  type StudentMarkApi,
  type TeacherSalaryPaymentApi,
} from '../lib/authApi';

interface TeacherPortalProps {
  currentUser: UserAccount;
  students: SchoolStudent[];
  exams: SchoolExam[];
  examResults: ExamResult[];
  timetable: TimetablePeriod[];
  teacherPayments: TeacherPaymentRecord[];
  onLogout: () => void;
  showToast: (msg: string) => void;
}

const mapTimetableToExam = (entry: ExamTimetableApi): SchoolExam => ({
  id: entry.timetable_id,
  examName: entry.exam_detail?.exam_name || 'Exam',
  subject: entry.subject_detail?.subject_name || entry.subject,
  className: entry.class_detail?.class_name || entry.school_class,
  date: entry.exam_date,
  maximumMarks: Number(entry.max_marks) || 100,
  room: entry.room_no,
});

const mapMarkToResult = (mark: StudentMarkApi): ExamResult => {
  const marks = Number(mark.marks_obtained) || 0;
  const maxMarks = Number(mark.timetable_detail?.max_marks) || 100;
  return {
    id: mark.mark_id,
    examId: mark.exam_timetable,
    studentId: mark.student,
    studentName: mark.student_detail ? `${mark.student_detail.first_name} ${mark.student_detail.last_name}`.trim() : 'Student',
    marksObtained: marks,
    remarks: mark.remarks || mark.grade || '',
    status: marks >= maxMarks * 0.4 ? 'Pass' : 'Fail',
  };
};

const mapTeacherPaymentFromApi = (payment: TeacherSalaryPaymentApi): TeacherPaymentRecord => ({
  id: payment.payment_id,
  teacherEmployeeId: payment.teacher,
  teacherName: '',
  amount: Number(payment.amount) || 0,
  paymentDate: payment.payment_date,
  month: payment.payment_date.slice(0, 7),
  method: payment.payment_method as TeacherPaymentRecord['method'],
  reference: payment.transaction_ref,
  notes: payment.notes,
});

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  students,
  exams,
  examResults: initialExamResults,
  timetable,
  teacherPayments,
  onLogout,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'Profile' | 'ExamTimetable' | 'Grading' | 'Payments'>('Profile');
  const [examResults, setExamResults] = useState<ExamResult[]>(initialExamResults);
  const [apiExams, setApiExams] = useState<SchoolExam[]>([]);
  const [apiPayments, setApiPayments] = useState<TeacherPaymentRecord[]>([]);

  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingComments, setGradingComments] = useState<Record<string, string>>({});

  const teacherDisplayName = currentUser.name.split(' (')[0];
  const surname = teacherDisplayName.split(' ').slice(-1)[0]?.toLowerCase() || '';
  const sourceExams = apiExams.length > 0 ? apiExams : exams;

  useEffect(() => {
    const loadTeacherPortalData = async () => {
      try {
        const [timetableResponse, marksResponse, paymentsResponse] = await Promise.allSettled([
          getExamTimetables(),
          getStudentMarks(),
          getTeacherSalaryPaymentsMe(),
        ]);
        if (timetableResponse.status === 'fulfilled') {
          const mappedExams = timetableResponse.value.exam_timetables.map(mapTimetableToExam);
          setApiExams(mappedExams);
          if (!selectedExamId && mappedExams[0]) setSelectedExamId(mappedExams[0].id);
        }
        if (marksResponse.status === 'fulfilled') {
          setExamResults(marksResponse.value.marks.map(mapMarkToResult));
        }
        if (paymentsResponse.status === 'fulfilled') {
          setApiPayments(paymentsResponse.value.salary_payments.map((payment) => ({
            ...mapTeacherPaymentFromApi(payment),
            teacherName: teacherDisplayName,
          })));
        }
      } catch (error: any) {
        showToast(error?.message || 'Unable to load teacher portal data.');
      }
    };

    void loadTeacherPortalData();
  }, [currentUser.id]);

  const activeTeachersLecture = timetable.filter(ti => {
    const tname = ti.teacherName.toLowerCase();
    return surname ? tname.includes(surname) : true;
  });

  const assignedClasses = Array.from(new Set(activeTeachersLecture.map(t => t.className)));
  const myStudents = students.filter(s => (assignedClasses.length > 0 ? assignedClasses.includes(s.className) : s.className === 'Class 10'));
  const myExamTimetable = sourceExams.filter(ex => apiExams.length > 0 || (assignedClasses.length > 0 ? assignedClasses.includes(ex.className) : ex.className === 'Class 10'));
  const myExamOptions = myExamTimetable.length > 0 ? myExamTimetable : sourceExams;
  const sourcePayments = apiPayments.length > 0 ? apiPayments : teacherPayments;
  const myPayments = sourcePayments
    .filter((p) => p.teacherName === teacherDisplayName)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  const teacherProfile = toUnifiedUserProfile(currentUser);

  const handleRegisterMarks = async (studentId: string, maxMarks: number) => {
    const rawScore = gradingScores[studentId];
    if (rawScore === undefined) {
      showToast('Please type a mark before registration.');
      return;
    }

    const score = Number(rawScore);
    if (score < 0 || score > maxMarks) {
      showToast(`Invalid Score. Maximum allowed is ${maxMarks}.`);
      return;
    }

    const comment = gradingComments[studentId] || 'Good attempt';
    try {
      const response = await upsertExamTimetableMark(selectedExamId, {
        student: studentId,
        marks_obtained: score,
        remarks: comment,
      });
      const updatedResult = mapMarkToResult(response.mark);
      setExamResults(prev => {
        const filtered = prev.filter(r => !(r.examId === selectedExamId && r.studentId === studentId));
        return [...filtered, updatedResult];
      });
      showToast(`✓ Registered marks score: ${score}/${maxMarks} with comments.`);
    } catch (error: any) {
      showToast(error?.message || 'Unable to save marks through API.');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col md:flex-row font-sans text-left">
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">EduCore Portal</h2>
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Teacher Console</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold font-mono uppercase tracking-wide">
            {[
              { id: 'Profile', label: 'Instructor Profile', icon: GraduationCap },
              { id: 'ExamTimetable', label: 'Exam Timetable', icon: CalendarDays },
              { id: 'Grading', label: 'Grading', icon: Award },
              { id: 'Payments', label: 'Payments', icon: DollarSign },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`w-full py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 border-t border-slate-800 pt-4">
          <div className="flex gap-2.5 items-center">
            <img referrerPolicy="no-referrer" src={currentUser.avatar} alt="Teacher" className="w-8 h-8 rounded-full border border-white/10" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-white truncate">{teacherDisplayName}</div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Instructor</span>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-1.5 bg-red-950/20 border border-red-500/10 text-red-400 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Close session
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded">Educator Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Hello, {teacherDisplayName}</h1>
          <p className="text-slate-500 text-xs text-slate-400">Manage profile, exam timetable, grading, and salary history</p>
        </div>

        {activeSubTab === 'Profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Assigned Periods</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{activeTeachersLecture.length}</div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Mapped Students</div>
                <div className="text-2xl font-extrabold text-indigo-600 mt-1">{myStudents.length}</div>
              </div>
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Assigned Classes</div>
                <div className="text-lg font-extrabold text-slate-900 mt-1">{assignedClasses.join(', ') || 'Class 10'}</div>
              </div>
            </div>

            <ProfileSummaryGrid
              title="Instructor Profile"
              profile={{ ...teacherProfile, name: teacherDisplayName }}
              extras={[
                { label: 'Role', value: currentUser.role },
                { label: 'Assigned Classes', value: assignedClasses.join(', ') || 'Class 10' },
              ]}
            />
          </div>
        )}

        {activeSubTab === 'ExamTimetable' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
            <h3 className="text-sm font-extrabold text-slate-950 uppercase font-mono tracking-wider border-b border-slate-100 pb-3">Exam Timetable</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border border-slate-100 rounded-xl">
                <thead>
                  <tr className="bg-slate-50/50 border-b text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">Exam</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Room</th>
                    <th className="p-3 text-right">Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {myExamTimetable.map(ex => (
                    <tr key={ex.id} className="border-b border-slate-100 hover:bg-slate-50/40">
                      <td className="p-3 font-mono">{ex.date}</td>
                      <td className="p-3 font-bold">{ex.examName}</td>
                      <td className="p-3">{ex.subject}</td>
                      <td className="p-3">{ex.className}</td>
                      <td className="p-3">{ex.room}</td>
                      <td className="p-3 text-right font-black text-indigo-600">{ex.maximumMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'Grading' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 uppercase font-mono tracking-wider">Exam Marks Sheet</h3>
                <span className="text-xs text-slate-400">Upload student marks to result sheets</span>
              </div>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs py-2 font-bold text-indigo-600"
              >
                {myExamOptions.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.subject} ({ex.className})</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border border-slate-100 rounded-xl">
                <thead>
                  <tr className="bg-slate-50/50 border-b text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Admission Code</th>
                    <th className="p-3 text-center">Current Score</th>
                    <th className="p-3">Enter Score</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudents.map(s => {
                    const matchedScore = examResults.find(r => r.studentId === s.id && r.examId === selectedExamId);
                    const selectedExam = sourceExams.find(ex => ex.id === selectedExamId);
                    const maxMarks = selectedExam?.maximumMarks || 100;

                    return (
                      <tr key={s.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-900">{s.firstName} {s.lastName}</td>
                        <td className="p-3 text-indigo-600 font-bold font-mono">{s.id}</td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600">{matchedScore ? `${matchedScore.marksObtained}/${maxMarks}` : '-'}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={gradingScores[s.id] ?? (matchedScore ? matchedScore.marksObtained : '')}
                            onChange={(e) => setGradingScores(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                            className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={gradingComments[s.id] ?? (matchedScore ? matchedScore.remarks : '')}
                            onChange={(e) => setGradingComments(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRegisterMarks(s.id, maxMarks)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                          >
                            <UserCheck2 className="w-3 h-3" /> Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'Payments' && (
          <TeacherPaymentsTab payments={myPayments} />
        )}
      </main>
    </div>
  );
};
