export interface SaaSSchool {
  id: string;
  name: string;
  code: string;
  logo?: string;
  notes?: string;
  directorPhoto?: string;
  principalSignature?: string;
  identityProofCard?: string;
  type: 'Primary' | 'Secondary' | 'Higher Secondary' | 'K-12' | 'Vocational';
  board: 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'IGCSE';
  estYear: number;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  principalName: string;
  principalPhone: string;
  principalEmail: string;
  plan: 'Free Trial' | 'Basic' | 'Standard' | 'Premium';
  billingCycle: 'Monthly' | 'Yearly';
  status: 'Active' | 'Trial' | 'Suspended';
  registeredAt: string;
  nextRenewal: string;
}

export interface SaaSPlan {
  name: 'Free Trial' | 'Basic' | 'Standard' | 'Premium';
  monthlyPrice: number;
  yearlyPrice: number;
  maxSchools: number;
  maxStudentsPerSchool: number;
  features: string[];
}

export interface SaaSRevenueLog {
  id: string;
  schoolName: string;
  schoolCode: string;
  plan: 'Basic' | 'Standard' | 'Premium';
  amount: number;
  billingCycle: 'Monthly' | 'Yearly';
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface SaaSSupportTicket {
  id: string;
  schoolName: string;
  subject: string;
  description: string;
  category: 'Billing' | 'Technical' | 'Feature Request' | 'Account Lock';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
}
