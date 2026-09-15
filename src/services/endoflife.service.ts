import { apiRequest } from './api.service';

export type EndOfLifeResolutionSource =
  | 'CONFIGURED'
  | 'LEGACY_ALIAS'
  | 'CATALOG_EXACT'
  | 'NONE';

export type EndOfLifeEntityType =
  | 'SOFTWARE'
  | 'OPERATING_SYSTEM';

export interface EndOfLifeProduct {
  name: string;
  label: string;
  aliases: string[];
  category: string | null;
  tags: string[];
}

export interface EndOfLifeCatalogResponse {
  provider: 'endoflife.date';
  status:
    | 'AVAILABLE'
    | 'STALE'
    | 'UNAVAILABLE';
  checkedAt: string;
  cacheTtlSeconds: number;
  products: EndOfLifeProduct[];
}

export interface EndOfLifeMappingItem {
  entityType: EndOfLifeEntityType;
  id: number;
  name: string;
  version: string | null;
  category: string;
  active: boolean;
  configuredProductKey: string | null;
  resolvedProductKey: string | null;
  resolutionSource:
    EndOfLifeResolutionSource;
  product: EndOfLifeProduct | null;
  suggestion: EndOfLifeProduct | null;
}

export interface EndOfLifeMappingsResponse {
  provider: 'endoflife.date';
  catalogStatus:
    | 'AVAILABLE'
    | 'STALE'
    | 'UNAVAILABLE';
  checkedAt: string;
  software: EndOfLifeMappingItem[];
  operatingSystems: EndOfLifeMappingItem[];
}

export interface EndOfLifeResolveResponse {
  productKey: string | null;
  source: EndOfLifeResolutionSource;
  product: EndOfLifeProduct | null;
}

export async function getEndOfLifeProducts(
  forceRefresh = false,
) {
  const query = forceRefresh
    ? '?refresh=true'
    : '';

  return apiRequest<EndOfLifeCatalogResponse>(
    `/endoflife/products${query}`,
    {
      cache: 'no-store',
      fallbackMessage:
        'No fue posible obtener el catálogo de endoflife.date.',
    },
  );
}

export async function resolveEndOfLifeProduct(
  name: string,
) {
  const params =
    new URLSearchParams({
      name,
    });

  return apiRequest<EndOfLifeResolveResponse>(
    `/endoflife/resolve?${params.toString()}`,
    {
      cache: 'no-store',
      fallbackMessage:
        'No fue posible resolver el producto en endoflife.date.',
    },
  );
}

export async function getEndOfLifeMappings() {
  return apiRequest<EndOfLifeMappingsResponse>(
    '/endoflife/mappings',
    {
      cache: 'no-store',
      fallbackMessage:
        'No fue posible obtener las asociaciones de endoflife.date.',
    },
  );
}

export async function updateEndOfLifeMapping(
  entityType: EndOfLifeEntityType,
  id: number,
  productKey: string | null,
) {
  const entityPath =
    entityType === 'SOFTWARE'
      ? 'software'
      : 'operating-system';

  return apiRequest<EndOfLifeMappingsResponse>(
    `/endoflife/mappings/${entityPath}/${id}`,
    {
      method: 'PATCH',
      body: {
        productKey,
      },
      fallbackMessage:
        'No fue posible actualizar la asociación con endoflife.date.',
    },
  );
}
