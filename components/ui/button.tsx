import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const variantClass = {
      default: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
      primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
      ghost: "hover:bg-slate-700/50 text-slate-300 hover:text-white",
      outline: "border border-slate-600 hover:bg-slate-700 text-slate-300",
      danger: "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30",
    }[variant];

    const sizeClass = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variantClass,
          sizeClass,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
