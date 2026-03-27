import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "brand" | "neutral";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass = {
    default: "bg-slate-700 text-slate-200",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    brand: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    neutral: "bg-slate-600/50 text-slate-300 border border-slate-600",
  }[variant];

  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variantClass, className)}
      {...props}
    />
  );
}
