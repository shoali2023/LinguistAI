import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import { Mic, Square } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardDescription, CardTitle } from "./ui/card";
import { useLearning } from "../state/LearningProvider";

export default function AudioRecorder({ onRecorded }) {
  const { t } = useLearning();
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const recordRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recordingMimeType, setRecordingMimeType] = useState("");

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#475569",
      progressColor: "#22d3ee",
      cursorWidth: 0,
      height: 72,
      barWidth: 3,
      barGap: 2,
      barRadius: 999,
      interact: false
    });

    const preferredMimeTypes = [
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav",
      "audio/mpeg"
    ];
    const selectedMimeType = preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";

    const record = wavesurfer.registerPlugin(
      RecordPlugin.create({
        renderRecordedAudio: false,
        scrollingWaveform: true,
        continuousWaveform: true,
        mimeType: selectedMimeType || undefined
      })
    );
    setRecordingMimeType(selectedMimeType);

    record.on("record-end", (blob) => {
      onRecorded?.(blob);
      setIsRecording(false);
    });

    wavesurferRef.current = wavesurfer;
    recordRef.current = record;

    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }

    return () => {
      record.stopRecording();
      wavesurfer.destroy();
    };
  }, [onRecorded]);

  const startRecording = async () => {
    if (!recordRef.current) {
      return;
    }
    const devices = await RecordPlugin.getAvailableAudioDevices();
    await recordRef.current.startRecording({ deviceId: devices[0]?.deviceId });
    setIsRecording(true);
  };

  const stopRecording = async () => {
    await recordRef.current?.stopRecording();
    setIsRecording(false);
  };

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{t("stt.recorderTitle", "Recorder")}</CardTitle>
            <CardDescription>{t("stt.recorderDescription", "Capture live speech with a real-time waveform.")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={startRecording} disabled={!supported || isRecording}>
              <Mic className="mr-2 h-4 w-4" />
              {t("common.record", "Record")}
            </Button>
            <Button type="button" variant="secondary" onClick={stopRecording} disabled={!isRecording}>
              <Square className="mr-2 h-4 w-4" />
              {t("common.stop", "Stop")}
            </Button>
          </div>
        </div>
        <div className={isRecording ? "rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 animate-pulseRing" : "rounded-2xl bg-slate-950/60 p-3"}>
          <div ref={containerRef} />
        </div>
        {recordingMimeType && <p className="text-xs text-slate-400">{t("stt.recordingFormat", "Recording format")}: {recordingMimeType}</p>}
        {!supported && <p className="text-sm text-red-300">{t("stt.browserUnavailable", "Browser audio recording is not available here.")}</p>}
      </div>
    </Card>
  );
}
