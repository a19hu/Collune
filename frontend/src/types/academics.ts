export interface SchoolClass {
  id: string;
  name: string;
  section: string;
  classTeacher: string;
  capacity: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface SchoolExam {
  id: string;
  examName: string;
  subject: string;
  className: string;
  date: string;
  maximumMarks: number;
  room: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  remarks: string;
  status: 'Pass' | 'Fail';
}

export interface TimetablePeriod {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: string;
  subjectName: string;
  teacherName: string;
  className: string;
}

export interface HomeworkAssignment {
  id: string;
  className: string;
  section: string;
  subject: string;
  description: string;
  dueDate: string;
  attachments?: string;
  createdAt: string;
}

export interface NoticeBoardMessage {
  id: string;
  title: string;
  description: string;
  publishDate: string;
  audience: 'All' | 'Teachers' | 'Students' | 'Parents' | 'Staff';
  schoolCode: string;
}
