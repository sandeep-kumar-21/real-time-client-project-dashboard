import React from "react";
import { FolderKanban } from "lucide-react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div className={cn("text-center py-12 px-4 flex flex-col items-center justify-center", className)}>
    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200/60">
      {icon || <FolderKanban className="w-6 h-6" />}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
    {action}
  </div>
);
