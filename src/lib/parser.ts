export interface ChordPosition {
  chord: string;
  position: number;
}

export interface SongLine {
  type: 'line' | 'empty';
  chords: ChordPosition[];
  lyrics: string;
}

/**
 * Parses a song content (ChordPro format) into a structured format.
 * Example input: "[Dm]Do Egito, escravo fui"
 * Example output: [{ type: "line", chords: [{ chord: "Dm", position: 0 }], lyrics: "Do Egito, escravo fui" }]
 */
export function parseSong(content: string): SongLine[] {
  if (!content) return [];

  const lines = content.split('\n');
  const parsedLines: SongLine[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      parsedLines.push({
        type: 'empty',
        chords: [],
        lyrics: ''
      });
      continue;
    }

    const chords: ChordPosition[] = [];
    let lyrics = '';
    let currentPosition = 0;

    // Split by chord brackets but keep them to process
    // Regex: /(\[.*?\])/g
    const parts = line.split(/(\[.*?\])/g);

    for (const part of parts) {
      if (part.startsWith('[') && part.endsWith(']')) {
        const chord = part.slice(1, -1);
        chords.push({
          chord,
          position: currentPosition
        });
      } else {
        lyrics += part;
        currentPosition += part.length;
      }
    }

    parsedLines.push({
      type: 'line',
      chords,
      lyrics
    });
  }

  return parsedLines;
}

/**
 * Helper to check if a line is a traditional chord line (not ChordPro).
 * Useful if we want to auto-convert traditional format to ChordPro before parsing.
 */
export function isTraditionalChordLine(line: string): boolean {
  if (!line.trim()) return false;
  if (line.includes('[') && line.includes(']')) return false;

  const words = line.trim().split(/\s+/);
  const chordRegex = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*(\/[A-G][#b]?)?$/;

  const chordCount = words.filter(w => chordRegex.test(w)).length;
  return chordCount > 0 && chordCount >= words.length * 0.7;
}

/**
 * Converts traditional chord lines + lyric lines into ChordPro format.
 */
export function convertToChordPro(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    if (isTraditionalChordLine(currentLine) && nextLine && !isTraditionalChordLine(nextLine)) {
      const chordRegex = /[A-G][#b]?(m|maj|min|dim|aug|sus|add|7|9|11|13|M)*(\/[A-G][#b]?)?/g;
      let match;
      const chordsWithPos: { chord: string, pos: number }[] = [];

      while ((match = chordRegex.exec(currentLine)) !== null) {
        chordsWithPos.push({ chord: match[0], pos: match.index });
      }

      // Sort descending to insert from end to start
      chordsWithPos.sort((a, b) => b.pos - a.pos);

      let lyricLine = nextLine;
      chordsWithPos.forEach(({ chord, pos }) => {
        if (lyricLine.length < pos) {
          lyricLine = lyricLine.padEnd(pos, ' ');
        }
        lyricLine = lyricLine.slice(0, pos) + `[${chord}]` + lyricLine.slice(pos);
      });

      result.push(lyricLine);
      i++; // Skip next line
    } else {
      result.push(currentLine);
    }
  }

  return result.join('\n');
}
