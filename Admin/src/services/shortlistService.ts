import { Shortlist, ShortlistStatus } from '../types';
import * as api from '../lib/api';

let shortlistsState: Shortlist[] = [];

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
    const apiShortlists = await api.getAdminShortlists();
    shortlistsState = apiShortlists.map(mapApiShortlist);
    return [...shortlistsState];
  },

  getShortlistById: async (id: string): Promise<Shortlist | null> => {
    const apiShortlist = await api.getAdminShortlist(id);
    const shortlist = mapApiShortlist(apiShortlist);
    shortlistsState = shortlistsState.some((s) => s.id === shortlist.id)
      ? shortlistsState.map((s) => (s.id === shortlist.id ? shortlist : s))
      : [shortlist, ...shortlistsState];
    return shortlist;
  },
};
