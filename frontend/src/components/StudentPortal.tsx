import React, { useEffect, useState } from 'react';
import {
  Award,
  FileText,
  LogOut,
  Receipt,
  UserCircle2,
} from 'lucide-react';
import {
  UserAccount,
  ExamResult,
  SchoolExam,
  SchoolStudent,
  StudentFeeBill,
  toUnifiedStudentProfile,
  toUnifiedUserProfile,
} from '../types';
import { ProfileSummaryGrid } from '../features/profiles/components/ProfileSummaryGrid';
import {
  getExamTimetables,
  getStudentFeeStructureMe,
  getStudentMarks,
  getStudentProfileMe,
  type ExamTimetableApi,
  type StudentApi,
  type StudentFeeAccountApi,
  type StudentMarkApi,
} from '../lib/authApi';

interface StudentPortalProps {
  currentUser: UserAccount;
  students: SchoolStudent[];
  fees: StudentFeeBill[];
  exams: SchoolExam[];
  examResults: ExamResult[];
  onLogout: () => void;
  showToast: (msg: string) => void;
}

const toFrontendGender = (gender: StudentApi['gender']): SchoolStudent['gender'] => {
  if (gender === 'FEMALE') return 'Female';
  if (gender === 'OTHER') return 'Other';
  return 'Male';
};

const mapStudentProfileFromApi = (student: StudentApi): SchoolStudent => {
  const address = student.address;
  const enrollment = student.enrollments?.[0];
  const father = student.guardians?.find((guardian) => guardian.relation.toLowerCase() === 'father');
  const mother = student.guardians?.find((guardian) => guardian.relation.toLowerCase() === 'mother');
  return {
    id: student.user.user_id,
    studentUserId: student.user.user_id,
    firstName: student.first_name,
    lastName: student.last_name,
    email: student.email || student.user.email,
    phoneNo: student.phone_no || student.user.phone_no || '',
    gender: toFrontendGender(student.gender),
    dob: student.dob || '',
    bloodGroup: student.blood_group,
    nationality: student.nationality,
    religion: student.religion,
    category: student.category,
    admissionNo: student.admission_no,
    admissionDate: student.admission?.admission_date || '',
    className: student.class_id,
    classId: student.class_id,
    section: enrollment?.section_id || '',
    rollNo: Number.parseInt(student.roll_no, 10) || 0,
    rollNoText: student.roll_no,
    status: student.user.is_active ? 'Active' : 'Suspended',
    fatherName: father?.name || '',
    motherName: mother?.name || '',
    parentPhone: father?.phone_no || mother?.phone_no || student.phone_no || '',
    address: [address?.address_line1, address?.address_line2].filter(Boolean).join(', '),
    city: address?.city || '',
    state: address?.state || '',
    country: address?.country || '',
    pincode: address?.pincode || '',
    allergies: student.category || '',
    medicalNotes: student.admission?.remarks || '',
  };
};

