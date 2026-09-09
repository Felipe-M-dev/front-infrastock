import { apiRequest } from './api.service';

export interface AuditUser {
  id: number;
  username: string;
  name: string;
}

export interface OperatingSystem {
  id: number;
  name: string;
  version: string;
  active: boolean;

  createdById: number | null;
  updatedById: number | null;

  createdBy: AuditUser | null;
  updatedBy: AuditUser | null;

  createdAt: string;
  updatedAt: string;
}

export type SoftwareCategory =
  | 'DATABASE'
  | 'APP_SERVER'
  | 'RUNTIME_FRAMEWORK'
  | 'CONTAINER_ORCHESTRATION'
  | 'OBSERVABILITY'
  | 'DEVOPS'
  | 'MESSAGING_CACHE'
  | 'OTHER';

export interface SoftwareCatalogItem {
  id: number;
  name: string;
  category: SoftwareCategory;
  active: boolean;

  createdById: number | null;
  updatedById: number | null;

  createdBy: AuditUser | null;
  updatedBy: AuditUser | null;

  createdAt: string;
  updatedAt: string;
}

export interface ServerOperatingSystemCatalogItem {
  id: number;
  name: string;
  version: string;
  active: boolean;
}

export interface ServerSoftwareCatalogItem {
  id: number;
  name: string;
  category?: SoftwareCategory;
  active: boolean;
}

export interface ServerCatalogs {
  operatingSystems:
    ServerOperatingSystemCatalogItem[];

  software:
    ServerSoftwareCatalogItem[];
}

export interface ServerSoftwareVersionsResponse {
  softwareId: number;
  versions: string[];
}

export interface ServerSoftwareVersionFilters {
  softwareId: number;
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

export interface SoftwareVersionInventoryCompany {
  id: number;
  name: string;
}

export type EndOfLifeSupportStatus =
  | 'SUPPORTED'
  | 'EOL_SOON'
  | 'EOL'
  | 'UNKNOWN';

export interface EndOfLifeVersionStatus {
  installedVersion: string;
  cycle: string | null;
  status: EndOfLifeSupportStatus;
  eolDate: string | null;
  daysToEol: number | null;
  latestInCycle: string | null;
  isLts: boolean;
}

export interface EndOfLifeRecommendation {
  cycle: string;
  latestVersion: string;
  eolDate: string | null;
  daysToEol: number | null;
  isLts: boolean;
}

export interface SoftwareEndOfLifeInfo {
  provider: 'endoflife.date';
  product: string | null;
  status:
    | 'AVAILABLE'
    | 'NOT_CONFIGURED'
    | 'UNAVAILABLE';
  checkedAt: string;
  recommendation:
    EndOfLifeRecommendation | null;
  versions:
    EndOfLifeVersionStatus[];
}

export interface SoftwareVersionInventoryVersion {
  version: string;
  serverCount: number;
  companies:
    SoftwareVersionInventoryCompany[];
  environments: string[];
}

export interface SoftwareVersionInventoryItem {
  softwareId: number;
  name: string;
  active: boolean;
  serverCount: number;
  versionCount: number;
  hasMultipleVersions: boolean;
  companies:
    SoftwareVersionInventoryCompany[];
  environments: string[];
  versions:
    SoftwareVersionInventoryVersion[];
  endOfLife:
    SoftwareEndOfLifeInfo;
}

export interface SoftwareVersionInventoryResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  totals: {
    software: number;
    versions: number;
    multipleVersionSoftware: number;
    servers: number;
  };
  items:
    SoftwareVersionInventoryItem[];
}

export interface SoftwareVersionInventoryFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

export interface SoftwareSupportSummaryResponse {
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
    serversWithSoftware: number;
    eol: number;
    eolSoon: number;
    supported: number;
    unknown: number;
    mappedProducts: number;
    availableProducts: number;
    unavailableProducts: number;
    notConfiguredProducts: number;
  };
}

export interface SoftwareSupportSummaryFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}


export type SoftwareUpdatePriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM';

export interface SoftwareUpdatePriorityItem {
  softwareId: number;
  name: string;
  installedVersion: string;
  cycle: string | null;
  status:
    | 'EOL'
    | 'EOL_SOON';
  priority:
    SoftwareUpdatePriority;
  eolDate: string | null;
  daysToEol: number | null;
  latestInCycle: string | null;
  isLts: boolean;
  serverCount: number;
  prdServers: number;
  qasServers: number;
  devServers: number;
  companies: {
    id: number;
    name: string;
    serverCount: number;
  }[];
  recommendation: {
    cycle: string;
    latestVersion: string | null;
    eolDate: string | null;
    isLts: boolean;
  } | null;
}

export interface SoftwareUpdatePrioritiesResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  thresholdDays: number;
  totals: {
    critical: number;
    high: number;
    medium: number;
    affectedVersions: number;
    affectedServers: number;
  };
  items:
    SoftwareUpdatePriorityItem[];
}

export interface SoftwareUpdatePrioritiesFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

export type TechnologyRiskLevel =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export interface TechnologyRiskCompanyItem {
  id: number;
  name: string;
  riskLevel: TechnologyRiskLevel;
  affectedServers: number;
  criticalVersions: number;
  highVersions: number;
  mediumVersions: number;
  eolVersions: number;
  eolSoonVersions: number;
  exposurePoints: number;
}

export interface TechnologyRiskEnvironmentItem {
  environment: 'PRD' | 'QAS' | 'DEV';
  riskLevel: TechnologyRiskLevel;
  affectedServers: number;
  criticalVersions: number;
  highVersions: number;
  mediumVersions: number;
  eolVersions: number;
  eolSoonVersions: number;
  exposurePoints: number;
}

export interface TechnologyRiskResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  thresholdDays: number;
  totals: {
    affectedServers: number;
    affectedVersions: number;
    companiesAtRisk: number;
    criticalCompanies: number;
  };
  byCompany: TechnologyRiskCompanyItem[];
  byEnvironment: TechnologyRiskEnvironmentItem[];
}

export interface TechnologyRiskFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

export interface InventoryFreshnessOldestServer {
  id: number;
  hostname: string;
  updatedAt: string;
  ageDays: number;
  environment: string | null;
  company: {
    id: number;
    name: string;
  } | null;
}

export interface InventoryFreshnessSummaryResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  thresholds: {
    warningDays: number;
    staleDays: number;
    criticalDays: number;
  };
  totals: {
    total: number;
    recent: number;
    days30to59: number;
    days60to89: number;
    days90plus: number;
    stale30plus: number;
    freshnessPercentage: number;
  };
  oldest: InventoryFreshnessOldestServer | null;
}

export interface InventoryFreshnessSummaryFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}


export type InventoryConfidenceLevel =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export interface InventoryConfidenceLowestServer {
  id: number;
  hostname: string;
  environment: string | null;
  company: {
    id: number;
    name: string;
  } | null;
  updatedAt: string;
  score: number;
  level: InventoryConfidenceLevel;
  issueCount: number;
  ageDays: number;
  completenessPoints: number;
  freshnessPoints: number;
}

export interface InventoryConfidenceSummaryResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  scoring: {
    completenessMax: number;
    freshnessMax: number;
    issuePenalty: number;
    freshnessPoints: {
      recent: number;
      days30to59: number;
      days60to89: number;
      days90plus: number;
    };
    levels: {
      highMin: number;
      mediumMin: number;
    };
  };
  totals: {
    total: number;
    high: number;
    medium: number;
    low: number;
    averageScore: number;
    reliablePercentage: number;
  };
  lowest: InventoryConfidenceLowestServer | null;
}

export interface InventoryConfidenceSummaryFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}


