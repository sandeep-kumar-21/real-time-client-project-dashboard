import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./authStore";
import { authApi } from "../../api/auth.api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Zap, Shield, UserCheck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface DemoAccount {
  label: string;
  email: string;
  role: string;
  badge: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: "Admin (Rajesh)", email: "admin@velozity.com", role: "Administrator", badge: "bg-indigo-600 text-white border-transparent" },
  { label: "PM (Neha)", email: "neha.pm@velozity.com", role: "Project Manager", badge: "bg-amber-600 text-white border-transparent" },
  { label: "PM (Rohan)", email: "rohan.pm@velozity.com", role: "Project Manager", badge: "bg-amber-600 text-white border-transparent" },
  { label: "Dev (Ravi)", email: "ravi.dev@velozity.com", role: "Frontend Dev", badge: "bg-emerald-600 text-white border-transparent" },
  { label: "Dev (Priya)", email: "priya.dev@velozity.com", role: "Backend Dev", badge: "bg-emerald-600 text-white border-transparent" },
  { label: "Dev (Siddharth)", email: "siddharth.dev@velozity.com", role: "Fullstack Dev", badge: "bg-emerald-600 text-white border-transparent" },
  { label: "Dev (Ananya)", email: "ananya.dev@velozity.com", role: "QA Automation", badge: "bg-emerald-600 text-white border-transparent" },
];

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    if (!loginEmail || !loginPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const { user, accessToken } = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword("Password123!");
    handleLogin(undefined, account.email, "Password123!");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">VELOZITY</span>
        </div>
        <h2 className="text-center text-lg font-medium text-slate-400">
          Client Project Dashboard
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-8 shadow-xl border border-slate-200/80 rounded-xl sm:rounded-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Access real-time project metrics, tasks, and team activity
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="you@velozity.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full justify-center"
              isLoading={isLoading}
              size="md"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Persona Switcher for Evaluators */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Quick Demo Switcher
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Password123!</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin(acc)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 px-3 py-2 text-left rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-semibold text-slate-800 group-hover:text-slate-900">
                      {acc.label}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate">{acc.email}</span>
                  </div>
                  <span className={`self-start sm:self-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${acc.badge}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Secure HttpOnly JWT Refresh Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
