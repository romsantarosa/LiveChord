import React, { useState } from 'react';
import { Search, Plus, Heart, Music, ListMusic, MoreVertical, Play, Trash2 } from 'lucide-react';
import { Song, Setlist } from '../types';
import { cn } from '../lib/utils';

interface SongListProps {
  songs: Song[];
  setlists: Setlist[];
  onSelectSong: (song: Song) => void;
  onSelectSetlist: (setlist: Setlist) => void;
  onAddSong: () => void;
  onToggleFavorite: (id: string) => void;
  onShowMode: () => void;
  onAddToSetlist: (songId: string, setlistId: string) => void;
  onCreateSetlist: (name: string) => void;
  onRemoveFromSetlist: (songId: string, setlistId: string) => void;
  onDeleteSong: (id: string) => void;
}

export default function SongList({ 
  songs, 
  setlists, 
  onSelectSong, 
  onSelectSetlist, 
  onAddSong,
  onToggleFavorite,
  onShowMode,
  onAddToSetlist,
  onCreateSetlist,
  onRemoveFromSetlist,
  onDeleteSong
}: SongListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'setlists'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSetlistSelector, setShowSetlistSelector] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') return matchesSearch && song.isFavorite;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black tracking-tight">LiveChord</h1>
          <button 
            onClick={onAddSong}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text"
            placeholder="Buscar músicas ou artistas..."
            className="w-full bg-zinc-900 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-white/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                "text-sm font-bold pb-2 transition-all border-b-2",
                activeTab === 'all' ? "border-white text-white" : "border-transparent text-zinc-500"
              )}
            >
              Músicas
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={cn(
                "text-sm font-bold pb-2 transition-all border-b-2",
                activeTab === 'favorites' ? "border-white text-white" : "border-transparent text-zinc-500"
              )}
            >
              Favoritos
            </button>
            <button 
              onClick={() => setActiveTab('setlists')}
              className={cn(
                "text-sm font-bold pb-2 transition-all border-b-2",
                activeTab === 'setlists' ? "border-white text-white" : "border-transparent text-zinc-500"
              )}
            >
              Setlists
            </button>
          </div>

          <button 
            onClick={onShowMode}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 rounded-lg font-bold text-xs transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Play size={14} fill="currentColor" />
            <span>MODO SHOW</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 relative">
        {activeTab === 'setlists' ? (
          <div className="grid gap-3">
            <button 
              onClick={() => setIsCreatingSetlist(true)}
              className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition-colors group text-left"
            >
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                <Plus size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">Nova Setlist</h3>
                <p className="text-xs text-zinc-500">Crie um roteiro para o seu show</p>
              </div>
            </button>

            {isCreatingSetlist && (
              <div className="bg-zinc-900 p-4 rounded-2xl border border-orange-500/30">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Nome da Setlist (ex: Show de Sábado)"
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-4 text-sm mb-3 focus:ring-1 focus:ring-orange-500 outline-none"
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
                    className="flex-1 bg-orange-500 text-black font-bold py-2 rounded-xl text-xs"
                  >
                    Criar
                  </button>
                  <button 
                    onClick={() => setIsCreatingSetlist(false)}
                    className="flex-1 bg-zinc-800 text-white font-bold py-2 rounded-xl text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {setlists.map(setlist => (
              <button 
                key={setlist.id}
                onClick={() => onSelectSetlist(setlist)}
                className="bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 hover:bg-zinc-800 transition-colors group text-left"
              >
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                  <ListMusic size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{setlist.name}</h3>
                  <p className="text-xs text-zinc-500">{setlist.songIds.length} músicas</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={16} fill="currentColor" />
                </div>
              </button>
            ))}
            {setlists.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <ListMusic size={48} className="mb-4 opacity-20" />
                <p>Nenhuma setlist criada</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-1">
            {filteredSongs.map(song => (
              <div 
                key={song.id}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 transition-colors group"
              >
                <button 
                  onClick={() => onSelectSong(song)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                    <Music size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{song.title}</h3>
                    <p className="text-xs text-zinc-500 truncate">{song.artist} • {song.currentKey}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setShowSetlistSelector(song.id)}
                    className="p-2 text-zinc-600 hover:text-orange-500 transition-colors"
                    title="Adicionar à Setlist"
                  >
                    <ListMusic size={20} />
                  </button>
                  <button 
                    onClick={() => onToggleFavorite(song.id)}
                    className={cn(
                      "p-2 transition-colors",
                      song.isFavorite ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    <Heart size={20} fill={song.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(song.id)}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    title="Excluir Música"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {filteredSongs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Music size={48} className="mb-4 opacity-20" />
                <p>Nenhuma música encontrada</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setlist Selector Modal */}
      {showSetlistSelector && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowSetlistSelector(null)}
          />
          <div className="relative w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Adicionar à Setlist</h3>
              <button onClick={() => setShowSetlistSelector(null)} className="text-zinc-500 hover:text-white">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {setlists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm mb-4">Você ainda não tem setlists.</p>
                  <button 
                    onClick={() => {
                      setActiveTab('setlists');
                      setIsCreatingSetlist(true);
                      setShowSetlistSelector(null);
                    }}
                    className="bg-orange-500 text-black px-6 py-2 rounded-xl font-bold text-sm"
                  >
                    Criar minha primeira Setlist
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
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
                          "w-full p-4 rounded-2xl flex items-center justify-between transition-all border",
                          isAlreadyIn 
                            ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                            : "bg-zinc-800/50 border-transparent text-zinc-300 hover:bg-zinc-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <ListMusic size={20} />
                          <span className="font-bold">{sl.name}</span>
                        </div>
                        {isAlreadyIn ? (
                          <div className="w-6 h-6 bg-orange-500 text-black rounded-full flex items-center justify-center">
                            <Plus size={16} className="rotate-45" />
                          </div>
                        ) : (
                          <Plus size={20} className="text-zinc-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 bg-zinc-950/50">
              <button 
                onClick={() => setShowSetlistSelector(null)}
                className="w-full py-3 text-zinc-500 font-bold text-sm"
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
          <div className="relative w-full max-w-xs bg-zinc-900 rounded-3xl border border-red-500/20 p-6 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">Excluir Música?</h3>
            <p className="text-sm text-zinc-500 mb-6">Esta ação não pode ser desfeita e removerá a música de todas as setlists.</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  onDeleteSong(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="w-full py-3 bg-red-500 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
              >
                Sim, Excluir
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
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
