import React from 'react';
import { X, Music, Piano as PianoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChordData {
  guitar: number[]; // -1 for muted, 0 for open, 1-5 for frets
  piano: number[]; // indices of keys in an octave (0-11)
}

export const CHORD_LIBRARY: Record<string, ChordData> = {
  // Major Chords
  'C': { guitar: [-1, 3, 2, 0, 1, 0], piano: [0, 4, 7] },
  'C#': { guitar: [-1, 4, 3, 1, 2, 1], piano: [1, 5, 8] },
  'D': { guitar: [-1, -1, 0, 2, 3, 2], piano: [2, 6, 9] },
  'D#': { guitar: [-1, -1, 1, 3, 4, 3], piano: [3, 7, 10] },
  'E': { guitar: [0, 2, 2, 1, 0, 0], piano: [4, 8, 11] },
  'F': { guitar: [1, 3, 3, 2, 1, 1], piano: [5, 9, 0] },
  'F#': { guitar: [2, 4, 4, 3, 2, 2], piano: [6, 10, 1] },
  'G': { guitar: [3, 2, 0, 0, 0, 3], piano: [7, 11, 2] },
  'G#': { guitar: [4, 6, 6, 5, 4, 4], piano: [8, 0, 3] },
  'A': { guitar: [-1, 0, 2, 2, 2, 0], piano: [9, 1, 4] },
  'A#': { guitar: [-1, 1, 3, 3, 3, 1], piano: [10, 2, 5] },
  'B': { guitar: [-1, 2, 4, 4, 4, 2], piano: [11, 3, 6] },
  // Minor Chords
  'Cm': { guitar: [-1, 3, 5, 5, 4, 3], piano: [0, 3, 7] },
  'C#m': { guitar: [-1, 4, 6, 6, 5, 4], piano: [1, 4, 8] },
  'Dm': { guitar: [-1, -1, 0, 2, 3, 1], piano: [2, 5, 9] },
  'D#m': { guitar: [-1, -1, 1, 3, 4, 2], piano: [3, 6, 10] },
  'Em': { guitar: [0, 2, 2, 0, 0, 0], piano: [4, 7, 11] },
  'Fm': { guitar: [1, 3, 3, 1, 1, 1], piano: [5, 8, 0] },
  'F#m': { guitar: [2, 4, 4, 2, 2, 2], piano: [6, 9, 1] },
  'Gm': { guitar: [3, 5, 5, 3, 3, 3], piano: [7, 10, 2] },
  'G#m': { guitar: [4, 6, 6, 4, 4, 4], piano: [8, 11, 3] },
  'Am': { guitar: [-1, 0, 2, 2, 1, 0], piano: [9, 0, 4] },
  'A#m': { guitar: [-1, 1, 3, 3, 2, 1], piano: [10, 1, 5] },
  'Bm': { guitar: [-1, 2, 4, 4, 3, 2], piano: [11, 2, 6] },
};

interface ChordVisualizerProps {
  chord: string | null;
  onClose: () => void;
}

export default function ChordVisualizer({ chord, onClose }: ChordVisualizerProps) {
  if (!chord) return null;

  // Normalize chord name for lookup (e.g., Db -> C#)
  let normalizedChord = chord
    .replace('Db', 'C#')
    .replace('Eb', 'D#')
    .replace('Gb', 'F#')
    .replace('Ab', 'G#')
    .replace('Bb', 'A#');
    
  // If not found, try to find the base major/minor (e.g., D7 -> D, Dm7 -> Dm)
  if (!CHORD_LIBRARY[normalizedChord]) {
    const baseMatch = normalizedChord.match(/^([A-G][#b]?m?)/);
    if (baseMatch && CHORD_LIBRARY[baseMatch[1]]) {
      normalizedChord = baseMatch[1];
    }
  }
    
  const data = CHORD_LIBRARY[normalizedChord];

  return (
    <AnimatePresence>
      {chord && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-3xl sm:rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 flex flex-col items-center">
              <div className="w-full flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex flex-col">
                  <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">{chord}</h2>
                  <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Diagrama de Acorde</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-zinc-800 text-zinc-400 rounded-full hover:text-white transition-colors"
                >
                  <X size={20} className="sm:size-6" />
                </button>
              </div>

              {!data ? (
                <div className="py-12 text-zinc-600 text-center">
                  <Music size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Diagrama não disponível</p>
                  <p className="text-xs mt-1">Estamos trabalhando para adicionar mais acordes.</p>
                </div>
              ) : (
                <div className="w-full space-y-10">
                  {/* Guitar Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Music size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Violão</span>
                    </div>
                    <div className="flex justify-center">
                      <GuitarDiagram frets={data.guitar} />
                    </div>
                  </div>

                  {/* Piano Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-orange-500">
                      <PianoIcon size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Piano</span>
                    </div>
                    <div className="flex justify-center">
                      <PianoDiagram activeKeys={data.piano} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GuitarDiagram({ frets, size = "normal" }: { frets: number[], size?: "normal" | "small" }) {
  const strings = 6;
  const fretCount = 5;
  
  // Find the starting fret if the chord is high up
  const minFret = Math.min(...frets.filter(f => f > 0));
  const startFret = minFret > 4 ? minFret : 1;

  const width = size === "small" ? 60 : 160;
  const height = size === "small" ? 70 : 180;
  const nutY = size === "small" ? 10 : 20;
  const fretSpacing = size === "small" ? 12 : 30;
  const stringSpacing = size === "small" ? 8 : 24;
  const dotRadius = size === "small" ? 3 : 8;
  const paddingX = size === "small" ? 10 : 20;

  return (
    <div className={cn("relative px-1", size === "small" ? "pt-2" : "pt-6 px-4")}>
      {startFret > 1 && (
        <div className={cn("absolute font-bold text-zinc-600", size === "small" ? "-left-1 top-4 text-[6px]" : "-left-2 top-10 text-[10px]")}>
          {startFret}fr
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Nut */}
        <line x1={paddingX} y1={nutY} x2={paddingX + 5 * stringSpacing} y2={nutY} stroke={startFret === 1 ? "white" : "#333"} strokeWidth={size === "small" ? "2" : "4"} />
        
        {/* Frets */}
        {[1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={paddingX} y1={nutY + i * fretSpacing} x2={paddingX + 5 * stringSpacing} y2={nutY + i * fretSpacing} stroke="#333" strokeWidth={size === "small" ? "1" : "2"} />
        ))}
        
        {/* Strings */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <line key={i} x1={paddingX + i * stringSpacing} y1={nutY} x2={paddingX + i * stringSpacing} y2={nutY + 5 * fretSpacing} stroke="#333" strokeWidth="1" />
        ))}

        {/* Dots */}
        {frets.map((fret, stringIdx) => {
          if (fret === -1) {
            return (
              <text key={stringIdx} x={paddingX + stringIdx * stringSpacing} y={nutY - 4} textAnchor="middle" fill="#666" fontSize={size === "small" ? "6" : "12"} fontWeight="bold">X</text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={stringIdx} cx={paddingX + stringIdx * stringSpacing} cy={nutY - 5} r={size === "small" ? "1.5" : "4"} fill="none" stroke="#666" strokeWidth={size === "small" ? "0.5" : "1.5"} />
            );
          }
          
          const relativeFret = fret - startFret + 1;
          if (relativeFret < 1 || relativeFret > 5) return null;

          return (
            <circle 
              key={stringIdx} 
              cx={paddingX + stringIdx * stringSpacing} 
              cy={nutY + relativeFret * fretSpacing - (fretSpacing/2)} 
              r={dotRadius} 
              fill="#f97316" 
            />
          );
        })}
      </svg>
    </div>
  );
}

export function PianoDiagram({ activeKeys, size = "normal" }: { activeKeys: number[], size?: "normal" | "small" }) {
  const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
  const blackKeys = [1, 3, 6, 8, 10];
  
  const width = size === "small" ? 100 : 280;
  const height = size === "small" ? 30 : 80;
  const whiteKeyWidth = size === "small" ? 7 : 19;
  const blackKeyWidth = size === "small" ? 5 : 14;
  const blackKeyHeight = size === "small" ? 18 : 45;
  const spacing = size === "small" ? 7.14 : 20;

  return (
    <div className={cn("bg-zinc-800 p-1 rounded-lg overflow-hidden", size === "small" ? "p-0.5" : "p-1")}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* White Keys */}
        {Array.from({ length: 14 }).map((_, i) => {
          const keyIndex = [0, 2, 4, 5, 7, 9, 11][i % 7] + (Math.floor(i / 7) * 12);
          const isActive = activeKeys.includes(keyIndex % 12);
          return (
            <rect 
              key={i} 
              x={i * spacing} 
              y="0" 
              width={whiteKeyWidth} 
              height={height} 
              fill={isActive ? "#f97316" : "white"} 
              rx={size === "small" ? "1" : "2"}
            />
          );
        })}
        
        {/* Black Keys */}
        {Array.from({ length: 14 }).map((_, i) => {
          const octave = Math.floor(i / 7);
          const posInOctave = i % 7;
          if (posInOctave === 2 || posInOctave === 6) return null;
          
          const blackKeyMap: Record<number, number> = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
          const keyIndex = blackKeyMap[posInOctave] + (octave * 12);
          const isActive = activeKeys.includes(keyIndex % 12);

          return (
            <rect 
              key={`b-${i}`} 
              x={i * spacing + (spacing * 0.65)} 
              y="0" 
              width={blackKeyWidth} 
              height={blackKeyHeight} 
              fill={isActive ? "#fb923c" : "black"} 
              rx={size === "small" ? "0.5" : "2"}
            />
          );
        })}
      </svg>
    </div>
  );
}
