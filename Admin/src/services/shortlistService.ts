import { Shortlist, ShortlistStatus } from '../types';
import { mockShortlists } from '../mocks/mockData';
import * as api from '../lib/api';

let shortlistsState: Shortlist[] = [...mockShortlists];

function mapApiShortlist(apiShortlist: api.AdminShortlistApi): Shortlist {
  return {
    ...apiShortlist,
    status: apiShortlist.status as ShortlistStatus,
    platforms: apiShortlist.platforms as Shortlist['platforms'],
    creators: apiShortlist.creators.map((c) => ({ ...c, platform: c.platform as any })),
  };
}

export const shortlistService = {
  getShortlists: async (): Promise<Shortlist[]> => {
    try {
      const apiShortlists = await api.getAdminShortlists();
      shortlistsState = apiShortlists.map(mapApiShortlist);
      return [...shortlistsState];
    } catch (err) {
      // Not authenticated yet, or backend unreachable — keep working off the mock catalog.
      return [...shortlistsState];
    }
  },

  getShortlistById: async (id: string): Promise<Shortlist | null> => {
    try {
      const apiShortlist = await api.getAdminShortlist(id);
      const shortlist = mapApiShortlist(apiShortlist);
      shortlistsState = shortlistsState.some((s) => s.id === shortlist.id)
        ? shortlistsState.map((s) => (s.id === shortlist.id ? shortlist : s))
        : [shortlist, ...shortlistsState];
      return shortlist;
    } catch (err) {
      const shortlist = shortlistsState.find((s) => s.id === id || s.shortlistCode === id) || null;
      return shortlist ? { ...shortlist } : null;
    }
  },
};
