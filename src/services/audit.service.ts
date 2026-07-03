import prisma from '../lib/prisma.ts';
import { requestContext } from '../middleware/request-id.ts';

export const AuditAction = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  
  EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
  EMPLOYEE_EDIT: 'EMPLOYEE_EDIT',
  EMPLOYEE_DEACTIVATE: 'EMPLOYEE_DEACTIVATE',
  EMPLOYEE_RESTORE: 'EMPLOYEE_RESTORE',
  
  PAYROLL_GENERATE: 'PAYROLL_GENERATE',
  PAYROLL_FINALIZE: 'PAYROLL_FINALIZE',
  SALARY_EDIT: 'SALARY_EDIT',
  
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DOCUMENT_DOWNLOAD: 'DOCUMENT_DOWNLOAD',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  
  USER_CREATE: 'USER_CREATE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

interface LogParams {
  userId?: string;
  companyId?: string;
  action: AuditActionType | string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  req?: any; // To extract correlationId
  correlationId?: string;
}

export class AuditService {
  static async log({
    userId,
    companyId,
    action,
    entityType,
    entityId,
    metadata = {},
    ipAddress,
    req,
    correlationId
  }: LogParams) {
    try {
      const store = requestContext.getStore();
      const asyncReqId = store?.get('requestId');
      const finalCorrelationId = correlationId || req?.id || asyncReqId;
      
      if (finalCorrelationId) {
        metadata = { ...metadata, correlationId: finalCorrelationId };
      }
      
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          metadata,
          ip_address: ipAddress,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}
