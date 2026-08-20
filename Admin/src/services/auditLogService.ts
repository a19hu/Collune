import { AuditLog, AuditAction, ModuleName } from '../types';
import { mockAuditLogs } from '../mocks/mockData';

let auditLogsState: AuditLog[] = [...mockAuditLogs];

export const auditLogService = {
  getLogs: async (): Promise<AuditLog[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...auditLogsState]), 150);
    });
  },

  logAction: async (params: {
    userId: string;
    userName: string;
    userRole: string;
    action: AuditAction;
    module: ModuleName;
    description: string;
    targetId?: string;
  }): Promise<AuditLog> => {
    return new Promise((resolve) => {
      const newLog: AuditLog = {
        id: `AUD-${String(auditLogsState.length + 1).padStart(3, '0')}`,
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        module: params.module,
        description: params.description,
        targetId: params.targetId,
        ipAddress: '103.21.14.88',
        timestamp: new Date().toISOString(),
      };
      auditLogsState = [newLog, ...auditLogsState];
      resolve(newLog);
    });
  },
};
