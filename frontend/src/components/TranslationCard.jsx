import AudioPlayer from "./AudioPlayer";
import { Card, CardDescription, CardTitle } from "./ui/card";

export default function TranslationCard({ translation, explanations, audioUrl }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Full translation</CardTitle>
        <CardDescription className="mt-2">A natural translation in the learner&apos;s native language.</CardDescription>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{translation || "No translation is available yet."}</p>
      </Card>
      {explanations && (
        <Card className="bg-slate-950/35">
          <CardTitle>Helpful explanation</CardTitle>
          <p className="mt-4 text-sm leading-7 text-slate-300">{explanations}</p>
        </Card>
      )}
      {audioUrl && (
        <AudioPlayer
          audioUrl={audioUrl}
          title="Listen to the translation"
          description="Use the audio player when you want to hear the translated meaning out loud."
        />
      )}
    </div>
  );
}
