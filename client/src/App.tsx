import { useEffect, useState } from "react";
import "./App.css";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { API_BASE_URL, getMe } from "@/lib/api";
import { AccountsPanel } from "@/components/accounts/AccountsPanel";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { DailyLimitCard } from "@/components/limits/DailyLimitCard";
import { LoanApplyForm } from "@/components/loans/LoanApplyForm";
import { AdminPanel } from "@/components/admin/AdminPanel";

type AuthTab = "login" | "signup";

function App() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingMe, setCheckingMe] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("access_token");
    if (stored) {
      setAccessToken(stored);
    }
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (!accessToken) {
        setIsAdmin(false);
        return;
      }
      setCheckingMe(true);
      try {
        const me = await getMe(accessToken);
        setIsAdmin(Boolean(me.is_staff || me.is_superuser));
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setCheckingMe(false);
      }
    };
    fetchMe();
  }, [accessToken]);

  const handleLoginSuccess = (tokens: { access: string; refresh: string }) => {
    window.localStorage.setItem("access_token", tokens.access);
    window.localStorage.setItem("refresh_token", tokens.refresh);
    setAccessToken(tokens.access);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("refresh_token");
    setAccessToken(null);
  };

  return (
    <div className="min-h-svh w-screen bg-gradient-to-br from-amber-200 via-amber-300 to-orange-300 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: marketing / info */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 lg:p-8 shadow-lg flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono text-amber-600 mb-2">
              API: {API_BASE_URL}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              HCL Smart Banking
            </h1>
            <p className="text-gray-600 mb-6">
              Secure internet banking for transfers, daily limit checks and loan
              management. Powered by Django REST + JWT auth.
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-amber-500">●</span>
                Create an account with built-in KYC details.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">●</span>
                Login using JWT and access your bank dashboard.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500">●</span>
                Ready for transfers, transaction history and loans next.
              </li>
            </ul>
          </div>

          {accessToken && (
            <div className="mt-6 border-t border-amber-100 pt-4">
              <p className="text-xs text-gray-500 mb-2">
                Logged-in session detected. This is just for debugging the auth
                flow while we build the full dashboard.
              </p>
              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Right panel: auth or dashboard */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 lg:p-6 shadow-lg space-y-4 overflow-y-auto max-h-[90vh]">
          {accessToken ? (
            isAdmin ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Signed in as admin. User banking UI is hidden for admin sessions.
                </p>
                <AdminPanel token={accessToken} />
              </div>
            ) : (
              <div className="space-y-4">
                <AccountsPanel token={accessToken} />
                <TransactionForm token={accessToken} />
                <TransactionHistory token={accessToken} />
                <DailyLimitCard token={accessToken} />
                <LoanApplyForm token={accessToken} />
              </div>
            )
          ) : (
            <>
              <div className="flex mb-4 border border-gray-200 rounded-full p-1 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                    activeTab === "login"
                      ? "bg-white shadow text-gray-900"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                    activeTab === "signup"
                      ? "bg-white shadow text-gray-900"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Create account
                </button>
              </div>

              {activeTab === "login" ? (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Welcome back
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Use the same credentials you used during signup.
                  </p>
                  <LoginForm onSuccess={handleLoginSuccess} />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Create your account
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    We collect basic KYC information required by your backend.
                  </p>
                  <SignupForm onSuccess={() => setActiveTab("login")} />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

