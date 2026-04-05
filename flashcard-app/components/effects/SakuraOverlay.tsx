"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

interface VocabEntry { word: string; meaning: string }

interface Petal {
  id: number; vocab: VocabEntry;
  x: number; y: number; r: number;
  vx: number; vy: number; angle: number; va: number;
  sw: number; sphase: number; color: string; alpha: number; alive: boolean;
}

const FALLBACK: Record<string, VocabEntry[]> = {
  daily:      [{ word:"serene",meaning:"thanh thản"},{word:"cherish",meaning:"trân trọng"},{word:"linger",meaning:"nán lại"},{word:"tender",meaning:"dịu dàng"},{word:"radiant",meaning:"rạng rỡ"},{word:"tranquil",meaning:"yên bình"},{word:"flourish",meaning:"phát triển"},{word:"solace",meaning:"an ủi"}],
  business:   [{ word:"leverage",meaning:"tận dụng"},{word:"synergy",meaning:"cộng lực"},{word:"pivot",meaning:"chuyển hướng"},{word:"agile",meaning:"linh hoạt"},{word:"scalable",meaning:"mở rộng được"},{word:"iterate",meaning:"lặp lại"}],
  technology: [{ word:"latency",meaning:"độ trễ"},{word:"encryption",meaning:"mã hóa"},{word:"abstraction",meaning:"trừu tượng hóa"},{word:"redundancy",meaning:"dư thừa"},{word:"inference",meaning:"suy luận"},{word:"neural",meaning:"thần kinh"}],
  ielts:      [{ word:"ubiquitous",meaning:"có mặt khắp nơi"},{word:"eloquent",meaning:"hùng hồn"},{word:"mitigate",meaning:"giảm nhẹ"},{word:"paradigm",meaning:"mô hình điển hình"},{word:"ambiguous",meaning:"mơ hồ"},{word:"lucid",meaning:"rõ ràng"}],
};

const COLORS = ["#f7c5d0","#f4afc3","#f9d6de","#e8a0b4","#fce4ec","#f2b8c6"];

function drawPetal(ctx: CanvasRenderingContext2D, r: number, color: string) {
  const p = (n: number) => n * r;
  for (const s of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(p(s*1.2),p(-1.8),p(s*2.2),p(-0.8),p(s*1.8),p(0.5));
    ctx.bezierCurveTo(p(s*1.4),p(1.5), p(s*0.4),p(1.2), 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function detectTopic(pathname: string): string {
  if (pathname.includes("/topics/")) {
    return pathname.split("/topics/")[1]?.split("/")[0]?.toLowerCase() ?? "daily";
  }
  return "daily";
}

interface Props {
  topic?: string;
  maxPetals?: number;
  enabled?: boolean;
}

export default function SakuraOverlay({ topic: topicProp, maxPetals = 35, enabled = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const vocabRef  = useRef<VocabEntry[]>([]);
  const frameRef  = useRef<number>(0);
  const tRef      = useRef(0);
  const idRef     = useRef(0);

  const [hoveredWord, setHoveredWord] = useState<VocabEntry | null>(null);
  const [tipPos, setTipPos]           = useState({ x: 0, y: 0 });
  const [aiLoaded, setAiLoaded]       = useState(false);

  const pathname = usePathname();
  const topic = topicProp ?? detectTopic(pathname);

  // ── Fetch vocab from internal API ──
  useEffect(() => {
    vocabRef.current = [...(FALLBACK[topic] ?? FALLBACK.daily)];
    setAiLoaded(false);

    fetch(`/api/sakura-vocab?topic=${encodeURIComponent(topic)}&count=15`)
      .then((r) => r.json())
      .then(({ words }) => {
        if (Array.isArray(words) && words.length > 0) {
          vocabRef.current = words;
          setAiLoaded(true);
        }
      })
      .catch(() => {});
  }, [topic]);

  const spawnPetal = useCallback((W: number) => {
    const vocab = vocabRef.current;
    if (!vocab.length) return;
    const entry = vocab[Math.floor(Math.random() * vocab.length)];
    petalsRef.current.push({
      id: idRef.current++, vocab: entry,
      x: Math.random() * W, y: -30,
      r: 9 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 0.7,
      vy: 0.55 + Math.random() * 0.65,
      angle: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.035,
      sw: 40 + Math.random() * 60,
      sphase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0, alive: true,
    });
  }, []);

  // ── Canvas loop ──
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);
      tRef.current++;
      const t = tRef.current;

      if (t % 60 === 0 && petalsRef.current.filter(p => p.alive).length < maxPetals) spawnPetal(W);
      petalsRef.current = petalsRef.current.filter(p => p.alive);

      for (const p of petalsRef.current) {
        p.alpha  = Math.min(1, p.alpha + 0.025);
        p.y     += p.vy;
        p.x     += p.vx + Math.sin(t / p.sw + p.sphase) * 0.35;
        p.angle += p.va;
        if (p.y > H + 40) { p.alive = false; continue; }

        ctx.save();
        ctx.globalAlpha = p.alpha * 0.88;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        drawPetal(ctx, p.r, p.color);
        ctx.rotate(-p.angle);
        ctx.font = `500 ${Math.max(9, Math.round(p.r * 0.88))}px 'Segoe UI',sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(70,30,20,0.82)";
        ctx.fillText(p.vocab.word, 0, -p.r * 2.5);
        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    for (let i = 0; i < 18; i++) setTimeout(() => spawnPetal(canvas.width), i * 140);
    frameRef.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener("resize", resize); };
  }, [enabled, maxPetals, spawnPetal]);

  // ── Hover via document (canvas stays pointer-events-none) ──
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = [...petalsRef.current].reverse().find(p => p.alive && Math.hypot(p.x - mx, p.y - my) < p.r * 2.8);
      setHoveredWord(hit?.vocab ?? null);
      setTipPos({ x: e.clientX + 14, y: e.clientY - 10 });
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 50, pointerEvents: "none" }} />

      {hoveredWord && (
        <div className="fixed z-[51] px-3 py-2 rounded-xl"
          style={{ left: tipPos.x, top: tipPos.y, background: "rgba(26,12,8,0.88)", backdropFilter: "blur(6px)", transform: "translateY(-50%)", pointerEvents: "none", minWidth: 110 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fce4ec" }}>{hoveredWord.word}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#f48fb1" }}>{hoveredWord.meaning}</p>
        </div>
      )}

      {aiLoaded && (
        <div className="fixed bottom-4 right-4 z-[51]"
          style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(200,150,160,0.55)", pointerEvents: "none" }}>
          AI · {topic}
        </div>
      )}
    </>
  );
}