const mapFeeAccountToBills = (account: StudentFeeAccountApi | null, student: SchoolStudent | null): StudentFeeBill[] => {
  if (!account || !student) return [];
  const bills: StudentFeeBill[] = [{
    id: account.fee_account_id,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    className: student.className,
    feeType: 'Tuition Fee',
    amount: Number(account.total_due) || 0,
    dueDate: account.academic_year,
    status: Number(account.balance) <= 0 ? 'Paid' : Number(account.total_paid) > 0 ? 'Pending' : 'Overdue',
    paidDate: account.payments[0]?.payment_date,
    paymentMethod: account.payments[0]?.payment_mode as StudentFeeBill['paymentMethod'],
    receiptNo: account.payments[0]?.transaction_ref,
  }];
  return bills;
};

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

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  students,
  fees,
  exams,
  examResults,
  onLogout,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'Profile' | 'Grades' | 'Fees' | 'ExamTimetable'>('Profile');
  const [apiProfile, setApiProfile] = useState<SchoolStudent | null>(null);
  const [apiFees, setApiFees] = useState<StudentFeeBill[]>([]);
  const [apiExams, setApiExams] = useState<SchoolExam[]>([]);
  const [apiExamResults, setApiExamResults] = useState<ExamResult[]>([]);

  useEffect(() => {
    const loadStudentPortalData = async () => {
      try {
        const [profileResponse, feeResponse, timetableResponse, marksResponse] = await Promise.allSettled([
          getStudentProfileMe(),
          getStudentFeeStructureMe(),
          getExamTimetables(),
          getStudentMarks(),
        ]);
        const mappedProfile =
          profileResponse.status === 'fulfilled' ? mapStudentProfileFromApi(profileResponse.value.student) : null;
        if (mappedProfile) setApiProfile(mappedProfile);
        if (feeResponse.status === 'fulfilled') {
          setApiFees(mapFeeAccountToBills(feeResponse.value.fee_account, mappedProfile));
        }
        if (timetableResponse.status === 'fulfilled') {
          setApiExams(timetableResponse.value.exam_timetables.map(mapTimetableToExam));
        }
        if (marksResponse.status === 'fulfilled') {
          setApiExamResults(marksResponse.value.marks.map(mapMarkToResult));
        }
      } catch (error: any) {
        showToast(error?.message || 'Unable to load student portal data.');
      }
    };

    void loadStudentPortalData();
  }, [currentUser.id]);

  const derivedStudentId = currentUser.details?.startsWith('STU-') ? currentUser.details : 'STU-1001';
  const myProfile = apiProfile || students.find(s => s.id === derivedStudentId) || students[0];
  const studentId = myProfile?.id || 'STU-1001';

  const sourceFees = apiFees.length > 0 ? apiFees : fees;
  const sourceGrades = apiExamResults.length > 0 ? apiExamResults : examResults;
  const sourceExams = apiExams.length > 0 ? apiExams : exams;
  const myFees = sourceFees.filter(f => f.studentId === studentId);
  const myGrades = sourceGrades.filter(r => r.studentId === studentId);
  const myExamTimetable = sourceExams.filter(e => e.className === (myProfile?.className || 'Class 10') || apiExams.length > 0);
  const studentProfile = myProfile ? toUnifiedStudentProfile(myProfile) : toUnifiedUserProfile(currentUser);

  const totalFees = myFees.reduce((sum, bill) => sum + bill.amount, 0);
  const paidFees = myFees.filter(f => f.status === 'Paid').reduce((sum, bill) => sum + bill.amount, 0);
  const dueFees = totalFees - paidFees;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col md:flex-row font-sans text-left">
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 p-5 flex flex-col justify-between md:sticky md:top-0 md:h-screen">
        <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight">EduCore Desk</h2>
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Student Portal</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold font-mono uppercase tracking-wide">
            {[
              { id: 'Profile', label: 'Student Profile', icon: UserCircle2 },
              { id: 'Grades', label: 'Grades History', icon: Award },
              { id: 'Fees', label: 'Fee Structure', icon: Receipt },
              { id: 'ExamTimetable', label: 'Exam Timetable', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full py-2.5 px-3.5 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            <img referrerPolicy="no-referrer" src={currentUser.avatar} alt="Student" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-white truncate">{myProfile ? `${myProfile.firstName} ${myProfile.lastName}` : currentUser.name}</div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">{myProfile ? `${myProfile.className}-${myProfile.section}` : 'Class'} • {studentId}</span>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-1.5 bg-red-950/20 border border-red-500/10 text-red-400 rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Close Session
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 font-mono tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded">Student Workspace</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">{myProfile ? `${myProfile.firstName} ${myProfile.lastName}` : 'Student Dashboard'}</h1>
          <p className="text-slate-400 text-xs">{myProfile ? `${myProfile.className} Division ${myProfile.section} • Admission ${myProfile.admissionNo}` : 'Student panel'}</p>
        </div>

        {activeTab === 'Profile' && myProfile && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Student Profile</h3>
            <ProfileSummaryGrid
              title="Core Profile"
              profile={{ ...studentProfile, schoolCode: currentUser.schoolCode }}
              extras={[
                { label: 'Admission No', value: myProfile.admissionNo },
                { label: 'Class / Section', value: `${myProfile.className} - ${myProfile.section}` },
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div><span className="text-slate-400">Full Name</span><div className="font-bold text-slate-900">{myProfile.firstName} {myProfile.lastName}</div></div>
              <div><span className="text-slate-400">Admission No</span><div className="font-bold text-indigo-600">{myProfile.admissionNo}</div></div>
              <div><span className="text-slate-400">Class / Section</span><div className="font-bold">{myProfile.className} - {myProfile.section}</div></div>
              <div><span className="text-slate-400">Roll No</span><div className="font-bold">{myProfile.rollNo}</div></div>
              <div><span className="text-slate-400">DOB</span><div className="font-bold">{myProfile.dob}</div></div>
              <div><span className="text-slate-400">Blood Group</span><div className="font-bold">{myProfile.bloodGroup}</div></div>
              <div><span className="text-slate-400">Father Name</span><div className="font-bold">{myProfile.fatherName}</div></div>
              <div><span className="text-slate-400">Mother Name</span><div className="font-bold">{myProfile.motherName}</div></div>
              <div><span className="text-slate-400">Parent Phone</span><div className="font-bold">{myProfile.parentPhone}</div></div>
              <div className="md:col-span-3"><span className="text-slate-400">Address</span><div className="font-bold">{myProfile.address}, {myProfile.city}, {myProfile.state} - {myProfile.pincode}</div></div>
            </div>
          </div>
        )}

        {activeTab === 'Grades' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3">Grades History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">Exam</th><th className="p-3">Subject</th><th className="p-3">Marks</th><th className="p-3">Status</th><th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {myGrades.map(g => {
                    const exam = sourceExams.find(e => e.id === g.examId);
                    return (
                      <tr key={g.id} className="border-b border-slate-100">
                        <td className="p-3 font-bold">{exam?.examName || 'Exam'}</td>
                        <td className="p-3">{exam?.subject || '-'}</td>
                        <td className="p-3 font-black text-indigo-600">{g.marksObtained}/{exam?.maximumMarks || 100}</td>
                        <td className="p-3">{g.status}</td>
                        <td className="p-3 text-slate-500">{g.remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Fees' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">Fee Structure & Payment History</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3"><div className="text-slate-400">Total Fee</div><div className="text-xl font-black text-slate-900">${totalFees}</div></div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><div className="text-emerald-700">Total Paid</div><div className="text-xl font-black text-emerald-600">${paidFees}</div></div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3"><div className="text-rose-700">Outstanding</div><div className="text-xl font-black text-rose-500">${dueFees}</div></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">Fee Type</th><th className="p-3">Amount</th><th className="p-3">Due Date</th><th className="p-3">Status</th><th className="p-3">Paid Date</th><th className="p-3">Method</th><th className="p-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {myFees.map(f => (
                    <tr key={f.id} className="border-b border-slate-100">
                      <td className="p-3 font-bold">{f.feeType}</td>
                      <td className="p-3 font-black text-indigo-600">${f.amount}</td>
                      <td className="p-3">{f.dueDate}</td>
                      <td className="p-3">{f.status}</td>
                      <td className="p-3">{f.paidDate || '-'}</td>
                      <td className="p-3">{f.paymentMethod || '-'}</td>
                      <td className="p-3 font-mono">{f.receiptNo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ExamTimetable' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3">Exam Timetable</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">Date</th><th className="p-3">Exam</th><th className="p-3">Subject</th><th className="p-3">Class</th><th className="p-3">Max Marks</th><th className="p-3">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {myExamTimetable.map(ex => (
                    <tr key={ex.id} className="border-b border-slate-100">
                      <td className="p-3 font-mono">{ex.date}</td><td className="p-3 font-bold">{ex.examName}</td><td className="p-3">{ex.subject}</td><td className="p-3">{ex.className}</td><td className="p-3">{ex.maximumMarks}</td><td className="p-3">{ex.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
