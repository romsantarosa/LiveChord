import React, { useState, useEffect } from 'react';
import { Song, Setlist, Artist } from './types';
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
import { X } from 'lucide-react';
import { storage } from './lib/storage';

import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

export default function App() {
  const { user, loading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);
  const [setlistIndex, setSetlistIndex] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [isShowMode, setIsShowMode] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  // Migration logic
  useEffect(() => {
    const migrateData = async () => {
      if (!user || isMigrating) return;
      
      const localSongs = storage.getSongs();
      const localSetlists = storage.getSetlists();
      const localArtists = storage.getArtists();
      
      if (localSongs.length === 0 && localSetlists.length === 0 && localArtists.length === 0) return;

      setIsMigrating(true);
      console.log('Migrating local data to Firestore...');

      try {
        const batch = writeBatch(db);
        
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

        for (const artist of localArtists) {
          const { id, ...artistData } = artist;
          const newArtistRef = doc(collection(db, 'artists'));
          batch.set(newArtistRef, { ...artistData, userId: user.uid });
        }

        await batch.commit();
        
        // Clear local storage after successful migration
        storage.saveSongs([]);
        storage.saveSetlists([]);
        storage.saveArtists([]);
        
        // Update state to reflect Firestore data
        // The onSnapshot listeners will handle the state update automatically
        
        console.log('Migration complete!');
      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        setIsMigrating(false);
      }
    };

    migrateData();
    if (user) setIsAuthModalOpen(false);
  }, [user]);

  // Sync Songs
  useEffect(() => {
    if (!user) {
      // Load from local storage if not logged in
      const localSongs = storage.getSongs();
      setSongs(localSongs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
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
      // Sort client-side to include songs that don't have the createdAt field yet
      setSongs(songsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'songs');
    });

    return unsubscribe;
  }, [user]);

  // Sync Setlists
  useEffect(() => {
    if (!user) {
      // Load from local storage if not logged in
      setSetlists(storage.getSetlists());
      return;
    }

    const q = query(
      collection(db, 'setlists'), 
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const setlistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setlist[];
      // Sort client-side to include setlists that don't have the createdAt field yet
      setSetlists(setlistsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'setlists');
    });

    return unsubscribe;
  }, [user]);

  // Sync Artists
  useEffect(() => {
    if (!user) {
      setArtists(storage.getArtists());
      return;
    }

    const q = query(
      collection(db, 'artists'), 
      where('userId', '==', user.uid),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const artistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Artist[];
      setArtists(artistsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'artists');
    });

    return unsubscribe;
  }, [user]);

  if (loading) return null;

  const handleUpdateSong = async (updatedSong: Song) => {
    if (!user) {
      const allSongs = storage.getSongs();
      const newSongs = allSongs.map(s => s.id === updatedSong.id ? updatedSong : s);
      storage.saveSongs(newSongs);
      setSongs(newSongs);
      if (selectedSong?.id === updatedSong.id) {
        setSelectedSong(updatedSong);
      }
      return;
    }

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
    if (!user) {
      const allSongs = storage.getSongs();
      const newSongs = allSongs.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s);
      storage.saveSongs(newSongs);
      setSongs(newSongs);
      return;
    }

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
    const songWithTimestamp = { ...newSong, createdAt: Date.now() };
    if (!user) {
      const allSongs = storage.getSongs();
      const updatedSongs = [songWithTimestamp, ...allSongs];
      storage.saveSongs(updatedSongs);
      setSongs(updatedSongs);
      setIsImporting(false);
      return;
    }

    const path = 'songs';
    try {
      const { id, ...data } = songWithTimestamp;
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
    if (!user) {
      const allSongs = storage.getSongs();
      const newSongs = allSongs.filter(s => s.id !== id);
      storage.saveSongs(newSongs);
      setSongs(newSongs);
      
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.map(sl => ({
        ...sl,
        songIds: sl.songIds.filter(songId => songId !== id)
      }));
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      
      if (selectedSong?.id === id) {
        setSelectedSong(null);
      }
      return;
    }

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
    if (!user) {
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.filter(sl => sl.id !== id);
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      if (activeSetlist?.id === id) {
        setActiveSetlist(null);
      }
      return;
    }

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
    if (!user) {
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.map(sl => sl.id === id ? { ...sl, ...updates } : sl);
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      if (activeSetlist?.id === id) {
        setActiveSetlist({ ...activeSetlist, ...updates });
      }
      return;
    }

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
    if (!user) {
      const newSetlist: Setlist = {
        id: crypto.randomUUID(),
        name,
        songIds: [],
        createdAt: Date.now(),
        userId: 'guest'
      };
      const allSetlists = storage.getSetlists();
      const updatedSetlists = [newSetlist, ...allSetlists];
      storage.saveSetlists(updatedSetlists);
      setSetlists(updatedSetlists);
      return;
    }

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
    if (!user) {
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.map(sl => {
        if (sl.id === setlistId && !sl.songIds.includes(songId)) {
          return { ...sl, songIds: [...sl.songIds, songId] };
        }
        return sl;
      });
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      return;
    }

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
    if (!user) {
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.map(sl => {
        if (sl.id === setlistId) {
          return { ...sl, songIds: sl.songIds.filter(id => id !== songId) };
        }
        return sl;
      });
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      return;
    }

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
    if (!user) {
      const allSetlists = storage.getSetlists();
      const newSetlists = allSetlists.map(sl => sl.id === setlistId ? { ...sl, songIds: newSongIds } : sl);
      storage.saveSetlists(newSetlists);
      setSetlists(newSetlists);
      if (activeSetlist?.id === setlistId) {
        setActiveSetlist({ ...activeSetlist, songIds: newSongIds });
      }
      return;
    }

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

  const handleCreateArtist = async (name: string) => {
    if (!user) {
      const newArtist: Artist = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        userId: 'guest'
      };
      const allArtists = storage.getArtists();
      const updatedArtists = [newArtist, ...allArtists];
      storage.saveArtists(updatedArtists);
      setArtists(updatedArtists);
      return;
    }

    const path = 'artists';
    try {
      await addDoc(collection(db, 'artists'), {
        name,
        userId: user.uid,
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateArtist = async (id: string, updates: Partial<Artist>) => {
    if (!user) {
      const allArtists = storage.getArtists();
      const oldArtist = allArtists.find(a => a.id === id);
      const newArtists = allArtists.map(a => a.id === id ? { ...a, ...updates } : a);
      storage.saveArtists(newArtists);
      setArtists(newArtists);

      // If name changed, update all songs with that artist name
      if (updates.name && oldArtist) {
        const allSongs = storage.getSongs();
        const updatedSongs = allSongs.map(s => s.artist === oldArtist.name ? { ...s, artist: updates.name! } : s);
        storage.saveSongs(updatedSongs);
        setSongs(updatedSongs);
      }
      return;
    }

    const path = `artists/${id}`;
    try {
      const artistRef = doc(db, 'artists', id);
      const oldArtist = artists.find(a => a.id === id);
      await updateDoc(artistRef, updates);

      // If name changed, update all songs with that artist name in Firestore
      if (updates.name && oldArtist) {
        const batch = writeBatch(db);
        const songsToUpdate = songs.filter(s => s.artist === oldArtist.name);
        songsToUpdate.forEach(s => {
          const songRef = doc(db, 'songs', s.id);
          batch.update(songRef, { artist: updates.name });
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteArtist = async (id: string) => {
    if (!user) {
      const allArtists = storage.getArtists();
      const newArtists = allArtists.filter(a => a.id !== id);
      storage.saveArtists(newArtists);
      setArtists(newArtists);
      return;
    }

    const path = `artists/${id}`;
    try {
      await deleteDoc(doc(db, 'artists', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSyncArtistSongs = async (artist: Artist) => {
    // Find songs that match the artist name (case insensitive) but aren't exactly the same
    const targetName = artist.name.toLowerCase().trim();
    const songsToSync = songs.filter(s => 
      s.artist.toLowerCase().trim() === targetName && s.artist !== artist.name
    );

    // Always select the artist to "go inside the folder"
    setSelectedArtistId(artist.id);

    if (songsToSync.length === 0) return;

    if (!user) {
      const allSongs = storage.getSongs();
      const updatedSongs = allSongs.map(s => {
        if (s.artist.toLowerCase().trim() === targetName) {
          return { ...s, artist: artist.name };
        }
        return s;
      });
      storage.saveSongs(updatedSongs);
      setSongs(updatedSongs);
      return;
    }

    try {
      const batch = writeBatch(db);
      songsToSync.forEach(s => {
        const songRef = doc(db, 'songs', s.id);
        batch.update(songRef, { artist: artist.name });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error syncing artist songs:", error);
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
    <div className="h-screen h-[100dvh] w-full bg-zinc-50 dark:bg-black overflow-hidden font-sans select-none fixed inset-0 theme-transition">
      <ShowMode 
        active={isShowMode}
        songs={activeSetlist ? songs.filter(s => activeSetlist.songIds.includes(s.id)) : songs}
        initialSongIndex={activeSetlist ? setlistIndex : Math.max(0, songs.findIndex(s => s.id === selectedSong?.id))}
        onClose={() => setIsShowMode(false)}
      />

      <AnimatePresence mode="wait">
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
              artists={artists}
              onSelectSong={handleSelectSong}
              onSelectSetlist={handleSelectSetlist}
              onStartSetlistShow={handleStartSetlistShow}
              onAddSong={() => setIsImporting(true)}
              onSaveSong={handleAddSong}
              onToggleFavorite={handleToggleFavorite}
              onAddToSetlist={handleAddSongToSetlist}
              onCreateSetlist={handleCreateSetlist}
              onCreateArtist={handleCreateArtist}
              onRemoveFromSetlist={handleRemoveSongFromSetlist}
              onReorderSetlist={handleReorderSetlist}
              onDeleteSong={handleDeleteSong}
              onDeleteSetlist={handleDeleteSetlist}
              onDeleteArtist={handleDeleteArtist}
              onUpdateSetlist={handleUpdateSetlist}
              onUpdateArtist={handleUpdateArtist}
              onSyncArtistSongs={handleSyncArtistSongs}
              onSelectSongFromSetlist={handleSelectSongFromSetlist}
              selectedSetlistId={selectedSetlistId}
              onSelectedSetlistIdChange={setSelectedSetlistId}
              selectedArtistId={selectedArtistId}
              onSelectedArtistIdChange={setSelectedArtistId}
              onShowAuth={() => setIsAuthModalOpen(true)}
            />
          </motion.div>
        )}

        {isAuthModalOpen && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md">
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <Auth />
            </div>
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
