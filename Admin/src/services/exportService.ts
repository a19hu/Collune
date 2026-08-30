import { ExportRecord, ExportType, ExportFormat } from '../types';
import * as api from '../lib/api';

let exportsState: ExportRecord[] = [];

function downloadText(filename: string, content: string, format: ExportFormat) {
  const blob = new Blob([content], { type: format === 'CSV' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportService = {
  getExports: async (): Promise<ExportRecord[]> => {
    return [...exportsState];
  },

  createExport: async (params: {
    type: ExportType;
    format: ExportFormat;
    filters: string;
    userName: string;
    userRole: string;
  }): Promise<ExportRecord> => {
    let count = 0;
    if (params.type === 'Creator Data') count = (await api.getAdminCreators()).length;
    else if (params.type === 'Brand Data') count = (await api.getAdminBrands()).length;
    else if (params.type === 'Campaign Data') count = (await api.getAdminCampaigns()).length;
    else if (params.type === 'Shortlist Data') count = (await api.getAdminShortlists()).length;
    else count = (await api.getStaffUsers()).length;

    const nextId = `EXP-${9040 + exportsState.length + 1}`;
    const newRecord: ExportRecord = {
      id: `EXP-${String(exportsState.length + 1).padStart(3, '0')}`,
      exportCode: nextId,
      type: params.type,
      requestedBy: params.userName,
      requestedByRole: params.userRole,
      recordsCount: count,
      format: params.format,
      status: 'Completed',
      filtersApplied: params.filters || 'All records',
      createdAt: new Date().toISOString(),
    };

    exportsState = [newRecord, ...exportsState];
    return newRecord;
  },

  downloadDataset: async (type: ExportType, format: ExportFormat) => {
    let filename = `collune_${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    let content = '';

    if (type === 'Creator Data') {
      const creators = await api.getAdminCreators();
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Creator ID', 'Name', 'Handle', 'Category', 'Location', 'Followers', 'Engagement', 'Status', 'Verification'];
      const rows = creators.map((c) => [
        c.id,
        `"${c.name}"`,
        c.handle,
        c.category,
        `"${c.location}"`,
        c.totalFollowers,
        `${c.primaryEngagementRate}%`,
        c.accountStatus,
        c.verificationStatus,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'Brand Data') {
      const brands = await api.getAdminBrands();
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Brand ID', 'Name', 'Industry', 'Email', 'Total Campaigns', 'Total Spend', 'Status'];
      const rows = brands.map((b) => [
        b.id,
        `"${b.name}"`,
        `"${b.industry}"`,
        b.email,
        b.totalCampaigns,
        b.totalSpend,
        b.verificationStatus,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'Campaign Data') {
      const campaigns = await api.getAdminCampaigns();
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Campaign ID', 'Title', 'Brand', 'Category', 'Budget', 'Creators', 'Status', 'Start Date', 'End Date'];
      const rows = campaigns.map((cmp) => [
        cmp.campaignCode,
        `"${cmp.title}"`,
        `"${cmp.brandName}"`,
        cmp.category,
        cmp.budget,
        cmp.creatorsRequired,
        cmp.status,
        cmp.startDate,
        cmp.endDate,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'Shortlist Data') {
      const shortlists = await api.getAdminShortlists();
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Shortlist ID', 'Title', 'Brand', 'Status', 'Creators', 'Platforms', 'Start Date', 'End Date'];
      const rows = shortlists.map((shortlist) => [
        shortlist.shortlistCode,
        `"${shortlist.title}"`,
        `"${shortlist.brandName}"`,
        shortlist.status,
        shortlist.creators.length,
        `"${shortlist.platforms.join(', ')}"`,
        shortlist.startDate,
        shortlist.endDate,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      const users = await api.getStaffUsers();
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Last Login'];
      const rows = users.map((u) => [
        u.user_id,
        `"${u.name}"`,
        u.email,
        `"${u.userrole?.assigned_role?.name || u.userrole?.role_name || 'Unassigned'}"`,
        u.is_active ? 'Active' : 'Inactive',
        u.last_login_at || 'Never',
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    downloadText(filename, content, format);
  },
};
