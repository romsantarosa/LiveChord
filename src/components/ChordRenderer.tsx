import React, { useMemo } from 'react';
import { parseSong, convertToChordPro, SongLine } from '../lib/parser';
import { transposeSong } from '../lib/transpose';
import { cn } from '../lib/utils';

interface ChordRendererProps {
  content: string;
  transpose?: number;
  fontSize?: number;
  showChords?: boolean;
  onChordClick?: (chord: string) => void;
  className?: string;
}

interface Segment {
  chord: string | null;
  text: string;
}

interface Word {
  segments: Segment[];
}

/**
 * Component to render song lyrics with chords aligned above them.
 * Optimized for performance and responsive wrapping.
 */
export const ChordRenderer: React.FC<ChordRendererProps> = ({
  content,
  transpose = 0,
  fontSize = 16,
  showChords = true,
  onChordClick,
  className
}) => {
  // 1) Protective check for content
  if (!content) {
    return <div className="text-zinc-500 italic p-4">Música sem conteúdo</div>;
  }

  // 2) Transpose and Parse with error handling
  const parsedLines = useMemo(() => {
    try {
      const safeContent = content || "";
      const transposed = transpose !== 0 ? transposeSong(safeContent, transpose) : safeContent;
      const chordPro = convertToChordPro(transposed);
      const result = parseSong(chordPro);
      return result && result.length ? result : [{ type: 'line', chords: [], lyrics: transposed } as SongLine];
    } catch (e) {
      console.error("ChordRenderer Error:", e);
      return [{ type: 'line', chords: [], lyrics: content } as SongLine];
    }
  }, [content, transpose]);

  /**
   * Groups segments into "words" to prevent chords from breaking away from their syllables
   * during line wrapping on mobile devices.
   */
  const getWords = (line: SongLine): Word[] => {
    const segments: Segment[] = [];
    
    if (!line.chords || line.chords.length === 0) {
      segments.push({ chord: null, text: line.lyrics || "" });
    } else {
      const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);
      
      // Handle text before the first chord
      if (sortedChords[0].position > 0) {
        segments.push({ 
          chord: null, 
          text: line.lyrics.slice(0, sortedChords[0].position) 
        });
      }
      
      for (let i = 0; i < sortedChords.length; i++) {
        const current = sortedChords[i];
        const next = sortedChords[i + 1];
        const textEnd = next ? next.position : line.lyrics.length;
        segments.push({ 
          chord: current.chord, 
          text: line.lyrics.slice(current.position, textEnd) 
        });
      }
    }

    // Group segments into words (splitting by spaces but keeping the space with the preceding word)
    const words: Word[] = [];
    let currentWordSegments: Segment[] = [];

    segments.forEach(seg => {
      const parts = seg.text.split(/(\s+)/);
      
      parts.forEach((part, idx) => {
        if (part === '') return;
        
        const isSpace = /^\s+$/.test(part);
        
        if (isSpace) {
          // Add space to current word and finish it
          currentWordSegments.push({ chord: idx === 0 ? seg.chord : null, text: part });
          words.push({ segments: currentWordSegments });
          currentWordSegments = [];
        } else {
          // If it's a new word part and we have a chord, it belongs to the start of this part
          currentWordSegments.push({ chord: idx === 0 ? seg.chord : null, text: part });
        }
      });
    });

    if (currentWordSegments.length > 0) {
      words.push({ segments: currentWordSegments });
    }

    return words;
  };

  const renderLine = (line: SongLine, index: number) => {
    if (line.type === 'empty') {
      return <div key={index} className="h-6" aria-hidden="true" />;
    }

    const words = getWords(line);

    return (
      <div 
        key={index} 
        className={cn(
          "flex flex-wrap items-end leading-none select-none", 
          showChords ? "mb-6 mt-2" : "mb-2"
        )}
      >
        {words.map((word, wIdx) => (
          <div key={wIdx} className="inline-flex whitespace-nowrap">
            {word.segments.map((seg, sIdx) => (
              <div key={sIdx} className="inline-flex flex-col">
                {showChords && (
                  <div 
                    onClick={() => seg.chord && onChordClick?.(seg.chord)}
                    className={cn(
                      "h-[1.2em] font-bold text-orange-500 font-mono whitespace-pre transition-colors",
                      seg.chord ? "cursor-pointer hover:text-orange-400 underline decoration-orange-500/30 underline-offset-4" : ""
                    )}
                    style={{ fontSize: fontSize * 0.8 }}
                  >
                    {seg.chord || '\u00A0'}
                  </div>
                )}
                <div 
                  className="text-white font-mono whitespace-pre" 
                  style={{ fontSize }}
                >
                  {seg.text}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("w-full max-w-full overflow-x-hidden", className)}>
      {parsedLines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default ChordRenderer;
