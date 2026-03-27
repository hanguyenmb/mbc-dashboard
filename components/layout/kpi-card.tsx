import { cn, formatVND, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  target?: string;
  growth?: number;
  percent?: number;
  icon?: React.ElementType;
  iconColor?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  target,
  growth,
  percent,
  icon: Icon,
  iconColor = "text-blue-400",
  className,
}: KpiCardProps) {
  const progressColor =
    percent !== undefined
      ? percent >= 100
        ? "bg-green-500"
        : percent >= 75
        ? "bg-blue-500"
        : percent >= 50
        ? "bg-amber-500"
        : "bg-red-500"
      : "bg-blue-500";

  const badgeColor =
    percent !== undefined
      ? percent >= 100
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : percent >= 75
        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
        : percent >= 50
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : "bg-red-500/20 text-red-400 border-red-500/30"
      : "bg-blue-500/20 text-blue-400 border-blue-500/30";

  const borderColor =
    percent !== undefined
      ? percent >= 100
        ? "border-green-500/20"
        : percent >= 75
        ? "border-blue-500/20"
        : percent >= 50
        ? "border-amber-500/20"
        : "border-red-500/20"
      : "border-slate-700/50";

  return (
    <div
      className={cn(
        "rounded-xl border bg-slate-800/60 backdrop-blur-sm p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5",
        borderColor,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Icon size={16} className={iconColor} />
            </div>
          )}
          <span className="text-sm text-slate-400 font-medium">{title}</span>
        </div>
        {percent !== undefined && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full border",
              badgeColor
            )}
          >
            {percent.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="text-2xl font-bold text-white mb-1">{value}</div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {growth !== undefined && (
            <>
              {growth > 0 ? (
                <TrendingUp size={12} className="text-green-400" />
              ) : growth < 0 ? (
                <TrendingDown size={12} className="text-red-400" />
              ) : (
                <Minus size={12} className="text-slate-400" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  growth > 0
                    ? "text-green-400"
                    : growth < 0
                    ? "text-red-400"
                    : "text-slate-400"
                )}
              >
                {formatPercent(growth)}
              </span>
            </>
          )}
        </div>
        {target && (
          <span className="text-xs text-slate-500">/ {target}</span>
        )}
      </div>

      {percent !== undefined && (
        <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", progressColor)}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
