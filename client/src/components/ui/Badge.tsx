import React from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "slate" | "gray" | "blue" | "amber" | "emerald" | "rose" | "indigo" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "slate", children, ...props }) => {
  const variantStyles = {
    slate: "bg-slate-100 text-slate-700 border-slate-200/80",
    gray: "bg-gray-100 text-gray-700 border-gray-200/80",
    blue: "bg-blue-600 text-white border-blue-600 font-medium",
    amber: "bg-amber-600 text-white border-amber-600 font-medium",
    emerald: "bg-emerald-600 text-white border-emerald-600 font-medium",
    rose: "bg-rose-600 text-white border-rose-600 font-medium",
    indigo: "bg-indigo-600 text-white border-indigo-600 font-medium",
    outline: "bg-transparent text-slate-600 border-slate-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
