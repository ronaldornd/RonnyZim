"use client";

import React, { useRef, useEffect } from "react";

interface WaveVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export function WaveVisualizer({ analyser, isRecording }: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const draw = () => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Gradient Setup (Cyber-Mystic Green)
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(0, 255, 127, 0)");
    gradient.addColorStop(0.5, "rgba(0, 255, 127, 0.8)");
    gradient.addColorStop(1, "rgba(0, 255, 127, 0)");

    ctx.lineWidth = 2;
    ctx.strokeStyle = gradient;
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    if (isRecording) {
      requestRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    if (isRecording && analyser) {
      requestRef.current = requestAnimationFrame(draw);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRecording, analyser]);

  return (
    <div className="relative w-full h-24 bg-black/20 rounded-lg border border-emerald-500/20 overflow-hidden backdrop-blur-md">
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="w-full h-full"
      />
      
      {/* SCANNING LINE EFFECT */}
      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/10" />
      
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center text-emerald-500/40 text-[10px] font-mono tracking-[0.2em]">
          [ WAITING FOR UPLINK... ]
        </div>
      )}
    </div>
  );
}
