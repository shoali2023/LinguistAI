export default function PracticeStepper({ steps, currentStep }) {
  return (
    <div className="panel p-4">
      <div className="grid gap-3 md:grid-cols-6">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          return (
            <div
              key={step}
              className={`rounded-2xl border px-3 py-3 text-sm ${isActive ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-slate-950/40 text-slate-400"}`}
            >
              <p className="text-xs uppercase tracking-[0.2em]">Step {index + 1}</p>
              <p className="mt-2 font-medium">{step}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
