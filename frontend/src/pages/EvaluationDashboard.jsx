import { useEffect, useMemo, useState } from "react";
import { BarChart3, BrainCircuit, Clock3, Microscope } from "lucide-react";

import AudioPlayer from "../components/AudioPlayer";
import InlineNotice from "../components/InlineNotice";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { requestEvaluationResults, requestEvaluationRun, requestTTS } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { useSessionApiKey } from "../state/ApiKeyProvider";

const STT_BENCHMARK_CHECKLIST = [
  {
    id: "STT-C1",
    asset: "en_sample_000.wav",
    language: "English",
    visibleOutput: "Transcript, summary, keywords, difficult words, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
  {
    id: "STT-C2",
    asset: "en_sample_001.wav",
    language: "English",
    visibleOutput: "Transcript, summary, study notes, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
  {
    id: "STT-C3",
    asset: "en_sample_002.wav",
    language: "English",
    visibleOutput: "Transcript, keywords, vocabulary support, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
  {
    id: "STT-C4",
    asset: "es_sample_000.wav",
    language: "Spanish",
    visibleOutput: "Transcript, summary, keywords, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
  {
    id: "STT-C5",
    asset: "es_sample_001.wav",
    language: "Spanish",
    visibleOutput: "Transcript, study notes, vocabulary, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
  {
    id: "STT-C6",
    asset: "es_sample_002.wav",
    language: "Spanish",
    visibleOutput: "Transcript, difficult words, suggested practice, confidence",
    correctnessCheck: "Check the transcript against the original text using the same STT metrics: WER, accuracy, and latency.",
    trustSignal: "Use the same STT confidence signal for every sample: Gemini confidence score plus WER.",
  },
];

const TTS_BENCHMARK_CHECKLIST = [
  {
    id: "TTS-C1",
    asset: "tts_prompts.csv #1",
    language: "English",
    visibleOutput: "Playable audio sample and voice metadata",
    promptText: "Hello, my name is Ali and this is a speech synthesis test.",
    correctnessCheck: "Review every TTS sample with the same metrics: pronunciation clarity, naturalness, and latency.",
    trustSignal: "Use the same TTS confidence signal for every sample: successful generation plus human listening review.",
  },
  {
    id: "TTS-C2",
    asset: "tts_prompts.csv #2",
    language: "Spanish",
    visibleOutput: "Playable audio sample and voice metadata",
    promptText: "Hola, me llamo Ali y esta es una prueba de síntesis de voz.",
    correctnessCheck: "Review every TTS sample with the same metrics: pronunciation clarity, naturalness, and latency.",
    trustSignal: "Use the same TTS confidence signal for every sample: successful generation plus human listening review.",
  },
  {
    id: "TTS-C3",
    asset: "tts_prompts.csv #3",
    language: "English",
    visibleOutput: "Playable audio sample and voice metadata",
    promptText: "Artificial intelligence can transform the future of human computer interaction.",
    correctnessCheck: "Review every TTS sample with the same metrics: pronunciation clarity, naturalness, and latency.",
    trustSignal: "Use the same TTS confidence signal for every sample: successful generation plus human listening review.",
  },
  {
    id: "TTS-C4",
    asset: "tts_prompts.csv #4",
    language: "Spanish",
    visibleOutput: "Playable audio sample and voice metadata",
    promptText: "La inteligencia artificial puede mejorar la comunicación entre humanos y máquinas.",
    correctnessCheck: "Review every TTS sample with the same metrics: pronunciation clarity, naturalness, and latency.",
    trustSignal: "Use the same TTS confidence signal for every sample: successful generation plus human listening review.",
  },
  {
    id: "TTS-C5",
    asset: "tts_prompts.csv #5",
    language: "English",
    visibleOutput: "Playable audio sample and voice metadata",
    promptText: "Speaker A: Hello, how are you today? Speaker B: I am fine, thank you.",
    correctnessCheck: "Review every TTS sample with the same metrics: pronunciation clarity, naturalness, and latency.",
    trustSignal: "Use the same TTS confidence signal for every sample: successful generation plus human listening review.",
  },
];

function formatPercent(value) {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function formatSeconds(value) {
  return `${Number(value || 0).toFixed(3)}s`;
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll("\"", "\"\"")}"`;
  }
  return stringValue;
}

function downloadCsvFile(filename, rows) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function InsightCard({ icon: Icon, title, description }) {
  return (
    <Card className="border border-white/10 bg-slate-950/40">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2 leading-6">{description}</CardDescription>
        </div>
      </div>
    </Card>
  );
}

function BenchmarkChecklistTable({ title, description, rows, textColumnLabel, showPromptText = false }) {
  return (
    <Card className="border border-white/10 bg-slate-950/40">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-slate-400">
              <th className="px-3 py-3">Test</th>
              <th className="px-3 py-3">{textColumnLabel}</th>
              <th className="px-3 py-3">Language</th>
              {showPromptText && <th className="px-3 py-3">Text</th>}
              <th className="px-3 py-3">What You See</th>
              <th className="px-3 py-3">How To Check</th>
              <th className="px-3 py-3">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 align-top">
                <td className="px-3 py-4 font-medium text-cyan-200">{row.id}</td>
                <td className="px-3 py-4 font-mono text-xs text-slate-300">{row.asset}</td>
                <td className="px-3 py-4">{row.language}</td>
                {showPromptText && <td className="px-3 py-4">{row.promptText}</td>}
                <td className="px-3 py-4">{row.visibleOutput}</td>
                <td className="px-3 py-4">{row.correctnessCheck}</td>
                <td className="px-3 py-4">{row.trustSignal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BenchmarkResultsTable({ title, description, rows, columns, filename }) {
  return (
    <Card className="border border-white/10 bg-slate-950/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2">{description}</CardDescription>
        </div>
        <Button type="button" variant="secondary" onClick={() => downloadCsvFile(filename, rows)} disabled={rows.length === 0}>
          Download CSV
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          No benchmark results available yet.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-slate-400">
                {columns.map((column) => (
                  <th key={column.key} className="px-3 py-3">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${filename}-${index}`} className="border-b border-white/5 align-top">
                  {columns.map((column) => (
                    <td key={column.key} className="px-3 py-4">{row[column.key] ?? "--"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function EvaluationDashboard() {
  const { apiKey } = useSessionApiKey();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [ttsRunning, setTtsRunning] = useState(false);
  const [sampleLimit, setSampleLimit] = useState(6);
  const [ttsSampleLimit, setTtsSampleLimit] = useState(3);
  const [error, setError] = useState("");
  const [ttsError, setTtsError] = useState("");
  const [ttsOutputs, setTtsOutputs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvaluationResults() {
      setLoading(true);
      setError("");
      try {
        const response = await requestEvaluationResults();
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "We couldn't load the evaluation benchmark.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvaluationResults();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRunBenchmark = async () => {
    if (!apiKey) {
      setError("Add your Gemini API key in Settings before running the benchmark.");
      return;
    }

    setRunning(true);
    setError("");
    try {
      const generated = await requestEvaluationRun(apiKey, sampleLimit);
      setData(generated);
    } catch (err) {
      setError(err.message || "We couldn't generate the evaluation benchmark.");
    } finally {
      setRunning(false);
    }
  };

  const handleGenerateTtsBenchmark = async () => {
    if (!apiKey) {
      setTtsError("Add your Gemini API key in Settings before generating TTS benchmark samples.");
      return;
    }

    setTtsRunning(true);
    setTtsError("");
    try {
      const generated = [];
      for (const row of TTS_BENCHMARK_CHECKLIST.slice(0, ttsSampleLimit)) {
        const result = await requestTTS(apiKey, {
          text: row.promptText,
          voice: "Kore",
          style: "Friendly",
          learning_mode: "Friendly tutor",
          generation_type: "model_pronunciation",
        });
        generated.push({
          id: row.id,
          language: row.language,
          text: row.promptText,
          audioUrl: `data:${result.mime_type};base64,${result.audio_base64}`,
          voice: result.voice,
          processingTime: result.metadata?.processing_time_seconds,
          modelDisplay: result.metadata?.model_display,
        });
      }
      setTtsOutputs(generated);
    } catch (err) {
      setTtsError(err.message || "We couldn't generate the TTS benchmark samples.");
    } finally {
      setTtsRunning(false);
    }
  };

  const successfulItems = useMemo(
    () => (data?.items || []).filter((item) => !item.error),
    [data]
  );
  const sttBenchmarkRows = useMemo(
    () => (data?.items || []).map((item) => ({
      sample: item.audio_file || "",
      language: item.language || "",
      wer: item.wer ?? "",
      accuracy: item.accuracy ?? "",
      stt_latency_seconds: item.latency_seconds ?? "",
      pronunciation_latency_seconds: item.pronunciation_latency_seconds ?? "",
      total_processing_seconds: item.total_processing_seconds ?? "",
      confidence: item.stt_confidence ?? "",
      pronunciation_score: item.pronunciation_score ?? "",
      model: item.model_display || item.model || "",
      status: item.error ? "error" : "success",
      error: item.error || "",
    })),
    [data]
  );
  const ttsBenchmarkRows = useMemo(
    () => ttsOutputs.map((item) => ({
      sample: item.id,
      language: item.language,
      text: item.text,
      voice: item.voice,
      latency_seconds: item.processingTime ?? "",
      model: item.modelDisplay || "",
      audio_generated: item.audioUrl ? "yes" : "no",
      status: item.audioUrl ? "success" : "error",
    })),
    [ttsOutputs]
  );
  const maxLatency = useMemo(
    () => Math.max(...((data?.by_language || []).map((item) => item.average_latency_seconds)), 0.001),
    [data]
  );

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-6 md:p-8">
        <PageHeader
          eyebrow="Benchmark & Analytics"
          title="Gemini Benchmark & Analytics"
          description="Research-facing evaluation for recognition accuracy, latency behavior, and multimodal pronunciation understanding across your benchmark dataset."
        />
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <Card className="border border-cyan-400/20 bg-cyan-400/5">
            <CardTitle>STT Benchmark</CardTitle>
            <CardDescription className="mt-2">
              Use this box to run the speech-to-text benchmark with audio samples from the dataset.
            </CardDescription>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">STT Samples</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sampleLimit}
                  onChange={(event) => setSampleLimit(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                  className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                />
              </label>
              <Button type="button" onClick={handleRunBenchmark} disabled={running || loading}>
                {running ? "Running STT..." : "Run STT Benchmark"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => window.location.reload()} disabled={running || loading}>
                Refresh Results
              </Button>
            </div>
            <CardDescription className="mt-4 text-slate-300">
              This runner checks transcription quality, accuracy, latency, and pronunciation analysis.
            </CardDescription>
          </Card>

          <Card className="border border-emerald-400/20 bg-emerald-400/5">
            <CardTitle>TTS Benchmark</CardTitle>
            <CardDescription className="mt-2">
              Use this box to generate benchmark audio samples directly on this page.
            </CardDescription>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">TTS Samples</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={ttsSampleLimit}
                  onChange={(event) => setTtsSampleLimit(Math.max(1, Math.min(5, Number(event.target.value) || 1)))}
                  className="w-28 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white"
                />
              </label>
              <Button type="button" onClick={handleGenerateTtsBenchmark} disabled={ttsRunning}>
                {ttsRunning ? "Generating TTS..." : "Generate TTS Samples"}
              </Button>
            </div>
            <CardDescription className="mt-4 text-slate-300">
              This runner generates audio samples here so you can listen, compare, and review latency.
            </CardDescription>
            {ttsError && (
              <div className="mt-4">
                <InlineNotice tone="error" title="We couldn't generate the TTS samples." description={ttsError} />
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="grid gap-4">
        <BenchmarkResultsTable
          title="STT Benchmark Results"
          description="Download the STT benchmark metrics collected from the evaluation run."
          filename="stt_benchmark_results.csv"
          rows={sttBenchmarkRows}
          columns={[
            { key: "sample", label: "Sample" },
            { key: "language", label: "Language" },
            { key: "wer", label: "WER" },
            { key: "accuracy", label: "Accuracy" },
            { key: "stt_latency_seconds", label: "STT Latency (s)" },
            { key: "pronunciation_latency_seconds", label: "Pronunciation Latency (s)" },
            { key: "total_processing_seconds", label: "Total Time (s)" },
            { key: "confidence", label: "Confidence" },
            { key: "pronunciation_score", label: "Pronunciation Score" },
            { key: "model", label: "Model" },
            { key: "status", label: "Status" },
          ]}
        />
        <BenchmarkResultsTable
          title="TTS Benchmark Results"
          description="Download the TTS benchmark metrics available from the generated audio samples on this page."
          filename="tts_benchmark_results.csv"
          rows={ttsBenchmarkRows}
          columns={[
            { key: "sample", label: "Sample" },
            { key: "language", label: "Language" },
            { key: "text", label: "Text" },
            { key: "voice", label: "Voice" },
            { key: "latency_seconds", label: "Latency (s)" },
            { key: "model", label: "Model" },
            { key: "audio_generated", label: "Audio Generated" },
            { key: "status", label: "Status" },
          ]}
        />
        <BenchmarkChecklistTable
          title="STT Benchmark Table"
          description="A simple STT checklist with the audio file, the result shown to the user, how to verify it, and the confidence signal."
          rows={STT_BENCHMARK_CHECKLIST}
          textColumnLabel="Audio File"
        />
        <BenchmarkChecklistTable
          title="TTS Benchmark Table"
          description="A simple TTS checklist with the source text, the result shown to the user, how to review it, and the confidence signal."
          rows={TTS_BENCHMARK_CHECKLIST}
          textColumnLabel="Source"
          showPromptText
        />
      </section>

      <Card className="border border-amber-400/20 bg-amber-400/5">
        <CardTitle>Benchmark Notes</CardTitle>
        <CardDescription className="mt-2">
          For a live presentation, use 6 examples or fewer on the free tier. The STT benchmark is quantitative
          with WER, accuracy, and latency, while the TTS benchmark combines latency with human review of
          naturalness and pronunciation clarity.
        </CardDescription>
      </Card>

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      )}

      {running && (
        <InlineNotice
          tone="info"
          title="Benchmark in progress"
          description={`LinguistAI is evaluating ${sampleLimit} dataset example(s) with your current Gemini session key.`}
        />
      )}

      {error && <InlineNotice tone="error" title="We couldn’t load the benchmark." description={error} />}

      <section className="grid gap-4">
        <Card>
          <CardTitle>TTS Generated Outputs</CardTitle>
          <CardDescription className="mt-2">Generate TTS benchmark samples above to preview the real audio outputs here.</CardDescription>
          {ttsOutputs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              No TTS benchmark audio has been generated yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {ttsOutputs.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                      {item.id}
                    </span>
                    <span className="text-slate-300">{item.language}</span>
                    <span className="text-slate-300">Voice: {item.voice}</span>
                    <span className="text-slate-300">
                      Latency: {item.processingTime != null ? formatSeconds(item.processingTime) : "--"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-200">{item.text}</p>
                  <div className="mt-4">
                    <AudioPlayer
                      audioUrl={item.audioUrl}
                      title="Generated Benchmark Audio"
                      description={item.modelDisplay || "Gemini TTS output"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {data && (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Precisión Media" value={formatPercent(data.summary?.average_accuracy)} />
            <MetricCard label="WER Medio" value={formatPercent(data.summary?.average_wer)} />
            <MetricCard label="Latencia Media" value={formatSeconds(data.summary?.average_latency_seconds)} />
            <MetricCard label="Pronunciación Media" value={data.summary?.average_pronunciation_score?.toFixed?.(1) ?? "--"} />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <InsightCard
              icon={BarChart3}
              title="Capacidad de Reconocimiento"
              description="Este panel compara la transcripción de Gemini contra el ground truth del dataset para estimar precisión media y variación por idioma."
            />
            <InsightCard
              icon={Clock3}
              title="Estudio de Latencia"
              description="La latencia refleja el tiempo exacto desde el envío del audio hasta recibir la respuesta estructurada del backend con salida lista para UI."
            />
            <InsightCard
              icon={BrainCircuit}
              title="Estudio Multimodal"
              description="Gemini no solo transcribe: también interpreta el audio para emitir score de pronunciación e inteligibilidad dentro del mismo flujo de evaluación."
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardTitle>Latencia por Idioma</CardTitle>
              <CardDescription className="mt-2">Average STT response time grouped by dataset language.</CardDescription>
              <div className="mt-6 space-y-4">
                {(data.by_language || []).map((item) => (
                  <div key={item.language} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{item.language}</span>
                      <span className="text-slate-300">{formatSeconds(item.average_latency_seconds)}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-300"
                        style={{ width: `${Math.max((item.average_latency_seconds / maxLatency) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(data.by_language || []).length === 0 && (
                  <CardDescription>No successful benchmark rows are available yet.</CardDescription>
                )}
              </div>
            </Card>

            <Card>
              <CardTitle>Research Snapshot</CardTitle>
              <CardDescription className="mt-2">A compact view for reporting capabilities and interfaces of the Gemini multimodal flow.</CardDescription>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dataset Rows</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{data.summary?.sample_count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Model Interface</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {successfulItems[0]?.model_display || "Gemini 2.5 Flash (Multimodal)"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mean Confidence</p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {successfulItems.length > 0
                      ? (successfulItems.reduce((sum, item) => sum + (item.stt_confidence || 0), 0) / successfulItems.length).toFixed(1)
                      : "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Generated At</p>
                  <p className="mt-2 text-sm font-semibold text-white">{data.generated_at || "--"}</p>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-4">
            <Card>
              <CardTitle>STT Generated Outputs</CardTitle>
              <CardDescription className="mt-2">These are the main text outputs produced by the STT benchmark run.</CardDescription>
              <div className="mt-5 grid gap-4">
                {(data.items || []).map((item, index) => (
                  <div key={`${item.audio_file}-${index}-output`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                        {item.audio_file || "Unknown file"}
                      </span>
                      <span className="text-slate-300">{item.language || "--"}</span>
                      {!item.error && <span className="text-slate-300">Confidence: {item.stt_confidence ?? "--"}/100</span>}
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Original Text</p>
                        <p className="mt-2 text-sm text-slate-200">{item.ground_truth_text || "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Generated Transcript</p>
                        {item.error ? (
                          <p className="mt-2 text-sm text-red-300">{item.error}</p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-200">{item.gemini_transcript || "--"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardTitle>Comparativa de Transcripción y Pronunciación</CardTitle>
              <CardDescription className="mt-2">Original ground truth versus Gemini transcript, with pronunciation scoring for each benchmark sample.</CardDescription>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <th className="px-3 py-3">Idioma</th>
                      <th className="px-3 py-3">Texto Original</th>
                      <th className="px-3 py-3">Transcripción Gemini</th>
                      <th className="px-3 py-3">Score Pronunciación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.items || []).map((item, index) => (
                      <tr key={`${item.audio_file}-${index}`} className="border-b border-white/5 align-top">
                        <td className="px-3 py-4 text-cyan-200">{item.language || "--"}</td>
                        <td className="px-3 py-4">{item.ground_truth_text || "--"}</td>
                        <td className="px-3 py-4">
                          {item.error ? (
                            <span className="text-red-300">{item.error}</span>
                          ) : (
                            item.gemini_transcript || "--"
                          )}
                        </td>
                        <td className="px-3 py-4">
                          {item.error ? "--" : item.pronunciation_score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="border border-cyan-400/15 bg-slate-950/40">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Panel de Investigador</CardTitle>
                  <CardDescription className="mt-2 leading-6">
                    Esta sección está pensada para documentar las capacidades e interfases de Gemini: precisión frente a ground truth,
                    tiempos de respuesta por idioma y el valor añadido multimodal del feedback de pronunciación.
                  </CardDescription>
                </div>
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
