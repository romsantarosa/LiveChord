import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Pause, RotateCcw, Settings, Wifi, WifiOff, Columns } from 'lucide-react';
import { Song } from '../types';
import SongViewer from './SongViewer';
import { cn } from '../lib/utils';

interface ShowModeProps {
  songs: Song[];
  initialSongIndex?: number;
  onClose: () => void;
}

export default function ShowMode({ songs, initialSongIndex = 0, onClose }: ShowModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSongIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColumnMode, setIsColumnMode] = useState(false);
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

  // Handle controls visibility
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls]);

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
    <div 
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col"
      onDoubleClick={() => setShowControls(!showControls)}
    >
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
                className="p-2.5 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={24} />
              </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white leading-tight">{currentSong.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">{currentSong.artist}</p>
                  <span className="w-1 h-1 rounded-full bg-zinc-800" />
                  <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[10px] font-bold border border-orange-500/20">
                    {currentSong.currentKey}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsColumnMode(!isColumnMode)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all",
                  isColumnMode ? "bg-orange-500 text-black" : "bg-zinc-900/50 text-zinc-400 border border-zinc-800"
                )}
                title={isColumnMode ? "Desativar 2 Colunas" : "Ativar 2 Colunas"}
              >
                <Columns size={16} />
                <span className="hidden sm:inline">2 Colunas</span>
              </button>

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
        <AnimatePresence initial={false}>
          {songs.map((song, index) => {
            // Render current, previous and next songs for smooth transitions and background loading
            const isNeighbor = Math.abs(index - currentIndex) <= 1;
            if (!isNeighbor) return null;

            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, x: index > currentIndex ? '100%' : '-100%' }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0.5, 
                  x: (index - currentIndex) * 100 + '%',
                  scale: index === currentIndex ? 1 : 0.9,
                  zIndex: index === currentIndex ? 10 : 0
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) nextSong();
                  else if (info.offset.x > 100) prevSong();
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                className="absolute inset-0 touch-pan-y"
              >
                <SongViewer 
                  song={{
                    ...song,
                    fontSize: (song.fontSize || 18) * 1.2 // Auto-increase font for show mode
                  }}
                  onUpdate={() => {}} // Read-only in show mode
                  onBack={onClose}
                  isSetlistMode={true}
                  onNext={nextSong}
                  onPrev={prevSong}
                  hideControls={!showControls}
                  isActive={index === currentIndex}
                  isColumnMode={isColumnMode}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
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
              <div className="flex gap-1 mb-2">
                {songs.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all ${idx === currentIndex ? 'w-8 bg-orange-500' : 'w-2 bg-zinc-800'}`}
                  />
                ))}
              </div>
              {currentIndex < songs.length - 1 && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  <span>Próxima:</span>
                  <span className="text-white">{songs[currentIndex + 1].title}</span>
                </div>
              )}
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
