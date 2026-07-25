export function BreadcrumbPath({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.15em] text-ink-faint">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="opacity-40">/</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}
