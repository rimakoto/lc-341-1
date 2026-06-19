import { useEffect, useRef } from "react";
import type { LiveWaveData } from "@/hooks/useRecorder";

interface Props {
  liveData: LiveWaveData | null;
  isRecording: boolean;
}

export default function LiveWaveCanvas({ liveData, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Float32Array | null>(null);
  const historyLenRef = useRef(0);
  const writeIdxRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setupSizing = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setupSizing();
    const ro = new ResizeObserver(setupSizing);
    ro.observe(canvas);

    const HISTORY_LEN = 1200;
    if (!historyRef.current || historyRef.current.length !== HISTORY_LEN) {
      historyRef.current = new Float32Array(HISTORY_LEN);
      historyLenRef.current = HISTORY_LEN;
      writeIdxRef.current = 0;
    }

    let raf = 0;
    const render = () => {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const mid = h / 2;

      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(0, 255, 204, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      for (let i = 1; i < 4; i++) {
        const y1 = (h / 4) * i;
        ctx.strokeStyle = "rgba(0, 255, 204, 0.04)";
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.lineTo(w, y1);
        ctx.stroke();
      }

      if (liveData && historyRef.current) {
        const src = liveData.timeData;
        const dst = historyRef.current;
        const N = historyLenRef.current;
        const pushCount = Math.min(src.length, N);
        const wi = writeIdxRef.current;
        for (let i = 0; i < pushCount; i++) {
          dst[(wi + i) % N] = src[src.length - pushCount + i];
        }
        writeIdxRef.current = (wi + pushCount) % N;
      }

      if (historyRef.current) {
        const hist = historyRef.current;
        const N = historyLenRef.current;
        const wi = writeIdxRef.current;

        ctx.save();
        ctx.shadowColor = "rgba(0, 255, 204, 0.8)";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const histIdx = (wi - N + Math.floor((x / w) * N) + N * 2) % N;
          const v = hist[histIdx] || 0;
          const y = mid + v * (h * 0.42);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(0, 255, 204, 0.25)");
        grad.addColorStop(1, "rgba(0, 255, 204, 0)");
        ctx.lineTo(w, mid);
        ctx.lineTo(0, mid);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        if (isRecording) {
          const headX = ((wi % N) / N) * w;
          ctx.save();
          ctx.fillStyle = "rgba(255, 45, 149, 0.9)";
          ctx.shadowColor = "rgba(255, 45, 149, 0.9)";
          ctx.shadowBlur = 14;
          ctx.fillRect(headX - 1, 0, 2, h);
          ctx.restore();
        }
      }

      if (!isRecording && !liveData) {
        ctx.save();
        ctx.strokeStyle = "rgba(0, 255, 204, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [liveData, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ display: "block" }}
    />
  );
}
