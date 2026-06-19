import { base64ToBlob, detectMimeFromBase64 } from "@/hooks/useLocalStorage";

export interface PlaybackCallbacks {
  onProgress?: (progress: number) => void;
  onEnd?: () => void;
  onStart?: () => void;
}

type Listener = (event: "start" | "end" | "progress", id: string | null, payload?: number) => void;

class GlobalPlaybackManager {
  private audioEl: HTMLAudioElement | null = null;
  private rafId: number | null = null;
  private objectUrl: string | null = null;
  private currentId: string | null = null;
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: "start" | "end" | "progress", id: string | null, payload?: number) {
    for (const l of this.listeners) {
      try {
        l(event, id, payload);
      } catch (e) {
        console.error(e);
      }
    }
  }

  getCurrentId(): string | null {
    return this.currentId;
  }

  isPlaying(id: string): boolean {
    return this.currentId === id && !!this.audioEl && !this.audioEl.paused && !this.audioEl.ended;
  }

  private teardown(emitEnd = true, lastId: string | null = this.currentId) {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch {}
      this.audioEl.onended = null;
      this.audioEl.onerror = null;
      this.audioEl.src = "";
      this.audioEl = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (emitEnd && lastId) {
      this.emit("progress", lastId, 0);
      this.emit("end", lastId);
    }
    this.currentId = null;
  }

  stop() {
    const lastId = this.currentId;
    if (!lastId) return;
    this.teardown(true, lastId);
  }

  play(id: string, audioBlobBase64: string, totalDurationMs: number, cbs: PlaybackCallbacks = {}) {
    if (this.currentId && this.currentId !== id) {
      this.teardown(true, this.currentId);
    } else if (this.currentId === id && this.audioEl && !this.audioEl.paused) {
      this.stop();
      return;
    }

    try {
      const mime = detectMimeFromBase64(audioBlobBase64);
      const rawB64 = audioBlobBase64.includes(",")
        ? audioBlobBase64.slice(audioBlobBase64.indexOf(",") + 1)
        : audioBlobBase64;
      const blob = base64ToBlob(rawB64, mime);
      const url = URL.createObjectURL(blob);
      this.objectUrl = url;

      const audio = new Audio();
      audio.src = url;
      audio.preload = "auto";
      this.audioEl = audio;
      this.currentId = id;

      audio.play().then(() => {
        if (this.currentId !== id) return;
        cbs.onStart?.();
        this.emit("start", id);

        const step = () => {
          if (this.currentId !== id || !this.audioEl) return;
          const elapsed = this.audioEl.currentTime * 1000;
          const prog = totalDurationMs > 0 ? elapsed / totalDurationMs : 0;
          const clamped = Math.max(0, Math.min(1, prog));
          cbs.onProgress?.(clamped);
          this.emit("progress", id, clamped);
          if (!this.audioEl.paused && !this.audioEl.ended) {
            this.rafId = requestAnimationFrame(step);
          }
        };
        this.rafId = requestAnimationFrame(step);
      }).catch((err) => {
        console.error("Playback failed:", err);
        cbs.onEnd?.();
        if (this.currentId === id) this.teardown(true, id);
      });

      audio.onended = () => {
        cbs.onProgress?.(1);
        this.emit("progress", id, 1);
        cbs.onEnd?.();
        this.teardown(true, id);
      };
      audio.onerror = () => {
        console.error("Audio element error");
        cbs.onEnd?.();
        if (this.currentId === id) this.teardown(true, id);
      };
    } catch (e) {
      console.error(e);
      cbs.onEnd?.();
      if (this.currentId === id) this.teardown(true, id);
    }
  }
}

export const globalPlayback = new GlobalPlaybackManager();
