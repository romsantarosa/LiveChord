import React, { useState, useEffect } from 'react';
import { Song, Setlist } from './types';
import SongList from './components/SongList';
import SongViewer from './components/SongViewer';
import ImportSong from './components/ImportSong';
import ShowMode from './components/ShowMode';
import Auth from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from './lib/storage';

import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

export default function App() {
  const { user, loading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);
  const [setlistIndex, setSetlistIndex] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isShowMode, setIsShowMode] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);

  // Migration logic
  useEffect(() => {
    const migrateData = async () => {
      if (!user || isMigrating) return;
      
      const localSongs = storage.getSongs();
      const localSetlists = storage.getSetlists();
      
      if (localSongs.length === 0 && localSetlists.length === 0) return;

      setIsMigrating(true);
      console.log('Migrating local data to Firestore...');

      try {
        const batch = writeBatch(db);
        
        // Map to keep track of old local IDs to new Firestore IDs (if needed, but Firestore generates its own)
        // Actually, we'll just add them as new docs
        
        for (const song of localSongs) {
          const { id, ...songData } = song;
          const newSongRef = doc(collection(db, 'songs'));
          batch.set(newSongRef, { ...songData, userId: user.uid });
        }

        for (const setlist of localSetlists) {
          const { id, ...setlistData } = setlist;
          const newSetlistRef = doc(collection(db, 'setlists'));
          batch.set(newSetlistRef, { ...setlistData, userId: user.uid });
        }

        await batch.commit();
        
        // Clear local storage after successful migration
        storage.saveSongs([]);
        storage.saveSetlists([]);
        console.log('Migration complete!');
      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    migrateData();
  }, [user]);

  // Sync Songs
  useEffect(() => {
    if (!user) {
      setSongs([]);
      return;
    }

    const q = query(
      collection(db, 'songs'), 
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Song[];
      setSongs(songsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'songs');
    });

    return unsubscribe;
  }, [user]);

  // Sync Setlists
  useEffect(() => {
    if (!user) {
      setSetlists([]);
      return;
    }

    const q = query(
      collection(db, 'setlists'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const setlistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setlist[];
      setSetlists(setlistsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'setlists');
    });

    return unsubscribe;
  }, [user]);

  if (loading) return null;
  if (!user) return <Auth />;

  const handleUpdateSong = async (updatedSong: Song) => {
    const path = `songs/${updatedSong.id}`;
    try {
      const songRef = doc(db, 'songs', updatedSong.id);
      const { id, ...data } = updatedSong;
      await updateDoc(songRef, data);
      if (selectedSong?.id === updatedSong.id) {
        setSelectedSong(updatedSong);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const path = `songs/${id}`;
    try {
      const song = songs.find(s => s.id === id);
      if (!song) return;
      const songRef = doc(db, 'songs', id);
      await updateDoc(songRef, { isFavorite: !song.isFavorite });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleAddSong = async (newSong: Song) => {
    const path = 'songs';
    try {
      const { id, ...data } = newSong;
      await addDoc(collection(db, 'songs'), {
        ...data,
        userId: user.uid
      });
      setIsImporting(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteSong = async (id: string) => {
    const path = `songs/${id}`;
    try {
      await deleteDoc(doc(db, 'songs', id));
      
      // Also remove from setlists
      const setlistsToUpdate = setlists.filter(sl => sl.songIds.includes(id));
      for (const sl of setlistsToUpdate) {
        const setlistRef = doc(db, 'setlists', sl.id);
        await updateDoc(setlistRef, {
          songIds: sl.songIds.filter(songId => songId !== id)
        });
      }
      
      if (selectedSong?.id === id) {
        setSelectedSong(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteSetlist = async (id: string) => {
    const path = `setlists/${id}`;
    try {
      await deleteDoc(doc(db, 'setlists', id));
      if (activeSetlist?.id === id) {
        setActiveSetlist(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUpdateSetlist = async (id: string, updates: Partial<Setlist>) => {
    const path = `setlists/${id}`;
    try {
      const setlistRef = doc(db, 'setlists', id);
      await updateDoc(setlistRef, updates);
      if (activeSetlist?.id === id) {
        setActiveSetlist({ ...activeSetlist, ...updates });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleCreateSetlist = async (name: string) => {
    const path = 'setlists';
    try {
      await addDoc(collection(db, 'setlists'), {
        name,
        userId: user.uid,
        songIds: [],
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleAddSongToSetlist = async (songId: string, setlistId: string) => {
    const path = `setlists/${setlistId}`;
    try {
      const sl = setlists.find(s => s.id === setlistId);
      if (!sl || sl.songIds.includes(songId)) return;
      
      const setlistRef = doc(db, 'setlists', setlistId);
      await updateDoc(setlistRef, {
        songIds: [...sl.songIds, songId]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleRemoveSongFromSetlist = async (songId: string, setlistId: string) => {
    const path = `setlists/${setlistId}`;
    try {
      const sl = setlists.find(s => s.id === setlistId);
      if (!sl) return;
      
      const setlistRef = doc(db, 'setlists', setlistId);
      await updateDoc(setlistRef, {
        songIds: sl.songIds.filter(id => id !== songId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleReorderSetlist = async (setlistId: string, newSongIds: string[]) => {
    const path = `setlists/${setlistId}`;
    try {
      const setlistRef = doc(db, 'setlists', setlistId);
      await updateDoc(setlistRef, {
        songIds: newSongIds
      });
      
      if (activeSetlist?.id === setlistId) {
        setActiveSetlist({ ...activeSetlist, songIds: newSongIds });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setActiveSetlist(null);
    setSelectedSetlistId(null);
  };

  const handleSelectSetlist = (setlist: Setlist) => {
    setActiveSetlist(setlist);
    setSetlistIndex(0);
    const firstSong = songs.find(s => s.id === setlist.songIds[0]);
    if (firstSong) setSelectedSong(firstSong);
  };

  const handleSelectSongFromSetlist = (song: Song, setlist: Setlist) => {
    setActiveSetlist(setlist);
    const index = setlist.songIds.indexOf(song.id);
    setSetlistIndex(index !== -1 ? index : 0);
    setSelectedSong(song);
  };

  const handleStartSetlistShow = (setlist: Setlist) => {
    setActiveSetlist(setlist);
    setSetlistIndex(0);
    setIsShowMode(true);
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
              onSelectSong={handleSelectSong}
              onSelectSetlist={handleSelectSetlist}
              onStartSetlistShow={handleStartSetlistShow}
              onAddSong={() => setIsImporting(true)}
              onToggleFavorite={handleToggleFavorite}
              onAddToSetlist={handleAddSongToSetlist}
              onCreateSetlist={handleCreateSetlist}
              onRemoveFromSetlist={handleRemoveSongFromSetlist}
              onReorderSetlist={handleReorderSetlist}
              onDeleteSong={handleDeleteSong}
              onDeleteSetlist={handleDeleteSetlist}
              onUpdateSetlist={handleUpdateSetlist}
              onSelectSongFromSetlist={handleSelectSongFromSetlist}
              selectedSetlistId={selectedSetlistId}
              onSelectedSetlistIdChange={setSelectedSetlistId}
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
            className="h-full relative"
          >
            <SongViewer 
              song={selectedSong}
              onUpdate={handleUpdateSong}
              onBack={() => {
                setSelectedSong(null);
                // We keep selectedSetlistId so the user goes back to the setlist view
                // if they came from one.
                if (!selectedSetlistId) {
                  setActiveSetlist(null);
                }
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
