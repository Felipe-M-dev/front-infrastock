import {
  apiFetch,
  apiRequest,
} from './api.service';

export interface CompanyRef {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface AuditUser {
  id: number;
  username: string;
  name: string;
}

export interface OperatingSystemRef {
  id: number;
  name: string;
  version: string;
  active: boolean;
}

export interface SoftwareRef {
  id: number;
  name: string;
  active: boolean;
}

export interface ServerSoftware {
  id: number;
  serverId: number;
  softwareId: number;
  version: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  software: SoftwareRef;
}

export interface Server {
  id: number;
  hostname: string;
  ipAddress: string | null;
  environment: string | null;
  cpuCores: number | null;
  ramGb: number | null;
  diskGb: number | null;
  notes: string | null;
  active: boolean;
  servicesOnitec: boolean;

  companyId: number | null;
  company: CompanyRef | null;

  operatingSystemId:
    number | null;

  operatingSystem:
    OperatingSystemRef | null;

  createdById:
    number | null;

  updatedById:
    number | null;

  createdBy:
    AuditUser | null;

  updatedBy:
    AuditUser | null;

  software:
    ServerSoftware[];

  createdAt:
    string;

  updatedAt:
    string;
}

export interface ServerSoftwarePayload {
  softwareId: number;
  version: string;
  notes?: string;
}

export interface CreateServerPayload {
  hostname: string;
  ipAddress?: string | null;
  environment?: string;
  cpuCores?: number | null;
  ramGb?: number | null;
  diskGb?: number | null;
  notes?: string;
  active?: boolean;
  servicesOnitec?: boolean;
  companyId?: number;
  operatingSystemId?: number | null;
  software?: ServerSoftwarePayload[];
}

export type ServerSortBy =
  | 'hostname'
  | 'company'
  | 'ipAddress'
  | 'environment'
  | 'operatingSystem'
  | 'cpuCores'
  | 'ramGb'
  | 'diskGb'
  | 'updatedAt';

export type ServerSortOrder =
  | 'asc'
  | 'desc';

export type ServerInventoryIssue =
  | 'missingIp'
  | 'missingOperatingSystem'
  | 'incompleteResources'
  | 'missingSoftware';

export type ServerQualityIssueCount =
  | '0'
  | '1'
  | '2'
  | '3plus';

export type ServerSoftwareSupportStatus =
  | 'EOL'
  | 'EOL_SOON';

export type ServerInventoryFreshness =
  | 'recent'
  | 'days30to59'
  | 'days60to89'
  | 'days90plus';

export type ServerInventoryConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type ServerExportField =
  | 'hostname'
  | 'company'
  | 'ipAddress'
  | 'environment'
  | 'operatingSystem'
  | 'cpuCores'
  | 'ramGb'
  | 'diskGb'
  | 'software'
  | 'active'
  | 'notes'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy';

export const SERVER_EXPORT_FIELDS:
  ServerExportField[] = [
    'hostname',
    'company',
    'ipAddress',
    'environment',
    'operatingSystem',
    'cpuCores',
    'ramGb',
    'diskGb',
    'software',
    'active',
    'notes',
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
  ];

export interface ServerFilters {
  search?: string;

  companyId?:
    | number
    | '';

  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | '';

  operatingSystemId?:
    | number
    | '';

  softwareId?:
    | number
    | '';

  softwareVersion?:
    string;

  inventoryIssue?:
    | ServerInventoryIssue
    | '';

  qualityIssueCount?:
    | ServerQualityIssueCount
    | '';

  softwareSupportStatus?:
    | ServerSoftwareSupportStatus
    | '';

  inventoryFreshness?:
    | ServerInventoryFreshness
    | '';

  inventoryConfidence?:
    | ServerInventoryConfidence
    | '';

  active?:
    | boolean
    | '';

  page?:
    number;

  pageSize?:
    | 10
    | 25
    | 50
    | 100;

  sortBy?:
    ServerSortBy;

  sortOrder?:
    ServerSortOrder;

  fields?:
    ServerExportField[];
}

export interface ServersResponse {
  items:
    Server[];

  total:
    number;

  filtered:
    number;

  page:
    number;

  pageSize:
    number;

  totalPages:
    number;

  sortBy:
    ServerSortBy;

  sortOrder:
    ServerSortOrder;
}

export interface ExportResult {
  blob:
    Blob;

