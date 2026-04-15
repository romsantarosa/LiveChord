const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const ACCIDENTALS: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'B#': 'C', 'Cb': 'B', 'E#': 'F', 'Fb': 'E'
};

/**
 * Normalizes a note to its sharp equivalent if it's a flat or other accidental.
 */
export function normalizeNote(note: string): string {
  return ACCIDENTALS[note] || note;
}

/**
 * Transposes a single chord by a given number of semitones.
 * Supports A-G, #, b, and maintains suffixes like 'm', '7', 'maj7', etc.
 * Example: Dm +2 -> Em
 */
export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  // Regex to find notes (A-G with optional # or b)
  // We use a regex that captures the note part specifically
  return chord.replace(/[A-G][#b]?/g, (match) => {
    const normalized = normalizeNote(match);
    const index = NOTES.indexOf(normalized);
    
    if (index === -1) return match;
    
    const newIndex = (index + semitones + 12) % 12;
    return NOTES[newIndex];
  });
}

/**
 * Transposes all chords within a song content (ChordPro format).
 * Example: "[C]Hello [G]World" +2 -> "[D]Hello [A]World"
 */
export function transposeSong(content: string, semitones: number): string {
  if (semitones === 0) return content;
  
  // Replace everything inside [brackets]
  return content.replace(/\[(.*?)\]/g, (match, chord) => {
    const transposed = transposeChord(chord, semitones);
    return `[${transposed}]`;
  });
}

/**
 * Calculates the semitone difference between two notes.
 */
export function getSemitoneDifference(from: string, to: string): number {
  const fromIdx = NOTES.indexOf(normalizeNote(from));
  const toIdx = NOTES.indexOf(normalizeNote(to));
  
  if (fromIdx === -1 || toIdx === -1) return 0;
  
  return (toIdx - fromIdx + 12) % 12;
}
