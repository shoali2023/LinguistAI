import { Clock3, Cpu, Gauge } from "lucide-react";

import { Card, CardDescription, CardTitle } from "./ui/card";

function MetadataChip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function TechnicalMetadataPanel({
  title = "API Metadata",
  description = "Technical response metadata returned by the backend.",
  processingTime,
  model,
  metricLabel,
  metricValue
}) {
  return (
    <Card className="border border-cyan-400/15 bg-slate-950/40">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetadataChip
          icon={Clock3}
          label="Processing Time"
          value={processingTime ? `${processingTime.toFixed(3)}s` : "--"}
        />
        <MetadataChip
          icon={Cpu}
          label="Model"
          value={model || "Gemini Multimodal"}
        />
        <MetadataChip
          icon={Gauge}
          label={metricLabel}
          value={metricValue ?? "--"}
        />
      </div>
    </Card>
  );
}
