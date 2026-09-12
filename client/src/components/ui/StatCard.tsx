import React from "react";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success" | "danger" | "info";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  variant = "default",
  className,
}) => {
  const iconBgs = {
    default: "bg-slate-100/90 text-slate-600 border border-slate-200/80",
    warning: "bg-slate-100/90 text-slate-600 border border-slate-200/80",
    success: "bg-slate-100/90 text-slate-600 border border-slate-200/80",
    danger: "bg-slate-100/90 text-slate-600 border border-slate-200/80",
    info: "bg-slate-100/90 text-slate-600 border border-slate-200/80",
  };

  return (
    <div
      className={cn(
        "bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs flex items-center justify-between transition-all hover:border-slate-300",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 font-normal">{subtitle}</p>}
      </div>
      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", iconBgs[variant])}>
        {icon}
      </div>
    </div>
  );
};
