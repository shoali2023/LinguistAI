import { Card, CardDescription, CardTitle } from "./ui/card";

export default function ProfileSummaryCard({ title, rows }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
            <span className="text-slate-400">{row.label}</span>
            <span className="text-right text-white">{row.value}</span>
          </div>
        ))}
      </div>
      {rows.length === 0 && <CardDescription className="mt-4">No profile data yet.</CardDescription>}
    </Card>
  );
}
