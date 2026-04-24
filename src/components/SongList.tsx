import React, { useState } from 'react';
import { Search, Plus, Heart, Music, ListMusic, MoreVertical, Play, Trash2, ChevronLeft, GripVertical, X, LogOut, Edit2, Check, RefreshCw, Radio, Menu, Youtube, Sparkles, Loader2 } from 'lucide-react';
import { Song, Setlist, Artist } from '../types';
import { cn } from '../lib/utils';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import SettingsSidebar from './SettingsSidebar';
import { searchYoutube, processYoutubeVideo, YoutubeSearchResult } from '../lib/youtubeService';

interface SongListProps {
  songs: Song[];
  setlists: Setlist[];
  artists: Artist[];
  onSelectSong: (song: Song) => void;
  onSelectSetlist: (setlist: Setlist) => void;
  onStartSetlistShow: (setlist: Setlist) => void;
  onAddSong: () => void;
  onToggleFavorite: (id: string) => void;
  onAddToSetlist: (songId: string, setlistId: string) => void;
  onCreateSetlist: (name: string) => void;
  onCreateArtist: (name: string) => void;
  onRemoveFromSetlist: (songId: string, setlistId: string) => void;
  onReorderSetlist: (setlistId: string, newSongIds: string[]) => void;
  onDeleteSong: (id: string) => void;
  onDeleteSetlist: (id: string) => void;
  onDeleteArtist: (id: string) => void;
  onUpdateSetlist: (id: string, updates: Partial<Setlist>) => void;
  onUpdateArtist: (id: string, updates: Partial<Artist>) => void;
  onSyncArtistSongs: (artist: Artist) => void;
  onSelectSongFromSetlist: (song: Song, setlist: Setlist) => void;
  onSaveSong: (song: Song) => void;
  selectedSetlistId: string | null;
  onSelectedSetlistIdChange: (id: string | null) => void;
  selectedArtistId: string | null;
  onSelectedArtistIdChange: (id: string | null) => void;
  onShowAuth: () => void;
}

