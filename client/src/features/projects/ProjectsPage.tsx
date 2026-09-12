import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../../api/projects.api";
import { ProjectFormModal } from "./ProjectFormModal";
import { useAuthStore } from "../auth/authStore";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import {
  FolderKanban,
  Plus,
  Trash2,
  Users,
  CheckSquare,
  Calendar,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list(),
  });

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${name}"? All associated tasks will be removed.`)) {
      return;
    }

    try {
      await projectsApi.delete(id);
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete project");
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-slate-600" />
            Projects Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === "ADMIN"
              ? "Global portfolio management across all enterprise clients and PM leads"
              : "Projects managed by you with linked client accounts and deliverable tracks"}
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsNewProjectOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Project
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by project name or client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Projects Grid / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400">
            {searchQuery ? "No projects match your query." : "Get started by creating your first client project."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const canDelete =
              user?.role === "ADMIN" ||
              (user?.role === "PROJECT_MANAGER" && project.createdById === user.id);

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {project.name}
                    </h3>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        title="Delete project"
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Client:</span>
                      <span className="font-semibold text-slate-800">
                        {project.client?.name || "None"}
                        {project.client?.company ? ` (${project.client.company})` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Lead PM:</span>
                      <span className="font-medium text-slate-800">
                        {project.createdBy?.name || "System"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{project._count?.tasks || 0} Tasks</span>
                  </div>

                  <Link to={`/tasks?projectId=${project.id}`}>
                    <Badge variant="slate" className="text-[10px] cursor-pointer hover:bg-slate-200">
                      View Tasks →
                    </Badge>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Creation Modal */}
      <ProjectFormModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        }}
      />
    </div>
  );
};
