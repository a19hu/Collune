export interface SchoolTeacher {
  teacherId?: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  qualification: string;
  specialization?: string;
  experience: number;
  subject: string;
  joiningDate: string;
  salary: number;
  address: string;
  photo?: string;
  status?: boolean;
  isClassTeacher?: boolean;
  classAssigned?: string;
}
