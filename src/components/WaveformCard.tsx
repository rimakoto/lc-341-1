import { useMemo, useState } from "react";
import { Play, Square, Trash2, Pencil, Check, Clock, Music } from "lucide-react";
import FixedWaveCanvas from "@/components/FixedWaveCanvas";
import type { WaveformRecord } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { usePlayback } from "@/hooks/usePlayback";

interface Props {
  rec: WaveformRecord;
  index: number;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const mm = (ms % 1000) / 10;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(
    Math.floor(mm)
  ).padStart(2, "0")}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
    2,
    "0"
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function WaveformCard({ rec, index }: Props) {
  const playback = usePlayback();
  const removeRecording = useAppStore((s) => s.removeRecording);
  const updateNote = useAppStore((s) => s.updateNote);
  const setSelectedId = useAppStore((s) => s.setSelectedId);
  const selectedId = useAppStore((s) => s.selectedId);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const playbackProgress = useAppStore((s) => s.playbackProgress);
  const setIsPlaying = useAppStore((s) => s.setIsPlaying);
  const setPlaybackProgress = useAppStore((s) => s.setPlaybackProgress);

  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(rec.note);

  const cardColor = useMemo(() => {
    const palette = ["#00ffcc", "#38bdf8", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
    return palette[index % palette.length];
  }, [index]);

  const thisPlaying = isPlaying === rec.id;
  const selected = selectedId === rec.id;
  const progress = playbackProgress[rec.id] ?? 0;

  const togglePlay = () => {
    if (thisPlaying) {
      playback.stop();
      setIsPlaying(null);
      setPlaybackProgress(rec.id, 0);
    } else {
      if (isPlaying) {
        playback.stop();
      }
      setIsPlaying(rec.id);
      setPlaybackProgress(rec.id, 0);
      playback.play(rec.id, rec.audioBlobBase64, rec.duration, {
        onProgress: (p) => setPlaybackProgress(rec.id, p),
        onEnd: () => {
          setIsPlaying(null);
          setPlaybackProgress(rec.id, 0);
        },
      });
    }
  };

  const handleCanvasClick = () => {
    setSelectedId(selected ? null : rec.id);
  };

  const saveNote = () => {
    const trimmed = noteDraft.trim().slice(0, 40);
    updateNote(rec.id, trimmed);
    setEditingNote(false);
  };

  const startEdit = () => {
    setNoteDraft(rec.note);
    setEditingNote(true);
  };

  const confirmDelete = () => {
    if (thisPlaying) {
      playback.stop();
      setIsPlaying(null);
    }
    removeRecording(rec.id);
  };

  return (
    <div
      className={`wave-card relative rounded-2xl border overflow-hidden p-4 bg-gradient-to-br from-[#0e1421] to-[#0a0f1a] animate-slide-up ${
        thisPlaying
          ? "playing border-cyber-accent/60"
          : selected
          ? "selected border-cyber-amber/60"
          : "border-cyber-border/70"
      }`}
      style={{
        animationDelay: `${Math.min(index, 6) * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 pt-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold"
            style={{
              background: `${cardColor}18`,
              color: cardColor,
              border: `1px solid ${cardColor}40`,
              boxShadow: `0 0 12px ${cardColor}25`,
            }}
          >
            #{String(index + 1).padStart(2, "0")}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {editingNote ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNote();
                      if (e.key === "Escape") {
                        setEditingNote(false);
                      }
                    }}
                    placeholder="例如：副歌哼唱、主歌旋律..."
                    className="cyber-input h-9 px-3 rounded-lg text-sm w-full max-w-xs"
                    maxLength={40}
                  />
                  <button
                    onClick={saveNote}
                    className="btn-cyber !px-2 !py-1.5"
                    title="保存"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <Music
                    className="w-4 h-4 shrink-0"
                    style={{ color: cardColor }}
                  />
                  <div
                    className="text-[15px] font-medium truncate min-w-0"
                    style={{ color: rec.note ? "#e5e7eb" : "#6b7280" }}
                  >
                    {rec.note || (
                      <span className="italic">未命名片段（点击添加备注）</span>
                    )}
                  </div>
                  <button
                    onClick={startEdit}
                    className="shrink-0 p-1.5 rounded-lg text-cyber-muted hover:text-cyber-accent hover:bg-cyber-accent/10 transition-all"
                    title="编辑备注"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <div className="flex items-center gap-1 text-xs font-mono text-cyber-muted mr-2">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(rec.duration)}</span>
                <span className="opacity-50 mx-1">·</span>
                <span>{formatDate(rec.createdAt)}</span>
              </div>
            </div>
          </div>

          <div
            className="relative rounded-xl overflow-hidden cursor-pointer group scope-screen"
            style={{ height: 88 }}
            onClick={handleCanvasClick}
            role="button"
            tabIndex={0}
            title={selected ? "取消选中" : "选中此波形"}
          >
            <FixedWaveCanvas
              samplePoints={rec.samplePoints}
              progress={progress}
              isPlaying={thisPlaying}
              variant="list"
              color={cardColor}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[1px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: thisPlaying
                    ? "rgba(255, 45, 149, 0.9)"
                    : `${cardColor}`,
                  color: "#071018",
                  boxShadow: `0 0 24px ${
                    thisPlaying
                      ? "rgba(255, 45, 149, 0.7)"
                      : `${cardColor}aa`
                  }`,
                }}
              >
                {thisPlaying ? (
                  <Square className="w-5 h-5 fill-current" strokeWidth={2} />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="btn-cyber !py-1.5 !px-3 text-xs"
                style={{
                  borderColor: thisPlaying ? "#ff2d9540" : undefined,
                  color: thisPlaying ? "#ff6ba9" : undefined,
                  background: thisPlaying ? "rgba(255,45,149,0.08)" : undefined,
                }}
              >
                {thisPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" strokeWidth={2} />
                    停止回放
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2} />
                    回放
                  </>
                )}
              </button>
            </div>
            <button
              onClick={confirmDelete}
              className="btn-cyber btn-danger !py-1.5 !px-3 text-xs"
              title="删除此录音"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
