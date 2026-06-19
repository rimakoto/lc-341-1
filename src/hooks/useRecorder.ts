import { useRef, useState, useCallback } from "react";
import type { WaveformRecord } from "@/types";
import { blobToBase64 } from "@/hooks/useLocalStorage";

const MAX_RECORD_MS = 30_000;
const SAMPLE_POINT_COUNT = 400;

export interface LiveWaveData {
  timeData: Float32Array;
  byteData: Uint8Array;
}

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liveData, setLiveData] = useState<LiveWaveData | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef<((rec: WaveformRecord) => void) | null>(null);
  const fullTimeDomainRef = useRef<number[]>([]);
  const maxDurationTimerRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setLiveData(null);
  }, []);

  const buildRecording = useCallback(
    async (durationMs: number): Promise<WaveformRecord | null> => {
      if (chunksRef.current.length === 0) return null;
      const mime = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const b64 = await blobToBase64(blob);

      const raw = fullTimeDomainRef.current;
      const sampled: number[] = [];
      const step = Math.max(1, Math.floor(raw.length / SAMPLE_POINT_COUNT));
      for (let i = 0; i < SAMPLE_POINT_COUNT; i++) {
        const start = i * step;
        const end = Math.min(raw.length, start + step);
        let peak = 0;
        for (let j = start; j < end; j++) {
          const v = Math.abs(raw[j] || 0);
          if (v > peak) peak = v;
        }
        const sign = raw[Math.min(raw.length - 1, start + Math.floor(step / 2))] || 0;
        sampled.push((sign >= 0 ? 1 : -1) * Math.min(1, peak));
      }

      return {
        id:
          "rec_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 8),
        createdAt: Date.now(),
        duration: durationMs,
        note: "",
        audioBlobBase64: `data:${mime};base64,${b64}`,
        samplePoints: sampled,
        waveformWidth: 1200,
      };
    },
    []
  );

  const startRecording = useCallback(
    async (onComplete?: (rec: WaveformRecord) => void) => {
      setError(null);
      if (onComplete) onCompleteRef.current = onComplete;
      try {
        cleanup();
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        mediaStreamRef.current = stream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const timeBuf = new Float32Array(analyser.fftSize);
        const byteBuf = new Uint8Array(analyser.frequencyBinCount);
        fullTimeDomainRef.current = [];

        let mime = "";
        const candidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ];
        for (const c of candidates) {
          if (
            typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported &&
            MediaRecorder.isTypeSupported(c)
          ) {
            mime = c;
            break;
          }
        }
        const recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const duration = Date.now() - startTimeRef.current;
          cleanup();
          setIsRecording(false);
          setElapsedMs(0);
          try {
            const rec = await buildRecording(duration);
            if (rec && onCompleteRef.current) {
              onCompleteRef.current(rec);
            }
            onCompleteRef.current = null;
          } catch (e) {
            console.error(e);
            setError("录音保存失败");
          }
        };

        recorder.start(100);
        startTimeRef.current = Date.now();
        setIsRecording(true);
        setElapsedMs(0);

        timerRef.current = window.setInterval(() => {
          setElapsedMs(Date.now() - startTimeRef.current);
        }, 50);

        maxDurationTimerRef.current = window.setTimeout(() => {
          stopRecordingInternal();
        }, MAX_RECORD_MS);

        const loop = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getFloatTimeDomainData(timeBuf);
          analyserRef.current.getByteFrequencyData(byteBuf);
          for (let i = 0; i < timeBuf.length; i++) {
            fullTimeDomainRef.current.push(timeBuf[i]);
          }
          setLiveData({
            timeData: new Float32Array(timeBuf),
            byteData: new Uint8Array(byteBuf),
          });
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e: unknown) {
        cleanup();
        setIsRecording(false);
        const msg =
          e instanceof Error
            ? e.message
            : "无法访问麦克风，请检查浏览器权限设置";
        setError(msg);
        console.error("Recording init error:", e);
      }
    },
    [cleanup, buildRecording]
  );

  const stopRecordingInternal = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
        cleanup();
      }
    } else {
      cleanup();
      setIsRecording(false);
      setElapsedMs(0);
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
  }, [stopRecordingInternal]);

  return {
    isRecording,
    elapsedMs,
    error,
    liveData,
    startRecording,
    stopRecording,
    maxDurationMs: MAX_RECORD_MS,
  };
}