export type InventoryReviewPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM';

export interface InventoryReviewSoftwareRisk {
  softwareId: number;
  name: string;
  installedVersion: string;
  status:
    | 'EOL'
    | 'EOL_SOON';
  eolDate: string | null;
  daysToEol: number | null;
  latestInCycle: string | null;
}

export interface InventoryReviewPriorityItem {
  id: number;
  hostname: string;
  company: {
    id: number;
    name: string;
  } | null;
  environment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  updatedAt: string;
  priority: InventoryReviewPriority;
  reviewScore: number;
  confidence: {
    score: number;
    level:
      | 'HIGH'
      | 'MEDIUM'
      | 'LOW';
    issueCount: number;
    ageDays: number;
    completenessPoints: number;
    freshnessPoints: number;
  };
  support: {
    hasEol: boolean;
    hasEolSoon: boolean;
    software: InventoryReviewSoftwareRisk[];
  };
  reasons: string[];
}

export interface InventoryReviewPrioritiesResponse {
  selectedCompanyId: number | null;
  selectedEnvironment:
    | 'PRD'
    | 'QAS'
    | 'DEV'
    | null;
  checkedAt: string;
  rules: {
    critical: string;
    high: string;
    medium: string;
  };
  totals: {
    critical: number;
    high: number;
    medium: number;
    reviewRequired: number;
  };
  items: InventoryReviewPriorityItem[];
}

export interface InventoryReviewPrioritiesFilters {
  companyId?: number;
  environment?:
    | 'PRD'
    | 'QAS'
    | 'DEV';
}

export interface CreateOperatingSystemPayload {
  name: string;
  version: string;
  active?: boolean;
}

export interface UpdateOperatingSystemPayload {
  name?: string;
  version?: string;
  active?: boolean;
}

export interface CreateSoftwarePayload {
  name: string;
  category: SoftwareCategory;
  active?: boolean;
}

export interface UpdateSoftwarePayload {
  name?: string;
  category?: SoftwareCategory;
  active?: boolean;
}

function buildScopeQuery(
  filters: {
    companyId?: number;
    environment?: 'PRD' | 'QAS' | 'DEV';
  },
) {
  const params = new URLSearchParams();

  if (filters.companyId !== undefined) {
    params.set('companyId', String(filters.companyId));
  }

  if (filters.environment) {
    params.set('environment', filters.environment);
  }

  return params.toString();
}

export async function getServerCatalogs(): Promise<ServerCatalogs> {
  return apiRequest<ServerCatalogs>(
    '/servers/catalogs',
    {
      fallbackMessage:
        'No fue posible obtener los catálogos de servidores.',
    },
  );
}

export async function getServerSoftwareVersions(
  filters: ServerSoftwareVersionFilters,
): Promise<ServerSoftwareVersionsResponse> {
  const params = new URLSearchParams();
  params.set('softwareId', String(filters.softwareId));

  if (filters.companyId !== undefined) {
    params.set('companyId', String(filters.companyId));
  }

  if (filters.environment) {
    params.set('environment', filters.environment);
  }

  return apiRequest<ServerSoftwareVersionsResponse>(
    `/servers/software-versions?${params.toString()}`,
    {
      fallbackMessage:
        'No fue posible obtener las versiones instaladas del software.',
    },
  );
}

export async function getSoftwareVersionInventory(
  filters: SoftwareVersionInventoryFilters = {},
): Promise<SoftwareVersionInventoryResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<SoftwareVersionInventoryResponse>(
    query
      ? `/servers/software-version-inventory?${query}`
      : '/servers/software-version-inventory',
    {
      fallbackMessage:
        'No fue posible obtener el inventario de versiones de software.',
    },
  );
}

