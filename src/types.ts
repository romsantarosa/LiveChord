export interface Song {
  id: string;
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
}

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}
