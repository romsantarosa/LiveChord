import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useWakeLock } from '../hooks/useWakeLock';
import ChordRenderer from './ChordRenderer';

interface ShowModeProps {
  songs: Song[];
  initialSongIndex?: number;
  onClose: () => void;
  active: boolean;
}

export default function ShowMode({ songs, initialSongIndex = 0, onClose, active }: ShowModeProps) {
  const [currentIndex, setCurrentIndex] = useState(initialSongIndex);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [fontSize, setFontSize] = useState(24);
  const [showControls, setShowControls] = useState(true);
  const { isWakeLocked, toggleWakeLock, requestWakeLock } = useWakeLock();

  // Update currentIndex when initialSongIndex changes and component is active
  useEffect(() => {
    if (active) {
      setCurrentIndex(initialSongIndex);
    }
  }, [initialSongIndex, active]);
  
  const currentSong = songs[currentIndex];

  const {
    isScrolling,
    speed: scrollSpeed,
    setSpeed: setScrollSpeed,
    startScroll,
    stopScroll,
    manualScroll,
    scrollRef
  } = useAutoScroll<HTMLDivElement>({
    initialSpeed: currentSong?.autoScrollSpeed || 5,
    isActive: active
  });

  const [scrollAmount, setScrollAmount] = useState(150);

  // Auto-request wake lock on mount or when active
  useEffect(() => {
    if (active) {
      requestWakeLock();
    }
  }, [requestWakeLock, active]);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (active && showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, active]);

  const nextSong = useCallback(() => {
    if (currentIndex < songs.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
      stopScroll();
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex, songs.length, stopScroll, scrollRef]);

  const prevSong = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
      stopScroll();
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [currentIndex, stopScroll, scrollRef]);

  const handleScreenClick = (e: React.MouseEvent) => {
    // If controls are hidden, show them on any tap
    if (!showControls) {
      setShowControls(true);
      // Also trigger manual scroll on tap if hidden
      manualScroll(scrollAmount);
      return;
    }

    // If controls are visible:
    // Any tap on the screen (outside buttons) scrolls down and hides controls
    setShowControls(false);
    manualScroll(scrollAmount);
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (!active) return null;

  // 1) CORRIGIR SHOWMODE - Validação
  if (!currentSong || !currentSong.content) {
    return (
      <div style={{
        background: 'black',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <p>ERRO: música sem conteúdo</p>
        <button 
          onClick={onClose}
          className="p-2.5 md:p-3 bg-zinc-900 rounded-xl text-xs uppercase tracking-widest font-bold"
        >
          Voltar
        </button>
      </div>
    );
  }

  // 2) NÃO MODIFICAR OBJETO DIRETAMENTE
  const enhancedSong = {
    ...currentSong,
    fontSize: (fontSize || 18) * 1.2
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col font-sans" 
      style={{ 
        background: 'black', 
        color: 'white', 
        minHeight: '100vh' 
      }}
      // 6) CONTROLES INTELIGENTES
      onClick={() => setShowControls(true)}
    >
      {/* Tap Zones & Content */}
      <div 
        className="flex-1 relative overflow-hidden"
        onClick={handleScreenClick}
      >
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto px-6 py-12 scrollbar-hide"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
              transition={{ 
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);
                if (swipe < -swipeConfidenceThreshold) {
                  nextSong();
                } else if (swipe > swipeConfidenceThreshold) {
                  prevSong();
                }
              }}
              className="max-w-4xl mx-auto cursor-grab active:cursor-grabbing"
            >
              <header className="mb-8 border-b border-zinc-800 pb-6">
                <h1 className="text-2xl sm:text-4xl font-black mb-1 text-white uppercase tracking-tighter">
                  {enhancedSong.title}
                </h1>
                <p className="text-lg sm:text-xl text-zinc-500 font-bold uppercase tracking-widest">
                  {enhancedSong.artist}
                </p>
              </header>

              <ChordRenderer 
                content={enhancedSong.content}
                fontSize={enhancedSong.fontSize}
                transpose={0}
                showChords={true}
                className="pb-[50vh]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Overlay Controls */}
      <AnimatePresence>
        {showControls && (
          <>
            {/* Top Bar - Minimal */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 z-[110]"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2.5 md:p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl text-orange-500 border border-white/10 shadow-xl hover:bg-zinc-800 transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>

            {/* Floating Controls - Bottom Right */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 0.8, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-[20px] right-[20px] z-[110] flex flex-col gap-3 items-end"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Secondary Controls (Speed/Font) */}
              <div className="flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-2.5 md:p-3 rounded-xl border border-white/10 shadow-2xl w-64">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Velocidade</span>
                    <span className="text-sm font-mono font-black text-orange-500">{scrollSpeed}</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="20"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Fonte</span>
                    <span className="text-sm font-mono font-black text-white">{fontSize}</span>
                  </div>
                  <input 
                    type="range"
                    min="16"
                    max="60"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Toque (px)</span>
                    <span className="text-sm font-mono font-black text-blue-400">{scrollAmount}</span>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="500"
                    step="10"
                    value={scrollAmount}
                    onChange={(e) => setScrollAmount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-400"
                  />
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md p-2.5 md:p-3 rounded-xl border border-white/10 shadow-2xl">
                <button 
                  onClick={prevSong}
                  disabled={currentIndex === 0}
                  className="p-2.5 md:p-3 text-white disabled:opacity-20 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>

                <button 
                  onClick={() => isScrolling ? stopScroll() : startScroll()}
                  className={cn(
                    "px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all",
                    isScrolling ? "bg-red-600 text-white" : "bg-white text-black"
                  )}
                >
                  {isScrolling ? (
                    <><Pause size={14} fill="currentColor" /> Parar</>
                  ) : (
                    <><Play size={14} fill="currentColor" /> Iniciar</>
                  )}
                </button>

                <button 
                  onClick={nextSong}
                  disabled={currentIndex === songs.length - 1}
                  className="p-2.5 md:p-3 text-white disabled:opacity-20 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Status Info */}
              <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                {currentIndex + 1} / {songs.length} • {isWakeLocked ? 'Wake Lock ON' : 'Wake Lock OFF'}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
