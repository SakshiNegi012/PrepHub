import type { ResourceType } from "@/lib/mock-data";
import { FileText, Video, Link as LinkIcon, Github, StickyNote, File } from "lucide-react";

const config: Record<
  ResourceType,
  { icon: typeof FileText; bg: string; fg: string }
> = {
  video: { icon: Video, bg: "bg-peach", fg: "text-peach-ink" },
  pdf: { icon: FileText, bg: "bg-peach", fg: "text-peach-ink" },
  doc: { icon: File, bg: "bg-sky", fg: "text-sky-ink" },
  link: { icon: LinkIcon, bg: "bg-sky", fg: "text-sky-ink" },
  repo: { icon: Github, bg: "bg-sage", fg: "text-sage-ink" },
  note: { icon: StickyNote, bg: "bg-forest-tint", fg: "text-forest" },
};

export function ResourceIcon({
  type,
  size = "md",
}: {
  type: ResourceType;
  size?: "sm" | "md";
}) {
  const { icon: Icon, bg, fg } = config[type];
  const box = size === "sm" ? "size-8" : "size-10";
  const ic = size === "sm" ? "size-4" : "size-4.5";
  return (
    <div
      className={`${box} ${bg} ${fg} shrink-0 rounded-lg grid place-items-center`}
    >
      <Icon className={ic} strokeWidth={1.8} />
    </div>
  );
}
