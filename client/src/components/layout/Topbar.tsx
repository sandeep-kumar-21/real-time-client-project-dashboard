import React from "react";
import { Menu } from "lucide-react";
import { useAuthStore } from "../../features/auth/authStore";
import { usePresenceStore } from "../../features/activity/presenceStore";
import { NotificationDropdown } from "./NotificationDropdown";

interface TopbarProps {
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { user } = useAuthStore();
  const onlineCount = usePresenceStore((s) => s.onlineCount);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left: Hamburger trigger & Section Header */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 truncate">
          <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace</span>
          <span className="hidden sm:inline text-slate-300">/</span>
          <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">Project Operations Hub</span>
        </div>
      </div>

      {/* Right: Presence counter, Notifications */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Admin Presence Pill: Assessment Requirement #18 */}
        {user?.role === "ADMIN" && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-medium text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              {onlineCount} <span className="hidden xs:inline sm:inline">{onlineCount === 1 ? "user" : "users"} </span>online
            </span>
          </div>
        )}

        {/* Real-Time Notifications Dropdown: Assessment Requirement #24 & #25 */}
        <NotificationDropdown />
      </div>
    </header>
  );
};
