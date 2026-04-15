import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Type, Music, Eye, Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';

interface SongControlsProps {
  currentKey: string;
  fontSize: number;
  showChords: boolean;
  isSmartScrollActive: boolean;
  isScrolling: boolean;
  scrollSpeed: number;
  onTranspose: (semitones: number) => void;
  onSetFontSize: (size: number) => void;
  onToggleChords: () => void;
  onToggleSmartScroll: () => void;
  onToggleScroll: () => void;
  onSetScrollSpeed: (speed: number) => void;
}

export const SongControls: React.FC<SongControlsProps> = ({
  currentKey,
  fontSize,
  showChords,
  isSmartScrollActive,
  isScrolling,
  scrollSpeed,
  onTranspose,
  onSetFontSize,
  onToggleChords,
  onToggleSmartScroll,
  onToggleScroll,
  onSetScrollSpeed
}) => {
  return (
    <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 sm:gap-4 z-50">
      {/* Key/Transpose Control */}
      <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800 flex flex-col items-center gap-0.5 sm:gap-1 shadow-2xl">
        <button onClick={() => onTranspose(1)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
          <Plus size={16} className="sm:size-[18px]" />
        </button>
        <div className="flex flex-col items-center min-w-[32px] sm:min-w-[40px] py-0.5 sm:py-1">
          <span className="text-[7px] sm:text-[8px] text-zinc-500 font-bold uppercase">Tom</span>
          <span className="text-white font-bold text-xs sm:text-sm">{currentKey}</span>
        </div>
        <button onClick={() => onTranspose(-1)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
          <Minus size={16} className="sm:size-[18px]" />
        </button>
      </div>

      {/* Font Size Control */}
      <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800 flex flex-col items-center gap-0.5 sm:gap-1 shadow-2xl">
        <button onClick={() => onSetFontSize(Math.min(40, fontSize + 2))} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
          <Type size={18} className="sm:size-5" />
        </button>
        <div className="h-[1px] w-3 sm:w-4 bg-zinc-800 my-0.5 sm:my-1" />
        <button onClick={() => onSetFontSize(Math.max(12, fontSize - 2))} className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors">
          <Type size={14} className="sm:size-4" />
        </button>
      </div>

      {/* Toggle Controls (Chords, Eye) */}
      <div className="bg-zinc-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-zinc-800 flex flex-col items-center gap-1.5 sm:gap-2 shadow-2xl">
        <button 
          onClick={onToggleChords} 
          className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors", showChords ? "bg-orange-500 text-black" : "text-zinc-600 hover:bg-zinc-800")}
          title={showChords ? "Ocultar Acordes" : "Exibir Acordes"}
        >
          <Music size={18} className="sm:size-5" />
        </button>
        <button 
          onClick={onToggleSmartScroll} 
          className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors", isSmartScrollActive ? "bg-orange-500 text-black" : "text-zinc-600 hover:bg-zinc-800")}
          title="Smart Scroll (Rastreamento Ocular)"
        >
          <Eye size={18} className="sm:size-5" />
        </button>
      </div>

      {/* Speed Control (Visible when scrolling) */}
      <AnimatePresence>
        {isScrolling && !isSmartScrollActive && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-zinc-900/90 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-800 flex flex-col items-center gap-2 sm:gap-4 shadow-2xl w-12 sm:w-16"
          >
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-[7px] sm:text-[8px] text-zinc-500 font-bold uppercase">Vel</span>
              <span className="text-white font-mono font-bold text-xs sm:text-sm">{scrollSpeed}</span>
            </div>
            
            <div className="h-24 sm:h-32 flex items-center justify-center py-1 sm:py-2">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={scrollSpeed} 
                onChange={(e) => onSetScrollSpeed(parseInt(e.target.value))}
                className="h-20 sm:h-24 w-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 orientation-vertical"
                style={{ WebkitAppearance: 'slider-vertical' } as any}
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <button 
                onClick={() => onSetScrollSpeed(3)}
                className={cn("text-[6px] sm:text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed <= 5 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
              >
                <span className="hidden sm:inline">Lento</span>
                <span className="sm:hidden">L</span>
              </button>
              <button 
                onClick={() => onSetScrollSpeed(10)}
                className={cn("text-[6px] sm:text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed > 5 && scrollSpeed <= 15 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
              >
                <span className="hidden sm:inline">Médio</span>
                <span className="sm:hidden">M</span>
              </button>
              <button 
                onClick={() => onSetScrollSpeed(18)}
                className={cn("text-[6px] sm:text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed > 15 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
              >
                <span className="hidden sm:inline">Rápido</span>
                <span className="sm:hidden">R</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Button */}
      {!isSmartScrollActive && (
        <motion.button 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={onToggleScroll}
          className={cn(
            "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-2xl",
            isScrolling ? "bg-red-600 text-white" : "bg-white text-black"
          )}
        >
          {isScrolling ? <Pause size={24} className="sm:size-8" fill="currentColor" /> : <Play size={24} className="sm:size-8 ml-1" fill="currentColor" />}
        </motion.button>
      )}
    </div>
  );
};
