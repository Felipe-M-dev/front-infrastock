import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Filter,
  Search,
  Server,
  ShieldAlert,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import PageLoader from '../components/PageLoader';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  getInventoryReviewPriorities,
  type InventoryReviewPrioritiesResponse,
  type InventoryReviewPriority,
  type InventoryReviewPriorityItem,
} from '../services/catalogs.service';

import {
  getUser,
} from '../services/session.service';

type EnvironmentFilter =
  | ''
  | 'PRD'
  | 'QAS'
  | 'DEV';

type PriorityFilter =
  | ''
  | InventoryReviewPriority;

type ConfidenceFilter =
  | ''
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

type SupportFilter =
  | ''
  | 'EOL'
  | 'EOL_SOON';

function getPriorityLabel(
  priority:
    InventoryReviewPriority,
) {
  if (
    priority ===
    'CRITICAL'
  ) {
    return 'Crítica';
  }

  if (
    priority ===
    'HIGH'
  ) {
    return 'Alta';
  }

  return 'Media';
}

function getPriorityClasses(
  priority:
    InventoryReviewPriority,
) {
  if (
    priority ===
    'CRITICAL'
  ) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (
    priority ===
    'HIGH'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function getConfidenceLabel(
  level:
    'HIGH'
    | 'MEDIUM'
    | 'LOW',
) {
  if (
    level ===
    'HIGH'
  ) {
    return 'Alta';
  }

  if (
    level ===
    'MEDIUM'
  ) {
    return 'Media';
  }

  return 'Baja';
}

function getConfidenceClasses(
  level:
    'HIGH'
    | 'MEDIUM'
    | 'LOW',
) {
  if (
    level ===
    'HIGH'
  ) {
    return 'bg-green-50 text-green-700 ring-1 ring-green-200';
  }

  if (
    level ===
    'MEDIUM'
  ) {
    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  return 'bg-red-50 text-red-700 ring-1 ring-red-200';
}

function formatDateTime(
  value:
    string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'es-CL',
    {
      day:
        '2-digit',
      month:
        '2-digit',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
    },
  ).format(
    date,
  );
}

function PriorityBadge({
  priority,
}: {
  priority:
    InventoryReviewPriority;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClasses(priority)}`}
    >
      {getPriorityLabel(
        priority,
      )}
    </span>
  );
}

function ReviewCard({
  item,
  onOpen,
}: {
  item:
    InventoryReviewPriorityItem;
  onOpen:
    (
      item:
        InventoryReviewPriorityItem,
    ) => void;
}) {
  return (
    <article className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <div className="h-0.5 bg-company-primary" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge
                priority={
                  item.priority
                }
              />

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {item.environment ??
                  'Sin ambiente'}
              </span>
            </div>

            <h2 className="font-hostname mt-3 font-semibold text-slate-900">
              {
                item.hostname
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {item.company
                ?.name ??
                'Sin empresa'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
            <p className="text-xs font-medium text-slate-400">
              Puntaje revisión
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {
                item.reviewScore
              }
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs text-slate-400">
              Confiabilidad
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getConfidenceClasses(item.confidence.level)}`}
              >
                {getConfidenceLabel(
                  item.confidence.level,
                )}
              </span>

              <span className="font-semibold text-slate-800">
                {
                  item.confidence
                    .score
                }
                /100
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-xs text-slate-400">
              Antigüedad
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {
                item.confidence
                  .ageDays
              }{' '}
              días
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Motivos de revisión
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {item.reasons.map(
              (
                reason,
              ) => (
                <span
                  key={
                    reason
                  }
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  {
                    reason
                  }
                </span>
              ),
            )}
          </div>
        </div>

        {item.support.software
          .length >
          0 && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Riesgo tecnológico
            </p>

            <div className="mt-2 space-y-1.5">
              {item.support.software.map(
                (
                  software,
                ) => (
                  <div
                    key={`${software.softwareId}-${software.installedVersion}`}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-medium text-slate-700">
                      {
                        software.name
                      }{' '}
                      <span className="font-version">
                        {
                          software.installedVersion
                        }
                      </span>
                    </span>

                    <span
                      className={
                        software.status ===
                        'EOL'
                          ? 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700'
                      }
                    >
                      {software.status ===
                      'EOL'
                        ? 'Fuera de soporte'
                        : 'Próximo a EOL'}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Actualizado{' '}
            {formatDateTime(
              item.updatedAt,
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              onOpen(
                item,
              )
            }
            className="flex items-center gap-1 text-sm font-semibold text-company-primary transition hover:opacity-80"
          >
            Ver servidor

            <ArrowRight
              size={
                16
              }
            />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function InventoryReviewPlanPage() {
  const navigate =
    useNavigate();

  const currentUser =
    getUser();

  const isAdmin =
    currentUser?.role ===
    'ADMIN';

  const [
    data,
    setData,
  ] = useState<
    InventoryReviewPrioritiesResponse | null
  >(null);

  const [
    companies,
    setCompanies,
  ] = useState<
    AccessibleCompany[]
  >([]);

  const canSelectCompany =
    isAdmin ||
    companies.length > 1;

  const [
    companyId,
    setCompanyId,
  ] = useState<
    number | ''
  >('');

  const [
    environment,
    setEnvironment,
  ] = useState<
    EnvironmentFilter
  >('');

  const [
    priority,
    setPriority,
  ] = useState<
    PriorityFilter
  >('');

  const [
    confidence,
    setConfidence,
  ] = useState<
    ConfidenceFilter
  >('');

  const [
    support,
    setSupport,
  ] = useState<
    SupportFilter
  >('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    async function loadCompanies() {
      try {
        const result =
          await getAccessibleCompanies();

        setCompanies(
          result.filter(
            (
              company,
            ) =>
              company.active,
          ),
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : 'No fue posible cargar las empresas.',
        );
      }
    }

    loadCompanies();
  }, [
    isAdmin,
  ]);

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(
          true,
        );

        setError(
          '',
        );

        const result =
          await getInventoryReviewPriorities(
            {
              companyId:
                companyId !==
                  ''
                  ? companyId
                  : undefined,

              environment:
                environment ||
                undefined,
            },
          );

        setData(
          result,
        );
      } catch (
        caughtError
      ) {
        setData(
          null,
        );

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : 'No fue posible cargar el plan de revisión.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    }

    loadPlan();
  }, [
    isAdmin,
    companyId,
    environment,
  ]);

  const filteredItems =
    useMemo(
      () => {
        if (
          !data
        ) {
          return [];
        }

        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              'es-CL',
            );

        return data.items.filter(
          (
            item,
          ) => {
            if (
              priority &&
              item.priority !==
                priority
            ) {
              return false;
            }

            if (
              confidence &&
              item.confidence.level !==
                confidence
            ) {
              return false;
            }

            if (
              support ===
                'EOL' &&
              !item.support.hasEol
            ) {
              return false;
            }

            if (
              support ===
                'EOL_SOON' &&
              !item.support.hasEolSoon
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            const searchable = [
              item.hostname,
              item.company?.name ??
                '',
              item.environment ??
                '',
              ...item.reasons,
              ...item.support.software.flatMap(
                (
                  software,
                ) => [
                  software.name,
                  software.installedVersion,
                  software.latestInCycle ??
                    '',
                ],
              ),
            ]
              .join(
                ' ',
              )
              .toLocaleLowerCase(
                'es-CL',
              );

            return searchable.includes(
              normalizedSearch,
            );
          },
        );
      },
      [
        data,
        priority,
        confidence,
        support,
        search,
      ],
    );

  const visibleImpactCount =
    filteredItems.length;

  const hasActiveFilters =
    companyId !==
      '' ||
    environment !==
      '' ||
    priority !==
      '' ||
    confidence !==
      '' ||
    support !==
      '' ||
    search.trim() !==
      '';

  function clearFilters() {
    setCompanyId(
      '',
    );

    setEnvironment(
      '',
    );

    setPriority(
      '',
    );

    setConfidence(
      '',
    );

    setSupport(
      '',
    );

    setSearch(
      '',
    );
  }

  function openServer(
    item:
      InventoryReviewPriorityItem,
  ) {
    navigate(
      `/servers/${item.id}`,
      {
        state: {
          returnTo:
            '/inventory-review-plan',
        },
      },
    );
  }

  function togglePriority(
    value:
      InventoryReviewPriority,
  ) {
    setPriority(
      (
        current,
      ) =>
        current ===
        value
          ? ''
          : value,
    );
  }

  const totals =
    data?.totals;

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex items-start gap-4">
          <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
            <ClipboardCheck
              size={
                24
              }
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
              Calidad del inventario
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Plan de revisión del inventario
            </h1>

            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              Prioriza qué servidores revisar primero combinando confiabilidad, antigüedad, ambiente y soporte tecnológico.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {
            error
          }
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() =>
            togglePriority(
              'CRITICAL',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority ===
            'CRITICAL'
              ? 'border-red-400 bg-red-50 ring-2 ring-red-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500" />

          <div className="flex items-center justify-between">
            <ShieldAlert
              size={
                20
              }
              className="text-red-600"
            />

            <span className="text-xs font-semibold text-red-600">
              CRÍTICA
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {totals?.critical ??
              0}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Revisión inmediata
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            togglePriority(
              'HIGH',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority ===
            'HIGH'
              ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-400" />

          <div className="flex items-center justify-between">
            <AlertTriangle
              size={
                20
              }
              className="text-amber-600"
            />

            <span className="text-xs font-semibold text-amber-600">
              ALTA
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {totals?.high ??
              0}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Atención prioritaria
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            togglePriority(
              'MEDIUM',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority ===
            'MEDIUM'
              ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />

          <div className="flex items-center justify-between">
            <CircleAlert
              size={
                20
              }
              className="text-blue-600"
            />

            <span className="text-xs font-semibold text-blue-600">
              MEDIA
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {totals?.medium ??
              0}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Revisar programadamente
          </p>
        </button>

        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-company-primary" />

          <div className="flex items-center justify-between">
            <Server
              size={
                20
              }
              className="text-company-primary"
            />

            <span className="text-xs font-semibold text-slate-500">
              COLA
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {totals?.reviewRequired ??
              0}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Servidores por revisar
          </p>
        </div>
      </div>

      <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-company-primary/10 p-2.5 text-company-primary">
            <Filter
              size={
                18
              }
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
              Filtros operacionales
            </p>

            <h2 className="mt-1 font-bold text-slate-800">
              Refinar cola de revisión
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search
              size={
                18
              }
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar servidor, empresa, software..."
              className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            />
          </div>

          {canSelectCompany && (
            <select
              value={
                companyId
              }
              onChange={(
                event,
              ) =>
                setCompanyId(
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : '',
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            >
              <option value="">
                {isAdmin
                  ? 'Todas las empresas'
                  : 'Todas las empresas accesibles'}
              </option>

              {companies.map(
                (
                  company,
                ) => (
                  <option
                    key={
                      company.id
                    }
                    value={
                      company.id
                    }
                  >
                    {
                      company.name
                    }
                  </option>
                ),
              )}
            </select>
          )}

          <select
            value={
              environment
            }
            onChange={(
              event,
            ) =>
              setEnvironment(
                event.target.value as
                  EnvironmentFilter,
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los ambientes
            </option>

            <option value="PRD">
              PRD
            </option>

            <option value="QAS">
              QAS
            </option>

            <option value="DEV">
              DEV
            </option>
          </select>

          <select
            value={
              priority
            }
            onChange={(
              event,
            ) =>
              setPriority(
                event.target.value as
                  PriorityFilter,
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todas las prioridades
            </option>

            <option value="CRITICAL">
              Crítica
            </option>

            <option value="HIGH">
              Alta
            </option>

            <option value="MEDIUM">
              Media
            </option>
          </select>

          <select
            value={
              confidence
            }
            onChange={(
              event,
            ) =>
              setConfidence(
                event.target.value as
                  ConfidenceFilter,
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Toda confiabilidad
            </option>

            <option value="LOW">
              Confiabilidad baja
            </option>

            <option value="MEDIUM">
              Confiabilidad media
            </option>

            <option value="HIGH">
              Confiabilidad alta
            </option>
          </select>

          <select
            value={
              support
            }
            onChange={(
              event,
            ) =>
              setSupport(
                event.target.value as
                  SupportFilter,
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todo soporte
            </option>

            <option value="EOL">
              Con software fuera de soporte
            </option>

            <option value="EOL_SOON">
              Con software próximo a EOL
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Mostrando{' '}
            <span className="font-semibold text-slate-800">
              {
                visibleImpactCount
              }
            </span>{' '}
            de{' '}
            <span className="font-semibold text-slate-800">
              {data?.items.length ??
                0}
            </span>{' '}
            servidores de la cola.
          </p>

          <button
            type="button"
            onClick={
              clearFilters
            }
            disabled={
              !hasActiveFilters
            }
            className="text-sm font-semibold text-company-primary transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {loading ? (
        <PageLoader
          variant="table"
          rows={7}
        />
      ) : filteredItems.length ===
        0 ? (
        <div className="rounded-2xl border border-green-200 bg-green-50/90 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-green-600 ring-1 ring-green-200">
            <CheckCircle2
              size={
                28
              }
            />
          </div>

          <p className="mt-4 font-semibold text-green-800">
            No hay servidores pendientes bajo estos filtros.
          </p>

          <p className="mt-1 text-sm text-green-700">
            El alcance actual no presenta condiciones que requieran revisión priorizada.
          </p>
        </div>
      ) : (
        <>
          <div className="ui-panel hidden overflow-x-auto rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm xl:block">
            <table className="w-full min-w-[1450px]">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    Prioridad
                  </th>

                  <th className="px-4 py-3">
                    Servidor
                  </th>

                  <th className="px-4 py-3">
                    Empresa
                  </th>

                  <th className="px-4 py-3">
                    Ambiente
                  </th>

                  <th className="px-4 py-3">
                    Confiabilidad
                  </th>

                  <th className="px-4 py-3">
                    Antigüedad
                  </th>

                  <th className="px-4 py-3">
                    Riesgo software
                  </th>

                  <th className="px-4 py-3">
                    Motivos
                  </th>

                  <th className="px-4 py-3 text-right">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(
                  (
                    item,
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                      className="align-top transition hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-4">
                        <PriorityBadge
                          priority={
                            item.priority
                          }
                        />

                        <p className="mt-2 text-xs text-slate-400">
                          Score{' '}
                          {
                            item.reviewScore
                          }
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-hostname font-semibold text-slate-900">
                          {
                            item.hostname
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Actualizado{' '}
                          {formatDateTime(
                            item.updatedAt,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.company
                          ?.name ??
                          'Sin empresa'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {item.environment ??
                            'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getConfidenceClasses(item.confidence.level)}`}
                        >
                          {getConfidenceLabel(
                            item.confidence.level,
                          )}
                        </span>

                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          {
                            item.confidence
                              .score
                          }
                          /100
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {
                            item.confidence
                              .issueCount
                          }{' '}
                          problemas
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <span className="font-semibold">
                          {
                            item.confidence
                              .ageDays
                          }{' '}
                          días
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {item.support.software
                          .length ===
                        0 ? (
                          <span className="text-sm text-slate-400">
                            Sin alerta EOL
                          </span>
                        ) : (
                          <div className="space-y-2">
                            {item.support.software.map(
                              (
                                software,
                              ) => (
                                <div
                                  key={`${software.softwareId}-${software.installedVersion}`}
                                >
                                  <p className="text-sm font-medium text-slate-700">
                                    {
                                      software.name
                                    }{' '}
                                    <span className="font-version">
                                      {
                                        software.installedVersion
                                      }
                                    </span>
                                  </p>

                                  <span
                                    className={
                                      software.status ===
                                      'EOL'
                                        ? 'mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200'
                                        : 'mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200'
                                    }
                                  >
                                    {software.status ===
                                    'EOL'
                                      ? 'Fuera de soporte'
                                      : 'Próximo a EOL'}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-md space-y-1">
                          {item.reasons.map(
                            (
                              reason,
                            ) => (
                              <p
                                key={
                                  reason
                                }
                                className="text-sm text-slate-600"
                              >
                                •{' '}
                                {
                                  reason
                                }
                              </p>
                            ),
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openServer(
                              item,
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-company-primary hover:text-company-primary"
                        >
                          Ver servidor

                          <ArrowRight
                            size={
                              16
                            }
                          />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 xl:hidden">
            {filteredItems.map(
              (
                item,
              ) => (
                <ReviewCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  onOpen={
                    openServer
                  }
                />
              ),
            )}
          </div>
        </>
      )}

      {data && (
        <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-sm font-bold text-slate-700">
            Cómo se prioriza
          </p>

          <div className="mt-3 grid gap-3 text-sm text-slate-600 lg:grid-cols-3">
            <p className="rounded-xl border border-red-100 bg-red-50/60 p-3">
              <span className="font-semibold text-red-700">
                Crítica:
              </span>{' '}
              {
                data.rules
                  .critical
              }.
            </p>

            <p className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
              <span className="font-semibold text-amber-700">
                Alta:
              </span>{' '}
              {
                data.rules
                  .high
              }.
            </p>

            <p className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <span className="font-semibold text-blue-700">
                Media:
              </span>{' '}
              {
                data.rules
                  .medium
              }.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
