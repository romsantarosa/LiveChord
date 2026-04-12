import React, { useState, useEffect } from 'react';
import { Song, Setlist } from './types';
import { storage } from './lib/storage';
import SongList from './components/SongList';
import SongViewer from './components/SongViewer';
import ImportSong from './components/ImportSong';
import ShowMode from './components/ShowMode';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);
  const [setlistIndex, setSetlistIndex] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isShowMode, setIsShowMode] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadedSongs = storage.getSongs();
    const loadedSetlists = storage.getSetlists();
    
    if (loadedSongs.length === 0) {
      // Add a sample song if empty
      const sampleSong: Song = {
        id: 'sample-1',
        title: 'Tempo Perdido',
        artist: 'Legião Urbana',
        originalKey: 'C',
        currentKey: 'C',
        content: `[C]Todos os [Am7]dias quando [Bm7]acordo
Não te[Em]nho mais o [C]tempo que pas[Am7]sou
Mas vejo [Bm7]mãos que cons[Em]troem
O [C]tempo que virá[Am7]
Eu [Bm7]vou te bus[Em]car na frente do [C]mar
[Am7]Na frente do [Bm7]mar[Em]`,
        youtubeId: 'pS-fU-xY6X0',
        fontSize: 20,
        autoScrollSpeed: 5,
        isFavorite: true,
        tags: ['Rock Nacional']
      };
      storage.saveSongs([sampleSong]);
      setSongs([sampleSong]);
    } else {
      setSongs(loadedSongs);
    }

    if (loadedSetlists.length === 0) {
      const sampleSetlist: Setlist = {
        id: 'setlist-1',
        name: 'Show Acústico',
        songIds: ['sample-1'],
        createdAt: Date.now()
      };
      storage.saveSetlists([sampleSetlist]);
      setSetlists([sampleSetlist]);
    } else {
      setSetlists(loadedSetlists);
    }
  }, []);

  const handleUpdateSong = (updatedSong: Song) => {
    const newSongs = songs.map(s => s.id === updatedSong.id ? updatedSong : s);
    setSongs(newSongs);
    storage.saveSongs(newSongs);
    if (selectedSong?.id === updatedSong.id) {
      setSelectedSong(updatedSong);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const newSongs = songs.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s);
    setSongs(newSongs);
    storage.saveSongs(newSongs);
  };

  const handleAddSong = (newSong: Song) => {
    const newSongs = [...songs, newSong];
    setSongs(newSongs);
    storage.saveSongs(newSongs);
    setIsImporting(false);
  };

  const handleDeleteSong = (id: string) => {
    const newSongs = songs.filter(s => s.id !== id);
    setSongs(newSongs);
    storage.saveSongs(newSongs);
    
    // Also remove from setlists
    const newSetlists = setlists.map(sl => ({
      ...sl,
      songIds: sl.songIds.filter(songId => songId !== id)
    }));
    setSetlists(newSetlists);
    storage.saveSetlists(newSetlists);
    
    if (selectedSong?.id === id) {
      setSelectedSong(null);
    }
  };

  const handleCreateSetlist = (name: string) => {
    const newSetlist: Setlist = {
      id: `setlist-${Date.now()}`,
      name,
      songIds: [],
      createdAt: Date.now()
    };
    const newSetlists = [...setlists, newSetlist];
    setSetlists(newSetlists);
    storage.saveSetlists(newSetlists);
  };

  const handleAddSongToSetlist = (songId: string, setlistId: string) => {
    const newSetlists = setlists.map(sl => {
      if (sl.id === setlistId) {
        if (sl.songIds.includes(songId)) return sl;
        return { ...sl, songIds: [...sl.songIds, songId] };
      }
      return sl;
    });
    setSetlists(newSetlists);
    storage.saveSetlists(newSetlists);
  };

  const handleRemoveSongFromSetlist = (songId: string, setlistId: string) => {
    const newSetlists = setlists.map(sl => {
      if (sl.id === setlistId) {
        return { ...sl, songIds: sl.songIds.filter(id => id !== songId) };
      }
      return sl;
    });
    setSetlists(newSetlists);
    storage.saveSetlists(newSetlists);
  };

  const handleSelectSetlist = (setlist: Setlist) => {
    setActiveSetlist(setlist);
    setSetlistIndex(0);
    const firstSong = songs.find(s => s.id === setlist.songIds[0]);
    if (firstSong) setSelectedSong(firstSong);
  };

  const navigateSetlist = (direction: number) => {
    if (!activeSetlist) return;
    const nextIndex = setlistIndex + direction;
    if (nextIndex >= 0 && nextIndex < activeSetlist.songIds.length) {
      setSetlistIndex(nextIndex);
      const nextSong = songs.find(s => s.id === activeSetlist.songIds[nextIndex]);
      if (nextSong) setSelectedSong(nextSong);
    }
  };

  return (
    <div className="h-screen w-full bg-black overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        {isShowMode && (
          <motion.div
            key="show-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <ShowMode 
              songs={activeSetlist ? songs.filter(s => activeSetlist.songIds.includes(s.id)) : songs}
              initialSongIndex={activeSetlist ? setlistIndex : Math.max(0, songs.findIndex(s => s.id === selectedSong?.id))}
              onClose={() => setIsShowMode(false)}
            />
          </motion.div>
        )}

        {!selectedSong && !isImporting && !isShowMode && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <SongList 
              songs={songs}
              setlists={setlists}
              onSelectSong={setSelectedSong}
              onSelectSetlist={handleSelectSetlist}
              onAddSong={() => setIsImporting(true)}
              onToggleFavorite={handleToggleFavorite}
              onShowMode={() => setIsShowMode(true)}
              onAddToSetlist={handleAddSongToSetlist}
              onCreateSetlist={handleCreateSetlist}
              onRemoveFromSetlist={handleRemoveSongFromSetlist}
              onDeleteSong={handleDeleteSong}
            />
          </motion.div>
        )}

        {selectedSong && !isShowMode && (
          <motion.div 
            key="viewer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full"
          >
            <SongViewer 
              song={selectedSong}
              onUpdate={handleUpdateSong}
              onBack={() => {
                setSelectedSong(null);
                setActiveSetlist(null);
              }}
              onShowMode={() => setIsShowMode(true)}
              isSetlistMode={!!activeSetlist}
              onNext={() => navigateSetlist(1)}
              onPrev={() => navigateSetlist(-1)}
            />
          </motion.div>
        )}

        {isImporting && !isShowMode && (
          <motion.div 
            key="import"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full"
          >
            <ImportSong 
              onClose={() => setIsImporting(false)}
              onSave={handleAddSong}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
