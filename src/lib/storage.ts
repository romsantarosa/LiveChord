import { Song, Setlist, Artist } from '../types';

const SONGS_KEY = 'livechord_songs';
const SETLISTS_KEY = 'livechord_setlists';
const ARTISTS_KEY = 'livechord_artists';

export const storage = {
  getSongs: (): Song[] => {
    const data = localStorage.getItem(SONGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveSongs: (songs: Song[]) => {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
  },
  getSetlists: (): Setlist[] => {
    const data = localStorage.getItem(SETLISTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveSetlists: (setlists: Setlist[]) => {
    localStorage.setItem(SETLISTS_KEY, JSON.stringify(setlists));
  },
  getArtists: (): Artist[] => {
    const data = localStorage.getItem(ARTISTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveArtists: (artists: Artist[]) => {
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(artists));
  }
};
