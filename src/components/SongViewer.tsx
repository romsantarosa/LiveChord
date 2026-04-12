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
  X as CloseIcon,
  Eye
} from 'lucide-react';
import YouTube from 'react-youtube';
import { Song } from '../types';
import { transposeContent, cn } from '../lib/utils';
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
}

export default function SongViewer({ 
  song, 
  onUpdate, 
  onBack, 
  onShowMode,
  isSetlistMode, 
  onNext, 
  onPrev,
  hideControls = false
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
  const [fontSize, setFontSize] = useState(song.fontSize || 18);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollInterval = useRef<number | null>(null);

  useEffect(() => {
    if (isScrolling) {
      scrollInterval.current = window.setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += 1;
        }
      }, 100 / scrollSpeed);
    } else {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    }
    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [isScrolling, scrollSpeed]);

  const handleTranspose = (semitones: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentIndex = notes.indexOf(currentKey);
    const newIndex = (currentIndex + semitones + 12) % 12;
    const newKey = notes[newIndex];
    
    const newContent = transposeContent(song.content, semitones);
    onUpdate({
      ...song,
      content: newContent,
      currentKey: newKey
    });
    setCurrentKey(newKey);
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
        currentChord = part.slice(1, -1);
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
      <div key={index} className={cn("flex flex-wrap", showChords ? "mb-8 mt-6" : "mb-2")}>
        {elements.map((el, eIdx) => (
          <div key={eIdx} className="relative flex flex-col">
            {showChords && el.chord && (
              <span 
                className="absolute -top-7 left-0 font-bold text-orange-500 whitespace-nowrap" 
                style={{ fontSize: fontSize * 0.75 }}
              >
                {el.chord}
              </span>
            )}
            <span 
              className="text-white whitespace-pre leading-tight" 
              style={{ fontSize }}
            >
              {el.text || (eIdx === elements.length - 1 ? '' : '\u00A0')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <AnimatePresence>
        {!hideControls && (
          <motion.div 
            initial={{ y: -64 }}
            animate={{ y: 0 }}
            exit={{ y: -64 }}
            className="h-16 bg-zinc-900 flex items-center justify-between px-4 border-b border-zinc-800 shrink-0 z-50"
          >
            <button onClick={onBack} className="p-2 text-zinc-400 hover:text-white">
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h2 className="text-white font-bold truncate max-w-[200px]">{song.title}</h2>
              <span className="text-zinc-500 text-xs">{song.artist} • Tom: {currentKey}</span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95"
                  >
                    <Check size={16} />
                    <span>SALVAR</span>
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <CloseIcon size={20} />
                  </button>
                </>
              ) : (
                <>
                  {onShowMode && (
                    <button 
                      onClick={onShowMode}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black px-2 sm:px-3 py-1 rounded-lg font-bold text-[10px] sm:text-xs transition-all active:scale-95 mr-1 sm:mr-2"
                    >
                      <Play size={12} fill="currentColor" className="sm:w-[14px] sm:h-[14px]" />
                      <span>SHOW</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-zinc-400 hover:text-white"
                    title="Editar Música"
                  >
                    <Edit2 size={20} />
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
          isActive={isSmartScrollActive} 
          onScrollAction={handleSmartScrollAction} 
        />

        {showYoutube && song.youtubeId && (
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
          className="flex-1 overflow-y-auto p-6 scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="max-w-3xl mx-auto pb-32">
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
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-6 z-50"
            >
              <AnimatePresence>
                {isScrolling && !isSmartScrollActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-4"
                  >
                    <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Velocidade</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setScrollSpeed(Math.max(1, scrollSpeed - 1))} className="text-white"><Minus size={16} /></button>
                      <span className="text-white font-mono w-4 text-center">{scrollSpeed}</span>
                      <button onClick={() => setScrollSpeed(Math.min(20, scrollSpeed + 1))} className="text-white"><Plus size={16} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-zinc-900/90 backdrop-blur-md p-2 rounded-2xl border border-zinc-800 flex items-center gap-2 shadow-2xl">
                <div className="flex items-center border-r border-zinc-800 pr-2 mr-2">
                  <button onClick={() => handleTranspose(-1)} className="p-3 text-zinc-400 hover:text-white"><Minus size={20} /></button>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Tom</span>
                    <span className="text-white font-bold">{currentKey}</span>
                  </div>
                  <button onClick={() => handleTranspose(1)} className="p-3 text-zinc-400 hover:text-white"><Plus size={20} /></button>
                </div>

                {!isSmartScrollActive && (
                  <button 
                    onClick={() => setIsScrolling(!isScrolling)}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                      isScrolling ? "bg-red-600 text-white" : "bg-white text-black"
                    )}
                  >
                    {isScrolling ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                  </button>
                )}

                <div className="flex items-center border-l border-zinc-800 pl-2 ml-2">
                  <button 
                    onClick={() => setIsSmartScrollActive(!isSmartScrollActive)} 
                    className={cn("p-3 transition-colors", isSmartScrollActive ? "text-orange-500" : "text-zinc-600")}
                    title="Smart Scroll (Rastreamento Ocular)"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => setShowChords(!showChords)} 
                    className={cn("p-3 transition-colors", showChords ? "text-orange-500" : "text-zinc-600")}
                    title={showChords ? "Ocultar Acordes" : "Exibir Acordes"}
                  >
                    <Music size={20} />
                  </button>
                  <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-3 text-zinc-400 hover:text-white"><Type size={18} className="scale-75" /></button>
                  <button onClick={() => setFontSize(Math.min(40, fontSize + 2))} className="p-3 text-zinc-400 hover:text-white"><Type size={22} /></button>
                </div>
              </div>
            </motion.div>
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
