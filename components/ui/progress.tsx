import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({ value, className, showLabel = false }: ProgressProps) {
  const clamped = Math.min(value, 150);
  const color =
    value >= 100
      ? "bg-green-500"
      : value >= 75
      ? "bg-blue-500"
      : value >= 50
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className={cn("w-full", className)}>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(clamped, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 mt-1">{value.toFixed(1)}%</span>
      )}
    </div>
  );
}
