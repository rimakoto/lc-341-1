import { useRef, useCallback } from "react";
import { base64ToBlob, detectMimeFromBase64 } from "@/hooks/useLocalStorage";

export function usePlayback() {
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.src = "";
      } catch {}
      audioElRef.current = null;
    }
    activeIdRef.current = null;
  }, []);

  const play = useCallback(
    (
      id: string,
      audioBlobBase64: string,
      totalDurationMs: number,
      opts: {
        onProgress?: (progress: number) => void;
        onEnd?: () => void;
        onStart?: () => void;
      } = {}
    ) => {
      cleanup();
      try {
        const mime = detectMimeFromBase64(audioBlobBase64);
        const rawB64 = audioBlobBase64.includes(",")
          ? audioBlobBase64.slice(audioBlobBase64.indexOf(",") + 1)
          : audioBlobBase64;
        const blob = base64ToBlob(rawB64, mime);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio();
        audio.src = url;
        audio.preload = "auto";
        audioElRef.current = audio;
        activeIdRef.current = id;

        audio.play().then(() => {
          opts.onStart?.();
          const startT = performance.now();
          const step = () => {
            if (activeIdRef.current !== id) return;
            const elapsed = audio.currentTime * 1000;
            const prog = totalDurationMs > 0 ? elapsed / totalDurationMs : 0;
            opts.onProgress?.(Math.max(0, Math.min(1, prog)));
            if (!audio.paused && !audio.ended) {
              rafRef.current = requestAnimationFrame(step);
            }
            void startT;
          };
          rafRef.current = requestAnimationFrame(step);
        }).catch((err) => {
          console.error("Playback failed:", err);
          opts.onEnd?.();
          cleanup();
        });

        audio.onended = () => {
          opts.onProgress?.(1);
          opts.onEnd?.();
          cleanup();
        };
        audio.onerror = () => {
          console.error("Audio element error");
          opts.onEnd?.();
          cleanup();
        };
      } catch (e) {
        console.error(e);
        opts.onEnd?.();
        cleanup();
      }
    },
    [cleanup]
  );

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return { play, stop };
}
