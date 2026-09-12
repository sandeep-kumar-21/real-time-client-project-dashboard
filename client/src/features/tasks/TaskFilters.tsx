import React from "react";
import { useSearchParams } from "react-router-dom";
import type { Project } from "../../types/project";
import { Filter, X, Calendar } from "lucide-react";

interface TaskFiltersProps {
  projects: Project[];
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ projects }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";
  const currentProjectId = searchParams.get("projectId") || "";
  const currentDueFrom = searchParams.get("dueFrom") || "";
  const currentDueTo = searchParams.get("dueTo") || "";

  const hasActiveFilters = Boolean(
    currentStatus || currentPriority || currentProjectId || currentDueFrom || currentDueTo
  );

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 shrink-0">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <span>Filters:</span>
      </div>

      {/* Project Filter */}
      <select
        value={currentProjectId}
        onChange={(e) => updateParam("projectId", e.target.value)}
        className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
      >
        <option value="">All Projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
      >
        <option value="">All Statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="DONE">Done</option>
      </select>

      {/* Priority Filter */}
      <select
        value={currentPriority}
        onChange={(e) => updateParam("priority", e.target.value)}
        className="w-full sm:w-auto px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-700 font-medium hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      {/* Due Date Range Filter */}
      <div className="w-full sm:w-auto flex flex-wrap items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-600">
        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-medium text-slate-500">Due:</span>
        <input
          type="date"
          value={currentDueFrom}
          onChange={(e) => updateParam("dueFrom", e.target.value)}
          aria-label="Due date from"
          className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer max-w-[125px]"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={currentDueTo}
          onChange={(e) => updateParam("dueTo", e.target.value)}
          aria-label="Due date to"
          className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden cursor-pointer max-w-[125px]"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-auto sm:ml-0"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
};
