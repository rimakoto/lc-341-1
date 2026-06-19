import { Mic, Square } from "lucide-react";

interface Props {
  isRecording: boolean;
  elapsedMs: number;
  maxMs: number;
  disabled?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

export default function RecordButton({
  isRecording,
  elapsedMs,
  maxMs,
  disabled,
  onPressStart,
  onPressEnd,
}: Props) {
  const secs = Math.floor(elapsedMs / 1000);
  const ms = Math.floor((elapsedMs % 1000) / 10);
  const prog = Math.min(1, elapsedMs / maxMs);
  const R = 64;
  const C = 2 * Math.PI * R;

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (disabled) return;
    onPressStart();
  };
  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onPressEnd();
  };

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div className="relative">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="absolute -top-3 -left-3 pointer-events-none"
        >
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke="rgba(0, 255, 204, 0.08)"
            strokeWidth="3"
          />
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={isRecording ? "#ff2d95" : "#00ffcc"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - prog)}
            transform="rotate(-90 80 80)"
            style={{
              transition: "stroke-dashoffset 0.05s linear, stroke 0.3s ease",
              filter: isRecording
                ? "drop-shadow(0 0 8px rgba(255,45,149,0.7))"
                : "drop-shadow(0 0 6px rgba(0,255,204,0.5))",
            }}
          />
        </svg>

        <button
          type="button"
          disabled={disabled}
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={(e) => {
            if (isRecording) handleEnd(e);
          }}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          className={`relative w-[136px] h-[136px] rounded-full flex items-center justify-center transition-all duration-200 ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            isRecording
              ? "bg-gradient-to-br from-[#ff2d95] to-[#a91a60] shadow-[0_0_40px_rgba(255,45,149,0.55)] rec-pulse"
              : "bg-gradient-to-br from-[#00ffcc] to-[#008a75] shadow-[0_0_30px_rgba(0,255,204,0.4)] hover:shadow-[0_0_45px_rgba(0,255,204,0.55)] hover:scale-[1.03] active:scale-[0.97]"
          }`}
          aria-label={isRecording ? "停止录音" : "按住录音"}
        >
          <div className="absolute inset-2 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
            {isRecording ? (
              <Square
                className="w-11 h-11 text-white fill-white/90"
                strokeWidth={1.5}
              />
            ) : (
              <Mic
                className="w-12 h-12 text-white"
                strokeWidth={1.8}
              />
            )}
          </div>
        </button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div
          className={`font-mono text-3xl font-bold tracking-wider ${
            isRecording ? "text-[#ff2d95]" : "text-cyber-accent"
          }`}
          style={{
            textShadow: isRecording
              ? "0 0 14px rgba(255,45,149,0.6)"
              : "0 0 14px rgba(0,255,204,0.4)",
          }}
        >
          {String(Math.floor(secs / 60)).padStart(2, "0")}:
          {String(secs % 60).padStart(2, "0")}.
          {String(ms).padStart(2, "0")}
        </div>
        <div className="text-xs text-cyber-muted tracking-widest uppercase">
          {isRecording ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff2d95] animate-rec-blink" />
              REC · 松开结束录音
            </span>
          ) : (
            <span>按住按钮开始录音 · 最长 {(maxMs / 1000).toFixed(0)} 秒</span>
          )}
        </div>
      </div>
    </div>
  );
}
