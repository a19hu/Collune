const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? "http://localhost:8000/api/v1"
  : "/api/v1";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_API_BASE_URL
).replace(/\/$/, "");
const API_EXTRA_HEADERS = API_BASE_URL.includes("ngrok")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};
const usesRelativeApiBase = API_BASE_URL.startsWith("/");

type ApiError = { error?: string; detail?: string; message?: string };
type ApiRecord = Record<string, unknown>;

export type LoginApiUser = {
  user_id: string;
  username: string;
  email: string;
  name: string;
  phone_no: string | null;
  role: string | null;
  school: string | null;
  is_active: boolean;
};

export type LoginResponse = {
  message: string;
  token: string;
  refresh: string;
  access: string;
  user: LoginApiUser;
};

export type SchoolRegisterPayload = {
  school_name: string;
  short_name: string;
  email: string;
  phone_no: string;
  established_year: number;
  school_type?: string;
  settings?: Record<string, unknown>;
  password?: string;
  logo?: File | null;
  principal_photo?: File | null;
  principal_signature?: File | null;
  principal_identity_proof_doc?: File | null;
  principal: {
    name: string;
    phone: string;
    email: string;
  };
  address: {
    country: string;
    state: string;
    city: string;
    pincode: string;
    full_address: string;
  };
};

export type SchoolRegisterResponse = {
  message: string;
  school_id: string;
  subdomain: string;
  full_domain: string;
  login_username: string;
  login_email: string;
  login_password: string;
};

function getAuthHeader() {
  const access = localStorage.getItem("saaserp_access_token");
  const drfToken = localStorage.getItem("saaserp_drf_token");
  if (access) return `Bearer ${access}`;
  if (drfToken) return `Token ${drfToken}`;
  return "";
}

function formatApiError(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "Request failed";
  const apiError = data as ApiError & ApiRecord;
  if (apiError.error || apiError.detail || apiError.message) {
    return String(apiError.error || apiError.detail || apiError.message);
  }

  for (const [key, value] of Object.entries(apiError)) {
    if (typeof value === "string") {
      return `${key}: ${value}`;
    }
    if (Array.isArray(value) && value.length > 0) {
      return `${key}: ${String(value[0])}`;
    }
    if (value && typeof value === "object") {
      const nested = formatApiError(value);
      if (nested !== "Request failed") return `${key}: ${nested}`;
    }
  }

  return "Request failed";
}

async function apiRequest<T>(path: string, init: RequestInit = {}, authed = false): Promise<T> {
  const authHeader = authed ? getAuthHeader() : "";
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...API_EXTRA_HEADERS,
      ...(init.headers || {}),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
  const text = res.status === 204 ? "" : await res.text();
  let data = {} as T & ApiError;
  if (text) {
    try {
      data = JSON.parse(text) as T & ApiError;
    } catch {
      throw new Error(`Invalid API response (${res.status} ${res.statusText || "Unknown"}): ${text.slice(0, 160)}`);
    }
  }
  if (!res.ok) {
    if (authed && [401, 403].includes(res.status)) {
      window.dispatchEvent(new CustomEvent("saaserp:session-expired"));
    }
    throw new Error(text ? formatApiError(data) : `Request failed (${res.status} ${res.statusText || "Unknown"})`);
  }
  return data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    false,
  );
}

