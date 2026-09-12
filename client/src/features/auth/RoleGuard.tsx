import React from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "./authStore";
import type { Role } from "../../types/auth";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1.5 mb-6">
          Your role (<span className="font-semibold text-slate-800">{user?.role}</span>) does not have permission to view or manage this resource.
        </p>
        <Link to="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
