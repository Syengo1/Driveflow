"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onRecordingComplete: (videoBlob: Blob) => void;
}

export default function VideoLivenessRecorder({ onRecordingComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      setError("Camera access denied. Please enable permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      onRecordingComplete(blob);
      setIsCompleted(true);
      stopCamera();
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setCountdown(5);

    // Auto-stop after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (recorder.state !== 'inactive') recorder.stop();
          setIsRecording(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reset = () => {
    setIsCompleted(false);
    setIsRecording(false);
    setCountdown(5);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  if (error) {
    return <div className="p-4 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20 text-center">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center border border-zinc-800">
        {!isCompleted ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-white font-bold">Liveness Captured</p>
            <p className="text-zinc-400 text-xs">Ready for verification</p>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" /> REC {countdown}s
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isCompleted ? (
          !isRecording ? (
            <Button onClick={startRecording} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold">
              <Video className="mr-2 h-4 w-4" /> Start Security Scan
            </Button>
          ) : (
            <Button disabled className="w-full bg-red-500/10 text-red-500 border border-red-500/20">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
            </Button>
          )
        ) : (
          <Button onClick={reset} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <RefreshCw className="mr-2 h-4 w-4" /> Retake Video
          </Button>
        )}
      </div>
    </div>
  );
}