import { useEffect, useRef } from "react";

interface Props {
  samplePoints: number[];
  progress?: number;
  isPlaying?: boolean;
  variant?: "list" | "detail";
  color?: string;
}

export default function FixedWaveCanvas({
  samplePoints,
  progress = 0,
  isPlaying = false,
  variant = "list",
  color = "#00ffcc",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    setup();
    const ro = new ResizeObserver(setup);
    ro.observe(canvas);

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const mid = h / 2;
      ctx.clearRect(0, 0, w, h);

      if (variant === "detail") {
        ctx.strokeStyle = `${color}14`;
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
          const y = (h / 5) * i;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      const pts = samplePoints;
      if (!pts || pts.length === 0) {
        ctx.strokeStyle = `${color}55`;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      }

      const progX = Math.max(0, Math.min(1, progress)) * w;

      const ptsN = pts.length;
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = variant === "detail" ? 2 : 1.5;

      if (isPlaying) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      const renderPath = (drawX: number, colorStr: string) => {
        ctx.strokeStyle = colorStr;
        ctx.beginPath();
        for (let i = 0; i <= drawX; i++) {
          const idx = Math.min(ptsN - 1, Math.floor((i / w) * ptsN));
          let v = pts[idx] ?? 0;
          if (!isFinite(v)) v = 0;
          const amp = variant === "detail" ? h * 0.42 : h * 0.38;
          const y = mid + v * amp;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
      };

      renderPath(w, `${color}55`);
      if (progX > 0) {
        renderPath(progX, color);
      }

      if (isPlaying && progX > 0 && progX < w) {
        ctx.fillStyle = "#ff2d95";
        ctx.shadowColor = "#ff2d95";
        ctx.shadowBlur = 10;
        ctx.fillRect(progX - 1, 0, 2, h);
      }
      ctx.restore();
    }

    draw();

    return () => ro.disconnect();
  }, [samplePoints, progress, isPlaying, variant, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ display: "block" }}
    />
  );
}
