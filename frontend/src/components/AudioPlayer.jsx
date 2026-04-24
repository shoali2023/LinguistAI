import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Pause, Play } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { useLearning } from "../state/LearningProvider";

export default function AudioPlayer({ audioUrl, title = "Generated Audio", description = "Preview" }) {
  const { t } = useLearning();
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) {
      return undefined;
    }

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#334155",
      progressColor: "#22d3ee",
      cursorColor: "#f8fafc",
      height: 72,
      barWidth: 3,
      barGap: 2,
      barRadius: 999
    });
    wavesurfer.load(audioUrl);
    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => setIsPlaying(false));
    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    if (!wavesurferRef.current) {
      return;
    }
    wavesurferRef.current.playPause();
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" onClick={togglePlayback}>
            {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isPlaying ? t("common.pause", "Pause") : t("common.play", "Play")}
          </Button>
        </div>
        <div ref={containerRef} className="rounded-2xl bg-slate-950/60 p-4" />
        <audio className="w-full" controls src={audioUrl} />
      </div>
    </Card>
  );
}
