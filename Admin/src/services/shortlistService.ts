import { Shortlist } from '../types';
import { mockShortlists } from '../mocks/mockData';

let shortlistsState: Shortlist[] = [...mockShortlists];

export const shortlistService = {
  getShortlists: async (): Promise<Shortlist[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...shortlistsState]), 150);
    });
  },

  getShortlistById: async (id: string): Promise<Shortlist | null> => {
    return new Promise((resolve) => {
      const shortlist = shortlistsState.find((s) => s.id === id || s.shortlistCode === id) || null;
      setTimeout(() => resolve(shortlist ? { ...shortlist } : null), 100);
    });
  },
};
