export default function AdvancedPanel({ title = "Advanced options", children, defaultOpen = false }) {
  return (
    <details
      className="rounded-2xl border border-white/10 bg-slate-950/35"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-200">
        {title}
      </summary>
      <div className="border-t border-white/10 px-4 py-4">{children}</div>
    </details>
  );
}
