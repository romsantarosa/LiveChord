import React from 'react';
import { AnimatePresence } from 'motion/react';
import { SongControls } from './SongControls';
import SmartScroll from './SmartScroll';
import { Song } from '../types';

interface PerformanceControllerProps {
  song: Song;
  isActive: boolean;
  isSmartScrollActive: boolean;
  isScrolling: boolean;
  scrollSpeed: number;
  currentKey: string;
  fontSize: number;
  showChords: boolean;
  hideControls: boolean;
  isEditing: boolean;
  onTranspose: (semitones: number) => void;
  onSetFontSize: (size: number) => void;
  onToggleChords: () => void;
  onToggleSmartScroll: () => void;
  onToggleScroll: () => void;
  onSetScrollSpeed: (speed: number) => void;
  onSmartScrollAction: (adjustment: number) => void;
}

/**
 * Component that coordinates performance-related features:
 * - Floating controls
 * - Smart Scroll (Eye tracking)
 * - Auto Scroll state
 */
export const PerformanceController: React.FC<PerformanceControllerProps> = ({
  song,
  isActive,
  isSmartScrollActive,
  isScrolling,
  scrollSpeed,
  currentKey,
  fontSize,
  showChords,
  hideControls,
  isEditing,
  onTranspose,
  onSetFontSize,
  onToggleChords,
  onToggleSmartScroll,
  onToggleScroll,
  onSetScrollSpeed,
  onSmartScrollAction
}) => {
  return (
    <>
      <SmartScroll 
        isActive={isActive && isSmartScrollActive} 
        onScrollAction={onSmartScrollAction} 
      />

      <AnimatePresence>
        {!hideControls && !isEditing && (
          <SongControls 
            currentKey={currentKey}
            fontSize={fontSize}
            showChords={showChords}
            isSmartScrollActive={isSmartScrollActive}
            isScrolling={isScrolling}
            scrollSpeed={scrollSpeed}
            onTranspose={onTranspose}
            onSetFontSize={onSetFontSize}
            onToggleChords={onToggleChords}
            onToggleSmartScroll={onToggleSmartScroll}
            onToggleScroll={onToggleScroll}
            onSetScrollSpeed={onSetScrollSpeed}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PerformanceController;
