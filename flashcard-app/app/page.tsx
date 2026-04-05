"use client";

import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ── same animated bg as login/register ──────────────────────────────────────
function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    interface P {
      x:number;y:number;vx:number;vy:number;size:number;alpha:number;char:string;
      type:"kanji"|"dot"|"line";angle:number;va:number;len:number;life:number;maxLife:number;
    }
    const KANJI=["桜","語","学","花","心","道","水","山","風","光","空","夢","愛","詩","書"];
    const ps: P[] = [];

    const spawn=()=>{
      const W=canvas.width,H=canvas.height;
      const r=Math.random();
      const type:"kanji"|"dot"|"line"=r<0.25?"kanji":r<0.55?"dot":"line";
      ps.push({x:Math.random()*W,y:H*0.2+Math.random()*H*0.8,vx:(Math.random()-.5)*.28,vy:-.12-Math.random()*.22,
        size:type==="kanji"?12+Math.random()*16:1.5+Math.random()*3,alpha:0,
        char:KANJI[Math.floor(Math.random()*KANJI.length)],type,
        angle:Math.random()*Math.PI*2,va:(Math.random()-.5)*.007,len:24+Math.random()*72,
        life:0,maxLife:200+Math.random()*320});
    };
    for(let i=0;i<50;i++) ps.push({x:Math.random()*1400,y:Math.random()*900,vx:0,vy:-.2,size:13,alpha:0,
      char:KANJI[i%KANJI.length],type:"kanji",angle:Math.random()*Math.PI*2,va:.005,len:40,
      life:Math.floor(Math.random()*280),maxLife:380});

    let frame=0,raf:number;
    const loop=()=>{
      const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#f0ebe3"; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle="rgba(140,110,90,0.18)"; ctx.lineWidth=.5;
      for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      frame++;
      if(frame%18===0&&ps.length<90) spawn();
      for(let i=ps.length-1;i>=0;i--){
        const p=ps[i]; p.life++;
        p.x+=p.vx+Math.sin(frame*.007+i*.4)*.1; p.y+=p.vy; p.angle+=p.va;
        const prog=p.life/p.maxLife;
        p.alpha=prog<.12?prog/.12:prog>.78?1-(prog-.78)/.22:1;
        if(p.life>=p.maxLife||p.y<-80){ps.splice(i,1);continue;}
        ctx.save(); ctx.globalAlpha=p.alpha*.55;
        if(p.type==="kanji"){
          ctx.font=`300 ${p.size}px serif`;ctx.textAlign="center";ctx.textBaseline="middle";
          ctx.fillStyle="#3d2218";ctx.translate(p.x,p.y);ctx.rotate(p.angle*.25);ctx.fillText(p.char,0,0);
        }else if(p.type==="dot"){
          ctx.fillStyle="#a06040";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
        }else{
          ctx.strokeStyle="#905030";ctx.lineWidth=1.2;ctx.beginPath();
          const dx=Math.cos(p.angle)*p.len*.5,dy=Math.sin(p.angle)*p.len*.5;
          ctx.moveTo(p.x-dx,p.y-dy);ctx.lineTo(p.x+dx,p.y+dy);ctx.stroke();
        }
        ctx.restore();
      }
      const t=frame*.003;
      for(const c of [{cx:W*.1,cy:H*.15,r:180,phase:0},{cx:W*.9,cy:H*.8,r:220,phase:2.1},
        {cx:W*.5,cy:H*.95,r:150,phase:4.2},{cx:W*.8,cy:H*.2,r:120,phase:1.1}]){
        const pulse=Math.sin(t+c.phase)*.5+.5;
        ctx.save();ctx.globalAlpha=.18+pulse*.1;ctx.strokeStyle="#8b5e3c";ctx.lineWidth=1;
        ctx.beginPath();ctx.arc(c.cx,c.cy,c.r+pulse*18,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.arc(c.cx,c.cy,c.r-28+pulse*12,0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();};
  },[]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{zIndex:0}}/>;
}

export default function HomePage() {

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      <AnimatedBackground />

      {/* Vignette */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 25%, rgba(240,235,227,0.5) 100%)" }} />

      {/* Content */}
      <div className="relative z-[2] flex flex-col items-center text-center px-6 max-w-2xl mx-auto">

        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-stone-200/80 text-[10px] uppercase tracking-[3px] text-stone-500">
            <span>学習アプリ</span>
            <div className="w-px h-3 bg-stone-300" />
            <span>FlashCard AI</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...fadeUp(0.07)}
          className="text-6xl font-extralight tracking-tight text-stone-800 leading-none mb-3">
          学ぶことは
        </motion.h1>
        <motion.h1 {...fadeUp(0.12)}
          className="text-6xl font-extralight tracking-tight text-stone-800 leading-none mb-8">
          生きること
        </motion.h1>

        {/* Sub */}
        <motion.p {...fadeUp(0.18)}
          className="text-sm font-light text-stone-500 tracking-wide mb-2">
          To learn is to live.
        </motion.p>
        <motion.p {...fadeUp(0.22)}
          className="text-sm text-stone-400 leading-relaxed mb-12 max-w-sm">
          AI-powered vocabulary flashcards with a Japanese touch. Build your word bank, track progress, and speak with Sakura — your personal tutor.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.27)} className="flex items-center gap-3">
          <Link href="/register">
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white text-sm font-light tracking-wide hover:bg-stone-700 transition-colors">
              Get started
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </Link>
          <Link href="/login">
            <div className="flex items-center gap-2 px-6 py-3 rounded-xl border border-stone-300/80 bg-white/50 backdrop-blur-sm text-stone-700 text-sm font-light tracking-wide hover:border-stone-500 hover:bg-white/70 transition-all">
              Sign in
            </div>
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div {...fadeUp(0.33)} className="flex items-center gap-2 mt-10 flex-wrap justify-center">
          {["Whisper voice input","Qwen AI tutor","Unsplash visuals","Shoji transitions"].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm border border-stone-200/70 text-[10px] uppercase tracking-[1.5px] text-stone-400">
              {f}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom watermark */}
      <motion.p {...fadeUp(0.4)}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[2] text-[10px] uppercase tracking-[3px] text-stone-300">
        桜 · Sakura AI · 2025
      </motion.p>
    </div>
  );
}