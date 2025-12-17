"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Props {
  label: string;
  onCapture: (file: File | null) => void;
  value: File | null;
}

export default function SmartDocumentInput({ label, onCapture, value }: Props) {
  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // --- FILE UPLOAD LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onCapture(e.target.files[0]);
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode("camera");
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !stream) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${label.replace(" ", "_")}_capture.jpg`, { type: "image/jpeg" });
          onCapture(file);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setMode("idle");
  };

  // --- RENDER ---
  if (value) {
    return (
      <div className="relative h-40 w-full rounded-xl overflow-hidden border-2 border-green-500/50 bg-zinc-900 group">
        <img src={URL.createObjectURL(value)} alt="Preview" className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <CheckCircle2 className="text-green-500 mb-2" size={32} />
          <p className="text-white font-bold text-sm">{label} Added</p>
          <Button 
            size="sm" 
            variant="destructive" 
            className="mt-2 h-8 text-xs"
            onClick={() => onCapture(null)}
          >
            Remove & Retake
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "camera") {
    return (
      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-black border border-zinc-700">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-2 left-0 w-full flex justify-center gap-4">
          <Button size="sm" variant="secondary" onClick={stopCamera} className="rounded-full h-10 w-10 p-0"><X size={18}/></Button>
          <Button size="sm" onClick={takePhoto} className="rounded-full h-10 w-10 p-0 bg-white hover:bg-zinc-200 text-black border-4 border-zinc-300"><div className="w-full h-full rounded-full" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-40 w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs gap-2 h-9">
          <Upload size={14} /> Upload
        </Button>
        <Button variant="default" size="sm" onClick={startCamera} className="text-xs gap-2 h-9 bg-zinc-900 dark:bg-white text-white dark:text-black">
          <Camera size={14} /> Camera
        </Button>
      </div>
      <p className="text-[10px] text-zinc-400">JPG, PNG or PDF</p>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
    </div>
  );
}