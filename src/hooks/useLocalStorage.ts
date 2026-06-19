import type { WaveformRecord } from "@/types";

const STORAGE_KEY = "voicewave_doodle_recordings_v1";

export function loadRecordingsFromStorage(): WaveformRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WaveformRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        Array.isArray(r.samplePoints) &&
        typeof r.audioBlobBase64 === "string"
    );
  } catch (err) {
    console.warn("Failed to load recordings:", err);
    return [];
  }
}

export function saveRecordingsToStorage(list: WaveformRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to save recordings (localStorage quota?):", err);
  }
}

export function exportRecordingsToJSON(list: WaveformRecord[]): void {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    count: list.length,
    recordings: list,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.download = `voicewave-doodle-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function base64ToBlob(base64: string, mime: string): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function detectMimeFromBase64(base64: string): string {
  if (base64.startsWith("data:")) {
    const m = base64.match(/^data:([^;]+);/);
    if (m) return m[1];
  }
  return "audio/webm";
}
