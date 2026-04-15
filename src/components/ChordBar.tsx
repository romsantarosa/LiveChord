import React from 'react';
import { motion } from 'motion/react';
import { Music, Piano as PianoIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { CHORD_LIBRARY, GuitarDiagram, PianoDiagram } from './ChordVisualizer';

interface ChordBarProps {
  uniqueChords: string[];
  instrumentPreference: 'guitar' | 'piano';
  onSetInstrumentPreference: (pref: 'guitar' | 'piano') => void;
  onSelectChord: (chord: string) => void;
}

export const ChordBar: React.FC<ChordBarProps> = ({
  uniqueChords,
  instrumentPreference,
  onSetInstrumentPreference,
  onSelectChord
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-zinc-900/50 border-b border-zinc-800 overflow-hidden shrink-0 z-40"
    >
      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => onSetInstrumentPreference('guitar')}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                instrumentPreference === 'guitar' ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500 hover:text-white"
              )}
            >
              <Music size={10} className="sm:size-3" />
              Violão
            </button>
            <button 
              onClick={() => onSetInstrumentPreference('piano')}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                instrumentPreference === 'piano' ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500 hover:text-white"
              )}
            >
              <PianoIcon size={10} className="sm:size-3" />
              Piano
            </button>
          </div>
          <span className="text-[8px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            {uniqueChords.length} Acordes
          </span>
        </div>

        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {uniqueChords.map(chord => {
            let normalizedChord = chord
              .replace('Db', 'C#')
              .replace('Eb', 'D#')
              .replace('Gb', 'F#')
              .replace('Ab', 'G#')
              .replace('Bb', 'A#');
            
            // Fallback
            if (!CHORD_LIBRARY[normalizedChord]) {
              const baseMatch = normalizedChord.match(/^([A-G][#b]?m?)/);
              if (baseMatch && CHORD_LIBRARY[baseMatch[1]]) {
                normalizedChord = baseMatch[1];
              }
            }

            const data = CHORD_LIBRARY[normalizedChord];

            return (
              <div 
                key={chord} 
                className="flex flex-col items-center gap-1.5 sm:gap-2 bg-black/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-zinc-800/50 min-w-[70px] sm:min-w-[80px] cursor-pointer hover:border-orange-500/30 transition-colors"
                onClick={() => onSelectChord(chord)}
              >
                <span className="text-xs sm:text-sm font-black text-white">{chord}</span>
                {data ? (
                  instrumentPreference === 'guitar' ? (
                    <GuitarDiagram frets={data.guitar} size="small" />
                  ) : (
                    <PianoDiagram activeKeys={data.piano} size="small" />
                  )
                ) : (
                  <div className="w-[50px] sm:w-[60px] h-[60px] sm:h-[70px] flex items-center justify-center">
                    <Music size={14} className="text-zinc-800" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
