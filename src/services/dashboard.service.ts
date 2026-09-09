import { apiRequest } from './api.service';

export type EnvironmentFilter =
  | 'PRD'
  | 'QAS'
  | 'DEV'
  | '';

export type CompanyFilter =
  | number
  | '';

export interface DashboardItem {
  id: number;
  name: string;
  count: number;
  version?: string;
}

export interface DashboardQuality {
  missingIp: number;
  missingOperatingSystem: number;
  incompleteResources: number;
  missingSoftware: number;
  completeInventory: number;
  completenessPercentage: number;
  issueCountDistribution: {
    zero: number;
    one: number;
    two: number;
    threePlus: number;
  };
}

export interface DashboardSoftwareVersionSpread {
  softwareId: number;
  name: string;
  versions: string[];
  versionCount: number;
  serverCount: number;
}

export interface DashboardActivity {
  id: number;
  action: string;
  entityId: number | null;
  entityName: string | null;
  message: string;
  createdAt: string;

  user: {
    id: number;
    username: string;
    name: string;
  } | null;

  company: {
    id: number;
    name: string;
  } | null;
}

export interface DashboardSummary {
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;

  selectedCompanyId:
    number | null;

  totals: {
    servers: number;
    active: number;
    inactive: number;
    prd: number;
    qas: number;
    dev: number;
    filtered: number;
    filteredActive: number;
    filteredInactive: number;
  };

  resources: {
    cpuCores: number;
    ramGb: number;
    diskGb: number;
  };

  quality:
    DashboardQuality;

  softwareVersionSpread:
    DashboardSoftwareVersionSpread[];

  operatingSystems:
    DashboardItem[];

  software:
    DashboardItem[];

  companies:
    DashboardItem[];

  recentActivity:
    DashboardActivity[];
}

export async function getDashboardSummary(
  environment:
    EnvironmentFilter = '',
  companyId:
    CompanyFilter = '',
): Promise<DashboardSummary> {
  const params =
    new URLSearchParams();

  if (environment) {
    params.set(
      'environment',
      environment,
    );
  }

  if (companyId !== '') {
    params.set(
      'companyId',
      String(companyId),
    );
  }

  const query = params.toString();

  return apiRequest<DashboardSummary>(
    query
      ? `/dashboard/summary?${query}`
      : '/dashboard/summary',
    {
      fallbackMessage:
        'No fue posible obtener las métricas del dashboard.',
    },
  );
}