export async function getSoftwareSupportSummary(
  filters: SoftwareSupportSummaryFilters = {},
): Promise<SoftwareSupportSummaryResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<SoftwareSupportSummaryResponse>(
    query
      ? `/servers/software-support-summary?${query}`
      : '/servers/software-support-summary',
    {
      fallbackMessage:
        'No fue posible obtener el estado de soporte del software.',
    },
  );
}

export async function getSoftwareUpdatePriorities(
  filters: SoftwareUpdatePrioritiesFilters = {},
): Promise<SoftwareUpdatePrioritiesResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<SoftwareUpdatePrioritiesResponse>(
    query
      ? `/servers/software-update-priorities?${query}`
      : '/servers/software-update-priorities',
    {
      fallbackMessage:
        'No fue posible obtener las prioridades de actualización.',
    },
  );
}

export async function getInventoryFreshnessSummary(
  filters: InventoryFreshnessSummaryFilters = {},
): Promise<InventoryFreshnessSummaryResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<InventoryFreshnessSummaryResponse>(
    query
      ? `/servers/inventory-freshness-summary?${query}`
      : '/servers/inventory-freshness-summary',
    {
      fallbackMessage:
        'No fue posible obtener la antigüedad del inventario.',
    },
  );
}

export async function getInventoryConfidenceSummary(
  filters: InventoryConfidenceSummaryFilters = {},
): Promise<InventoryConfidenceSummaryResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<InventoryConfidenceSummaryResponse>(
    query
      ? `/servers/inventory-confidence-summary?${query}`
      : '/servers/inventory-confidence-summary',
    {
      fallbackMessage:
        'No fue posible obtener la confiabilidad del inventario.',
    },
  );
}

export async function getInventoryReviewPriorities(
  filters: InventoryReviewPrioritiesFilters = {},
): Promise<InventoryReviewPrioritiesResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<InventoryReviewPrioritiesResponse>(
    query
      ? `/servers/inventory-review-priorities?${query}`
      : '/servers/inventory-review-priorities',
    {
      fallbackMessage:
        'No fue posible obtener la prioridad de revisión del inventario.',
    },
  );
}

export async function getTechnologyRisk(
  filters: TechnologyRiskFilters = {},
): Promise<TechnologyRiskResponse> {
  const query = buildScopeQuery(filters);
  return apiRequest<TechnologyRiskResponse>(
    query
      ? `/servers/technology-risk?${query}`
      : '/servers/technology-risk',
    {
      fallbackMessage:
        'No fue posible obtener el riesgo tecnológico.',
    },
  );
}

export async function getOperatingSystems(): Promise<OperatingSystem[]> {
  return apiRequest<OperatingSystem[]>(
    '/operating-systems',
    {
      fallbackMessage:
        'No fue posible obtener los sistemas operativos.',
    },
  );
}

export async function createOperatingSystem(
  payload: CreateOperatingSystemPayload,
): Promise<OperatingSystem> {
  return apiRequest<OperatingSystem>(
    '/operating-systems',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear el sistema operativo.',
    },
  );
}

export async function updateOperatingSystem(
  id: number,
  payload: UpdateOperatingSystemPayload,
): Promise<OperatingSystem> {
  return apiRequest<OperatingSystem>(
    `/operating-systems/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar el sistema operativo.',
    },
  );
}

export async function getSoftwareCatalog(): Promise<SoftwareCatalogItem[]> {
  return apiRequest<SoftwareCatalogItem[]>(
    '/software',
    {
      fallbackMessage:
        'No fue posible obtener el catálogo de software.',
    },
  );
}

export async function createSoftware(
  payload: CreateSoftwarePayload,
): Promise<SoftwareCatalogItem> {
  return apiRequest<SoftwareCatalogItem>(
    '/software',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear el software.',
    },
  );
}

export async function updateSoftware(
  id: number,
  payload: UpdateSoftwarePayload,
): Promise<SoftwareCatalogItem> {
  return apiRequest<SoftwareCatalogItem>(
    `/software/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible modificar el software.',
    },
  );
}
