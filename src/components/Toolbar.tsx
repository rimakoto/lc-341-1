import { Download, Trash2, Activity, Disc3 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { exportRecordingsToJSON } from "@/hooks/useLocalStorage";

export default function Toolbar() {
  const recordings = useAppStore((s) => s.recordings);
  const clearAll = useAppStore((s) => s.clearAll);
  const isPlaying = useAppStore((s) => s.isPlaying);

  const totalDurationMs = recordings.reduce((acc, r) => acc + r.duration, 0);
  const totalSecs = Math.floor(totalDurationMs / 1000);

  const handleExport = () => {
    if (recordings.length === 0) return;
    exportRecordingsToJSON(recordings);
  };

  const handleClearAll = () => {
    if (recordings.length === 0) return;
    const msg = `确定要删除全部 ${recordings.length} 条录音吗？此操作不可撤销。`;
    if (window.confirm(msg)) clearAll();
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-cyber-card/60 border border-cyber-border/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-accent" />
          <div className="text-sm">
            <span className="font-mono font-bold text-cyber-accent text-base">
              {recordings.length}
            </span>
            <span className="text-cyber-muted ml-1.5">条片段</span>
          </div>
        </div>
        <div className="w-px h-5 bg-cyber-border" />
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-cyber-amber" />
          <div className="text-sm">
            <span className="font-mono font-bold text-cyber-amber text-base">
              {String(Math.floor(totalSecs / 60)).padStart(2, "0")}:
              {String(totalSecs % 60).padStart(2, "0")}
            </span>
            <span className="text-cyber-muted ml-1.5">总时长</span>
          </div>
        </div>
        {isPlaying && (
          <>
            <div className="w-px h-5 bg-cyber-border" />
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-neon" />
              </span>
              <span className="text-sm text-cyber-neon font-medium">回放中</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={recordings.length === 0}
          className="btn-cyber"
          title="导出全部录音为 JSON 文件"
        >
          <Download className="w-4 h-4" />
          导出
        </button>
        <button
          onClick={handleClearAll}
          disabled={recordings.length === 0}
          className="btn-cyber btn-danger"
          title="清空全部录音"
        >
          <Trash2 className="w-4 h-4" />
          清空
        </button>
      </div>
    </div>
  );
}
