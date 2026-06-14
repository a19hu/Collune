export type PaymentMethod = 'Cash' | 'Card' | 'GPay' | 'NetBanking';

export interface TeacherPaymentRecord {
  id: string;
  teacherEmployeeId: string;
  teacherName: string;
  amount: number;
  paymentDate: string;
  month: string;
  method: PaymentMethod;
  reference: string;
  notes?: string;
}
