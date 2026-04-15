import React, { useMemo } from 'react';
import { parseSong, convertToChordPro, SongLine } from '../lib/parser';
import { transposeChord } from '../lib/transpose';
import { cn } from '../lib/utils';

interface ChordRendererProps {
  content: string;
  transpose?: number;
  fontSize?: number;
  showChords?: boolean;
  onChordClick?: (chord: string) => void;
  className?: string;
}

/**
 * Component to render song lyrics with chords aligned above them.
 * Optimized with useMemo for performance.
 */
export const ChordRenderer: React.FC<ChordRendererProps> = ({
  content,
  transpose = 0,
  fontSize = 16,
  showChords = true,
  onChordClick,
  className
}) => {
  // Parse and transpose content only when content or transpose changes
  const parsedLines = useMemo(() => {
    const chordProContent = convertToChordPro(content);
    return parseSong(chordProContent);
  }, [content]);

  const renderLine = (line: SongLine, index: number) => {
    if (line.type === 'empty') {
      return <div key={index} className="h-4" aria-hidden="true" />;
    }

    // Process line into segments of { chord, text }
    const segments: { chord: string | null; text: string }[] = [];
    
    if (line.chords.length === 0) {
      segments.push({ chord: null, text: line.lyrics });
    } else {
      // Sort chords by position just in case
      const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);
      
      let lastPos = 0;
      for (let i = 0; i < sortedChords.length; i++) {
        const current = sortedChords[i];
        const next = sortedChords[i + 1];
        
        // Transpose the chord if needed
        const displayChord = transpose !== 0 
          ? transposeChord(current.chord, transpose) 
          : current.chord;
        
        // Handle text before the first chord
        if (i === 0 && current.position > 0) {
          segments.push({ 
            chord: null, 
            text: line.lyrics.slice(0, current.position) 
          });
        }
        
        // Text between this chord and the next chord (or end of line)
        const textEnd = next ? next.position : line.lyrics.length;
        const text = line.lyrics.slice(current.position, textEnd);
        
        segments.push({ chord: displayChord, text });
      }
    }

    return (
      <div 
        key={index} 
        className={cn(
          "flex flex-wrap break-inside-avoid", 
          showChords ? "mb-6 mt-4" : "mb-2"
        )}
      >
        {segments.map((segment, sIdx) => (
          <div key={sIdx} className="inline-flex flex-col align-bottom">
            {showChords && (
              <div 
                onClick={() => segment.chord && onChordClick?.(segment.chord)}
                className={cn(
                  "h-[1.2em] font-bold text-orange-500 font-mono whitespace-pre leading-none transition-colors",
                  segment.chord ? "cursor-pointer hover:text-orange-400 underline decoration-orange-500/30 underline-offset-4" : ""
                )}
                style={{ fontSize: fontSize * 0.85 }}
              >
                {segment.chord || '\u00A0'}
              </div>
            )}
            <div 
              className="text-white font-mono whitespace-pre leading-none" 
              style={{ fontSize }}
            >
              {segment.text || (sIdx === segments.length - 1 && segment.chord ? '\u00A0' : '')}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("w-full select-none", className)}>
      {parsedLines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default ChordRenderer;
