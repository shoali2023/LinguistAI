import { cn } from "../lib/utils";

const toneStyles = {
  info: "border-cyan-400/20 bg-cyan-400/8 text-cyan-100",
  warning: "border-amber-400/25 bg-amber-400/8 text-amber-100",
  error: "border-red-400/25 bg-red-500/8 text-red-100",
  success: "border-emerald-400/25 bg-emerald-500/8 text-emerald-100"
};

export default function InlineNotice({ tone = "info", title, description, className }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3", toneStyles[tone], className)}>
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-sm leading-6 opacity-90">{description}</p> : null}
    </div>
  );
}

