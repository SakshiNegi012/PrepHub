import { createElement, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

type ToastOptions = {
  description?: string;
  duration?: number;
  id?: string;
  action?: ReactNode;
};

const recentToasts = new Map<string, string | number>();

const toneClasses: Record<NotificationType, string> = {
  success:
    "border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-[0_18px_60px_-24px_rgba(16,185,129,0.45)] dark:border-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-50",
  error:
    "border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-[0_18px_60px_-24px_rgba(244,63,94,0.45)] dark:border-rose-500/20 dark:bg-rose-950/80 dark:text-rose-50",
  warning:
    "border-amber-200/80 bg-amber-50/95 text-amber-950 shadow-[0_18px_60px_-24px_rgba(245,158,11,0.45)] dark:border-amber-500/20 dark:bg-amber-950/80 dark:text-amber-50",
  info:
    "border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-[0_18px_60px_-24px_rgba(14,165,233,0.45)] dark:border-sky-500/20 dark:bg-sky-950/80 dark:text-sky-50",
};

const iconMap: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function cleanupKey(key: string) {
  window.setTimeout(() => {
    recentToasts.delete(key);
  }, 4500);
}

export function notify(type: NotificationType, title: string, options: ToastOptions = {}) {
  const description = options.description?.trim();
  const key = `${type}:${title.toLowerCase()}:${(description ?? "").toLowerCase()}`;

  if (recentToasts.has(key)) {
    return recentToasts.get(key);
  }

  const Icon = iconMap[type];
  let id: string | number;

  switch (type) {
    case "success":
      id = sonnerToast.success(title, {
        description,
        duration: options.duration ?? 4200,
        closeButton: true,
        icon: createElement(Icon, { className: "size-5" }),
        className: `!rounded-2xl !border !px-4 !py-3 !backdrop-blur-sm ${toneClasses[type]}`,
        descriptionClassName: "text-sm leading-5 opacity-90",
        action: options.action,
        id: options.id,
      });
      break;
    case "error":
      id = sonnerToast.error(title, {
        description,
        duration: options.duration ?? 4800,
        closeButton: true,
        icon: createElement(Icon, { className: "size-5" }),
        className: `!rounded-2xl !border !px-4 !py-3 !backdrop-blur-sm ${toneClasses[type]}`,
        descriptionClassName: "text-sm leading-5 opacity-90",
        action: options.action,
        id: options.id,
      });
      break;
    case "warning":
      id = sonnerToast.warning(title, {
        description,
        duration: options.duration ?? 4600,
        closeButton: true,
        icon: createElement(Icon, { className: "size-5" }),
        className: `!rounded-2xl !border !px-4 !py-3 !backdrop-blur-sm ${toneClasses[type]}`,
        descriptionClassName: "text-sm leading-5 opacity-90",
        action: options.action,
        id: options.id,
      });
      break;
    default:
      id = sonnerToast.info(title, {
        description,
        duration: options.duration ?? 4200,
        closeButton: true,
        icon: createElement(Icon, { className: "size-5" }),
        className: `!rounded-2xl !border !px-4 !py-3 !backdrop-blur-sm ${toneClasses[type]}`,
        descriptionClassName: "text-sm leading-5 opacity-90",
        action: options.action,
        id: options.id,
      });
      break;
  }

  recentToasts.set(key, id);
  cleanupKey(key);
  return id;
}

export function notifySuccess(title: string, description?: string, options: Omit<ToastOptions, "description"> = {}) {
  return notify("success", title, { ...options, description });
}

export function notifyError(title: string, description?: string, options: Omit<ToastOptions, "description"> = {}) {
  return notify("error", title, { ...options, description });
}

export function notifyWarning(title: string, description?: string, options: Omit<ToastOptions, "description"> = {}) {
  return notify("warning", title, { ...options, description });
}

export function notifyInfo(title: string, description?: string, options: Omit<ToastOptions, "description"> = {}) {
  return notify("info", title, { ...options, description });
}
