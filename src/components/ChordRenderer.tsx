import React, { useMemo } from 'react';
import { parseSong, convertToChordPro, SongLine } from '../lib/parser';
import { transposeSong } from '../lib/transpose';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface ChordRendererProps {
  content: string;
  transpose?: number;
  fontSize?: number;
  showChords?: boolean;
  onChordClick?: (chord: string) => void;
  className?: string;
}

/**
 * Component to render song lyrics with chords aligned exactly above them.
 * Uses a professional two-line approach with monospace font for perfect alignment.
 */
export const ChordRenderer: React.FC<ChordRendererProps> = ({
  content,
  transpose = 0,
  fontSize: propFontSize,
  showChords = true,
  onChordClick,
  className
}) => {
  const { fontSize: globalFontSize, fontType } = useSettings();
  
  // Map font size strings to pixel values
  const fontSizeMap = {
    small: 13,
    medium: 16,
    large: 20,
    huge: 26
  };
  
  const fontSize = propFontSize || fontSizeMap[globalFontSize];
  // 1) Protective check for content
  if (!content) {
    return <div className="text-zinc-500 italic p-4">Música sem conteúdo</div>;
  }

  // 2) Transpose and Parse with error handling
  const parsedLines = useMemo(() => {
    try {
      const safeContent = content || "";
      // Apply transpose before parsing to ensure positions are calculated on the final text
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
   * Renders a single line of the song with chords aligned above lyrics.
   * Guaranteed to separate chords even if they are at the same position.
   */
  const renderLine = (line: SongLine, index: number) => {
    if (line.type === 'empty') {
      return <div key={index} className="h-4 sm:h-6" aria-hidden="true" />;
    }

    if (!showChords || !line.chords || line.chords.length === 0) {
      return (
        <div key={index} className="mb-4 text-zinc-900 dark:text-white transition-colors" style={{ fontSize, fontFamily: `var(--font-${fontType})` }}>
          {line.lyrics || '\u00A0'}
        </div>
      );
    }

    // Professional Responsive Chunking Logic:
    // Create chunks that contain a chord and the text until the next chord.
    // Wrap them in inline-blocks so they stay aligned even when the line wraps.
    const chunks: { chord?: string, text: string }[] = [];
    const sortedChords = [...line.chords].sort((a, b) => a.position - b.position);
    
    let lastPos = 0;
    sortedChords.forEach((cp, i) => {
      // Text before the first chord or between chords
      if (cp.position > lastPos) {
        if (chunks.length === 0) {
          chunks.push({ text: line.lyrics.substring(0, cp.position) });
        } else {
          chunks[chunks.length - 1].text += line.lyrics.substring(lastPos, cp.position);
        }
      }
      
      chunks.push({ chord: cp.chord, text: '' });
      lastPos = cp.position;
    });

    // Remaining text
    if (lastPos < line.lyrics.length) {
      if (chunks.length === 0) {
        chunks.push({ text: line.lyrics });
      } else {
        chunks[chunks.length - 1].text += line.lyrics.substring(lastPos);
      }
    }

    return (
      <div 
        key={index} 
        className={cn(
          "select-none w-full flex flex-wrap items-end mb-6 theme-transition", 
          `font-${fontType}`
        )}
        style={{ lineHeight: 1.6, fontSize }}
      >
        {chunks.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="inline-flex flex-col items-start align-bottom leading-tight">
            {chunk.chord && (
              <span 
                onClick={() => onChordClick?.(chunk.chord!)}
                className="text-sky-400 font-bold hover:text-sky-300 underline decoration-sky-400/30 underline-offset-4 cursor-pointer mb-0.5"
              >
                {chunk.chord}
              </span>
            )}
            <span className="text-zinc-900 dark:text-white whitespace-pre transition-colors">
              {chunk.text || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("w-full max-w-full", className)}>
      {parsedLines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export default ChordRenderer;
