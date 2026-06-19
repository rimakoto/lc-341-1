import { useEffect, useState } from "react";
import { Activity, AudioWaveform, AlertTriangle, Fingerprint } from "lucide-react";
import LiveWaveCanvas from "@/components/LiveWaveCanvas";
import RecordButton from "@/components/RecordButton";
import WaveformCard from "@/components/WaveformCard";
import Toolbar from "@/components/Toolbar";
import { useRecorder } from "@/hooks/useRecorder";
import { useAppStore } from "@/store/useAppStore";
import type { WaveformRecord } from "@/types";

export default function Home() {
  const recorder = useRecorder();
  const addRecording = useAppStore((s) => s.addRecording);
  const recordings = useAppStore((s) => s.recordings);
  const setPermission = useAppStore((s) => s.setPermission);
  const permissionGranted = useAppStore((s) => s.permissionGranted);
  const permissionError = useAppStore((s) => s.permissionError);

  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (recorder.error) {
      setPermission(false, recorder.error);
    }
  }, [recorder.error, setPermission]);

  const handleStart = () => {
    if (permissionGranted === false) {
      setPermission(null);
    }
    recorder.startRecording((rec: WaveformRecord) => {
      addRecording(rec);
      setJustAddedId(rec.id);
      setTimeout(() => setJustAddedId(null), 2500);
    });
  };

  const handleEnd = () => {
    if (permissionGranted !== true) {
      setPermission(true);
    }
    recorder.stopRecording();
  };

  return (
    <div className="min-h-screen w-full relative grid-bg">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6 md:px-8 md:py-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, #00ffcc 0%, #38bdf8 50%, #a78bfa 100%)",
                boxShadow: "0 0 30px rgba(0, 255, 204, 0.35)",
              }}
            >
              <AudioWaveform className="w-6 h-6 text-[#06141d]" strokeWidth={2.4} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{
                  background:
                    "linear-gradient(90deg, #00ffcc 0%, #38bdf8 60%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                声纹涂鸦 · VoiceWave Doodle
              </h1>
              <p className="text-sm text-cyber-muted mt-0.5">
                按住按钮哼一段旋律，把声音变成画布上的心电图指纹
              </p>
            </div>
          </div>
          <Toolbar />
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-6 xl:gap-8">
          <section className="space-y-6">
            <div
              className="relative rounded-3xl overflow-hidden scope-screen scanline noise"
              style={{ height: 280 }}
            >
              <LiveWaveCanvas
                liveData={recorder.liveData}
                isRecording={recorder.isRecording}
              />
              <div className="absolute top-4 left-5 flex items-center gap-2 pointer-events-none">
                <Activity
                  className={`w-4 h-4 ${
                    recorder.isRecording ? "text-[#ff2d95]" : "text-cyber-accent"
                  }`}
                />
                <span
                  className={`text-xs font-mono tracking-widest uppercase ${
                    recorder.isRecording ? "text-[#ff2d95]" : "text-cyber-accent/80"
                  }`}
                  style={{
                    textShadow: recorder.isRecording
                      ? "0 0 10px rgba(255,45,149,0.7)"
                      : undefined,
                  }}
                >
                  {recorder.isRecording ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#ff2d95] animate-rec-blink" />
                      LIVE REC
                    </span>
                  ) : (
                    "OSCILLOSCOPE · IDLE"
                  )}
                </span>
              </div>

              {!recorder.isRecording && permissionGranted === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                  <div className="flex items-start gap-3 max-w-md">
                    <AlertTriangle className="w-6 h-6 text-cyber-amber shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-cyber-amber mb-1">
                        麦克风权限被拒绝
                      </div>
                      <div className="text-sm text-cyber-muted leading-relaxed">
                        {permissionError ||
                          "请在浏览器地址栏左侧点击权限图标，允许使用麦克风后重试。"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative rounded-3xl border border-cyber-border/70 bg-gradient-to-br from-[#0d1320]/80 to-[#0a101c]/60 backdrop-blur-sm p-8 md:p-10">
              <div className="absolute top-5 right-6 text-xs font-mono text-cyber-muted/80 tracking-widest uppercase">
                PUSH &middot; HOLD &middot; RELEASE
              </div>
              <div className="flex flex-col items-center py-2">
                <RecordButton
                  isRecording={recorder.isRecording}
                  elapsedMs={recorder.elapsedMs}
                  maxMs={recorder.maxDurationMs}
                  disabled={false}
                  onPressStart={handleStart}
                  onPressEnd={handleEnd}
                />
                <div className="mt-10 max-w-md text-center space-y-2 text-sm text-cyber-muted/90 leading-relaxed">
                  <p>
                    想一段旋律，<span className="text-cyber-accent">按住</span>
                    下方按钮哼唱，松开后波形自动存入声纹库。
                  </p>
                  <p className="text-xs text-cyber-muted/70">
                    录音数据完全保存在你的浏览器本地，不会上传任何服务器。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: "第1次", v: "按住录音" },
                { k: "第2次", v: "生成波形" },
                { k: "第3次", v: "标注备注" },
                { k: "第4次", v: "收集指纹" },
              ].map((it, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-cyber-border/70 bg-cyber-card/40 p-4 hover:border-cyber-accent/30 transition-all"
                >
                  <div className="text-xs font-mono text-cyber-accent/80 tracking-wider mb-1">
                    {it.k}
                  </div>
                  <div className="text-sm font-medium text-cyber-text">
                    {it.v}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative min-h-[600px]">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-5 h-5 text-cyber-accent" />
                  <h2 className="text-lg font-semibold text-cyber-text">
                    声音指纹库
                  </h2>
                  <span className="text-xs font-mono text-cyber-muted px-2 py-0.5 rounded-md bg-cyber-card/60 border border-cyber-border/70">
                    {recordings.length}
                  </span>
                </div>
                {justAddedId && (
                  <div className="text-xs text-cyber-accent animate-fade-in flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-accent opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-accent" />
                    </span>
                    新波形已入库
                  </div>
                )}
              </div>

              {recordings.length === 0 ? (
                <div className="relative rounded-3xl border border-dashed border-cyber-border/80 bg-cyber-card/20 p-10 md:p-14 text-center overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(0,255,204,0.25), transparent 70%)",
                        border: "1px dashed rgba(0, 255, 204, 0.3)",
                      }}
                    >
                      <AudioWaveform
                        className="w-8 h-8 text-cyber-accent/80"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div>
                      <div className="text-base font-medium text-cyber-text mb-1">
                        还没有任何声音指纹
                      </div>
                      <div className="text-sm text-cyber-muted/80 leading-relaxed max-w-sm mx-auto">
                        按住左侧的录音按钮，哼唱一段旋律或发出任何声音，
                        <br className="hidden md:block" />
                        你的第一条波形就会出现在这里。
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-50">
                    <svg className="w-full h-full">
                      <defs>
                        <pattern
                          id="empty-grid"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="rgba(0,255,204,0.06)"
                            strokeWidth="1"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="url(#empty-grid)"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div
                  className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 -mr-2"
                  style={{ scrollbarGutter: "stable" }}
                >
                  {recordings.map((rec, i) => (
                    <WaveformCard
                      key={rec.id}
                      rec={rec}
                      index={recordings.length - 1 - i}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-14 pt-6 border-t border-cyber-border/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-cyber-muted/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyber-accent animate-rec-blink" />
            <span>All data stored locally · No cloud uploads · No tracking</span>
          </div>
          <div className="font-mono tracking-wider">
            VoiceWave Doodle · v1.0 · Built with Web Audio + Canvas
          </div>
        </footer>
      </div>
    </div>
  );
}
