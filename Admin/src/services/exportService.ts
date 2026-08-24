import { ExportRecord, ExportType, ExportFormat } from '../types';
import { mockExportHistory, mockCreators, mockBrands, mockCampaigns, mockStaffUsers } from '../mocks/mockData';

let exportsState: ExportRecord[] = [...mockExportHistory];

export const exportService = {
  getExports: async (): Promise<ExportRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...exportsState]), 150);
    });
  },

  createExport: async (params: {
    type: ExportType;
    format: ExportFormat;
    filters: string;
    userName: string;
    userRole: string;
  }): Promise<ExportRecord> => {
    return new Promise((resolve) => {
      let count = 0;
      if (params.type === 'Creator Data') count = mockCreators.length;
      else if (params.type === 'Brand Data') count = mockBrands.length;
      else if (params.type === 'Campaign Data') count = mockCampaigns.length;
      else count = mockStaffUsers.length;

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
      setTimeout(() => resolve(newRecord), 300);
    });
  },

  downloadDataset: (type: ExportType, format: ExportFormat) => {
    let filename = `collune_${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    let content = '';

    if (type === 'Creator Data') {
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Creator ID', 'Name', 'Handle', 'Category', 'Location', 'Followers', 'Engagement', 'Status', 'Verification'];
      const rows = mockCreators.map((c) => [
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
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Brand ID', 'Name', 'Industry', 'Email', 'Total Campaigns', 'Total Spend', 'Status'];
      const rows = mockBrands.map((b) => [
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
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['Campaign ID', 'Title', 'Brand', 'Category', 'Budget', 'Creators', 'Status', 'Start Date', 'End Date'];
      const rows = mockCampaigns.map((cmp) => [
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
    } else {
      filename += format === 'CSV' ? '.csv' : '.txt';
      const headers = ['User ID', 'Name', 'Email', 'Department', 'Role', 'Status', 'Last Login'];
      const rows = mockStaffUsers.map((u) => [
        u.id,
        `"${u.name}"`,
        u.email,
        `"${u.department}"`,
        `"${u.roleName}"`,
        u.status,
        u.lastLogin,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([content], { type: format === 'CSV' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
