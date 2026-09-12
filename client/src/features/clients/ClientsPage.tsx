import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "../../api/clients.api";
import type { Client } from "../../types/project";
import { ClientFormModal } from "./ClientFormModal";
import { useAuthStore } from "../auth/authStore";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Users, Plus, Trash2, Building, Mail, FolderKanban } from "lucide-react";
import toast from "react-hot-toast";

export const ClientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsApi.list(),
  });

  const handleDeleteClient = async (client: Client) => {
    const projectCount = client._count?.projects || 0;
    let cascade = false;

    if (projectCount > 0) {
      const confirmCascade = window.confirm(
        `Client "${client.name}" has ${projectCount} linked project(s). Deleting this client will permanently delete all associated projects and tasks. Do you want to proceed?`
      );
      if (!confirmCascade) return;
      cascade = true;
    } else {
      if (!window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
        return;
      }
    }

    try {
      await clientsApi.delete(client.id, cascade);
      toast.success("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to delete client"
      );
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-600" />
            Client Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise customer directory, contacts, and linked active client engagements
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsNewClientOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Client
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No clients registered</p>
          <p className="text-xs text-slate-400">
            Register your first corporate client to attach projects and deliverables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          {client.company}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(client)}
                      title="Delete client"
                      className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100 mt-3">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-600 font-mono text-[11px]">{client.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Active Projects:</span>
                    <span className="font-semibold text-slate-800">
                      {client._count?.projects || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Registered {new Date(client.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Form Modal */}
      <ClientFormModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </div>
  );
};

