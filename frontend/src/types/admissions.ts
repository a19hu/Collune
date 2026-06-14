export interface InquiryFollowUp {
  id: string;
  inquiryId: string;
  followUpDate: string;
  followUpType: 'Call' | 'Meeting' | 'WhatsApp' | 'Email';
  discussionNotes: string;
  nextFollowUpDate: string;
  status: 'New Inquiry' | 'Contacted' | 'Interested' | 'Campus Visit Scheduled' | 'Admission Test Scheduled' | 'Documents Pending' | 'Registration Pending' | 'Converted' | 'Not Interested' | 'Closed';
}

export interface PreAdmissionInquiry {
  id: string;
  inquiryDate: string;
  studentName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  currentSchool?: string;
  currentClass?: string;
  fatherName: string;
  motherName: string;
  guardianName?: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  emailAddress: string;
  interestedClass: string;
  academicSession: string;
  boardPreference: 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'IGCSE';
  transportRequired: 'Yes' | 'No';
  hostelRequired: 'Yes' | 'No';
  inquirySource: 'Walk-In' | 'Phone Call' | 'Website' | 'Social Media' | 'Referral' | 'Advertisement';
  counselorAssigned: string;
  status: 'New Inquiry' | 'Contacted' | 'Interested' | 'Campus Visit Scheduled' | 'Admission Test Scheduled' | 'Documents Pending' | 'Registration Pending' | 'Converted' | 'Not Interested' | 'Closed';
  remarks?: string;
  followUps: InquiryFollowUp[];
}

export interface AdmissionNotification {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
}
