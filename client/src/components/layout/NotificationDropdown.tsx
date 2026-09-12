import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import { useNotificationStore } from "../../features/notifications/notificationStore";
import { notificationsApi } from "../../api/notifications.api";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import toast from "react-hot-toast";

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    unreadCount,
    notifications,
    setNotifications,
    setUnreadCount,
    markRead,
    markAllRead,
  } = useNotificationStore();

  // Load notifications & count on initial mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [list, count] = await Promise.all([
          notificationsApi.list(),
          notificationsApi.getUnreadCount(),
        ]);
        setNotifications(list);
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    fetchNotifications();
  }, [setNotifications, setUnreadCount]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      markRead(id);
    } catch {
      toast.error("Failed to mark notification read");
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all read");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full border border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Inbox className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                    !n.isRead ? "bg-indigo-50/30 hover:bg-indigo-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <p className={`text-xs text-slate-800 ${!n.isRead ? "font-semibold text-slate-900" : ""}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkOne(n.id, e)}
                      title="Mark as read"
                      className="shrink-0 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
