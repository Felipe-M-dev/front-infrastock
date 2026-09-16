import { apiRequest } from './api.service';

import type {
  SoftwareEndOfLifeInfo,
} from './catalogs.service';

export interface LifecycleCompany {
  id: number;
  name: string;
}

export interface OperatingSystemLifecycleItem {
  operatingSystemId: number;
  name: string;
  version: string;
  active: boolean;
  configuredProductKey: string | null;
  serverCount: number;
  companies: LifecycleCompany[];
  environments: string[];
  endOfLife: SoftwareEndOfLifeInfo;
}

export interface OperatingSystemLifecycleResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  thresholdDays: number;
  totals: {
    servers: number;
    serversWithOperatingSystem: number;
    operatingSystems: number;
    versions: number;
    eol: number;
    eolSoon: number;
    supported: number;
    unknown: number;
    eolServers: number;
    eolSoonServers: number;
  };
  items: OperatingSystemLifecycleItem[];
}

export interface OperatingSystemLifecycleFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

function buildQuery(
  filters: OperatingSystemLifecycleFilters,
) {
  const params =
    new URLSearchParams();

  if (
    filters.companyId !==
    undefined
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

  return params.toString();
}

export async function getOperatingSystemLifecycle(
  filters: OperatingSystemLifecycleFilters = {},
): Promise<OperatingSystemLifecycleResponse> {
  const query =
    buildQuery(filters);

  return apiRequest<OperatingSystemLifecycleResponse>(
    query
      ? `/lifecycle/operating-systems?${query}`
      : '/lifecycle/operating-systems',
    {
      fallbackMessage:
        'No fue posible obtener el ciclo de vida de los sistemas operativos.',
    },
  );
}
