import { apiRequest } from './api.service';

export type ServerImportAction =
  | 'CREATE'
  | 'UPDATE'
  | 'REACTIVATE'
  | 'SKIP';

export interface ServerImportNormalizedData {
  hostname: string;
  companyId: number;
  companyName: string;
  environment: 'PRD' | 'QAS' | 'DEV' | null;
  ipAddress: string | null;
  operatingSystemId: number | null;
  operatingSystemLabel: string | null;
  cpuCores: number | null;
  ramGb: number | null;
  diskGb: number | null;
  active: boolean;
  notes: string | null;
  software: Array<{
    softwareId: number;
    name: string;
    version: string;
  }>;
  existingServerId: number | null;
  existingServerActive: boolean | null;
}

export interface ServerImportRow {
  id: number;
  batchId: number;
  rowNumber: number;
  rawData: Record<string, string>;
  normalizedData: ServerImportNormalizedData | null;
  suggestedAction: ServerImportAction;
  validationStatus: 'VALID' | 'ERROR';
  errors: string[] | null;
  warnings: string[] | null;
  selectedAction: ServerImportAction | null;
  resultStatus: 'SUCCESS' | 'FAILED' | 'SKIPPED' | null;
  resultMessage: string | null;
  serverId: number | null;
}

export interface ServerImportBatch {
  id: number;
  fileName: string;
  status: 'PREVIEWED' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  totalRows: number;
  validRows: number;
  errorRows: number;
  createdCount: number;
  updatedCount: number;
  reactivatedCount: number;
  skippedCount: number;
  failedCount: number;
  createdAt: string;
  completedAt: string | null;
  user?: {
    id: number;
    username: string;
    name: string;
  } | null;
  rows?: ServerImportRow[];
}

export async function previewServerImport(
  file: File,
): Promise<ServerImportBatch> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<ServerImportBatch>(
    '/server-imports/preview',
    {
      method: 'POST',
      body: formData,
      fallbackMessage:
        'No fue posible prevalidar el archivo',
    },
  );
}

export async function confirmServerImport(
  batchId: number,
  decisions: Array<{
    rowId: number;
    action: ServerImportAction;
  }>,
): Promise<ServerImportBatch> {
  return apiRequest<ServerImportBatch>(
    `/server-imports/${batchId}/confirm`,
    {
      method: 'POST',
      body: { decisions },
      fallbackMessage:
        'No fue posible confirmar la carga masiva',
    },
  );
}

export async function getServerImportHistory(): Promise<ServerImportBatch[]> {
  return apiRequest<ServerImportBatch[]>(
    '/server-imports',
    {
      fallbackMessage:
        'No fue posible cargar el historial de importaciones',
    },
  );
}

export async function downloadServerImportTemplate(): Promise<void> {
  const blob = await apiRequest<Blob>(
    '/server-imports/template.xlsx',
    {
      responseType: 'blob',
      fallbackMessage:
        'No fue posible descargar la plantilla',
    },
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'infrastock-plantilla-carga-servidores.xlsx';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
