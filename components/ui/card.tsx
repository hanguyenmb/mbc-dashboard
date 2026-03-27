import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "brand";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  const variantClass = {
    default: "border-slate-700/50",
    success: "border-green-500/30",
    warning: "border-amber-500/30",
    danger: "border-red-500/30",
    brand: "border-blue-500/30",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-xl border bg-slate-800/60 backdrop-blur-sm p-5 shadow-lg",
        variantClass,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
