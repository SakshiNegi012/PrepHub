import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  tone = "default",
}: {
  value: number;
  className?: string;
  tone?: "default" | "muted" | "peach" | "sky" | "sage";
}) {
  const fill =
    tone === "muted"
      ? "bg-ink-faint"
      : tone === "peach"
        ? "bg-clay"
        : tone === "sky"
          ? "bg-sky-ink"
          : tone === "sage"
            ? "bg-forest"
            : "bg-forest";
  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full overflow-hidden bg-hairline",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
