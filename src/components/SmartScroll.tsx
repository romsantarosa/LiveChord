import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SmartScrollProps {
  onScrollAction: (speedAdjustment: number) => void;
  isActive: boolean;
}

export default function SmartScroll({ onScrollAction, isActive }: SmartScrollProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastActionRef = useRef<number>(0);

  useEffect(() => {
    async function setup() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        landmarkerRef.current = landmarker;
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load MediaPipe:", err);
        setError("Não foi possível carregar o rastreamento facial.");
      }
    }

    if (isActive && !landmarkerRef.current) {
      setup();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !isLoaded) return;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        setError("Acesso à câmera negado.");
      }
    }

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, isLoaded]);

  const predictWebcam = async () => {
    if (!videoRef.current || !landmarkerRef.current) return;

    const startTimeMs = performance.now();
    const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      
      // Look for "look down" or "look up" patterns
      // EyeLookDownLeft, EyeLookDownRight
      const lookDownLeft = blendshapes.find(c => c.categoryName === "eyeLookDownLeft")?.score || 0;
      const lookDownRight = blendshapes.find(c => c.categoryName === "eyeLookDownRight")?.score || 0;
      const lookUpLeft = blendshapes.find(c => c.categoryName === "eyeLookUpLeft")?.score || 0;
      const lookUpRight = blendshapes.find(c => c.categoryName === "eyeLookUpRight")?.score || 0;

      const avgLookDown = (lookDownLeft + lookDownRight) / 2;
      const avgLookUp = (lookUpLeft + lookUpRight) / 2;

      const now = Date.now();
      if (now - lastActionRef.current > 50) { // Ultra-responsive
        if (avgLookDown > 0.25) { // Even more sensitive
          onScrollAction(avgLookDown > 0.5 ? 2 : 1); 
          lastActionRef.current = now;
        } else if (avgLookUp > 0.45) {
          onScrollAction(-99); // Pause
          lastActionRef.current = now;
        } else if (avgLookUp > 0.2) {
          onScrollAction(-1); // Slow down
          lastActionRef.current = now;
        }
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (!isActive) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col items-end gap-2">
      <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-black border border-zinc-700">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <Loader2 size={16} className="text-orange-500 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Smart Scroll Ativo</span>
          <span className="text-[8px] text-zinc-500 uppercase">Olhar p/ baixo: Acelera</span>
          <span className="text-[8px] text-zinc-500 uppercase">Olhar p/ cima: Pausa</span>
        </div>
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 px-3 py-1 rounded-lg text-[10px] text-red-500 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
