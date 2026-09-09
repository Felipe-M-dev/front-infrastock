import { apiRequest } from './api.service';


export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'REVERT'
  | string;

export interface AuditUser {
  id: number;
  username: string;
  name: string;
}

export interface AuditCompany {
  id: number;
  name: string;
  slug: string;
}

export interface AuditLog {
  id: number;
  action: AuditAction;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  details: Record<string, unknown> | null;

  userId: number | null;
  companyId: number | null;

  user: AuditUser | null;
  company: AuditCompany | null;

  createdAt: string;
}

export interface RevertPreviewChange {
  field: string;
  label: string;
  currentValue: unknown;
  currentDisplay: unknown;
  recordedAfterValue: unknown;
  targetValue: unknown;
  targetDisplay: unknown;
  changedAfterEvent: boolean;
  warning: string | null;
}

export interface RevertPreviewResponse {
  auditLogId: number;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  sourceAction: string;
  sourceCreatedAt: string;

  sourceUser: AuditUser | null;

  server: {
    id: number;
    hostname: string;
    companyId: number | null;
    company: AuditCompany | null;
  };

  reversible: boolean;
  hasLaterChanges: boolean;
  changes: RevertPreviewChange[];
}

export interface RevertAuditResponse {
  message: string;
  sourceAuditLogId: number;

  server: {
    id: number;
    hostname: string;
    [key: string]: unknown;
  };
}

export async function getAuditHistory(
  entityType: string,
  entityId: number,
): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>(
    `/audit/${entityType}/${entityId}`,
    {
      fallbackMessage:
        'No fue posible obtener el historial.',
    },
  );
}

export async function getRevertPreview(
  auditLogId: number,
): Promise<RevertPreviewResponse> {
  return apiRequest<RevertPreviewResponse>(
    `/audit/${auditLogId}/revert-preview`,
    {
      fallbackMessage:
        'No fue posible preparar la reversión.',
    },
  );
}

export async function revertAuditLog(
  auditLogId: number,
): Promise<RevertAuditResponse> {
  return apiRequest<RevertAuditResponse>(
    `/audit/${auditLogId}/revert`,
    {
      method: 'POST',
      fallbackMessage:
        'No fue posible revertir el cambio.',
    },
  );
}
