import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause, RotateCcw, Settings, Wifi, WifiOff } from 'lucide-react';
import { Song } from '../types';
import SongViewer from './SongViewer';

interface ShowModeProps {
  songs: Song[];
  initialSongIndex?: number;
  onClose: () => void;
}

export default function ShowMode({ songs, initialSongIndex = 0, onClose }: ShowModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSongIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSong = songs[currentIndex];

  if (!currentSong) {
    return (
      <div className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Nenhuma música encontrada</p>
          <button onClick={onClose} className="bg-zinc-800 px-4 py-2 rounded-xl">Voltar</button>
        </div>
      </div>
    );
  }

  // Wake Lock implementation
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Wake Lock is active');
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    };

    requestWakeLock();

    return () => {
      wakeLock?.release().then(() => setWakeLock(null));
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const resetTimeout = () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('touchstart', resetTimeout);
    resetTimeout();

    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('touchstart', resetTimeout);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nextSong = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSong = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col">
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-orange-500">{currentSong.title}</h2>
                <p className="text-xs text-zinc-400 uppercase tracking-widest">{currentSong.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-full border border-zinc-800">
                <div className={`w-2 h-2 rounded-full ${wakeLock ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Wake Lock</span>
              </div>
              
              <button 
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSong.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            <SongViewer 
              song={currentSong}
              onUpdate={() => {}} // Read-only in show mode
              onBack={onClose}
              isSetlistMode={true}
              onNext={nextSong}
              onPrev={prevSong}
              hideControls={!showControls}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays (Invisible click areas) */}
        {!showControls && (
          <>
            <div 
              className="absolute left-0 top-0 bottom-0 w-20 z-40 cursor-pointer" 
              onClick={prevSong}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-20 z-40 cursor-pointer" 
              onClick={nextSong}
            />
          </>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-8 flex items-center justify-center gap-12"
          >
            <button 
              onClick={prevSong}
              disabled={currentIndex === 0}
              className="p-4 bg-zinc-900/80 hover:bg-orange-500 hover:text-black rounded-2xl transition-all disabled:opacity-20 disabled:hover:bg-zinc-900/80 disabled:hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Música {currentIndex + 1} de {songs.length}</span>
              <div className="flex gap-1">
                {songs.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-orange-500' : 'w-2 bg-zinc-800'}`}
                  />
                ))}
              </div>
            </div>

            <button 
              onClick={nextSong}
              disabled={currentIndex === songs.length - 1}
              className="p-4 bg-zinc-900/80 hover:bg-orange-500 hover:text-black rounded-2xl transition-all disabled:opacity-20 disabled:hover:bg-zinc-900/80 disabled:hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
