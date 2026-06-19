import { create } from "zustand";
import type { AppStoreState, WaveformRecord } from "@/types";
import {
  loadRecordingsFromStorage,
  saveRecordingsToStorage,
} from "@/hooks/useLocalStorage";
import { globalPlayback } from "@/utils/globalPlayback";

const initialRecordings = loadRecordingsFromStorage();

export const useAppStore = create<AppStoreState>((set, get) => {
  globalPlayback.subscribe((event, id, payload) => {
    if (event === "start") {
      set({ isPlaying: id });
    } else if (event === "progress" && typeof payload === "number" && id) {
      set({
        playbackProgress: { ...get().playbackProgress, [id]: payload },
      });
    } else if (event === "end" && id) {
      const prevProgress = { ...get().playbackProgress };
      delete prevProgress[id];
      set({ isPlaying: null, playbackProgress: prevProgress });
    }
  });

  return {
    recordings: initialRecordings,
    isRecording: false,
    isPlaying: null,
    playbackProgress: {},
    selectedId: null,
    permissionGranted: null,
    permissionError: null,

    addRecording: (rec: WaveformRecord) => {
      const next = [rec, ...get().recordings];
      set({ recordings: next });
      saveRecordingsToStorage(next);
    },

    removeRecording: (id: string) => {
      if (globalPlayback.getCurrentId() === id) {
        globalPlayback.stop();
      }
      const next = get().recordings.filter((r) => r.id !== id);
      const prevProgress = { ...get().playbackProgress };
      delete prevProgress[id];
      set({
        recordings: next,
        selectedId: get().selectedId === id ? null : get().selectedId,
        playbackProgress: prevProgress,
      });
      saveRecordingsToStorage(next);
    },

    updateNote: (id: string, note: string) => {
      const next = get().recordings.map((r) =>
        r.id === id ? { ...r, note } : r
      );
      set({ recordings: next });
      saveRecordingsToStorage(next);
    },

    clearAll: () => {
      globalPlayback.stop();
      set({ recordings: [], selectedId: null, isPlaying: null, playbackProgress: {} });
      saveRecordingsToStorage([]);
    },

    setIsRecording: (v) => set({ isRecording: v }),
    setIsPlaying: (id) => set({ isPlaying: id }),
    setPlaybackProgress: (id, progress) =>
      set({
        playbackProgress: { ...get().playbackProgress, [id]: progress },
      }),
    setSelectedId: (id) => set({ selectedId: id }),
    setPermission: (granted, error) =>
      set({ permissionGranted: granted, permissionError: error ?? null }),
    setRecordings: (list) => {
      set({ recordings: list });
      saveRecordingsToStorage(list);
    },

    playRecording: (id: string) => {
      const rec = get().recordings.find((r) => r.id === id);
      if (!rec) return;
      setPlaybackProgressForId(id, 0);
      globalPlayback.play(id, rec.audioBlobBase64, rec.duration);
    },

    stopPlayback: () => {
      globalPlayback.stop();
    },

    togglePlayback: (id: string) => {
      const current = globalPlayback.getCurrentId();
      if (current === id) {
        globalPlayback.stop();
      } else {
        const rec = get().recordings.find((r) => r.id === id);
        if (!rec) return;
        if (current) {
          setPlaybackProgressForId(current, 0);
        }
        setPlaybackProgressForId(id, 0);
        globalPlayback.play(id, rec.audioBlobBase64, rec.duration);
      }
    },
  };
});

function setPlaybackProgressForId(id: string, progress: number) {
  const state = useAppStore.getState();
  state.setPlaybackProgress(id, progress);
}
