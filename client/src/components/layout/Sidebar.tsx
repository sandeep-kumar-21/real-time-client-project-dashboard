import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  LogOut,
  Zap,
  UserCog,
  X,
} from "lucide-react";
import { useAuthStore } from "../../features/auth/authStore";
import { cn } from "../../utils/cn";
import { Badge } from "../ui/Badge";

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, className }) => {
  const { user, logout } = useAuthStore();
  const role = user?.role;

  const navItems = [
    {
      label: "Dashboard",
      to: "/",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Projects",
      to: "/projects",
      icon: FolderKanban,
      // Developer cannot manage projects
      visible: role === "ADMIN" || role === "PROJECT_MANAGER",
    },
    {
      label: role === "DEVELOPER" ? "My Tasks" : "Tasks",
      to: "/tasks",
      icon: CheckSquare,
      visible: true,
    },
    {
      label: "Clients",
      to: "/clients",
      icon: Users,
      // Assessment Requirement: Developer must not reach or see clients
      visible: role === "ADMIN" || role === "PROJECT_MANAGER",
    },
    {
      label: "Users",
      to: "/users",
      icon: UserCog,
      // Admin only: Assessment Requirement #1
      visible: role === "ADMIN",
    },
    {
      label: "Activity Feed",
      to: "/activity",
      icon: Activity,
      visible: true,
    },
  ];

  const roleLabelMap: Record<string, string> = {
    ADMIN: "Administrator",
    PROJECT_MANAGER: "Project Manager",
    DEVELOPER: "Developer",
  };

  const roleVariantMap: Record<string, "indigo" | "amber" | "emerald" | "slate"> = {
    ADMIN: "indigo",
    PROJECT_MANAGER: "amber",
    DEVELOPER: "emerald",
  };

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">VELOZITY</h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Project Portal</p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
        </div>
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => onClose?.()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* User Profile Card */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-xl border border-slate-200/70 bg-white flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name}</p>
              <div className="mt-0.5">
                <Badge
                  variant={roleVariantMap[user?.role || "DEVELOPER"] || "slate"}
                  className="text-[9px] py-0 px-1.5"
                >
                  {roleLabelMap[user?.role || "DEVELOPER"]}
                </Badge>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              logout();
            }}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
