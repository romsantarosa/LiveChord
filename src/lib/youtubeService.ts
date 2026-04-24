import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface YoutubeSearchResult {
  id: string;
  title: string;
  thumbnail: string;
}

export interface ProcessedSong {
  title: string;
  artist: string;
  content: string;
  key: string;
  youtubeId: string;
}

function extractJson(text: string) {
  try {
    // Attempt to find JSON object or array within the text
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    throw new Error("Resposta da IA inválida. Tente novamente.");
  }
}

export async function searchYoutube(query: string): Promise<YoutubeSearchResult[]> {
  try {
    const prompt = `Busque os 10 vídeos mais relevantes para: "${query}".
    Priorize versões originais ou de alta qualidade.
    Retorne um array JSON filtrado: [{"id": "11_chars", "title": "Song Title", "thumbnail": "URL"}].
    RETORNE APENAS O JSON PURO. NADA ALÉM DISSO.`;

    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    return extractJson(response.text);
  } catch (err) {
    console.error("Error searching:", err);
    throw err;
  }
}

export async function processYoutubeVideo(youtubeId: string, suggestedTitle: string): Promise<ProcessedSong> {
  try {
    const prompt = `IDENTIFICAÇÃO E CIFRAÇÃO DE ALTA PRECISÃO.
    Vídeo Referência: https://www.youtube.com/watch?v=${youtubeId}
    Música Provável: "${suggestedTitle}"
    
    INSTRUÇÕES:
    1. Verifique se o vídeo corresponde à música "${suggestedTitle}".
    2. Pesquise em fontes como Cifra Club, Vagalume, Cifras.com.br ou Ultimate-Guitar para obter os acordes reais.
    3. Transforme para o formato ChordPro: [Acorde]Letra.
    
    RETORNE APENAS ESTE JSON:
    {
      "title": "Título Oficial",
      "artist": "Nome do Artista",
      "content": "Letra com cifras [C]Exemplo [G]Música",
      "key": "Tom (ex: G, Em, Bb)"
    }
    
    IMPORTANTE: Se for Faroeste Caboclo ou músicas longas, retorne a letra COMPLETA. 
    RETORNE APENAS O JSON PURO.`;
    
    const response = await (ai as any).models.generateContent({
      model: "gemini-3.1-pro-preview", // Use Pro for complex song processing (like Faroeste Caboclo)
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    const result = extractJson(response.text);
    
    let finalKey = result.key || 'C';
    if (!result.key && result.content) {
      const firstChordMatch = result.content.match(/\[([A-G][#b]?[m7]*)\]/);
      if (firstChordMatch) {
        finalKey = firstChordMatch[1].replace(/[m7]/g, '');
      }
    }
    
    return {
      title: result.title || suggestedTitle,
      artist: result.artist || 'Artista Desconhecido',
      content: result.content || '',
      key: finalKey,
      youtubeId
    };
  } catch (err) {
    console.error("Error processing:", err);
    throw err;
  }
}
