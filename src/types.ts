export interface Song {
  id: string;
  userId?: string;
  title: string;
  artist: string;
  originalKey: string;
  currentKey: string;
  content: string; // ChordPro format: "Hello [C]world"
  youtubeId?: string;
  fontSize: number;
  autoScrollSpeed: number;
  isFavorite: boolean;
  bpm?: number;
  tags: string[];
  createdAt: number;
}

export interface Setlist {
  id: string;
  userId?: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

export interface Artist {
  id: string;
  userId?: string;
  name: string;
  createdAt: number;
}
