import { create } from "zustand";
import type { AppStoreState, WaveformRecord } from "@/types";
import {
  loadRecordingsFromStorage,
  saveRecordingsToStorage,
} from "@/hooks/useLocalStorage";

const initialRecordings = loadRecordingsFromStorage();

export const useAppStore = create<AppStoreState>((set, get) => ({
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
    const next = get().recordings.filter((r) => r.id !== id);
    set({
      recordings: next,
      selectedId: get().selectedId === id ? null : get().selectedId,
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
    set({ recordings: [], selectedId: null, isPlaying: null });
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
}));
