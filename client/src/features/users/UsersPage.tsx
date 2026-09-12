import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type ManagedUser } from "../../api/users.api";
import { UserFormModal } from "./UserFormModal";
import { useAuthStore } from "../auth/authStore";
import { usePresenceStore } from "../activity/presenceStore";
import { getSocket } from "../../lib/socket";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Users, Plus, Edit2, Trash2, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export const UsersPage: React.FC = () => {
  const { user: currentUser, accessToken } = useAuthStore();
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => usersApi.list(),
  });

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handlePresenceChange = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    };

    socket.on("presence:update", handlePresenceChange);
    socket.on("presence:user", handlePresenceChange);

    return () => {
      socket.off("presence:update", handlePresenceChange);
      socket.off("presence:user", handlePresenceChange);
    };
  }, [accessToken, queryClient]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user: ManagedUser) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own administrator account");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete user "${user.name}" (${user.role})? This will unassign any active tasks.`
      )
    ) {
      return;
    }

    try {
      await usersApi.delete(user.id);
      toast.success(`User "${user.name}" deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white border border-indigo-600">
            Administrator
          </span>
        );
      case "PROJECT_MANAGER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 text-white border border-blue-600">
            Project Manager
          </span>
        );
      case "DEVELOPER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white border border-emerald-600">
            Developer
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-600" />
            User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer employee accounts, system role privileges, and active project assignments
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleOpenCreate} className="w-full sm:w-auto">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New User
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="PROJECT_MANAGER">Project Manager</option>
          <option value="DEVELOPER">Developer</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No users found</p>
          <p className="text-xs text-slate-400">
            {searchQuery || roleFilter
              ? "Try adjusting your search filters."
              : "Register your first team member using the button above."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Online Status</th>
                  <th className="py-3 px-4">Workload</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const isUserOnline =
                    isCurrent || user.isOnline || onlineUserIds.includes(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {user.name}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isUserOnline ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Offline
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {user.role === "PROJECT_MANAGER" && (
                          <span>{user.projectsCount} project(s)</span>
                        )}
                        {user.role === "DEVELOPER" && (
                          <span>{user.tasksCount} task(s) assigned</span>
                        )}
                        {user.role === "ADMIN" && (
                          <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            Full System Scope
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={isCurrent}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrent
                              ? "text-slate-200 cursor-not-allowed"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          }`}
                          title={isCurrent ? "Cannot delete own account" : "Delete User"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
        userToEdit={selectedUser}
      />
    </div>
  );
};
