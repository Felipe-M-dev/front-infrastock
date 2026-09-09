import { apiRequest } from './api.service';

export interface EconomicIndicator {
  id: number;
  code: string;
  date: string;
  value: number;
  source: string;
  fetchedAt: string;
}

export type PricingValueType =
  | 'UF_PER_UNIT'
  | 'UF_FIXED'
  | 'PERCENT';

export interface PricingTariff {
  id: number;
  code: string;
  category: string;
  name: string;
  unit: string;
  value: number;
  valueType: PricingValueType | string;
  active: boolean;
  sourceNote: string | null;
  operatingSystemName: string | null;
  softwareId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingSummary {
  uf: EconomicIndicator | null;
  tariffs: PricingTariff[];
  operatingSystemNames: string[];
  databaseSoftwareNames: string[];
  configuration: {
    bcchConfigured: boolean;
    ufSeries: string;
  };
}

export interface ServerValuationItem {
  id: number;
  hostname: string;
  environment: string | null;
  servicesOnitec: boolean;
  company: { id: number; name: string } | null;
  operatingSystem: {
    id: number;
    name: string;
    version: string;
  } | null;
  databases: Array<{
    id: number;
    name: string;
    version: string;
  }>;
  resources: {
    cpuCores: number | null;
    ramGb: number | null;
    diskGb: number | null;
  };
  status: 'COMPLETE' | 'PARTIAL';
  missing: string[];
  rows: Array<{
    key: string;
    resource: string;
    detail: string;
    quantity: number | null;
    unitValueUf: number | null;
    valueUf: number;
    tariffId: number | null;
  }>;
  subtotalUf: number;
  totalUf: number;
  totalClp: number | null;
}

export interface ServerValuationResponse {
  selectedCompanyId: number | null;
  selectedEnvironment: 'PRD' | 'QAS' | 'DEV' | null;
  checkedAt: string;
  uf: EconomicIndicator | null;
  totals: {
    servers: number;
    fullyValued: number;
    partial: number;
    totalUf: number;
    totalClp: number | null;
  };
  availableCompanies: Array<{
    id: number;
    name: string;
  }>;
  byCompany: Array<{
    id: number;
    name: string;
    servers: number;
    complete: number;
    partial: number;
    totalUf: number;
    totalClp: number | null;
  }>;
  items: ServerValuationItem[];
}

export interface ServerValuationFilters {
  companyId?: number;
  environment?: string;
}

export interface CreatePricingTariffPayload {
  category: string;
  name: string;
  unit: string;
  value: number;
  valueType: PricingValueType;
  active?: boolean;
}

export interface UpdatePricingTariffPayload {
  name?: string;
  value?: number;
  active?: boolean;
  sourceNote?: string | null;
}

export interface DeletePricingTariffResponse {
  id: number;
  code: string;
  name: string;
  deleted: true;
}

export async function getLatestUf(): Promise<EconomicIndicator | null> {
  return apiRequest<EconomicIndicator | null>(
    '/pricing/uf',
    {
      fallbackMessage:
        'No fue posible obtener el valor de la UF.',
    },
  );
}

export async function getPricingSummary(): Promise<PricingSummary> {
  return apiRequest<PricingSummary>(
    '/pricing/summary',
    {
      fallbackMessage:
        'No fue posible obtener tarifas e indicadores.',
    },
  );
}

export async function getServerValuations(
  filters: ServerValuationFilters = {},
): Promise<ServerValuationResponse> {
  const params = new URLSearchParams();

  if (filters.companyId !== undefined) {
    params.set('companyId', String(filters.companyId));
  }

  if (filters.environment) {
    params.set('environment', filters.environment);
  }

  const query = params.toString();

  return apiRequest<ServerValuationResponse>(
    query
      ? `/pricing/server-valuations?${query}`
      : '/pricing/server-valuations',
    {
      fallbackMessage:
        'No fue posible valorizar los servidores.',
    },
  );
}

export async function getServerValuation(
  id: number,
): Promise<ServerValuationItem> {
  return apiRequest<ServerValuationItem>(
    `/pricing/server-valuations/${id}`,
    {
      fallbackMessage:
        'No fue posible valorizar el servidor.',
    },
  );
}

export async function refreshUf(): Promise<EconomicIndicator> {
  return apiRequest<EconomicIndicator>(
    '/pricing/uf/refresh',
    {
      method: 'POST',
      fallbackMessage:
        'No fue posible actualizar la UF.',
    },
  );
}

export async function setManualUf(
  date: string,
  value: number,
): Promise<EconomicIndicator> {
  return apiRequest<EconomicIndicator>(
    '/pricing/uf/manual',
    {
      method: 'POST',
      body: { date, value },
      fallbackMessage:
        'No fue posible registrar la UF manual.',
    },
  );
}

export async function createPricingTariff(
  payload: CreatePricingTariffPayload,
): Promise<PricingTariff> {
  return apiRequest<PricingTariff>(
    '/pricing/tariffs',
    {
      method: 'POST',
      body: payload,
      fallbackMessage:
        'No fue posible crear la tarifa.',
    },
  );
}

export async function updatePricingTariff(
  id: number,
  payload: UpdatePricingTariffPayload,
): Promise<PricingTariff> {
  return apiRequest<PricingTariff>(
    `/pricing/tariffs/${id}`,
    {
      method: 'PATCH',
      body: payload,
      fallbackMessage:
        'No fue posible actualizar la tarifa.',
    },
  );
}

export async function deletePricingTariff(
  id: number,
): Promise<DeletePricingTariffResponse> {
  return apiRequest<DeletePricingTariffResponse>(
    `/pricing/tariffs/${id}`,
    {
      method: 'DELETE',
      fallbackMessage:
        'No fue posible eliminar la tarifa.',
    },
  );
}
