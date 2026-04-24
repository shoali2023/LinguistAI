import { Card, CardDescription, CardTitle } from "./ui/card";

export default function MetricCard({ label, value, description }) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{label}</p>
      <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
      {description && <CardDescription className="mt-3">{description}</CardDescription>}
    </Card>
  );
}
