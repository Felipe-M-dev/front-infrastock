import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Link2,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  Unlink,
  X,
} from 'lucide-react';

import { useToast } from './ToastProvider';

import {
  getEndOfLifeMappings,
  getEndOfLifeProducts,
  updateEndOfLifeMapping,
  type EndOfLifeCatalogResponse,
  type EndOfLifeMappingItem,
  type EndOfLifeMappingsResponse,
  type EndOfLifeProduct,
  type EndOfLifeResolutionSource,
} from '../services/endoflife.service';

type EntityFilter =
  | 'ALL'
  | 'SOFTWARE'
  | 'OPERATING_SYSTEM';

type StatusFilter =
  | 'ALL'
  | 'CONFIGURED'
  | 'AUTOMATIC'
  | 'SUGGESTIONS'
  | 'UNMAPPED';

function resolutionLabel(
  source: EndOfLifeResolutionSource,
) {
  if (source === 'CONFIGURED') {
    return 'Configurado';
  }

  if (
    source === 'LEGACY_ALIAS' ||
    source === 'CATALOG_EXACT'
  ) {
    return 'Automático';
  }

  return 'Sin asociación';
}

function resolutionClasses(
  source: EndOfLifeResolutionSource,
) {
  if (source === 'CONFIGURED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    source === 'LEGACY_ALIAS' ||
    source === 'CATALOG_EXACT'
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function entityLabel(
  item: EndOfLifeMappingItem,
) {
  return item.entityType ===
    'SOFTWARE'
    ? 'Aplicación / software'
    : 'Sistema operativo';
}

function productText(
  product: EndOfLifeProduct | null,
  fallbackKey: string | null,
) {
  if (product) {
    return `${product.label} (${product.name})`;
  }

  return fallbackKey ?? '—';
}

export default function EndOfLifeMappingsPanel() {
  const toast = useToast();

  const [mappings, setMappings] =
    useState<EndOfLifeMappingsResponse | null>(null);
  const [catalog, setCatalog] =
    useState<EndOfLifeCatalogResponse | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');
  const [entityFilter, setEntityFilter] =
    useState<EntityFilter>('ALL');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL');

  const [editing, setEditing] =
    useState<EndOfLifeMappingItem | null>(null);
  const [productSearch, setProductSearch] =
    useState('');
  const [selectedProductKey, setSelectedProductKey] =
    useState('');
  const [saving, setSaving] =
    useState(false);

  async function refreshData() {
    try {
      setRefreshing(true);
      setError('');

      const products =
        await getEndOfLifeProducts(
          true,
        );

      const mappingData =
        await getEndOfLifeMappings();

      setCatalog(products);
      setMappings(mappingData);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible actualizar la integración EOL.',
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getEndOfLifeProducts(false),
      getEndOfLifeMappings(),
    ])
      .then(
        ([
          products,
          mappingData,
        ]) => {
          if (cancelled) {
            return;
          }

          setCatalog(products);
          setMappings(mappingData);
          setError('');
        },
      )
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'No fue posible cargar la integración EOL.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const allItems =
    useMemo(
      () => [
        ...(mappings?.software ?? []),
        ...(mappings?.operatingSystems ?? []),
      ],
      [mappings],
    );

  const stats =
    useMemo(() => {
      const configured =
        allItems.filter(
          (item) =>
            item.resolutionSource ===
            'CONFIGURED',
        ).length;

      const automatic =
        allItems.filter(
          (item) =>
            item.resolutionSource ===
              'LEGACY_ALIAS' ||
            item.resolutionSource ===
              'CATALOG_EXACT',
        ).length;

      const suggestions =
        allItems.filter(
          (item) =>
            item.resolutionSource ===
              'NONE' &&
            item.suggestion !== null,
        ).length;

      const unmapped =
        allItems.filter(
          (item) =>
            item.resolutionSource ===
              'NONE' &&
            item.suggestion === null,
        ).length;

      return {
        total: allItems.length,
        configured,
        automatic,
        unmapped,
        suggestions,
      };
    }, [allItems]);

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase();

      return allItems.filter(
        (item) => {
          if (
            entityFilter !== 'ALL' &&
            item.entityType !==
              entityFilter
          ) {
            return false;
          }

          if (
            statusFilter ===
              'CONFIGURED' &&
            item.resolutionSource !==
              'CONFIGURED'
          ) {
            return false;
          }

          if (
            statusFilter ===
              'AUTOMATIC' &&
            ![
              'LEGACY_ALIAS',
              'CATALOG_EXACT',
            ].includes(
              item.resolutionSource,
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              'SUGGESTIONS' &&
            !(
              item.resolutionSource ===
                'NONE' &&
              item.suggestion !== null
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              'UNMAPPED' &&
            !(
              item.resolutionSource ===
                'NONE' &&
              item.suggestion === null
            )
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const haystack = [
            item.name,
            item.version ?? '',
            item.configuredProductKey ?? '',
            item.resolvedProductKey ?? '',
            item.product?.label ?? '',
            item.product?.name ?? '',
            item.suggestion?.label ?? '',
            item.suggestion?.name ?? '',
          ]
            .join(' ')
            .toLocaleLowerCase();

          return haystack.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      allItems,
      entityFilter,
      search,
      statusFilter,
    ]);

  const filteredProducts =
    useMemo(() => {
      const products =
        catalog?.products ?? [];

      const normalized =
        productSearch
          .trim()
          .toLocaleLowerCase();

      if (!normalized) {
        return products.slice(0, 120);
      }

      return products
        .filter((product) => {
          const haystack = [
            product.label,
            product.name,
            ...product.aliases,
            product.category ?? '',
            ...product.tags,
          ]
            .join(' ')
            .toLocaleLowerCase();

          return haystack.includes(
            normalized,
          );
        })
        .slice(0, 120);
    }, [
      catalog,
      productSearch,
    ]);

  function selectStatusFilter(
    nextStatus: StatusFilter,
  ) {
    setStatusFilter((current) =>
      current === nextStatus &&
      nextStatus !== 'ALL'
        ? 'ALL'
        : nextStatus,
    );
  }

  function clearFilters() {
    setSearch('');
    setEntityFilter('ALL');
    setStatusFilter('ALL');
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    entityFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  function openMapping(
    item: EndOfLifeMappingItem,
  ) {
    setEditing(item);
    setProductSearch(
      item.product?.label ??
        item.suggestion?.label ??
        item.name,
    );
    setSelectedProductKey(
      item.configuredProductKey ??
        item.resolvedProductKey ??
        item.suggestion?.name ??
        '',
    );
  }

  function closeMapping() {
    if (saving) {
      return;
    }

    setEditing(null);
    setProductSearch('');
    setSelectedProductKey('');
  }

  async function saveMapping(
    productKey: string | null,
  ) {
    if (!editing || saving) {
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateEndOfLifeMapping(
          editing.entityType,
          editing.id,
          productKey,
        );

      setMappings(updated);
      closeMapping();

      toast.success(
        productKey
          ? 'Asociación EOL guardada'
          : 'Asociación manual eliminada',
        productKey
          ? 'InfraStock usará el producto seleccionado en endoflife.date.'
          : 'InfraStock volverá a utilizar la resolución automática cuando corresponda.',
      );
    } catch (caughtError) {
      toast.error(
        'No fue posible actualizar la asociación',
        caughtError instanceof Error
          ? caughtError.message
          : 'Intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  }


  async function clearManualMapping(
    item: EndOfLifeMappingItem,
  ) {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateEndOfLifeMapping(
          item.entityType,
          item.id,
          null,
        );

      setMappings(updated);

      toast.success(
        'Asociación manual eliminada',
        'InfraStock volverá a utilizar la resolución automática cuando corresponda.',
      );
    } catch (caughtError) {
      toast.error(
        'No fue posible quitar la asociación',
        caughtError instanceof Error
          ? caughtError.message
          : 'Intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function applySuggestion(
    item: EndOfLifeMappingItem,
  ) {
    if (!item.suggestion || saving) {
      return;
    }

    try {
      setSaving(true);

      const updated =
        await updateEndOfLifeMapping(
          item.entityType,
          item.id,
          item.suggestion.name,
        );

      setMappings(updated);

      toast.success(
        'Sugerencia asociada',
        `${item.name} quedó asociado a ${item.suggestion.label}.`,
      );
    } catch (caughtError) {
      toast.error(
        'No fue posible aplicar la sugerencia',
        caughtError instanceof Error
          ? caughtError.message
          : 'Intenta nuevamente.',
      );
    } finally {
      setSaving(false);
    }
  }

  const catalogUnavailable =
    catalog?.status ===
    'UNAVAILABLE';

  const catalogStale =
    catalog?.status ===
    'STALE';

  return (
    <div className="space-y-5">
      <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <Link2 size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Correspondencias externas
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                Integración endoflife.date
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                Asocia los nombres de InfraStock con el catálogo EOL sin renombrar tu inventario. Las asociaciones manuales tienen prioridad; las coincidencias exactas y aliases existentes siguen funcionando automáticamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void refreshData()
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}
            Actualizar catálogo EOL
          </button>
        </div>
      </section>

      {catalogUnavailable && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-start gap-2">
            <CircleAlert
              size={18}
              className="mt-0.5 shrink-0"
            />
            <div>
              <p className="font-semibold">
                Catálogo EOL no disponible
              </p>
              <p className="mt-1">
                No se pueden validar nuevas asociaciones hasta recuperar la conexión con endoflife.date. Las asociaciones existentes continúan almacenadas.
              </p>
            </div>
          </div>
        </div>
      )}

      {catalogStale && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          <div className="flex items-start gap-2">
            <CircleAlert
              size={18}
              className="mt-0.5 shrink-0"
            />
            <div>
              <p className="font-semibold">
                Usando catálogo EOL en caché
              </p>
              <p className="mt-1">
                La última actualización remota falló, pero InfraStock conserva el catálogo válido anterior para no interrumpir la integración.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="ui-panel flex min-h-48 items-center justify-center rounded-2xl border border-white/80 bg-white/90 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
            Cargando correspondencias EOL…
          </p>
        </div>
      ) : (
        <>
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
            aria-label="Filtros rápidos de integración EOL"
          >
            <button
              type="button"
              onClick={() =>
                selectStatusFilter('ALL')
              }
              aria-pressed={
                statusFilter === 'ALL'
              }
              className={`ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-company-primary/20 ${
                statusFilter === 'ALL'
                  ? 'ring-2 ring-company-primary/20'
                  : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Catálogo local
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stats.total}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Ver todos
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                selectStatusFilter(
                  'CONFIGURED',
                )
              }
              aria-pressed={
                statusFilter ===
                'CONFIGURED'
              }
              className={`rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300/60 ${
                statusFilter ===
                'CONFIGURED'
                  ? 'ring-2 ring-emerald-300/60'
                  : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Configuradas
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {stats.configured}
              </p>
              <p className="mt-1 text-xs text-emerald-700/70">
                Asociación persistida
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                selectStatusFilter(
                  'AUTOMATIC',
                )
              }
              aria-pressed={
                statusFilter ===
                'AUTOMATIC'
              }
              className={`rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300/60 ${
                statusFilter ===
                'AUTOMATIC'
                  ? 'ring-2 ring-blue-300/60'
                  : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Automáticas
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-800">
                {stats.automatic}
              </p>
              <p className="mt-1 text-xs text-blue-700/70">
                Alias o coincidencia exacta
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                selectStatusFilter(
                  'SUGGESTIONS',
                )
              }
              aria-pressed={
                statusFilter ===
                'SUGGESTIONS'
              }
              className={`rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300/70 ${
                statusFilter ===
                'SUGGESTIONS'
                  ? 'ring-2 ring-amber-300/70'
                  : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Sugerencias
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {stats.suggestions}
              </p>
              <p className="mt-1 text-xs text-amber-700/70">
                Pendientes de confirmar
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                selectStatusFilter(
                  'UNMAPPED',
                )
              }
              aria-pressed={
                statusFilter ===
                'UNMAPPED'
              }
              className={`rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                statusFilter ===
                'UNMAPPED'
                  ? 'ring-2 ring-slate-300'
                  : ''
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Sin asociación
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-700">
                {stats.unmapped}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Sin coincidencia sugerida
              </p>
            </button>
          </section>

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_230px_230px]">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar nombre local o producto EOL"
                  className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                />
              </div>

              <select
                value={entityFilter}
                onChange={(event) =>
                  setEntityFilter(
                    event.target.value as EntityFilter,
                  )
                }
                className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="ALL">
                  Aplicaciones y SO
                </option>
                <option value="SOFTWARE">
                  Aplicaciones y software
                </option>
                <option value="OPERATING_SYSTEM">
                  Sistemas Operativos
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter,
                  )
                }
                className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="ALL">
                  Todos los estados
                </option>
                <option value="CONFIGURED">
                  Configuradas manualmente
                </option>
                <option value="AUTOMATIC">
                  Resueltas automáticamente
                </option>
                <option value="SUGGESTIONS">
                  Con sugerencia pendiente
                </option>
                <option value="UNMAPPED">
                  Sin asociación ni sugerencia
                </option>
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Mostrando{' '}
                <span className="font-semibold text-slate-700">
                  {filteredItems.length}
                </span>{' '}
                de{' '}
                <span className="font-semibold text-slate-700">
                  {allItems.length}
                </span>{' '}
                registros
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={14} />
                  Limpiar filtros
                </button>
              )}
            </div>
          </section>

          <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">
                      Catálogo InfraStock
                    </th>
                    <th className="px-5 py-3.5">
                      Resolución
                    </th>
                    <th className="px-5 py-3.5">
                      Producto EOL
                    </th>
                    <th className="px-5 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(
                    (item) => (
                      <tr
                        key={`${item.entityType}-${item.id}`}
                        className="text-sm transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {item.name}
                            {item.version
                              ? ` ${item.version}`
                              : ''}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {entityLabel(item)}
                            {!item.active
                              ? ' · Inactivo'
                              : ''}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${resolutionClasses(item.resolutionSource)}`}
                          >
                            {resolutionLabel(item.resolutionSource)}
                          </span>

                          {item.resolutionSource ===
                            'LEGACY_ALIAS' && (
                            <p className="mt-1 text-xs text-slate-400">
                              Alias compatible existente
                            </p>
                          )}

                          {item.resolutionSource ===
                            'CATALOG_EXACT' && (
                            <p className="mt-1 text-xs text-slate-400">
                              Coincidencia exacta del catálogo
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {item.resolvedProductKey ? (
                            <div>
                              <p className="font-semibold text-slate-800">
                                {item.product?.label ??
                                  item.resolvedProductKey}
                              </p>
                              <p className="mt-1 font-mono text-xs text-slate-500">
                                {item.resolvedProductKey}
                              </p>
                            </div>
                          ) : item.suggestion ? (
                            <div>
                              <p className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                                <Sparkles size={15} />
                                {item.suggestion.label}
                              </p>
                              <p className="mt-1 font-mono text-xs text-slate-500">
                                {item.suggestion.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Sugerencia: requiere confirmación
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Sin correspondencia
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            {item.resolutionSource ===
                              'NONE' &&
                              item.suggestion && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void applySuggestion(item)
                                  }
                                  disabled={saving || catalogUnavailable}
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                                >
                                  <Sparkles size={15} />
                                  Usar sugerencia
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() =>
                                openMapping(item)
                              }
                              disabled={catalogUnavailable}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-company-primary transition hover:bg-company-primary/10 disabled:opacity-50"
                            >
                              <Link2 size={15} />
                              {item.configuredProductKey
                                ? 'Cambiar'
                                : 'Asociar'}
                            </button>

                            {item.configuredProductKey && (
                              <button
                                type="button"
                                onClick={() =>
                                  void clearManualMapping(
                                    item,
                                  )
                                }
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                              >
                                <Unlink size={15} />
                                Quitar manual
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredItems.map((item) => (
                <article
                  key={`${item.entityType}-${item.id}-mobile`}
                  className="space-y-4 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.name}
                        {item.version
                          ? ` ${item.version}`
                          : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entityLabel(item)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${resolutionClasses(item.resolutionSource)}`}
                    >
                      {resolutionLabel(item.resolutionSource)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Producto EOL
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {item.resolvedProductKey
                        ? productText(
                            item.product,
                            item.resolvedProductKey,
                          )
                        : item.suggestion
                          ? `${item.suggestion.label} (${item.suggestion.name}) · sugerencia`
                          : 'Sin correspondencia'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.resolutionSource ===
                      'NONE' &&
                      item.suggestion && (
                        <button
                          type="button"
                          onClick={() =>
                            void applySuggestion(item)
                          }
                          disabled={saving || catalogUnavailable}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50"
                        >
                          <Sparkles size={15} />
                          Usar sugerencia
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        openMapping(item)
                      }
                      disabled={catalogUnavailable}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-company-primary disabled:opacity-50"
                    >
                      <Link2 size={15} />
                      {item.configuredProductKey
                        ? 'Cambiar asociación'
                        : 'Asociar producto'}
                    </button>

                    {item.configuredProductKey && (
                      <button
                        type="button"
                        onClick={() =>
                          void clearManualMapping(
                            item,
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 disabled:opacity-50"
                      >
                        <Unlink size={15} />
                        Quitar manual
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                No hay correspondencias que coincidan con los filtros seleccionados.
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {filteredItems.length} de {allItems.length} registros visibles
            </span>
            <span>
              Catálogo EOL: {catalog?.products.length ?? 0} productos · última carga{' '}
              {catalog?.checkedAt
                ? new Intl.DateTimeFormat(
                    'es-CL',
                    {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    },
                  ).format(
                    new Date(
                      catalog.checkedAt,
                    ),
                  )
                : '—'}
            </span>
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={closeMapping}
          />

          <div className="ui-table-shell ui-panel relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="h-1 shrink-0 bg-company-primary" />

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Integración EOL
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Asociar producto
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {editing.name}
                  {editing.version
                    ? ` ${editing.version}`
                    : ''}
                  {' · '}
                  {entityLabel(editing)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMapping}
                disabled={saving}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0"
                  />
                  <p>
                    Esta asociación no cambia el nombre local. Solo indica qué producto debe consultar InfraStock en endoflife.date.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Buscar en catálogo EOL
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={productSearch}
                    onChange={(event) =>
                      setProductSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Docker Engine, PostgreSQL, Tomcat"
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Producto endoflife.date
                </label>
                <select
                  value={selectedProductKey}
                  onChange={(event) =>
                    setSelectedProductKey(
                      event.target.value,
                    )
                  }
                  className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                >
                  <option value="">
                    Selecciona un producto
                  </option>
                  {selectedProductKey &&
                    !filteredProducts.some(
                      (product) =>
                        product.name ===
                        selectedProductKey,
                    ) && (
                      <option
                        value={
                          selectedProductKey
                        }
                      >
                        {selectedProductKey}
                      </option>
                    )}
                  {filteredProducts.map(
                    (product) => (
                      <option
                        key={product.name}
                        value={product.name}
                      >
                        {product.label} · {product.name}
                      </option>
                    ),
                  )}
                </select>

                <p className="mt-1.5 text-xs text-slate-500">
                  Se muestran hasta 120 coincidencias. Refina la búsqueda si necesitas acotar el catálogo.
                </p>
              </div>

              {selectedProductKey && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                  <p>
                    Identificador que quedará almacenado:
                  </p>
                  <p className="mt-1 font-mono font-semibold text-slate-800">
                    {selectedProductKey}
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
              <a
                href="https://endoflife.date/products"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
              >
                <ExternalLink size={16} />
                Ver catálogo EOL
              </a>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeMapping}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void saveMapping(
                      selectedProductKey ||
                        null,
                    )
                  }
                  disabled={
                    saving ||
                    !selectedProductKey ||
                    catalogUnavailable
                  }
                  className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Link2 size={17} />
                  )}
                  Guardar asociación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
