export interface SchoolStaff {
  id?: number;
  userId?: string;
  employeeId: string;
  name: string;
  email?: string;
  department: 'Finance' | 'Library' | 'Administration' | 'Security' | 'Maintenance' | 'Transport' | 'IT' | string;
  designation: 'Accountant' | 'Receptionist' | 'Librarian' | 'Cleaner' | 'Security Guard' | 'IT Staff' | 'Peon' | 'Driver' | string;
  phone: string;
  salary: number;
  joiningDate: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  photo?: string;
  isActive?: boolean;
  status: 'Active' | 'On Leave' | 'Resigned';
}
