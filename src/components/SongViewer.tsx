import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import YouTube from 'react-youtube';
import { Song } from '../types';
import { cn } from '../lib/utils';
import ChordVisualizer from './ChordVisualizer';
import ChordRenderer from './ChordRenderer';
import { SongHeader } from './SongHeader';
import { ChordBar } from './ChordBar';
import { useSongViewer } from '../hooks/useSongViewer';
import PerformanceController from './PerformanceController';

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
  const {
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
  } = useSongViewer(song, onUpdate, isActive);

  return (
    <div className={cn(
      "bg-black flex flex-col overflow-hidden",
      !isActive && "pointer-events-none",
      "absolute inset-0"
    )}>
      <AnimatePresence>
        {!hideControls && (
          <SongHeader 
            song={song}
            currentKey={currentKey}
            isEditing={isEditing}
            isWakeLocked={isWakeLocked}
            showYoutube={showYoutube}
            showChordBar={showChordBar}
            isSetlistMode={!!isSetlistMode}
            onBack={onBack}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onStartEdit={() => setIsEditing(true)}
            onToggleWakeLock={toggleWakeLock}
            onToggleYoutube={() => setShowYoutube(!showYoutube)}
            onToggleChordBar={() => setShowChordBar(!showChordBar)}
            onShowMode={onShowMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChordBar && !hideControls && !isEditing && (
          <ChordBar 
            uniqueChords={uniqueChords}
            instrumentPreference={instrumentPreference}
            onSetInstrumentPreference={setInstrumentPreference}
            onSelectChord={setSelectedChord}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <PerformanceController 
          song={song}
          isActive={isActive}
          isSmartScrollActive={isSmartScrollActive}
          isScrolling={isScrolling}
          scrollSpeed={scrollSpeed}
          currentKey={currentKey}
          fontSize={fontSize}
          showChords={showChords}
          hideControls={hideControls}
          isEditing={isEditing}
          onTranspose={handleTranspose}
          onSetFontSize={setFontSize}
          onToggleChords={() => setShowChords(!showChords)}
          onToggleSmartScroll={() => setIsSmartScrollActive(!isSmartScrollActive)}
          onToggleScroll={() => isScrolling ? stopScroll() : startScroll()}
          onSetScrollSpeed={setScrollSpeed}
          onSmartScrollAction={handleSmartScrollAction}
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
              <ChordRenderer 
                content={song.content}
                transpose={transposeOffset}
                fontSize={fontSize}
                showChords={showChords}
                onChordClick={setSelectedChord}
              />
            )}
          </div>
        </div>

        {isSetlistMode && !hideControls && (
          <>
            <button 
              onClick={onPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-zinc-800 z-40"
            >
              <ChevronLeft size={24} className="sm:size-8" />
            </button>
            <button 
              onClick={onNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-zinc-900/50 backdrop-blur rounded-full flex items-center justify-center text-white border border-zinc-800 z-40"
            >
              <ChevronRight size={24} className="sm:size-8" />
            </button>
          </>
        )}
      </div>

      <ChordVisualizer 
        chord={selectedChord} 
        onClose={() => setSelectedChord(null)} 
      />
    </div>
  );
}
