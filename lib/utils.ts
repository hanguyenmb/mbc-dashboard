import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)}M`;
  }
  return value.toLocaleString("vi-VN");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function getProgressColor(percent: number): string {
  if (percent >= 100) return "text-success";
  if (percent >= 75) return "text-brand-600";
  if (percent >= 50) return "text-warning";
  return "text-danger";
}

export function getProgressBg(percent: number): string {
  if (percent >= 100) return "bg-success";
  if (percent >= 75) return "bg-brand-600";
  if (percent >= 50) return "bg-warning";
  return "bg-danger";
}

export function getStatusLabel(percent: number): { label: string; color: string; bg: string } {
  if (percent >= 100)
    return { label: "Vượt chỉ tiêu", color: "text-success", bg: "bg-success/10 border-success/30" };
  if (percent >= 90)
    return { label: "Gần đạt", color: "text-brand-600", bg: "bg-brand-600/10 border-brand-600/30" };
  if (percent >= 70)
    return { label: "Đang tiến hành", color: "text-warning", bg: "bg-warning/10 border-warning/30" };
  return { label: "Cần cải thiện", color: "text-danger", bg: "bg-danger/10 border-danger/30" };
}
