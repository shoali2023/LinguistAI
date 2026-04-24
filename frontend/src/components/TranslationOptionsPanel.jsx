import AdvancedPanel from "./AdvancedPanel";
import { Button } from "./ui/button";
import { CardDescription } from "./ui/card";

function ToggleRow({ label, description, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        checked ? "border-cyan-300/40 bg-cyan-400/10" : "border-border bg-slate-950/30 hover:bg-slate-950/50"
      }`}
      aria-pressed={checked}
    >
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <span
        className={`inline-flex h-6 w-11 rounded-full p-1 transition ${checked ? "bg-cyan-300/80" : "bg-slate-700"}`}
      >
        <span className={`h-4 w-4 rounded-full bg-slate-950 transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

export default function TranslationOptionsPanel({
  mode,
  onModeChange,
  options,
  onOptionsChange,
  busy,
  onSubmit,
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-white">How would you like to view the translation?</p>
        <CardDescription className="mt-1">
          Start with the output you need now. You can always open the advanced options for more detail.
        </CardDescription>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "text", label: "Text" },
          { value: "voice", label: "Voice" },
          { value: "both", label: "Both" }
        ].map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={mode === item.value ? "default" : "secondary"}
            onClick={() => onModeChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <AdvancedPanel title="Advanced translation options">
        <div className="space-y-3">
          <ToggleRow
            label="Show word-by-word translation"
            description="Display a clean table with each important word and its meaning."
            checked={options.word_by_word}
            onToggle={() => onOptionsChange({ ...options, word_by_word: !options.word_by_word })}
          />
          <ToggleRow
            label="Highlight key vocabulary"
            description="Extract useful learning words with short meanings and examples."
            checked={options.vocabulary}
            onToggle={() => onOptionsChange({ ...options, vocabulary: !options.vocabulary })}
          />
          <ToggleRow
            label="Explain difficult words"
            description="Add a short learner-friendly explanation in the native language."
            checked={options.explanations}
            onToggle={() => onOptionsChange({ ...options, explanations: !options.explanations })}
          />
          <label className="space-y-2 text-sm">
            <span className="text-slate-300">Learning mode for translation audio</span>
            <select
              className="w-full rounded-2xl border border-border bg-slate-950/60"
              value={options.learning_mode}
              onChange={(event) => onOptionsChange({ ...options, learning_mode: event.target.value })}
            >
              <option value="Normal speed">Normal speed</option>
              <option value="Slow reading">Slow reading</option>
              <option value="Word-by-word playback">Word-by-word playback</option>
              <option value="Emphasized pronunciation">Emphasized pronunciation</option>
            </select>
          </label>
        </div>
      </AdvancedPanel>
      <Button type="button" onClick={onSubmit} disabled={busy}>
        {busy ? (mode === "voice" || mode === "both" ? "Preparing audio..." : "Translating...") : "Understand this content"}
      </Button>
    </div>
  );
}
