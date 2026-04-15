import { useState, useMemo, useCallback } from 'react';
import { Song } from '../types';
import { useAutoScroll } from './useAutoScroll';
import { useWakeLock } from './useWakeLock';
import { parseSong, convertToChordPro } from '../lib/parser';
import { transposeChord, normalizeNote } from '../lib/transpose';

export function useSongViewer(song: Song, onUpdate: (updatedSong: Song) => void, isActive: boolean) {
  const { isWakeLocked, toggleWakeLock } = useWakeLock();
  const [isSmartScrollActive, setIsSmartScrollActive] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(song.content);
  const [currentKey, setCurrentKey] = useState(song.currentKey || song.originalKey);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [fontSize, setFontSize] = useState(song.fontSize || 18);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [showChordBar, setShowChordBar] = useState(false);
  const [instrumentPreference, setInstrumentPreference] = useState<'guitar' | 'piano'>('guitar');

  const {
    isScrolling,
    speed: scrollSpeed,
    setSpeed: setScrollSpeed,
    startScroll,
    stopScroll,
    scrollRef
  } = useAutoScroll<HTMLDivElement>({
    initialSpeed: song.autoScrollSpeed || 5,
    isActive: isActive && !isSmartScrollActive
  });

  const handleTranspose = useCallback((semitones: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentIndex = notes.indexOf(normalizeNote(currentKey));
    if (currentIndex === -1) return;
    
    const newIndex = (currentIndex + semitones + 12) % 12;
    const newKey = notes[newIndex];
    
    setTransposeOffset(prev => prev + semitones);
    setCurrentKey(newKey);
    
    onUpdate({
      ...song,
      currentKey: newKey
    });
  }, [currentKey, onUpdate, song]);

  const handleSaveEdit = useCallback(() => {
    onUpdate({
      ...song,
      content: editContent
    });
    setIsEditing(false);
  }, [editContent, onUpdate, song]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(song.content);
    setIsEditing(false);
  }, [song.content]);

  const handleSmartScrollAction = useCallback((adjustment: number) => {
    if (adjustment === -99) {
      stopScroll();
      return;
    }
    if (!isScrolling) startScroll();
    setScrollSpeed(prev => Math.min(20, Math.max(1, prev + (adjustment * 2))));
  }, [isScrolling, startScroll, stopScroll, setScrollSpeed]);

  const uniqueChords = useMemo(() => {
    const parsedSong = parseSong(convertToChordPro(song.content));
    const chords = new Set<string>();
    parsedSong.forEach(line => {
      line.chords.forEach(cp => {
        const transposed = transposeOffset !== 0 ? transposeChord(cp.chord, transposeOffset) : cp.chord;
        chords.add(transposed);
      });
    });
    return Array.from(chords).sort();
  }, [song.content, transposeOffset]);

  return {
    isWakeLocked,
    toggleWakeLock,
    isSmartScrollActive,
    setIsSmartScrollActive,
    showYoutube,
    setShowYoutube,
    showChords,
    setShowChords,
    isEditing,
    setIsEditing,
    editContent,
    setEditContent,
    currentKey,
    transposeOffset,
    fontSize,
    setFontSize,
    selectedChord,
    setSelectedChord,
    showChordBar,
    setShowChordBar,
    instrumentPreference,
    setInstrumentPreference,
    isScrolling,
    scrollSpeed,
    setScrollSpeed,
    startScroll,
    stopScroll,
    scrollRef,
    handleTranspose,
    handleSaveEdit,
    handleCancelEdit,
    handleSmartScrollAction,
    uniqueChords
  };
}
