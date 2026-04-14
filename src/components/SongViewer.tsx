import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  Play, 
  Pause, 
  Youtube, 
  Settings, 
  Maximize2, 
  Minimize2,
  Type,
  Music,
  Edit2,
  Check,
  X,
  Save,
  Eye
} from 'lucide-react';
import YouTube from 'react-youtube';
import { Song } from '../types';
import { transposeContent, transposeChord, normalizeNote, cn } from '../lib/utils';
import SmartScroll from './SmartScroll';

interface SongViewerProps {
  song: Song;
  onUpdate: (updatedSong: Song) => void;
  onBack: () => void;
  onShowMode?: () => void;
  isSetlistMode?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  hideControls?: boolean;
  isActive?: boolean;
  isColumnMode?: boolean;
}

export default function SongViewer({ 
  song, 
  onUpdate, 
  onBack, 
  onShowMode,
  isSetlistMode, 
  onNext, 
  onPrev,
  hideControls = false,
  isActive = true,
  isColumnMode = false
}: SongViewerProps) {
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const wakeLock = useRef<any>(null);

  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (!isWakeLocked) {
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLocked(true);
        } else {
          await wakeLock.current.release();
          setIsWakeLocked(false);
        }
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (wakeLock.current) wakeLock.current.release();
    };
  }, []);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(song.autoScrollSpeed || 5);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSmartScrollActive, setIsSmartScrollActive] = useState(false);
  const [editContent, setEditContent] = useState(song.content);
  const [currentKey, setCurrentKey] = useState(song.currentKey || song.originalKey);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [fontSize, setFontSize] = useState(song.fontSize || 18);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !isScrolling || isSmartScrollActive) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
      return;
    }

    const scroll = (time: number) => {
      if (lastTimeRef.current !== null) {
        const deltaTime = time - lastTimeRef.current;
        if (scrollRef.current) {
          // Speed calculation: scrollSpeed 1-20
          // At speed 10, we want roughly 30px per second
          const pixelsPerMs = (scrollSpeed * 3) / 1000;
          scrollRef.current.scrollTop += pixelsPerMs * deltaTime;
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(scroll);
    };

    requestRef.current = requestAnimationFrame(scroll);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isScrolling, scrollSpeed, isActive, isSmartScrollActive]);

  const handleTranspose = (semitones: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentIndex = notes.indexOf(normalizeNote(currentKey));
    if (currentIndex === -1) return;
    
    const newIndex = (currentIndex + semitones + 12) % 12;
    const newKey = notes[newIndex];
    
    setTransposeOffset(prev => prev + semitones);
    setCurrentKey(newKey);
    
    // We still notify the parent about the key change for persistence
    onUpdate({
      ...song,
      currentKey: newKey
    });
  };

  const handleSaveEdit = () => {
    onUpdate({
      ...song,
      content: editContent
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(song.content);
    setIsEditing(false);
  };

  const handleSmartScrollAction = (adjustment: number) => {
    if (adjustment === -99) {
      setIsScrolling(false);
      return;
    }
    if (!isScrolling) setIsScrolling(true);
    // Increase the impact of each adjustment
    setScrollSpeed(prev => Math.min(20, Math.max(1, prev + (adjustment * 2))));
  };

  const processContent = (content: string) => {
    const lines = content.split('\n');
    const processedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      
      // Check if current line looks like a chord line
      // A chord line has chords (A-G...) and lots of spaces, and no common long words
      const isChordLine = (line: string) => {
        if (!line.trim()) return false;
        // If it already has ChordPro brackets, it's not a traditional chord line
        if (line.includes('[') && line.includes(']')) return false;
        
        const words = line.trim().split(/\s+/);
        const chordRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*(\/[A-G][#b]?)?$/;
        
        const chordCount = words.filter(w => chordRegex.test(w)).length;
        return chordCount > 0 && chordCount >= words.length * 0.7;
      };

      if (isChordLine(currentLine) && nextLine && !isChordLine(nextLine)) {
        // Merge chord line into the next lyric line
        let mergedLine = '';
        let lastPos = 0;
        
        // Find positions of chords in the current line
        const chordRegex = /[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*(\/[A-G][#b]?)?/g;
        let match;
        const chordsWithPos: { chord: string, pos: number }[] = [];
        
        while ((match = chordRegex.exec(currentLine)) !== null) {
          chordsWithPos.push({ chord: match[0], pos: match.index });
        }
        
        // Sort by position descending to insert from end to start
        chordsWithPos.sort((a, b) => b.pos - a.pos);
        
        let lyricLine = nextLine;
        chordsWithPos.forEach(({ chord, pos }) => {
          // Pad lyric line if it's shorter than the chord position
          if (lyricLine.length < pos) {
            lyricLine = lyricLine.padEnd(pos, ' ');
          }
          lyricLine = lyricLine.slice(0, pos) + `[${chord}]` + lyricLine.slice(pos);
        });
        
        processedLines.push(lyricLine);
        i++; // Skip the next line as we merged it
      } else {
        processedLines.push(currentLine);
      }
    }
    
    return processedLines;
  };

  const renderLine = (line: string, index: number) => {
    if (!line.trim()) return <div key={index} className="h-4" />;

    // Split line into parts: text and [chords]
    const parts = line.split(/(\[.*?\])/g);
    
    const elements: { chord: string | null, text: string }[] = [];
    let currentChord: string | null = null;

    parts.forEach((part) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const rawChord = part.slice(1, -1);
        currentChord = transposeOffset !== 0 ? transposeChord(rawChord, transposeOffset) : rawChord;
      } else if (part !== '') {
        elements.push({ chord: currentChord, text: part });
        currentChord = null;
      }
    });

    // If there's a trailing chord with no text after it
    if (currentChord) {
      elements.push({ chord: currentChord, text: '' });
    }

    return (
      <div key={index} className={cn("flex flex-wrap break-inside-avoid", showChords ? "mb-8 mt-6" : "mb-3")}>
        {elements.map((el, eIdx) => (
          <div key={eIdx} className="inline-flex flex-col align-bottom">
            {showChords && (
              <div 
                className="h-[1.2em] font-bold text-orange-500 font-mono whitespace-pre leading-none" 
                style={{ fontSize: fontSize * 0.8 }}
              >
                {el.chord || '\u00A0'}
              </div>
            )}
            <div 
              className="text-white font-mono whitespace-pre leading-none" 
              style={{ fontSize }}
            >
              {el.text || (eIdx === elements.length - 1 && el.chord ? '\u00A0' : '')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-black flex flex-col overflow-hidden",
      !isActive && "pointer-events-none",
      "absolute inset-0"
    )}>
      {/* Header */}
      <AnimatePresence>
        {!hideControls && (
          <motion.div 
            initial={{ y: -64 }}
            animate={{ y: 0 }}
            exit={{ y: -64 }}
            className="h-16 bg-zinc-900 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0 z-50"
          >
            <button onClick={onBack} className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h2 className="text-white font-bold text-base sm:text-lg truncate max-w-[180px] sm:max-w-[300px] leading-tight">{song.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider font-medium">{song.artist}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[10px] font-bold border border-orange-500/20">
                  {currentKey}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 bg-orange-500 text-black px-4 py-2 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
                  >
                    <Save size={16} />
                    <span className="hidden sm:inline">SALVAR</span>
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </>
              ) : (
                <>
                  {onShowMode && isSetlistMode && (
                    <button 
                      onClick={onShowMode}
                      className="flex items-center gap-2 bg-orange-500 text-black px-4 py-2 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
                    >
                      <Play size={14} fill="currentColor" />
                      <span className="hidden sm:inline uppercase tracking-widest">Show</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
                    title="Editar Música"
                  >
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={toggleWakeLock}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isWakeLocked ? "bg-yellow-500 text-black" : "text-zinc-400"
                    )}
                    title="Modo Performance (Manter tela ligada)"
                  >
                    <Maximize2 size={20} />
                  </button>
                  {song.youtubeId && (
                    <button 
                      onClick={() => setShowYoutube(!showYoutube)}
                      className={cn("p-2 rounded-full", showYoutube ? "bg-red-600 text-white" : "text-zinc-400")}
                    >
                      <Youtube size={20} />
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <SmartScroll 
          isActive={isActive && isSmartScrollActive} 
          onScrollAction={handleSmartScrollAction} 
        />

        {showYoutube && song.youtubeId && isActive && (
          <div className="w-full aspect-video bg-black shrink-0">
            <YouTube 
              videoId={song.youtubeId} 
              opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0 } }}
              className="w-full h-full"
            />
          </div>
        )}

        <div 
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto p-6 scroll-smooth",
            isColumnMode && "overflow-hidden h-full"
          )}
          style={{ scrollbarWidth: 'none' }}
        >
          <div className={cn(
            "max-w-3xl mx-auto pb-32",
            isColumnMode && "max-w-none columns-2 gap-x-12 h-full pb-0 [column-fill:auto]"
          )}>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Editor de Cifra</span>
                  <span className="text-[10px] text-zinc-600">Dica: Use [C] para acordes sobre a letra</span>
                </div>
                <textarea
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-white font-mono text-lg min-h-[70vh] focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Digite a letra e os acordes aqui..."
                />
              </div>
            ) : (
              processContent(song.content).map((line, i) => renderLine(line, i))
            )}
          </div>
        </div>

        {/* Floating Controls */}
        <AnimatePresence>
          {!hideControls && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-50">
              {/* Key/Transpose Control */}
              <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 flex flex-col items-center gap-1 shadow-2xl">
                <button onClick={() => handleTranspose(1)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Plus size={18} />
                </button>
                <div className="flex flex-col items-center min-w-[40px] py-1">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase">Tom</span>
                  <span className="text-white font-bold text-sm">{currentKey}</span>
                </div>
                <button onClick={() => handleTranspose(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Minus size={18} />
                </button>
              </div>

              {/* Font Size Control */}
              <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 flex flex-col items-center gap-1 shadow-2xl">
                <button onClick={() => setFontSize(Math.min(40, fontSize + 2))} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Type size={20} />
                </button>
                <div className="h-[1px] w-4 bg-zinc-800 my-1" />
                <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Type size={16} />
                </button>
              </div>

              {/* Toggle Controls (Chords, Eye) */}
              <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 flex flex-col items-center gap-2 shadow-2xl">
                <button 
                  onClick={() => setShowChords(!showChords)} 
                  className={cn("p-3 rounded-xl transition-colors", showChords ? "bg-orange-500 text-black" : "text-zinc-600 hover:bg-zinc-800")}
                  title={showChords ? "Ocultar Acordes" : "Exibir Acordes"}
                >
                  <Music size={20} />
                </button>
                <button 
                  onClick={() => setIsSmartScrollActive(!isSmartScrollActive)} 
                  className={cn("p-3 rounded-xl transition-colors", isSmartScrollActive ? "bg-orange-500 text-black" : "text-zinc-600 hover:bg-zinc-800")}
                  title="Smart Scroll (Rastreamento Ocular)"
                >
                  <Eye size={20} />
                </button>
              </div>

              {/* Speed Control (Visible when scrolling) */}
              <AnimatePresence>
                {isScrolling && !isSmartScrollActive && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-800 flex flex-col items-center gap-4 shadow-2xl w-16"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase">Vel</span>
                      <span className="text-white font-mono font-bold text-sm">{scrollSpeed}</span>
                    </div>
                    
                    <div className="h-32 flex items-center justify-center py-2">
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={scrollSpeed} 
                        onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                        className="h-24 w-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500 orientation-vertical"
                        style={{ WebkitAppearance: 'slider-vertical' } as any}
                      />
                    </div>

                    <div className="flex flex-col gap-1 w-full">
                      <button 
                        onClick={() => setScrollSpeed(3)}
                        className={cn("text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed <= 5 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
                      >
                        Lento
                      </button>
                      <button 
                        onClick={() => setScrollSpeed(10)}
                        className={cn("text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed > 5 && scrollSpeed <= 15 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
                      >
                        Médio
                      </button>
                      <button 
                        onClick={() => setScrollSpeed(18)}
                        className={cn("text-[8px] py-1 rounded font-bold uppercase transition-colors", scrollSpeed > 15 ? "bg-orange-500 text-black" : "bg-zinc-800 text-zinc-500")}
                      >
                        Rápido
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
                  onClick={() => setIsScrolling(!isScrolling)}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl",
                    isScrolling ? "bg-red-600 text-white" : "bg-white text-black"
                  )}
                >
                  {isScrolling ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </motion.button>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Setlist Navigation */}
        {isSetlistMode && !hideControls && (
          <>
            <button 
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-zinc-900/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-zinc-800"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-zinc-900/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-zinc-800"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
