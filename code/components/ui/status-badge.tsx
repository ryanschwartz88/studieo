"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Status =
  | "INCOMPLETE"
  | "SCHEDULED"
  | "OPEN"
  | "ACCEPTING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ARCHIVED"
  | (string & {});

const statusClasses: Record<string, string> = {
  INCOMPLETE: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  ACCEPTING: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  COMPLETED: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
  ARCHIVED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
};

function prettifyLabel(value: string): string {
  return value
    .split('_')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function StatusBadge({
  status,
  className,
}: {
  status?: Status | null;
  className?: string;
}) {
  const key = (status || "UNKNOWN").toString().toUpperCase();
  const palette = statusClasses[key] || statusClasses.COMPLETED;
  const displayText = key === "INCOMPLETE" ? "Draft" : prettifyLabel(key);

  return (
    <Badge
      variant="outline"
      className={cn("border w-fit", palette, className)}
    >
      {displayText}
    </Badge>
  );
}


