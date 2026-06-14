export type UserRole = 'Super Admin' | 'School Admin' | 'Teacher' | 'Staff' | 'Student' | 'Parent';

export interface UserAccount {
  id: string;
  phone: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  schoolCode?: string;
  rememberMe?: boolean;
  avatar?: string;
  title?: string;
  details?: string;
}
