import React from "react";
import { cn } from "../../utils/cn";

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-200/80 rounded-md", className)} />
);
