import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuthStore } from "../../features/auth/authStore";
import { useNotificationStore } from "../../features/notifications/notificationStore";
import { usePresenceStore } from "../../features/activity/presenceStore";
import { getSocket } from "../../lib/socket";
import toast from "react-hot-toast";

export const AppShell: React.FC = () => {
  const { accessToken } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const addNotification = useNotificationStore((s) => s.addNotification);
  const setPresence = usePresenceStore((s) => s.setPresence);
  const setUserPresence = usePresenceStore((s) => s.setUserPresence);
  const setOnlineCount = usePresenceStore((s) => s.setOnlineCount);

  // Automatically close mobile menu drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Global socket listeners for real-time notifications and live presence
  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket(accessToken);

    // Real-Time In-App Notification Pusher
    const handleNotification = (notif: any) => {
      addNotification(notif);
      toast(notif.message, {
        duration: 5000,
      });
    };

    // Real-Time Admin Presence Pusher
    const handlePresence = (data: { count: number; onlineUserIds?: string[] }) => {
      if (data.onlineUserIds) {
        setPresence(data);
      } else {
        setOnlineCount(data.count);
      }
    };

    const handleUserPresence = (data: {
      userId: string;
      isOnline: boolean;
      count?: number;
      onlineUserIds?: string[];
    }) => {
      setUserPresence(data.userId, data.isOnline, data.count);
      if (data.onlineUserIds) {
        setPresence({ count: data.count || 1, onlineUserIds: data.onlineUserIds });
      }
    };

    socket.on("notification:new", handleNotification);
    socket.on("presence:update", handlePresence);
    socket.on("presence:user", handleUserPresence);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("presence:update", handlePresence);
      socket.off("presence:user", handleUserPresence);
    };
  }, [accessToken, addNotification, setPresence, setUserPresence, setOnlineCount]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Persistent Sidebar */}
      <Sidebar className="hidden lg:flex sticky top-0" />

      {/* Mobile / Tablet Off-Canvas Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Off-canvas sidebar container */}
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} className="w-full h-full border-r-0" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

