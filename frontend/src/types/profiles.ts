import type { UserAccount } from './auth';
import type { SchoolTeacher } from './teacher';
import type { SchoolStaff } from './staff';
import type { SchoolStudent } from './student';

export type ProfileKind = 'admin' | 'teacher' | 'staff' | 'student';

export interface UnifiedProfile {
  id: string;
  kind: ProfileKind;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  schoolCode?: string;
  status?: string;
}

export const toUnifiedUserProfile = (user: UserAccount): UnifiedProfile => ({
  id: user.id,
  kind: user.role === 'Teacher' ? 'teacher' : user.role === 'Student' ? 'student' : user.role === 'Staff' ? 'staff' : 'admin',
  name: user.name,
  phone: user.phone,
  email: user.email,
  avatar: user.avatar,
  schoolCode: user.schoolCode,
  status: 'Active',
});

export const toUnifiedTeacherProfile = (teacher: SchoolTeacher): UnifiedProfile => ({
  id: teacher.employeeId,
  kind: 'teacher',
  name: teacher.name,
  phone: teacher.phone,
  email: teacher.email,
  avatar: teacher.photo,
  status: 'Active',
});

export const toUnifiedStaffProfile = (staff: SchoolStaff): UnifiedProfile => ({
  id: staff.employeeId,
  kind: 'staff',
  name: staff.name,
  phone: staff.phone,
  status: staff.status,
});

export const toUnifiedStudentProfile = (student: SchoolStudent): UnifiedProfile => ({
  id: student.id,
  kind: 'student',
  name: `${student.firstName} ${student.lastName}`.trim(),
  phone: student.parentPhone,
  avatar: student.photo,
  status: student.status,
});
