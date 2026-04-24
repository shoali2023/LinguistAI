import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("panel p-5 md:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-6 text-slate-300", className)} {...props} />;
}
