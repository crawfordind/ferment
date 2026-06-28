"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Square } from "lucide-react";

import { transcribeAudioApi } from "@/lib/api/client";

export type VoiceResult = {
  audioBlob: Blob | null;
  format: string;
  transcript: string;
  status: "none" | "pending" | "done" | "failed";
};

type RecorderState =
  | "idle"
  | "recording"
  | "transcribing"
  | "ready"
  | "error";

const CANDIDATE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
];

function pickMimeType(): { mimeType: string | undefined; format: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: undefined, format: "webm" };
  }
  for (const candidate of CANDIDATE_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      const format = candidate.includes("mp4")
        ? "mp4"
        : candidate.includes("ogg")
          ? "ogg"
          : "webm";
      return { mimeType: candidate, format };
    }
  }
  return { mimeType: undefined, format: "webm" };
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceRecorder({
  onChange,
}: {
  onChange: (result: VoiceResult) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const formatRef = useRef<string>("webm");
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      releaseStream();
    };
  }, [stopTimer, releaseStream]);

  async function handleStop(blob: Blob) {
    blobRef.current = blob;
    const format = formatRef.current;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setState("ready");
      onChange({ audioBlob: blob, format, transcript: "", status: "pending" });
      return;
    }

    setState("transcribing");
    try {
      const text = await transcribeAudioApi(blob, format);
      setTranscript(text);
      setState("ready");
      onChange({ audioBlob: blob, format, transcript: text, status: "done" });
    } catch {
      setState("ready");
      setErrorMessage(
        "Couldn't transcribe right now — audio saved. Type a note or try again.",
      );
      onChange({ audioBlob: blob, format, transcript: "", status: "failed" });
    }
  }

  async function startRecording() {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mimeType, format } = pickMimeType();
      formatRef.current = format;
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        releaseStream();
        const blob = new Blob(chunksRef.current, {
          type: mimeType ?? "audio/webm",
        });
        void handleStop(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setState("recording");
      timerRef.current = setInterval(
        () => setSeconds((value) => value + 1),
        1000,
      );
    } catch {
      setState("error");
      setErrorMessage(
        "Microphone access is needed to record. Check your browser permissions.",
      );
    }
  }

  function stopRecording() {
    stopTimer();
    recorderRef.current?.stop();
  }

  function reset() {
    stopTimer();
    releaseStream();
    blobRef.current = null;
    chunksRef.current = [];
    setTranscript("");
    setSeconds(0);
    setErrorMessage(null);
    setState("idle");
    onChange({ audioBlob: null, format: "webm", transcript: "", status: "none" });
  }

  function handleTranscriptChange(value: string) {
    setTranscript(value);
    onChange({
      audioBlob: blobRef.current,
      format: formatRef.current,
      transcript: value,
      status: value.trim() ? "done" : "pending",
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {state === "idle" ? (
        <button
          type="button"
          onClick={startRecording}
          className="flex min-h-tap-min items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-ink-border bg-surface text-sm font-semibold text-ink hover:bg-subtle-fill"
        >
          <Mic className="size-5" aria-hidden />
          Record a voice note
        </button>
      ) : null}

      {state === "recording" ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex min-h-tap-min items-center justify-center gap-3 rounded-[var(--radius-button)] bg-status-needs-action text-sm font-semibold text-white"
        >
          <span
            aria-hidden
            className="size-3 animate-pulse rounded-full bg-white"
          />
          <span aria-live="polite">Recording {formatTime(seconds)}</span>
          <Square className="size-4 fill-white" aria-hidden />
          <span className="sr-only">Stop recording</span>
        </button>
      ) : null}

      {state === "transcribing" ? (
        <div className="flex min-h-tap-min items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-border bg-subtle-fill text-sm font-medium text-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Transcribing…
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={transcript}
            onChange={(event) => handleTranscriptChange(event.target.value)}
            rows={3}
            placeholder={
              errorMessage
                ? "Type what you said, or re-record"
                : "Transcript saved offline — will fill in on reconnect"
            }
            aria-label="Voice transcript"
            className="rounded-[var(--radius-card)] border-2 border-border bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={reset}
            className="flex w-fit items-center gap-1.5 text-sm font-semibold text-accent"
          >
            <RotateCcw className="size-4" aria-hidden />
            Re-record
          </button>
        </div>
      ) : null}

      {state === "error" ? (
        <button
          type="button"
          onClick={startRecording}
          className="flex min-h-tap-min items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-border bg-subtle-fill text-sm font-medium text-secondary"
        >
          <Mic className="size-5" aria-hidden />
          Try again
        </button>
      ) : null}

      {errorMessage ? (
        <p className="text-xs text-status-needs-action-text" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