function resolvePublicAssetUrl(url: string | null | undefined) {
  if (!url) return "";

  try {
    const parsed = new URL(url, window.location.origin);
    if (usesRelativeApiBase && parsed.pathname.startsWith("/media/")) {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

function normalizePublicSchoolLookupResponse(response: PublicSchoolLookupResponse): PublicSchoolLookupResponse {
  return {
    ...response,
    school: {
      ...response.school,
      logo_url: resolvePublicAssetUrl(response.school.logo_url),
    },
    principal: response.principal
      ? {
          ...response.principal,
          photo: resolvePublicAssetUrl(response.principal.photo),
          signature: resolvePublicAssetUrl(response.principal.signature),
          identity_proof_doc: resolvePublicAssetUrl(response.principal.identity_proof_doc),
        }
      : null,
  };
}

async function apiAuthed<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  if (import.meta.env.DEV) {
    console.log(`Making ${method} request to ${path} with body:`, body);
  }
  return apiRequest<T>(
    path,
    {
      method,
      ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    },
    true,
  );
}

export async function registerSchool(payload: SchoolRegisterPayload) {
  const formData = new FormData();
  formData.append("school_name", payload.school_name);
  formData.append("short_name", payload.short_name);
  formData.append("email", payload.email);
  formData.append("phone_no", payload.phone_no);
  formData.append("established_year", String(payload.established_year));
  if (payload.school_type) formData.append("school_type", payload.school_type);
  if (payload.settings) formData.append("settings", JSON.stringify(payload.settings));
  formData.append("principal_name", payload.principal.name);
  formData.append("principal_phone", payload.principal.phone);
  formData.append("principal_email", payload.principal.email);
  formData.append("address_country", payload.address.country);
  formData.append("address_state", payload.address.state);
  formData.append("address_city", payload.address.city);
  formData.append("address_pincode", payload.address.pincode);
  formData.append("address_full_address", payload.address.full_address);
  if (payload.logo) formData.append("logo", payload.logo);
  if (payload.principal_photo) formData.append("principal_photo", payload.principal_photo);
  if (payload.principal_signature) formData.append("principal_signature", payload.principal_signature);
  if (payload.principal_identity_proof_doc) {
    formData.append("principal_identity_proof_doc", payload.principal_identity_proof_doc);
  }

  return apiRequest<SchoolRegisterResponse>(
    "/auth/schools/register/",
    {
      method: "POST",
      body: formData,
    },
    false,
  );
}

export type SchoolDomainPreviewResponse = {
  short_name: string;
  base_subdomain: string;
  subdomain: string;
  full_domain: string;
  available: boolean;
};

export type PublicSchoolLookupResponse = {
  school: {
    school_id: string;
    school_name: string;
    short_name: string;
    email: string;
    phone_no: string;
    established_year: number;
    school_type?: string;
    status: string;
    created_at: string;
    settings?: Record<string, unknown>;
    logo_url: string;
  };
  principal: {
    name: string;
    phone: string;
    email: string;
    photo?: string | null;
    signature?: string | null;
    identity_proof_doc?: string | null;
  } | null;
  address: {
    country: string;
    state: string;
    city: string;
    pincode: string;
    full_address: string;
  } | null;
  domain: {
    subdomain: string;
    full_domain: string;
    status: string;
  } | null;
};

export async function previewSchoolDomain(shortName: string) {
  const query = encodeURIComponent(shortName);
  return apiRequest<SchoolDomainPreviewResponse>(`/auth/schools/domain-preview/?short_name=${query}`);
}

export async function lookupPublicSchool(domain: string) {
  const response = await apiPost<PublicSchoolLookupResponse>("/auth/schools/public-profile/", {
    school_domain: domain,
  });
  return normalizePublicSchoolLookupResponse(response);
}

export async function loginWithUsername(username: string, password: string, schoolDomain?: string) {
  return apiPost<LoginResponse>("/auth/login/", {
    username,
    password,
    ...(schoolDomain ? { school_domain: schoolDomain } : {}),
  });
}

export async function getMe() {
  return apiAuthed<{ user: LoginApiUser }>("/auth/me/");
}

export async function signOutApi() {
  return apiAuthed<{ message: string }>("/auth/signout/", "POST");
}

export async function refreshAccessToken(refresh: string) {
  return apiRequest<{ access: string }>("/auth/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export type SchoolProfileResponse = {
  school: {
    school_id: string;
    school_name: string;
    short_name: string;
    email: string;
    phone_no: string;
    established_year: number;
    school_type?: string;
    status: string;
    created_at: string;
    settings?: Record<string, unknown>;
  };
  principal: {
    name: string;
    phone: string;
    email: string;
  } | null;
  address: {
    country: string;
    state: string;
    city: string;
    pincode: string;
    full_address: string;
  } | null;
  domain: {
    subdomain: string;
    full_domain: string;
    status: string;
  } | null;
};

export async function getSchoolProfile() {
  return apiAuthed<SchoolProfileResponse>("/auth/school-profile/");
}

export type SchoolProfileUpdatePayload = Partial<{
  school: Partial<SchoolProfileResponse["school"]>;
  principal: Partial<NonNullable<SchoolProfileResponse["principal"]>>;
  address: Partial<NonNullable<SchoolProfileResponse["address"]>>;
  domain: Partial<NonNullable<SchoolProfileResponse["domain"]>>;
}>;

export async function updateSchoolProfile(payload: SchoolProfileUpdatePayload) {
  return apiAuthed<SchoolProfileResponse>("/auth/school-profile/", "PATCH", payload);
}

export type StaffTeacherAddressApi = {
  address_id?: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  full_address: string;
};

export type TeacherApi = {
  teacher_id: string;
  user: LoginApiUser;
  school: string | null;
  employee_id: string;
  qualification: string;
  specialization: string;
  assigned_subjects: string[];
  assigned_classes: string[];
  profile_image: string | null;
  experience: string;
  join_date: string;
  salary: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  address?: StaffTeacherAddressApi | null;
};

export type TeacherPayload = {
  user?: {
    name?: string;
    email?: string;
    phone_no?: string;
    password?: string;
  };
  employee_id?: string;
  qualification?: string;
  specialization?: string;
  assigned_subjects?: string[];
  assigned_classes?: string[];
  profile_image?: File | null;
  experience?: number | string;
  join_date?: string;
  salary?: number | string;
  status?: boolean;
  address?: {
    country: string;
    state: string;
    city: string;
    pincode: string;
    full_address: string;
  };
};

export type TeacherCreateResponse = {
  message: string;
  login_username: string;
  login_email: string;
  login_password: string;
  teacher: TeacherApi;
};

export type TeacherSalaryPaymentApi = {
  payment_id: string;
  teacher: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_ref: string;
  status: string;
  notes: string;
  created_at: string;
};

export type SalaryPaymentPayload = {
  amount: number | string;
  payment_date?: string;
  payment_method: string;
  transaction_ref?: string;
  status?: string;
  notes?: string;
};

export async function getTeachers() {
  return apiAuthed<{ teachers: TeacherApi[] }>("/teachers/");
}

export async function getTeacher(teacherId: string) {
  return apiAuthed<{ teacher: TeacherApi }>(`/teachers/${teacherId}/`);
}

export async function createTeacher(payload: TeacherPayload) {
  if (payload.profile_image) {
    const { profile_image, ...teacherPayload } = payload;
    const formData = new FormData();
    formData.append("payload", JSON.stringify(teacherPayload));
    formData.append("profile_image", profile_image);
    return apiAuthed<TeacherCreateResponse>("/teachers/", "POST", formData);
  }

  return apiAuthed<TeacherCreateResponse>("/teachers/", "POST", payload);
}

export async function updateTeacher(teacherId: string, payload: TeacherPayload) {
  return apiAuthed<{ teacher: TeacherApi }>(`/teachers/${teacherId}/`, "PATCH", payload);
}

export async function deleteTeacher(teacherId: string) {
  return apiAuthed<Record<string, never>>(`/teachers/${teacherId}/`, "DELETE");
}

export async function getTeacherSalaryPayments(teacherId: string) {
  return apiAuthed<{ salary_payments: TeacherSalaryPaymentApi[] }>(`/teachers/${teacherId}/salary-payments/`);
}

export async function createTeacherSalaryPayment(teacherId: string, payload: SalaryPaymentPayload) {
  return apiAuthed<{ salary_payment: TeacherSalaryPaymentApi }>(`/teachers/${teacherId}/salary-payments/`, "POST", payload);
}

export type InquiryCreatePayload = {
  student_name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dob?: string;
  current_school?: string;
  current_class?: string;
  parent_name: string;
  mother_name?: string;
  guardian_name?: string;
  phone_no: string;
  email: string;
  grade_interested: string;
  academic_session?: string;
  inquiry_source?: string;
  message?: string;
  follow_up_date?: string;
};

export type InquiryStatusApi = "INQUIRY" | "INTERESTED" | "INQUIRY_CONVERTED" | "REGISTERED" | "ADMISSION_REJECTED" | "CANCELLED";

export type InquiryApi = {
  inquiry_id: string;
  school: string;
  student_name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dob: string | null;
  current_school: string;
  current_class: string;
  parent_name: string;
  mother_name: string;
  guardian_name: string;
  phone_no: string;
  email: string;
  grade_interested: string;
  academic_session: string;
  inquiry_source: string;
  message: string;
  status: InquiryStatusApi;
  created_at: string;
  follow_up_date: string | null;
};

export type StudentAddressApi = {
  address_id: string;
  student: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

export type GuardianInfoApi = {
  guardian_id: string;
  student: string;
  name: string;
  relation: string;
  phone_no: string;
  email: string;
  occupation: string;
};

export type StudentAdmissionApi = {
  admission_id: string;
  school: string;
  student: string | null;
  inquiry: string | null;
  admission_type: "DIRECT_REGISTRATION" | "INQUIRY_THEN_REGISTRATION";
  admission_no: string;
  status: string;
  admission_date: string;
  applied_for_class: string;
  academic_year: string;
  remarks: string;
  created_at: string;
};

export type StudentDocumentApi = {
  document_id: string;
  student: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
};

export type StudentEnrollmentApi = {
  enrollment_id: string;
  student: string;
  class_id: string;
  section_id: string;
  academic_year: string;
  roll_no: string;
  admission_no: string;
  status: boolean;
};

export type StudentFeePaymentApi = {
  payment_id: string;
  fee_account: string;
  amount: string;
  payment_date: string;
  payment_mode: string;
  transaction_ref: string;
};

export type StudentFeeAccountApi = {
  fee_account_id: string;
  student: string;
  academic_year: string;
  total_due: string;
  total_paid: string;
  balance: string;
  status: string;
  payments: StudentFeePaymentApi[];
};

export type StudentApi = {
  user: LoginApiUser;
  school: string | null;
  admission: StudentAdmissionApi | null;
  admission_no: string;
  roll_no: string;
  class_id: string;
  first_name: string;
  last_name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dob: string | null;
  blood_group: string;
  nationality: string;
  religion: string;
  category: string;
  email: string;
  phone_no: string;
  photo: string | null;
  medical_notes: string;
  updated_at: string;
  address?: StudentAddressApi | null;
  guardians?: GuardianInfoApi[];
  documents?: StudentDocumentApi[];
  enrollments?: StudentEnrollmentApi[];
  fee_account?: StudentFeeAccountApi | null;
};

export type StudentListApi = {
  user: string;
  school: string | null;
  admission_no: string;
  roll_no: string;
  class_id: string;
  first_name: string;
  last_name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dob: string | null;
  blood_group: string;
  nationality: string;
  religion: string;
  category: string;
  email: string;
  phone_no: string;
  photo: string | null;
  medical_notes: string;
  updated_at: string;
};

export type StudentRegistrationPayload = {
  student: {
    first_name: string;
    last_name?: string;
    email: string;
    phone_no?: string;
  };
  password?: string;
  admission_no: string;
  roll_no: string;
  class_id: string;
  applied_for_class: string;
  academic_year: string;
  inquiry_id?: string;
  admission_type?: "DIRECT_REGISTRATION" | "INQUIRY_THEN_REGISTRATION";
  admission_status?: InquiryStatusApi;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dob?: string;
  blood_group?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  photo?: File | null;
  medical_notes?: string;
  remarks?: string;
  registration_date?: string;
  address?: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  guardians?: Array<{
    name: string;
    relation: string;
    phone_no: string;
    email?: string;
    occupation?: string;
  }>;
  documents?: Array<{
    document_type: string;
    file_url: string;
  }>;
  enrollment?: {
    class_id: string;
    section_id: string;
    academic_year: string;
    roll_no: string;
    admission_no?: string;
    status?: boolean;
  };
  fee_total_due?: string;
  fee_total_paid?: string;
  fee_status?: string;
};

export type StudentRegistrationResponse = {
  message: string;
  login_username: string;
  login_email: string;
  login_password: string;
  student: StudentApi;
};

export async function createInquiry(payload: InquiryCreatePayload) {
  return apiAuthed<{ message: string; inquiry: InquiryApi }>("/inquiries/", "POST", payload);
}

export async function getInquiries() {
  return apiAuthed<{ inquiries: InquiryApi[] }>("/inquiries/");
}

export async function updateInquiry(inquiryId: string, payload: Partial<InquiryApi>) {
  return apiAuthed<{ inquiry: InquiryApi }>(`/inquiries/${inquiryId}/`, "PATCH", payload);
}

export async function deleteInquiry(inquiryId: string) {
  return apiAuthed<Record<string, never>>(`/inquiries/${inquiryId}/`, "DELETE");
}

export async function registerStudent(payload: StudentRegistrationPayload) {
  if (payload.photo) {
    const { photo, ...registrationPayload } = payload;
    const formData = new FormData();
    formData.append("payload", JSON.stringify(registrationPayload));
    formData.append("photo", photo);
    return apiAuthed<StudentRegistrationResponse>("/students/register/", "POST", formData);
  }

  return apiAuthed<StudentRegistrationResponse>("/students/register/", "POST", payload);
}

export async function getStudents() {
  return apiAuthed<{ students: StudentListApi[] }>("/students/");
}

export async function getStudentProfile(studentId: string) {
  return apiAuthed<{ student: StudentApi }>(`/students/${studentId}/profile/`);
}

export type StudentUpdatePayload = Partial<Pick<
  StudentApi,
  | "first_name"
  | "last_name"
  | "gender"
  | "dob"
  | "blood_group"
  | "nationality"
  | "religion"
  | "category"
  | "email"
  | "phone_no"
  | "class_id"
  | "roll_no"
  | "medical_notes"
>>;

export async function updateStudentProfile(studentId: string, payload: StudentUpdatePayload) {
  return apiAuthed<{ student: StudentApi }>(`/students/${studentId}/profile/`, "PATCH", payload);
}

export async function deleteStudentProfile(studentId: string) {
  return apiAuthed<Record<string, never>>(`/students/${studentId}/profile/`, "DELETE");
}

export async function getStudentFeeStructure(studentId: string) {
  return apiAuthed<{ fee_account: StudentFeeAccountApi }>(`/students/${studentId}/fee-structure/`);
}

export type StudentFeePaymentPayload = {
  amount: number | string;
  payment_date?: string;
  payment_mode: string;
  transaction_ref?: string;
};

export async function getStudentFeePayments(studentId: string) {
  return apiAuthed<{ fee_payments: StudentFeePaymentApi[] }>(`/students/${studentId}/fee-payments/`);
}

export async function createStudentFeePayment(studentId: string, payload: StudentFeePaymentPayload) {
  return apiAuthed<{ fee_payment: StudentFeePaymentApi; fee_account: StudentFeeAccountApi }>(
    `/students/${studentId}/fee-payments/`,
    "POST",
    payload,
  );
}

export type StaffApi = {
  id: number;
  user: LoginApiUser;
  school: string | null;
  employee_id: string;
  department: string;
  designation: string;
  join_date: string;
  salary: string;
  profile_image: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
  address?: StaffTeacherAddressApi | null;
};

export type StaffPayload = {
  user?: {
    name?: string;
    email?: string;
    phone_no?: string;
    password?: string;
  };
  employee_id?: string;
  department?: string;
  designation?: string;
  profile_image?: File | null;
  join_date?: string;
  salary?: number | string;
  status?: boolean;
  address?: {
    country: string;
    state: string;
    city: string;
    pincode: string;
    full_address: string;
  };
};

export type StaffCreateResponse = {
  message: string;
  login_username: string;
  login_email: string;
  login_password: string;
  staff: StaffApi;
};

export type StaffSalaryPaymentApi = {
  payment_id: string;
  staff: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_ref: string;
  status: string;
  notes: string;
  created_at: string;
};

export type StaffSalaryPaymentPayload = {
  amount: number | string;
  payment_date?: string;
  payment_method: string;
  transaction_ref?: string;
  status?: string;
  notes?: string;
};

export async function getStaff() {
  return apiAuthed<{ staff: StaffApi[] }>("/staff/");
}

export async function getStaffMember(staffId: number) {
  return apiAuthed<{ staff: StaffApi }>(`/staff/${staffId}/`);
}

export async function createStaff(payload: StaffPayload) {
  if (payload.profile_image) {
    const { profile_image, ...staffPayload } = payload;
    const formData = new FormData();
    formData.append("payload", JSON.stringify(staffPayload));
    formData.append("profile_image", profile_image);
    return apiAuthed<StaffCreateResponse>("/staff/", "POST", formData);
  }

  return apiAuthed<StaffCreateResponse>("/staff/", "POST", payload);
}

export async function updateStaff(staffId: number, payload: StaffPayload) {
  return apiAuthed<{ staff: StaffApi }>(`/staff/${staffId}/`, "PATCH", payload);
}

export async function deleteStaff(staffId: number) {
  return apiAuthed<Record<string, never>>(`/staff/${staffId}/`, "DELETE");
}

export async function getStaffSalaryPayments(staffId: number) {
  return apiAuthed<{ salary_payments: StaffSalaryPaymentApi[] }>(`/staff/${staffId}/salary-payments/`);
}

export async function createStaffSalaryPayment(staffId: number, payload: StaffSalaryPaymentPayload) {
  return apiAuthed<{ salary_payment: StaffSalaryPaymentApi }>(`/staff/${staffId}/salary-payments/`, "POST", payload);
}

export type SubjectApi = {
  subject_id: string;
  school: string;
  subject_name: string;
  subject_code: string;
  description: string;
};

export type SubjectPayload = {
  subject_name: string;
  subject_code: string;
  description?: string;
};

export async function getSubjects() {
  return apiAuthed<{ subjects: SubjectApi[] }>("/subjects/");
}

export async function createSubject(payload: SubjectPayload) {
  return apiAuthed<{ subject: SubjectApi }>("/subjects/", "POST", payload);
}

export async function updateSubject(subjectId: string, payload: Partial<SubjectPayload>) {
  return apiAuthed<{ subject: SubjectApi }>(`/subjects/${subjectId}/`, "PATCH", payload);
}

export async function deleteSubject(subjectId: string) {
  return apiAuthed<Record<string, never>>(`/subjects/${subjectId}/`, "DELETE");
}

export type ClassApi = {
  class_id: string;
  school: string;
  class_name: string;
  section: string;
  academic_year: string;
};

export type ClassPayload = {
  class_name: string;
  section: string;
  academic_year: string;
};

export async function getClasses() {
  return apiAuthed<{ classes: ClassApi[] }>("/classes/");
}

export async function createClass(payload: ClassPayload) {
  return apiAuthed<{ class: ClassApi }>("/classes/", "POST", payload);
}

export async function updateClass(classId: string, payload: Partial<ClassPayload>) {
  return apiAuthed<{ class: ClassApi }>(`/classes/${classId}/`, "PATCH", payload);
}

export async function deleteClass(classId: string) {
  return apiAuthed<Record<string, never>>(`/classes/${classId}/`, "DELETE");
}

export type ExamApi = {
  exam_id: string;
  school: string;
  exam_name: string;
  academic_year: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ExamPayload = {
  exam_name: string;
  academic_year: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
};

export async function getExams() {
  return apiAuthed<{ exams: ExamApi[] }>("/exams/");
}

export async function createExam(payload: ExamPayload) {
  return apiAuthed<{ exam: ExamApi }>("/exams/", "POST", payload);
}

export async function updateExam(examId: string, payload: Partial<ExamPayload>) {
  return apiAuthed<{ exam: ExamApi }>(`/exams/${examId}/`, "PATCH", payload);
}

export async function deleteExam(examId: string) {
  return apiAuthed<Record<string, never>>(`/exams/${examId}/`, "DELETE");
}

export type ExamTimetableApi = {
  timetable_id: string;
  school: string;
  exam: string;
  school_class: string;
  subject: string;
  teacher: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  max_marks: string;
  passing_marks: string;
  room_no: string;
  instructions: string;
  created_at: string;
  updated_at: string;
  exam_detail?: ExamApi;
  class_detail?: ClassApi;
  subject_detail?: SubjectApi;
  teacher_detail?: TeacherApi | null;
};

export type ExamTimetablePayload = {
  exam: string;
  school_class: string;
  subject: string;
  teacher?: string | null;
  exam_date: string;
  start_time: string;
  end_time: string;
  max_marks?: number | string;
  passing_marks?: number | string;
  room_no?: string;
  instructions?: string;
};

export type ExamTimetableFilters = {
  exam_id?: string;
  class_id?: string;
  subject_id?: string;
};

function toQuery(filters: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export async function getExamTimetables(filters: ExamTimetableFilters = {}) {
  return apiAuthed<{ exam_timetables: ExamTimetableApi[] }>(`/exam-timetables/${toQuery(filters)}`);
}

export async function createExamTimetable(payload: ExamTimetablePayload) {
  return apiAuthed<{ exam_timetable: ExamTimetableApi }>("/exam-timetables/", "POST", payload);
}

export async function updateExamTimetable(timetableId: string, payload: Partial<ExamTimetablePayload>) {
  return apiAuthed<{ exam_timetable: ExamTimetableApi }>(`/exam-timetables/${timetableId}/`, "PATCH", payload);
}

export async function deleteExamTimetable(timetableId: string) {
  return apiAuthed<Record<string, never>>(`/exam-timetables/${timetableId}/`, "DELETE");
}

export type StudentMarkApi = {
  mark_id: string;
  school: string;
  exam_timetable: string;
  student: string;
  marks_obtained: string;
  grade: string;
  remarks: string;
  marked_by: string | null;
  created_at: string;
  updated_at: string;
  student_detail?: StudentListApi;
  timetable_detail?: ExamTimetableApi;
};

export type StudentMarkPayload = {
  student: string;
  marks_obtained: number | string;
  grade?: string;
  remarks?: string;
};

export type StudentMarkFilters = {
  exam_id?: string;
  class_id?: string;
  subject_id?: string;
  student_id?: string;
};

export async function getStudentMarks(filters: StudentMarkFilters = {}) {
  return apiAuthed<{ marks: StudentMarkApi[] }>(`/marks/${toQuery(filters)}`);
}

export async function getExamTimetableMarks(timetableId: string) {
  return apiAuthed<{ marks: StudentMarkApi[] }>(`/exam-timetables/${timetableId}/marks/`);
}

export async function upsertExamTimetableMark(timetableId: string, payload: StudentMarkPayload) {
  return apiAuthed<{ mark: StudentMarkApi }>(`/exam-timetables/${timetableId}/marks/`, "POST", payload);
}

export async function updateStudentMark(markId: string, payload: Partial<StudentMarkPayload>) {
  return apiAuthed<{ mark: StudentMarkApi }>(`/marks/${markId}/`, "PATCH", payload);
}

export async function deleteStudentMark(markId: string) {
  return apiAuthed<Record<string, never>>(`/marks/${markId}/`, "DELETE");
}

export type AttendanceStatusApi = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export type StudentAttendanceApi = {
  attendance_id: string;
  school: string;
  student: string;
  attendance_date: string;
  status: AttendanceStatusApi;
  marked_by: string | null;
  remarks: string;
  created_at: string;
  updated_at: string;
  student_detail?: StudentListApi;
  marked_by_detail?: LoginApiUser | null;
};

export type StudentAttendancePayload = {
  student: string;
  attendance_date: string;
  status: AttendanceStatusApi;
  remarks?: string;
};

export type StudentAttendanceFilters = {
  class_id?: string;
  student_id?: string;
  attendance_date?: string;
};

export async function getStudentAttendance(filters: StudentAttendanceFilters = {}) {
  return apiAuthed<{ attendance: StudentAttendanceApi[] }>(`/student-attendance/${toQuery(filters)}`);
}
export async function getStudentAttendances() {
  return apiAuthed<{ attendance: StudentAttendanceApi[] }>(`/student-attendance/`);
}
export async function upsertStudentAttendance(payload: StudentAttendancePayload) {
  return apiAuthed<{ attendance: StudentAttendanceApi }>("/student-attendance/", "POST", payload);
}

export async function getClassStudentAttendance(classId: string, attendanceDate?: string) {
  return apiAuthed<{ attendance: StudentAttendanceApi[] }>(
    `/classes/${classId}/student-attendance/${toQuery({ attendance_date: attendanceDate })}`,
  );
}

export async function upsertClassStudentAttendance(classId: string, payload: StudentAttendancePayload) {
  return apiAuthed<{ attendance: StudentAttendanceApi }>(`/classes/${classId}/student-attendance/`, "POST", payload);
}

export async function updateStudentAttendance(attendanceId: string, payload: Partial<StudentAttendancePayload>) {
  return apiAuthed<{ attendance: StudentAttendanceApi }>(`/student-attendance/${attendanceId}/`, "PATCH", payload);
}

export async function deleteStudentAttendance(attendanceId: string) {
  return apiAuthed<Record<string, never>>(`/student-attendance/${attendanceId}/`, "DELETE");
}

export type WorkdayAttendanceApi = {
  attendance_id: string;
  school: string;
  teacher: string;
  attendance_date: string;
  status: AttendanceStatusApi;
  marked_by: string;
  remarks: string;
  created_at: string;
};

export type StaffAttendanceApi = {
  attendance_id: string;
  school: string;
  staff: number;
  attendance_date: string;
  status: AttendanceStatusApi;
  marked_by: string;
  remarks: string;
  created_at: string;
  updated_at: string;
  staff_detail?: StaffApi;
};

export type WorkdayAttendancePayload = {
  attendance_date: string;
  status: AttendanceStatusApi;
  remarks?: string;
};

export async function getTeacherProfileMe() {
  return apiAuthed<{ teacher: TeacherApi }>("/teachers/me/profile/");
}

export async function getTeacherSalaryPaymentsMe() {
  return apiAuthed<{ salary_payments: TeacherSalaryPaymentApi[] }>("/teachers/me/salary-payments/");
}

export async function getTeacherAttendanceMe() {
  return apiAuthed<{ attendance: WorkdayAttendanceApi[] }>("/teachers/me/attendance/");
}

export async function getTeacherAttendance(teacherId: string) {
  return apiAuthed<{ attendance: WorkdayAttendanceApi[] }>(`/teachers/${teacherId}/attendance/`);
}

export async function upsertTeacherAttendance(teacherId: string, payload: WorkdayAttendancePayload) {
  return apiAuthed<{ attendance: WorkdayAttendanceApi }>(`/teachers/${teacherId}/attendance/`, "POST", payload);
}

export async function updateTeacherAttendance(attendanceId: string, payload: Partial<WorkdayAttendancePayload>) {
  return apiAuthed<{ attendance: WorkdayAttendanceApi }>(`/teacher-attendance/${attendanceId}/`, "PATCH", payload);
}

export async function deleteTeacherAttendance(attendanceId: string) {
  return apiAuthed<Record<string, never>>(`/teacher-attendance/${attendanceId}/`, "DELETE");
}

export async function getStaffProfileMe() {
  return apiAuthed<{ staff: StaffApi }>("/staff/me/profile/");
}

export async function getStaffSalaryPaymentsMe() {
  return apiAuthed<{ salary_payments: StaffSalaryPaymentApi[] }>("/staff/me/salary-payments/");
}

export async function getStaffAttendanceMe() {
  return apiAuthed<{ attendance: StaffAttendanceApi[] }>("/staff/me/attendance/");
}

export async function getStaffAttendance(staffId: number) {
  return apiAuthed<{ attendance: StaffAttendanceApi[] }>(`/staff/${staffId}/attendance/`);
}

export async function upsertStaffAttendance(staffId: number, payload: WorkdayAttendancePayload) {
  return apiAuthed<{ attendance: StaffAttendanceApi }>(`/staff/${staffId}/attendance/`, "POST", payload);
}

export async function updateStaffAttendance(attendanceId: string, payload: Partial<WorkdayAttendancePayload>) {
  return apiAuthed<{ attendance: StaffAttendanceApi }>(`/staff-attendance/${attendanceId}/`, "PATCH", payload);
}

export async function deleteStaffAttendance(attendanceId: string) {
  return apiAuthed<Record<string, never>>(`/staff-attendance/${attendanceId}/`, "DELETE");
}

export async function getStudentProfileMe() {
  return apiAuthed<{ student: StudentApi }>("/students/me/profile/");
}

export async function getStudentAttendanceMe() {
  return apiAuthed<{ attendance: StudentAttendanceApi[] }>("/students/me/attendance/");
}

export async function getStudentFeeStructureMe() {
  return apiAuthed<{ fee_account: StudentFeeAccountApi }>("/students/me/fee-structure/");
}