  filename:
    string;
}

function buildServerParams(
  filters:
    ServerFilters,

  includePagination:
    boolean,
) {
  const params =
    new URLSearchParams();

  if (
    filters.search?.trim()
  ) {
    params.set(
      'search',
      filters.search.trim(),
    );
  }

  if (
    filters.companyId !==
      undefined &&
    filters.companyId !==
      ''
  ) {
    params.set(
      'companyId',
      String(
        filters.companyId,
      ),
    );
  }

  if (
    filters.environment
  ) {
    params.set(
      'environment',
      filters.environment,
    );
  }

  if (
    filters.operatingSystemId !==
      undefined &&
    filters.operatingSystemId !==
      ''
  ) {
    params.set(
      'operatingSystemId',
      String(
        filters.operatingSystemId,
      ),
    );
  }

  if (
    filters.softwareId !==
      undefined &&
    filters.softwareId !==
      ''
  ) {
    params.set(
      'softwareId',
      String(
        filters.softwareId,
      ),
    );
  }

  if (
    filters.softwareVersion?.trim()
  ) {
    params.set(
      'softwareVersion',
      filters.softwareVersion.trim(),
    );
  }

  if (
    filters.inventoryIssue
  ) {
    params.set(
      'inventoryIssue',
      filters.inventoryIssue,
    );
  }

  if (
    filters.qualityIssueCount
  ) {
    params.set(
      'qualityIssueCount',
      filters.qualityIssueCount,
    );
  }

  if (
    filters.softwareSupportStatus
  ) {
    params.set(
      'softwareSupportStatus',
      filters.softwareSupportStatus,
    );
  }

  if (
    filters.inventoryFreshness
  ) {
    params.set(
      'inventoryFreshness',
      filters.inventoryFreshness,
    );
  }

  if (
    filters.inventoryConfidence
  ) {
    params.set(
      'inventoryConfidence',
      filters.inventoryConfidence,
    );
  }

  if (
    filters.active !==
      undefined &&
    filters.active !==
      ''
  ) {
    params.set(
      'active',
      String(
        filters.active,
      ),
    );
  }

  if (
    includePagination &&
    filters.page !==
      undefined
  ) {
    params.set(
      'page',
      String(
        filters.page,
      ),
    );
  }

  if (
    includePagination &&
    filters.pageSize !==
      undefined
  ) {
    params.set(
      'pageSize',
      String(
        filters.pageSize,
      ),
    );
  }

  if (
    filters.sortBy
  ) {
    params.set(
      'sortBy',
      filters.sortBy,
    );
  }

  if (
    filters.sortOrder
  ) {
    params.set(
      'sortOrder',
      filters.sortOrder,
    );
  }

  if (
    filters.fields?.length
  ) {
    params.set(
      'fields',
      filters.fields.join(
        ',',
      ),
    );
  }

  return params;
}

function getFilenameFromResponse(
  response:
    Response,

  fallbackExtension:
    'csv'
    | 'xlsx',
) {
  const disposition =
    response.headers.get(
      'Content-Disposition',
    );

  if (
    disposition
  ) {
    const match =
      disposition.match(
        /filename="?([^";]+)"?/i,
      );

    if (
      match?.[1]
    ) {
      return match[1];
    }
  }

  const date =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

  return `infrastock-servidores-${date}.${fallbackExtension}`;
}

async function exportServers(
  endpoint: 'csv' | 'xlsx',
  filters: ServerFilters,
): Promise<ExportResult> {
  const params = buildServerParams(
    filters,
    false,
  );

  const query = params.toString();
  const path = query
    ? `/servers/export/${endpoint}?${query}`
    : `/servers/export/${endpoint}`;

  const response = await apiFetch(
    path,
    {
      fallbackMessage:
        `No fue posible exportar los servidores a ${endpoint.toUpperCase()}.`,
    },
  );

  const blob = await response.blob();
  const filename = getFilenameFromResponse(
    response,
    endpoint,
  );

  return { blob, filename };
}

export async function getServers(
  filters: ServerFilters = {},
): Promise<ServersResponse> {
  const params = buildServerParams(
    filters,
    true,
  );

  const query = params.toString();

  return apiRequest<ServersResponse>(
    query
      ? `/servers?${query}`
      : '/servers',
    {
      fallbackMessage:
        'No fue posible obtener los servidores.',
    },
  );
}

export async function getServer(
  id: number,
): Promise<Server> {
  return apiRequest<Server>(
    `/servers/${id}`,
    {
      fallbackMessage:
        'No fue posible obtener el servidor.',
    },
  );
}

export async function exportServersCsv(
  filters: ServerFilters = {},
): Promise<ExportResult> {
  return exportServers('csv', filters);
}

export async function exportServersXlsx(
  filters: ServerFilters = {},
): Promise<ExportResult> {
  return exportServers('xlsx', filters);
}

export async function createServer(
  payload: CreateServerPayload,
): Promise<Server> {
  return apiRequest<Server>(
    '/servers',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear el servidor.',
    },
  );
}

export async function updateServer(
  id: number,
  payload: CreateServerPayload,
): Promise<Server> {
  return apiRequest<Server>(
    `/servers/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar el servidor.',
    },
  );
}

export async function deleteServer(
  id: number,
): Promise<void> {
  await apiRequest<void>(
    `/servers/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar el servidor.',
    },
  );
}

export async function activateServer(
  id: number,
): Promise<Server> {
  return apiRequest<Server>(
    `/servers/${id}/activate`,
    {
      method: 'PATCH',
      fallbackMessage:
        'No fue posible activar el servidor.',
    },
  );
}

export async function deactivateServer(
  id: number,
): Promise<Server> {
  return apiRequest<Server>(
    `/servers/${id}/deactivate`,
    {
      method: 'PATCH',
      fallbackMessage:
        'No fue posible desactivar el servidor.',
    },
  );
}
