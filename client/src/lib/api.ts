const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function extractErrorMessage(data: unknown): string {
  if (data == null) return "Request failed";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.error === "string") return obj.error;
    // DRF serializer errors: {field: ["msg", ...], non_field_errors: [...]}
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
      const val = obj[firstKey];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
        return `${firstKey}: ${val[0]}`;
      }
      if (typeof val === "string") {
        return `${firstKey}: ${val}`;
      }
    }
  }
  return "Request failed";
}

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string | null;
  } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data as T;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  name: string;
  phone_number: string;
  date_of_birth: string;
  address: string;
  aadhaar_number: string;
  pan_number: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
}

export interface Account {
  id: number;
  account_number: number;
  account_type: "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";
  balance: string;
  is_active: boolean;
  created_at: string;
  user?: number;
  user_details?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateAccountPayload {
  account_type: "SAVINGS" | "CURRENT" | "FIXED_DEPOSIT";
  balance?: number;
}

export interface Transaction {
  id: number;
  sender_account: number;
  receiver_account: number;
  sender_account_details?: Account;
  receiver_account_details?: Account;
  amount: string;
  transaction_type: string;
  is_fraud: boolean;
  created_at: string;
}


export interface CreateTransactionPayload {
  sender_account_id: number;
  receiver_account_id: number;
  amount: number;
  schedule_delay?: number;
}

export interface DailyLimitResponse {
  account_id: number;
  account_number: string;
  daily_limit: number;
  used_today: number;
  remaining: number;
  transaction_count: number;
  max_single_transaction: number;
}

export interface LoanApplyPayload {
  loan_type: "PERSONAL" | "HOME" | "EDUCATION" | "CAR";
  amount: number;
  tenure_months: number;
}

export interface LoanResponse {
  message: string;
  emi: number;
  loan: {
    id: number;
    loan_type: string;
    amount: number;
    tenure_months: number;
    interest_rate: number;
    emi: number;
    status: string;
    created_at: string;
  };
}

export interface ApproveLoanPayload {
  action: "APPROVED" | "REJECTED";
}

export interface MeResponse {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface KYC {
  id: number;
  user: number;
  name: string;
  phone_number: string;
  date_of_birth: string;
  address: string;
  aadhaar_number: string;
  pan_number: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: number;
  loan_type: string;
  amount: string;
  tenure_months: number;
  interest_rate: string;
  emi: string;
  status: string;
  created_at: string;
}

export interface ProfileResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  kyc: KYC | null;
  accounts: Account[];
  recent_transactions: Transaction[];
  loans: Loan[];
  stats: {
    total_accounts: number;
    total_balance: number;
    active_loans: number;
  };
}

export interface CustomerData {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  kyc: KYC | null;
  accounts: Account[];
  loans: Loan[];
  stats: {
    total_accounts: number;
    total_balance: number;
    total_transactions: number;
    total_loans: number;
    active_loans: number;
  };
}

export interface AllCustomersResponse {
  total_customers: number;
  customers: CustomerData[];
}

export interface AuditLog {
  user: string | null;
  action: string;
  file: string;
  function: string;
  ip: string;
  time: string;
}

export async function signup(payload: SignupPayload) {
  return request<{ message: string }>("/signup/", {
    method: "POST",
    body: payload,
  });
}

export async function login(payload: LoginPayload) {
  return request<LoginResponse>("/token", {
    method: "POST",
    body: payload,
  });
}

export async function getAccounts(token: string) {
  return request<Account[]>("/accounts/", {
    method: "GET",
    token,
  });
}

export async function createAccount(payload: CreateAccountPayload, token: string) {
  return request<Account>("/accounts/", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function createTransaction(
  payload: CreateTransactionPayload,
  token: string,
) {
  return request<{ status: string; message?: string; transaction?: Transaction }>(
    "/transactions/",
    {
      method: "POST",
      body: payload,
      token,
    },
  );
}

export async function getTransactionHistory(token: string) {
  return request<Transaction[]>("/transactions/history/", {
    method: "GET",
    token,
  });
}

export async function getDailyLimit(accountId: number, token: string) {
  return request<DailyLimitResponse>(`/accounts/${accountId}/daily-limit/`, {
    method: "GET",
    token,
  });
}

export async function applyLoan(payload: LoanApplyPayload, token: string) {
  return request<LoanResponse>("/loans/apply/", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function approveLoan(
  loanId: number,
  payload: ApproveLoanPayload,
  token: string,
) {
  return request<{ message: string }>(`/loans/${loanId}/approve/`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function getProfile(token: string) {
  return request<ProfileResponse>("/profile/", {
    method: "GET",
    token,
  });
}

export async function getAllCustomers(token: string) {
  return request<AllCustomersResponse>("/admin/customers/", {
    method: "GET",
    token,
  });
}

export async function getAuditLogs(token: string) {
  return request<AuditLog[]>("/audit-logs/", {
    method: "GET",
    token,
  });
}

export async function getMe(token: string) {
  return request<MeResponse>("/me/", {
    method: "GET",
    token,
  });
}


