import React, { useState } from 'react';
import { X, Search, Youtube, Music, Save, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import YouTube from 'react-youtube';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Song } from '../types';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ImportSongProps {
  onClose: () => void;
  onSave: (song: Song) => void;
}

export default function ImportSong({ onClose, onSave }: ImportSongProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('C');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [youtubeResults, setYoutubeResults] = useState<{ id: string, title: string, thumbnail: string }[]>([]);
  const [showYoutubeSearch, setShowYoutubeSearch] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const extractYoutubeId = (url: string) => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : undefined;
  };

  const youtubeId = extractYoutubeId(youtubeUrl);

  const handleSave = () => {
    setError(null);
    if (!title.trim()) {
      setError('O título da música é obrigatório');
      return;
    }
    if (!content.trim()) {
      setError('A letra com as cifras é obrigatória');
      return;
    }

    const newSong: Song = {
      id: Date.now().toString(),
      title: title.trim(),
      artist: artist.trim() || 'Artista Desconhecido',
      originalKey: key,
      currentKey: key,
      content: content.trim(),
      youtubeId,
      fontSize: 18,
      autoScrollSpeed: 5,
      isFavorite: false,
      tags: []
    };

    onSave(newSong);
  };

  const handleAISearch = async () => {
    if (!title.trim()) {
      setError('Digite o título da música para buscar com IA');
      return;
    }

    setIsSearchingAI(true);
    setError(null);

    try {
      const prompt = `Você é um especialista em transcrição musical. 
      Sua tarefa é encontrar a letra COMPLETA e os acordes EXATOS da música "${title}" do artista "${artist || 'artista correspondente'}".
      
      REGRAS CRÍTICAS:
      1. NÃO misture com outras músicas. Verifique se cada estrofe pertence a esta música específica.
      2. A letra deve estar COMPLETA (do início ao fim).
      3. Use o formato ChordPro: [Acorde]Letra. O acorde deve estar exatamente antes da sílaba de mudança.
      4. Retorne APENAS o conteúdo da música. Sem introduções, sem "Aqui está a cifra", sem comentários.
      5. Se não tiver certeza absoluta da letra completa, use a busca para validar cada parte.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1, // Lower temperature for more factual consistency
        }
      });

      const result = response.text;
      if (result) {
        setContent(result.trim());
        
        // Try to guess the key from the first chord found
        const firstChordMatch = result.match(/\[([A-G][#b]?[m7]*)\]/);
        if (firstChordMatch) {
          const guessedKey = firstChordMatch[1].replace(/[m7]/g, '');
          setKey(guessedKey);
        }
      } else {
        setError('Não foi possível encontrar a cifra para esta música.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar cifra com IA. Verifique sua conexão.');
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleYoutubeSearch = async () => {
    if (!title.trim()) {
      setError('Digite o título da música para buscar no YouTube');
      return;
    }

    setIsSearchingYoutube(true);
    setError(null);
    setShowYoutubeSearch(true);

    try {
      const prompt = `Encontre os 3 vídeos mais relevantes no YouTube para a música "${title}" ${artist ? `do artista "${artist}"` : ''}.
      Você DEVE usar a ferramenta de busca para encontrar IDs de vídeo REAIS e ATUAIS.
      Retorne um array JSON de objetos. Cada objeto deve ter:
      - "id": o ID de 11 caracteres do vídeo do YouTube (ex: pS-fU-xY6X0)
      - "title": o título do vídeo
      - "thumbnail": a URL da thumbnail de alta resolução (ex: https://img.youtube.com/vi/ID/maxresdefault.jpg)
      
      Retorne APENAS o JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setYoutubeResults(result);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar vídeos no YouTube. Tente novamente.');
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  const mockImport = () => {
    setIsParsing(true);
    // Simulating API fetch
    setTimeout(() => {
      setTitle('Tempo Perdido');
      setArtist('Legião Urbana');
      setKey('C');
      setContent(`[C]Todos os [Am7]dias quando [Bm7]acordo
Não te[Em]nho mais o [C]tempo que pas[Am7]sou
Mas vejo [Bm7]mãos que cons[Em]troem
O [C]tempo que virá[Am7]
Eu [Bm7]vou te bus[Em]car na frente do [C]mar
[Am7]Na frente do [Bm7]mar[Em]`);
      setIsParsing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="h-16 sm:h-20 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 border-b border-zinc-800 shrink-0">
        <button onClick={onClose} className="p-2 sm:p-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl sm:rounded-2xl transition-all">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-white font-black tracking-tight text-base sm:text-lg">Nova Música</h2>
          <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Importar ou Criar</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-orange-500 text-black px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
        >
          Salvar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/50 p-3 sm:p-4 rounded-xl flex items-center gap-3 text-red-500"
            >
              <AlertCircle size={18} className="sm:size-5" />
              <span className="text-xs sm:text-sm font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <button 
              onClick={handleAISearch}
              disabled={isSearchingAI || !title.trim()}
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center gap-2 sm:gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 group shadow-xl"
            >
              {isSearchingAI ? (
                <>
                  <Loader2 size={24} className="text-orange-500 animate-spin sm:size-8" />
                  <span className="text-[8px] sm:text-[10px] text-orange-500 animate-pulse font-black uppercase tracking-widest">Buscando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} className="text-orange-500 group-hover:scale-110 transition-transform sm:size-8" />
                  <span className="text-[10px] sm:text-xs font-black text-zinc-300 uppercase tracking-widest">IA</span>
                </>
              )}
            </button>
          </div>
          <button 
            onClick={mockImport}
            disabled={isParsing}
            className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col items-center gap-2 sm:gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 h-fit shadow-xl group"
          >
            <Search size={24} className="text-zinc-500 group-hover:scale-110 transition-transform sm:size-8" />
            <span className="text-[10px] sm:text-xs font-black text-zinc-300 uppercase tracking-widest">Exemplo</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Título da Música</label>
            <input 
              type="text"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all outline-none"
              placeholder="Ex: Tempo Perdido"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Artista / Banda</label>
            <input 
              type="text"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all outline-none"
              placeholder="Ex: Legião Urbana"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Tom Original</label>
              <select 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-orange-500/20 outline-none appearance-none transition-all"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Link do YouTube</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Youtube className={cn("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", youtubeId ? "text-red-500" : "text-zinc-500")} size={18} />
                  <input 
                    type="text"
                    className={cn(
                      "w-full bg-zinc-900/50 border rounded-2xl p-4 pl-12 text-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all",
                      youtubeId ? "border-red-900/30" : "border-zinc-800"
                    )}
                    placeholder="Cole o link..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleYoutubeSearch}
                  disabled={isSearchingYoutube || !title.trim()}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-2xl transition-all disabled:opacity-50 active:scale-95"
                  title="Buscar no YouTube"
                >
                  {isSearchingYoutube ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
              </div>
            </div>
          </div>

          {showYoutubeSearch && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  {isSearchingYoutube ? 'Buscando no YouTube...' : 'Resultados do YouTube'}
                </span>
                <button onClick={() => setShowYoutubeSearch(false)} className="text-zinc-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              
              {isSearchingYoutube ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 size={32} className="text-red-500 animate-spin" />
                  <p className="text-xs text-zinc-500 animate-pulse">Consultando vídeos reais...</p>
                </div>
              ) : youtubeResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {youtubeResults.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => {
                        setYoutubeUrl(`https://www.youtube.com/watch?v=${video.id}`);
                        setShowYoutubeSearch(false);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
                    >
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-20 aspect-video object-cover rounded shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate group-hover:text-red-400 transition-colors">{video.title}</p>
                        <p className="text-[10px] text-zinc-500">ID: {video.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-zinc-500">Nenhum vídeo encontrado para esta busca.</p>
                </div>
              )}
            </div>
          )}

          {youtubeId && (
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase px-2">Pré-visualização do Vídeo</span>
                <button 
                  onClick={() => setYoutubeUrl('')}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="aspect-video">
                <YouTube 
                  videoId={youtubeId} 
                  opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, modestbranding: 1 } }}
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Letra e Acordes (ChordPro)</label>
              <span className="text-[10px] text-zinc-600 font-medium">Use [C] para inserir acordes</span>
            </div>
            <textarea 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 text-white font-mono text-sm min-h-[400px] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none shadow-inner"
              placeholder="[C]Todos os [Am7]dias quando [Bm7]acordo..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
