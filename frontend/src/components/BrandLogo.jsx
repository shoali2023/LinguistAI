import { cn } from "../lib/utils";

export default function BrandLogo({ className, imageClassName, compact = false }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/15 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.35)]",
        compact ? "max-w-[210px]" : "max-w-[360px]",
        className
      )}
    >
      <img
        src="/LINGUISTAI_Logo.png"
        alt="LinguistAI"
        className={cn("h-auto w-full object-contain", imageClassName)}
      />
    </div>
  );
}