export default function SongList({ 
  songs, 
  setlists, 
  artists,
  onSelectSong, 
  onSelectSetlist, 
  onStartSetlistShow,
  onAddSong,
  onToggleFavorite,
  onAddToSetlist,
  onCreateSetlist,
  onCreateArtist,
  onRemoveFromSetlist,
  onReorderSetlist,
  onDeleteSong,
  onDeleteSetlist,
  onDeleteArtist,
  onUpdateSetlist,
  onUpdateArtist,
  onSyncArtistSongs,
  onSelectSongFromSetlist,
  onSaveSong,
  selectedSetlistId,
  onSelectedSetlistIdChange,
  selectedArtistId,
  onSelectedArtistIdChange,
  onShowAuth
}: SongListProps) {
  const { user, logout } = useAuth();
  const { triggerVibration } = useSettings();
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'setlists' | 'artists'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabOrder, setTabOrder] = useState<('all' | 'favorites' | 'setlists' | 'artists')[]>(() => {
    const saved = localStorage.getItem('livechord_tab_order');
    return saved ? JSON.parse(saved) : ['all', 'favorites', 'setlists', 'artists'];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSetlistSelector, setShowSetlistSelector] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteSetlistConfirm, setShowDeleteSetlistConfirm] = useState<string | null>(null);
  const [showDeleteArtistConfirm, setShowDeleteArtistConfirm] = useState<string | null>(null);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [newArtistName, setNewArtistName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingArtistName, setIsEditingArtistName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);
  const [isCreatingArtist, setIsCreatingArtist] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [youtubeResults, setYoutubeResults] = useState<YoutubeSearchResult[]>([]);
  const [processingVideoId, setProcessingVideoId] = useState<string | null>(null);

  const handleGlobalSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    setIsSearchingYoutube(true);
    try {
      const results = await searchYoutube(trimmedQuery);
      setYoutubeResults(results);
    } catch (error) {
      console.error("YouTube search failed:", error);
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  const handleQuickImport = async (video: YoutubeSearchResult) => {
    setProcessingVideoId(video.id);
    try {
      const processed = await processYoutubeVideo(video.id, video.title);
      
      const newSong: Song = {
        id: Date.now().toString(),
        title: processed.title,
        artist: processed.artist,
        originalKey: processed.key,
        currentKey: processed.key,
        content: processed.content,
        youtubeId: video.id,
        fontSize: 18,
        autoScrollSpeed: 5,
        isFavorite: false,
        tags: [],
        createdAt: Date.now()
      };

      onSaveSong(newSong);
      onSelectSong(newSong); // Open it immediately
      setSearchQuery('');
      setYoutubeResults([]);
    } catch (error) {
      console.error("Quick import failed:", error);
    } finally {
      setProcessingVideoId(null);
    }
  };

  const filteredSongs = songs.filter(song => {
    const normalizedQuery = searchQuery.trim().toLowerCase().replace(/\s/g, '');
    if (!normalizedQuery) return true;
    
    const matchesSearch = 
      song.title.toLowerCase().replace(/\s/g, '').includes(normalizedQuery) || 
      song.artist.toLowerCase().replace(/\s/g, '').includes(normalizedQuery) ||
      song.currentKey.toLowerCase().replace(/\s/g, '').includes(normalizedQuery);
      
    if (activeTab === 'favorites') return matchesSearch && song.isFavorite;
    return matchesSearch;
  });

  const suggestions = searchQuery.length > 1 ? songs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query) ||
            song.currentKey.toLowerCase().includes(query)) &&
            !filteredSongs.includes(song); // Avoid duplicates if already in filtered list (though filteredSongs is the main list)
  }).slice(0, 5) : [];

  const selectedSetlist = setlists.find(s => s.id === selectedSetlistId);
  const setlistSongs = selectedSetlist ? selectedSetlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[] : [];

  const selectedArtist = artists.find(a => a.id === selectedArtistId);
  const artistSongs = selectedArtist ? songs.filter(s => s.artist === selectedArtist.name) : [];

  if (selectedArtist) {
    const handleSaveArtistName = () => {
      if (tempName.trim() && selectedArtist) {
        onUpdateArtist(selectedArtist.id, { name: tempName.trim() });
        setIsEditingArtistName(false);
      }
    };

    const startEditingArtist = () => {
      setTempName(selectedArtist.name);
      setIsEditingArtistName(true);
    };

    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-black theme-transition text-zinc-900 dark:text-white">
        <div className="p-4 sm:p-6 pb-2">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button 
              onClick={() => {
                onSelectedArtistIdChange(null);
                setIsEditingArtistName(false);
              }}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full transition-colors shrink-0 text-zinc-500 dark:text-zinc-400"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              {isEditingArtistName ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveArtistName()}
                    onBlur={handleSaveArtistName}
                    className="bg-white dark:bg-zinc-900 border border-sky-400/50 rounded-lg px-3 py-1 text-lg sm:text-xl font-black text-zinc-900 dark:text-white focus:outline-none w-full shadow-sm"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={handleSaveArtistName}
                      className="p-2 text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setIsEditingArtistName(false)}
                      className="p-2 text-zinc-500 hover:bg-zinc-500/10 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">{selectedArtist.name}</h1>
                  <button 
                    onClick={startEditingArtist}
                    className="p-1.5 text-zinc-600 hover:text-sky-400 sm:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{artistSongs.length} músicas</p>
                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                <span className="text-[9px] sm:text-[10px] text-zinc-600 font-medium">Pasta de Artista</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setShowDeleteArtistConfirm(selectedArtist.id)}
                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Excluir Pasta"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-20">
          <div className="space-y-2">
            {artistSongs.map((song) => (
              <div 
                key={song.id} 
                onClick={() => onSelectSong(song)}
                className="bg-zinc-900/50 rounded-2xl flex items-center gap-4 p-4 border border-zinc-800/50 group cursor-pointer hover:bg-zinc-900 transition-colors"
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-sky-400 transition-colors">
                  <Music size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{song.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-1 py-0.5 bg-sky-400/10 text-sky-400 rounded text-[8px] font-bold border border-sky-400/20">
                      {song.currentKey}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {artistSongs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <Music size={48} className="mb-4 opacity-20" />
              <p>Nenhuma música vinculada a este artista</p>
              <p className="text-xs mt-2">Músicas com o nome "{selectedArtist.name}" aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedSetlist) {
    const handleSaveName = () => {
      if (tempName.trim() && selectedSetlist) {
        onUpdateSetlist(selectedSetlist.id, { name: tempName.trim() });
        setIsEditingName(false);
      }
    };

    const startEditing = () => {
      setTempName(selectedSetlist.name);
      setIsEditingName(true);
    };

    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-black theme-transition text-zinc-900 dark:text-white">
        <div className="p-4 sm:p-6 pb-2">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button 
              onClick={() => {
                onSelectedSetlistIdChange(null);
                setIsEditingName(false);
              }}
              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full transition-colors shrink-0 text-zinc-500 dark:text-zinc-400"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    onBlur={handleSaveName}
                    className="bg-white dark:bg-zinc-900 border border-sky-400/50 rounded-lg px-3 py-1 text-lg sm:text-xl font-black text-zinc-900 dark:text-white focus:outline-none w-full shadow-sm"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={handleSaveName}
                      className="p-2 text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="p-2 text-zinc-500 hover:bg-zinc-500/10 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white truncate">{selectedSetlist.name}</h1>
                  <button 
                    onClick={startEditing}
                    className="p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-sky-400 sm:opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{setlistSongs.length} músicas</p>
                <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">Criado em {new Date(selectedSetlist.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setShowDeleteSetlistConfirm(selectedSetlist.id)}
                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                title="Excluir Setlist"
              >
                <Trash2 size={20} />
              </button>
              <button 
                onClick={() => onStartSetlistShow(selectedSetlist)}
                className="bg-sky-400 text-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(56,189,248,0.2)]"
              >
                <Radio size={14} className="animate-pulse" />
                <span className="hidden xs:inline">Live Mode</span>
              </button>
            </div>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto px-6 pb-20">
          <Reorder.Group 
            axis="y" 
            values={selectedSetlist.songIds} 
            onReorder={(newOrder) => onReorderSetlist(selectedSetlist.id, newOrder)}
            className="space-y-2"
          >
            {selectedSetlist.songIds.map((songId) => {
              const song = songs.find(s => s.id === songId);
              if (!song) return null;
              return (
                <Reorder.Item 
                  key={song.id} 
                  value={song.id}
                  className="bg-white dark:bg-zinc-900/50 rounded-2xl flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800/50 group shadow-sm transition-colors"
                >
                  <div className="cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-400 transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => onSelectSongFromSetlist(song, selectedSetlist)}>
                    <h3 className="font-bold truncate text-zinc-900 dark:text-white transition-colors">{song.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                  </div>
                  <button 
                    onClick={() => onRemoveFromSetlist(song.id, selectedSetlist.id)}
                    className="p-2 text-zinc-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          {setlistSongs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <Music size={48} className="mb-4 opacity-20" />
              <p>Nenhuma música nesta setlist</p>
              <button 
                onClick={() => setActiveTab('all')}
                className="mt-4 text-sky-400 text-sm font-bold"
              >
                Adicionar músicas
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-black theme-transition text-zinc-900 dark:text-white">
      <SettingsSidebar isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {/* Header */}
      <div className="p-4 sm:p-8 pb-4">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsSettingsOpen(true);
                triggerVibration();
              }}
              className="w-10 h-10 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-xl flex items-center justify-center hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5 shadow-sm"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                <span className="text-sky-400">Live</span>
                <span className="text-zinc-900 dark:text-white transition-colors">Chord</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Performance Mode</p>
                <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                {user ? (
                  <p className="text-[8px] sm:text-[10px] text-sky-400/80 font-bold uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                ) : (
                  <p className="text-[8px] sm:text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-widest">Guest Mode</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!user && (
              <button 
                onClick={onShowAuth}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm"
              >
                Entrar
              </button>
            )}
            {user && (
              <button 
                onClick={logout}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-xl sm:rounded-2xl flex items-center justify-center hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm"
                title="Sair"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <LogOut size={18} className="sm:size-5" />
                )}
              </button>
            )}
            <button 
              onClick={onAddSong}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-400 text-black rounded-xl sm:rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(56,189,248,0.2)]"
            >
              <Plus size={24} className="sm:size-7" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Buscar por nome, artista ou tom..."
            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 sm:py-3 pl-10 pr-12 text-xs sm:text-sm focus:ring-2 focus:ring-sky-400/20 transition-all text-zinc-900 dark:text-white"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value === '') setYoutubeResults([]);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGlobalSearch();
            }}
          />
          {searchQuery && (
            <button 
              onClick={handleGlobalSearch}
              disabled={isSearchingYoutube}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-sky-400 transition-colors disabled:opacity-50"
              title="Pesquisar..."
            >
              {isSearchingYoutube ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          )}
          
          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {(searchQuery.length > 1 && (filteredSongs.length > 0 || youtubeResults.length > 0)) && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[60] overflow-hidden flex flex-col max-h-[70vh]"
              >
                <div className="p-2 overflow-y-auto custom-scrollbar">
                  {filteredSongs.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Minha Biblioteca</p>
                        <span className="text-[10px] text-zinc-600">{Math.min(filteredSongs.length, 6)} de {filteredSongs.length}</span>
                      </div>
                      {filteredSongs.slice(0, 6).map((song, index) => (
                        <button
                          key={song.id}
                          onClick={() => {
                            onSelectSong(song);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-all text-left group/item border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                        >
                          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 w-5 shrink-0">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate text-zinc-900 dark:text-white group-hover/item:text-sky-500 transition-colors uppercase tracking-tight">{song.title}</h4>
                            <p className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">{song.artist}</p>
                          </div>
                          <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[8px] font-black border border-zinc-200 dark:border-zinc-700">
                            {song.currentKey}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {youtubeResults.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 mt-2 border-b border-zinc-100 dark:border-zinc-800 pt-3">
                        <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} /> Resultados Sugeridos
                        </p>
                      </div>
                      {youtubeResults.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => handleQuickImport(video)}
                          disabled={processingVideoId !== null}
                          className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-xl transition-all text-left group/youtube disabled:opacity-50 border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                        >
                          <div className="w-5 shrink-0 flex items-center justify-center">
                            {processingVideoId === video.id ? (
                              <Loader2 size={12} className="text-sky-400 animate-spin" />
                            ) : (
                              <span className="text-[10px] font-black text-sky-400/50 group-hover/youtube:text-sky-400">
                                {String(filteredSongs.length + index + 1).padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold leading-tight text-zinc-900 dark:text-white truncate group-hover/youtube:text-sky-500 transition-colors uppercase tracking-tight">
                              {video.title}
                            </h4>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {youtubeResults.length === 0 && searchQuery.length > 2 && !isSearchingYoutube && (
                    <button 
                      onClick={handleGlobalSearch}
                      className="w-full p-4 text-center group/btn"
                    >
                      <div className="flex items-center justify-center gap-2 text-zinc-500 group-hover/btn:text-sky-400 transition-colors">
                        <Search size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Pesquisar na Nuvem</span>
                      </div>
                    </button>
                  )}
                  {isSearchingYoutube && (
                    <div className="w-full p-6 text-center space-y-4">
                      <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-sky-400"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 size={16} className="text-sky-400 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sincronizando com a Nuvem...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <Reorder.Group 
          axis="x" 
          values={tabOrder} 
          onReorder={(newOrder) => {
            setTabOrder(newOrder);
            localStorage.setItem('livechord_tab_order', JSON.stringify(newOrder));
          }}
          className="flex items-center gap-6 mb-6 overflow-x-auto scrollbar-hide"
        >
          {tabOrder.map((tab) => (
            <Reorder.Item 
              key={tab} 
              value={tab}
              className="shrink-0"
              whileDrag={{ scale: 1.1, opacity: 0.8 }}
            >
              <button 
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 cursor-grab active:cursor-grabbing",
                  activeTab === tab ? "border-sky-400 text-zinc-900 dark:text-white" : "border-transparent text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                )}
              >
                {tab === 'all' ? 'Músicas' : 
                 tab === 'favorites' ? 'Favoritos' : 
                 tab === 'setlists' ? 'Setlists' : 'Artistas'}
              </button>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 relative">
        {activeTab === 'setlists' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            <button 
              onClick={() => setIsCreatingSetlist(true)}
              className="bg-white dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-sky-400 dark:hover:border-zinc-700 transition-colors group text-left shadow-sm"
            >
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-sky-400 dark:group-hover:text-white transition-colors">
                <Plus size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white transition-colors">Nova Setlist</h3>
                <p className="text-xs text-zinc-500">Crie um roteiro para o seu show</p>
              </div>
            </button>

            {isCreatingSetlist && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-sky-400/30 shadow-xl">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome da Setlist (ex: Show de Sábado)"
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 text-sm mb-3 focus:ring-1 focus:ring-sky-400 outline-none text-zinc-900 dark:text-white"
                  value={newSetlistName}
                  onChange={(e) => setNewSetlistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSetlistName.trim()) {
                      onCreateSetlist(newSetlistName);
                      setNewSetlistName('');
                      setIsCreatingSetlist(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (newSetlistName.trim()) {
                        onCreateSetlist(newSetlistName);
                        setNewSetlistName('');
                        setIsCreatingSetlist(false);
                      }
                    }}
                    className="flex-1 bg-sky-400 text-black font-bold py-2 rounded-xl text-xs hover:scale-105 transition-transform"
                  >
                    Criar
                  </button>
                  <button 
                    onClick={() => setIsCreatingSetlist(false)}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-white font-bold py-2 rounded-xl text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {setlists.map(setlist => (
              <div 
                key={setlist.id}
                onClick={() => onSelectedSetlistIdChange(setlist.id)}
                className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group text-left cursor-pointer border border-zinc-100 dark:border-transparent shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-sky-400 dark:group-hover:text-white transition-colors">
                  <ListMusic size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-zinc-900 dark:text-white transition-colors">{setlist.name}</h3>
                    <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                    <p className="text-xs text-zinc-500 shrink-0">{setlist.songIds.length} músicas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectedSetlistIdChange(setlist.id);
                      setTempName(setlist.name);
                      setIsEditingName(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800/50 text-zinc-500 flex items-center justify-center hover:text-sky-400 hover:bg-sky-400/10 transition-all"
                    title="Renomear Setlist"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteSetlistConfirm(setlist.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-zinc-800/50 text-zinc-500 flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Excluir Setlist"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSetlistShow(setlist);
                    }}
                    className="w-10 h-10 rounded-xl bg-sky-400 text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg"
                    title="Live Mode"
                  >
                    <Radio size={18} className="animate-pulse" />
                  </button>
                </div>
              </div>
            ))}
            {setlists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800/50">
                  <ListMusic size={40} className="opacity-20" />
                </div>
                <p className="font-bold text-zinc-500">Nenhuma setlist criada</p>
                <p className="text-xs text-zinc-600 mt-1">Organize seu show criando uma lista agora.</p>
                <button 
                  onClick={() => setIsCreatingSetlist(true)}
                  className="mt-6 text-sky-400 text-xs font-black uppercase tracking-widest hover:text-sky-300 transition-colors"
                >
                  + Criar Primeira Setlist
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'artists' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            <button 
              onClick={() => setIsCreatingArtist(true)}
              className="bg-white dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-sky-400 dark:hover:border-zinc-700 transition-colors group text-left shadow-sm"
            >
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-sky-400 dark:group-hover:text-white transition-colors">
                <Plus size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white transition-colors">Nova Pasta de Artista</h3>
                <p className="text-xs text-zinc-500">Agrupe músicas por artista</p>
              </div>
            </button>

            {isCreatingArtist && (
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-sky-400/30 shadow-xl">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome do Artista (ex: Legião Urbana)"
                  className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-4 text-sm mb-3 focus:ring-1 focus:ring-sky-400 outline-none text-zinc-900 dark:text-white"
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newArtistName.trim()) {
                      onCreateArtist(newArtistName);
                      setNewArtistName('');
                      setIsCreatingArtist(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (newArtistName.trim()) {
                        onCreateArtist(newArtistName);
                        setNewArtistName('');
                        setIsCreatingArtist(false);
                      }
                    }}
                    className="flex-1 bg-sky-400 text-black font-bold py-2 rounded-xl text-xs hover:scale-105 transition-transform"
                  >
                    Criar
                  </button>
                  <button 
                    onClick={() => setIsCreatingArtist(false)}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-white font-bold py-2 rounded-xl text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {artists.map(artist => {
              const count = songs.filter(s => s.artist === artist.name).length;
              return (
                <div 
                  key={artist.id}
                  onClick={() => onSelectedArtistIdChange(artist.id)}
                  className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group text-left cursor-pointer border border-zinc-100 dark:border-transparent shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-sky-400 dark:group-hover:text-white transition-colors">
                    <Music size={24} />
                  </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-zinc-900 dark:text-white transition-colors">{artist.name}</h3>
                    <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                    <p className="text-xs text-zinc-500 shrink-0">{count} músicas</p>
                  </div>
                </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSyncArtistSongs(artist);
                      }}
                      className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 flex items-center justify-center hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                      title="Sincronizar Músicas"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectedArtistIdChange(artist.id);
                        setTempName(artist.name);
                        setIsEditingArtistName(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 flex items-center justify-center hover:text-sky-400 hover:bg-sky-400/10 transition-all"
                      title="Renomear Artista"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteArtistConfirm(artist.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 flex items-center justify-center hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Excluir Artista"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {artists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800/50">
                  <Music size={40} className="opacity-20" />
                </div>
                <p className="font-bold text-zinc-500">Nenhuma pasta de artista</p>
                <p className="text-xs text-zinc-600 mt-1">Organize suas músicas criando pastas por artista.</p>
                <button 
                  onClick={() => setIsCreatingArtist(true)}
                  className="mt-6 text-sky-400 text-xs font-black uppercase tracking-widest hover:text-sky-300 transition-colors"
                >
                  + Criar Primeira Pasta
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 hover:border-sky-400 dark:hover:border-zinc-700 transition-all group shadow-sm hover:shadow-md"
              >
                <button 
                  onClick={() => onSelectSong(song)}
                  className="flex-1 flex items-center gap-3 sm:gap-4 text-left min-w-0"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-sky-400 transition-colors shrink-0">
                    <Music size={20} className="sm:size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate text-zinc-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-white transition-colors">{song.title}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                      <p className="text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-500 truncate transition-colors">{song.artist}</p>
                      <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <span className="px-1 py-0.5 bg-sky-400/10 text-sky-400 rounded text-[8px] sm:text-[10px] font-bold border border-sky-400/20">
                        {song.currentKey}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button 
                    onClick={() => setShowSetlistSelector(song.id)}
                    className="p-2 sm:p-2.5 text-zinc-400 hover:text-sky-500 hover:bg-sky-400/10 rounded-xl transition-all"
                    title="Adicionar à Setlist"
                  >
                    <ListMusic size={18} className="sm:size-5" />
                  </button>
                  <button 
                    onClick={() => onToggleFavorite(song.id)}
                    className={cn(
                      "p-2 sm:p-2.5 rounded-xl transition-all",
                      song.isFavorite ? "text-red-500 bg-red-500/10" : "text-zinc-400 hover:text-red-400 hover:bg-red-500/5"
                    )}
                  >
                    <Heart size={18} className="sm:size-5" fill={song.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(song.id)}
                    className="p-2 sm:p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Excluir Música"
                  >
                    <Trash2 size={18} className="sm:size-5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredSongs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-400 dark:text-zinc-600">
                <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-300 dark:border-zinc-800/50">
                  <Music size={40} className="opacity-20" />
                </div>
                <p className="font-bold text-zinc-700 dark:text-zinc-500">Nenhuma música encontrada</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1">Tente buscar por outro termo ou no YouTube.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button 
                    onClick={onAddSong}
                    className="px-6 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    + Criar Manual
                  </button>
                  <button 
                    onClick={handleGlobalSearch}
                    disabled={isSearchingYoutube}
                    className="px-6 py-2 bg-sky-400 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-sky-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSearchingYoutube ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Pesquisar Online
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setlist Selector Modal */}
      {showSetlistSelector && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowSetlistSelector(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900/90 backdrop-blur-2xl rounded-t-[2rem] sm:rounded-[2.5rem] border-t sm:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-all">
            <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-black text-lg sm:text-xl text-zinc-900 dark:text-white tracking-tight">Adicionar à Setlist</h3>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">Escolha uma lista</p>
              </div>
              <button onClick={() => setShowSetlistSelector(null)} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
              {setlists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ListMusic size={32} className="text-zinc-400 dark:text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 font-medium">Você ainda não tem setlists.</p>
                  <button 
                    onClick={() => {
                      setActiveTab('setlists');
                      setIsCreatingSetlist(true);
                      setShowSetlistSelector(null);
                    }}
                    className="bg-sky-400 text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(56,189,248,0.2)]"
                  >
                    Criar minha primeira Setlist
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {setlists.map(sl => {
                    const isAlreadyIn = sl.songIds.includes(showSetlistSelector);
                    return (
                      <button 
                        key={sl.id}
                        onClick={() => {
                          if (isAlreadyIn) {
                            onRemoveFromSetlist(showSetlistSelector, sl.id);
                          } else {
                            onAddToSetlist(showSetlistSelector, sl.id);
                          }
                        }}
                        className={cn(
                          "w-full p-5 rounded-3xl flex items-center justify-between transition-all border-2",
                          isAlreadyIn 
                            ? "bg-sky-400/10 border-sky-400/50 text-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.1)]" 
                            : "bg-zinc-50 dark:bg-zinc-800/30 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isAlreadyIn ? "bg-sky-400 text-black" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                          )}>
                            <Music size={20} />
                          </div>
                          <span className="font-black text-sm uppercase tracking-tight">{sl.name}</span>
                        </div>
                        {isAlreadyIn ? (
                          <div className="w-6 h-6 bg-sky-400 text-black rounded-full flex items-center justify-center shadow-lg">
                            <Plus size={16} className="rotate-45" />
                          </div>
                        ) : (
                          <Plus size={20} className="text-zinc-300 dark:text-zinc-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800">
              <button 
                onClick={() => setShowSetlistSelector(null)}
                className="w-full py-4 text-zinc-500 font-black text-xs uppercase tracking-[0.2em] hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-red-500/20 p-6 text-center shadow-2xl transition-all">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Excluir Música?</h3>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Esta ação não pode ser desfeita e removerá a música de todas as setlists.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onDeleteSong(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-red-500/20"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Setlist Confirmation Modal */}
      {showDeleteSetlistConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowDeleteSetlistConfirm(null)}
          />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-red-500/20 p-6 text-center shadow-2xl transition-all">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Excluir Setlist?</h3>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Esta ação removerá apenas a lista, suas músicas continuarão salvas.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onDeleteSetlist(showDeleteSetlistConfirm);
                  setShowDeleteSetlistConfirm(null);
                }}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-red-500/20"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setShowDeleteSetlistConfirm(null)}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Artist Confirmation Modal */}
      {showDeleteArtistConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            onClick={() => setShowDeleteArtistConfirm(null)}
          />
          <div className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-red-500/20 p-6 text-center shadow-2xl transition-all">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-zinc-900 dark:text-white">Excluir Pasta?</h3>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Esta ação removerá apenas a pasta, suas músicas continuarão salvas.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onDeleteArtist(showDeleteArtistConfirm);
                  setShowDeleteArtistConfirm(null);
                }}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-red-500/20"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setShowDeleteArtistConfirm(null)}
                className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
