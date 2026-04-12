import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ACCIDENTALS: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'B#': 'C', 'Cb': 'B', 'E#': 'F', 'Fb': 'E'
};

export function normalizeNote(note: string): string {
  return ACCIDENTALS[note] || note;
}

export function transposeChord(chord: string, semitones: number): string {
  // Regex to find notes (A-G with optional # or b)
  return chord.replace(/[A-G][#b]?/g, (match) => {
    const normalized = normalizeNote(match);
    const index = NOTES.indexOf(normalized);
    if (index === -1) return match;
    
    const newIndex = (index + semitones + 12) % 12;
    return NOTES[newIndex];
  });
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;
  return content.replace(/\[(.*?)\]/g, (match, chord) => {
    const transposed = transposeChord(chord, semitones);
    return `[${transposed}]`;
  });
}

export function getSemitoneDifference(from: string, to: string): number {
  const fromIdx = NOTES.indexOf(normalizeNote(from));
  const toIdx = NOTES.indexOf(normalizeNote(to));
  if (fromIdx === -1 || toIdx === -1) return 0;
  return (toIdx - fromIdx + 12) % 12;
}
