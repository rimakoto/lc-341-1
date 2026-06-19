export interface WaveformRecord {
  id: string;
  createdAt: number;
  duration: number;
  note: string;
  audioBlobBase64: string;
  samplePoints: number[];
  waveformWidth: number;
}

export interface AppStoreState {
  recordings: WaveformRecord[];
  isRecording: boolean;
  isPlaying: string | null;
  playbackProgress: Record<string, number>;
  selectedId: string | null;
  permissionGranted: boolean | null;
  permissionError: string | null;

  addRecording: (rec: WaveformRecord) => void;
  removeRecording: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  clearAll: () => void;
  setIsRecording: (v: boolean) => void;
  setIsPlaying: (id: string | null) => void;
  setPlaybackProgress: (id: string, progress: number) => void;
  setSelectedId: (id: string | null) => void;
  setPermission: (granted: boolean, error?: string) => void;
  setRecordings: (list: WaveformRecord[]) => void;
}
