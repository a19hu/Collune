import type { TeacherPaymentRecord } from '../features/payments/types';

export interface StudentFeeBill {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  feeType: 'Tuition Fee' | 'Exam Fee' | 'Transport Fee' | 'Library Fee' | 'Sports Fee' | 'Admission Fee';
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paidDate?: string;
  paymentMethod?: 'Card' | 'Cash' | 'GPay' | 'NetBanking';
  receiptNo?: string;
}

export type { TeacherPaymentRecord };
