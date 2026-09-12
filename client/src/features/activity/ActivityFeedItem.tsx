import React from "react";
import type { ActivityLog } from "../../types/activity";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { statusConfigMap } from "../../utils/statusColorMap";
import { ArrowRight } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

interface ActivityFeedItemProps {
  log: ActivityLog;
}

const roleVariantMap: Record<string, "indigo" | "amber" | "emerald" | "slate"> = {
  ADMIN: "indigo",
  PROJECT_MANAGER: "amber",
  DEVELOPER: "emerald",
};

const roleLabelMap: Record<string, string> = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "PM",
  DEVELOPER: "Dev",
};

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ log }) => {
  const fromCfg = log.fromStatus ? statusConfigMap[log.fromStatus] : null;
  const toCfg = log.toStatus ? statusConfigMap[log.toStatus] : null;

  return (
    <div className="p-4 hover:bg-slate-50/60 transition-colors flex items-start gap-3.5">
      {/* Actor Avatar */}
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-slate-200">
        {log.user?.name?.slice(0, 2).toUpperCase() || "US"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{log.user?.name}</span>
            {log.user?.role && (
              <Badge
                variant={roleVariantMap[log.user.role] || "slate"}
                className="text-[9px] py-0 px-1.5"
              >
                {roleLabelMap[log.user.role] || log.user.role}
              </Badge>
            )}
            {log.project && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                {log.project.name}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-700 leading-relaxed">{log.message}</p>

        {/* Status Transition Pills if status changed */}
        {fromCfg && toCfg && log.fromStatus !== log.toStatus && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${fromCfg.border} ${fromCfg.bg} ${fromCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${fromCfg.dot}`} />
              {fromCfg.label}
            </span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${toCfg.border} ${toCfg.bg} ${toCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${toCfg.dot}`} />
              {toCfg.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
