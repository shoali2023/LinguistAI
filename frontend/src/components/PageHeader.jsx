import { CardDescription, CardTitle } from "./ui/card";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/90">{eyebrow}</p>}
        <CardTitle className="mt-2 text-2xl md:text-3xl">{title}</CardTitle>
        {description && <CardDescription className="mt-3 text-base leading-7 text-slate-300">{description}</CardDescription>}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

