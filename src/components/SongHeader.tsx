import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Save, X, Play, Settings, Maximize2, Youtube, Music } from 'lucide-react';
import { Song } from '../types';
import { cn } from '../lib/utils';

interface SongHeaderProps {
  song: Song;
  currentKey: string;
  isEditing: boolean;
  isWakeLocked: boolean;
  showYoutube: boolean;
  showChordBar: boolean;
  isSetlistMode: boolean;
  onBack: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onToggleWakeLock: () => void;
  onToggleYoutube: () => void;
  onToggleChordBar: () => void;
  onShowMode?: () => void;
}

export const SongHeader: React.FC<SongHeaderProps> = ({
  song,
  currentKey,
  isEditing,
  isWakeLocked,
  showYoutube,
  showChordBar,
  isSetlistMode,
  onBack,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onToggleWakeLock,
  onToggleYoutube,
  onToggleChordBar,
  onShowMode
}) => {
  return (
    <motion.div 
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      exit={{ y: -64 }}
      className="h-14 sm:h-16 bg-zinc-900 flex items-center justify-between px-2 sm:px-4 border-b border-zinc-800 shrink-0 z-50"
    >
      <button onClick={onBack} className="p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all shrink-0">
        <ChevronLeft size={24} />
      </button>
      
      <div className="flex flex-col items-center flex-1 min-w-0 px-2">
        <h2 className="text-white font-bold text-sm sm:text-lg truncate w-full text-center leading-tight">{song.title}</h2>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
          <span className="text-zinc-500 text-[9px] sm:text-xs uppercase tracking-wider font-medium truncate max-w-[80px] sm:max-w-none">{song.artist}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[9px] sm:text-[10px] font-bold border border-orange-500/20">
            {currentKey}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {isEditing ? (
          <>
            <button 
              onClick={onSaveEdit}
              className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
            >
              <Save size={14} className="sm:size-4" />
              <span className="hidden xs:inline">SALVAR</span>
            </button>
            <button 
              onClick={onCancelEdit}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
            >
              <X size={18} className="sm:size-5" />
            </button>
          </>
        ) : (
          <>
            {onShowMode && isSetlistMode && (
              <button 
                onClick={onShowMode}
                className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
              >
                <Play size={12} className="sm:size-3.5" fill="currentColor" />
                <span className="hidden xs:inline uppercase tracking-widest">Show</span>
              </button>
            )}
            <button 
              onClick={onStartEdit}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
              title="Editar Música"
            >
              <Settings size={18} className="sm:size-5" />
            </button>
            <button 
              onClick={onToggleWakeLock}
              className={cn(
                "p-2 rounded-full transition-colors",
                isWakeLocked ? "bg-yellow-500 text-black" : "text-zinc-400"
              )}
              title="Modo Performance (Manter tela ligada)"
            >
              <Maximize2 size={18} className="sm:size-5" />
            </button>
            {song.youtubeId && (
              <button 
                onClick={onToggleYoutube}
                className={cn("p-2 rounded-full", showYoutube ? "bg-red-600 text-white" : "text-zinc-400")}
              >
                <Youtube size={18} className="sm:size-5" />
              </button>
            )}
            <button 
              onClick={onToggleChordBar}
              className={cn("p-2 rounded-full transition-colors", showChordBar ? "bg-orange-500 text-black" : "text-zinc-400")}
              title="Ver Diagramas de Acordes"
            >
              <Music size={18} className="sm:size-5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
