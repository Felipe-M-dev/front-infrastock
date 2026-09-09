import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
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
  getSoftwareUpdatePriorities,
  type SoftwareUpdatePrioritiesResponse,
  type SoftwareUpdatePriority,
  type SoftwareUpdatePriorityItem,
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
  | SoftwareUpdatePriority;

type SupportFilter =
  | ''
  | 'EOL'
  | 'EOL_SOON';

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'Sin fecha';
  }

  const date =
    new Date(
      `${value}T00:00:00`,
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date);
}

function getEolText(
  item: SoftwareUpdatePriorityItem,
) {
  if (
    item.daysToEol === null
  ) {
    return item.status === 'EOL'
      ? 'Fuera de soporte'
      : 'Próximo a EOL';
  }

  if (
    item.daysToEol < 0
  ) {
    const days =
      Math.abs(
        item.daysToEol,
      );

    return `EOL hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }

  if (
    item.daysToEol === 0
  ) {
    return 'EOL hoy';
  }

  return `EOL en ${item.daysToEol} ${item.daysToEol === 1 ? 'día' : 'días'}`;
}

function getPriorityLabel(
  priority: SoftwareUpdatePriority,
) {
  if (
    priority === 'CRITICAL'
  ) {
    return 'Crítico';
  }

  if (
    priority === 'HIGH'
  ) {
    return 'Alto';
  }

  return 'Medio';
}

function getPriorityClasses(
  priority: SoftwareUpdatePriority,
) {
  if (
    priority === 'CRITICAL'
  ) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (
    priority === 'HIGH'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function PriorityBadge({
  priority,
}: {
  priority:
    SoftwareUpdatePriority;
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

export default function SoftwareUpdatePlanPage() {
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
    SoftwareUpdatePrioritiesResponse | null
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
  ] = useState(true);

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
            (company) =>
              company.active,
          ),
        );
      } catch (caughtError) {
        if (
          caughtError instanceof Error
        ) {
          setError(
            caughtError.message,
          );
        }
      }
    }

    loadCompanies();
  }, [isAdmin]);

  useEffect(() => {
    async function loadPlan() {
      try {
        setLoading(true);
        setError('');

        const result =
          await getSoftwareUpdatePriorities({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setData(
          result,
        );
      } catch (caughtError) {
        setData(null);

        if (
          caughtError instanceof Error
        ) {
          setError(
            caughtError.message,
          );
        } else {
          setError(
            'No fue posible obtener el plan de actualización.',
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [
    companyId,
    environment,
    isAdmin,
  ]);

  const filteredItems =
    useMemo(
      () => {
        if (!data) {
          return [];
        }

        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              'es',
            );

        return data.items.filter(
          (item) => {
            if (
              priority &&
              item.priority !==
                priority
            ) {
              return false;
            }

            if (
              support &&
              item.status !==
                support
            ) {
              return false;
            }

            if (
              !normalizedSearch
            ) {
              return true;
            }

            const searchable = [
              item.name,
              item.installedVersion,
              item.cycle ?? '',
              item.latestInCycle ?? '',
              item.recommendation
                ?.cycle ?? '',
              item.recommendation
                ?.latestVersion ?? '',
              ...item.companies.map(
                (company) =>
                  company.name,
              ),
            ]
              .join(' ')
              .toLocaleLowerCase(
                'es',
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
        search,
        support,
      ],
    );

  const visibleServerIdsCount =
    useMemo(
      () =>
        filteredItems.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.serverCount,
          0,
        ),
      [filteredItems],
    );

  const openServers = (
    item: SoftwareUpdatePriorityItem,
  ) => {
    const params =
      new URLSearchParams();

    params.set(
      'softwareId',
      String(
        item.softwareId,
      ),
    );

    params.set(
      'softwareVersion',
      item.installedVersion,
    );

    if (
      companyId !== ''
    ) {
      params.set(
        'companyId',
        String(
          companyId,
        ),
      );
    }

    if (
      environment
    ) {
      params.set(
        'environment',
        environment,
      );
    }

    navigate(
      `/servers?${params.toString()}`,
    );
  };

  const clearAllFilters = () => {
    setCompanyId('');
    setEnvironment('');
    setPriority('');
    setSupport('');
    setSearch('');
  };

  const hasAnyFilters =
    Boolean(
      (companyId !== '') ||
        environment ||
        priority ||
        support ||
        search.trim(),
    );

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <ShieldAlert
                size={24}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Riesgo tecnológico
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Plan de actualización
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Cola operacional de versiones fuera de soporte o próximas a EOL, ordenada por impacto y prioridad.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CalendarClock
                size={17}
                className="text-company-primary"
              />
              Fuente de soporte
            </div>

            <p className="mt-1 text-xs text-slate-500">
              endoflife.date · umbral próximo a EOL: {data?.thresholdDays ?? 180} días
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() =>
            setPriority(
              priority === 'CRITICAL'
                ? ''
                : 'CRITICAL',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority === 'CRITICAL'
              ? 'border-red-300 bg-red-50 ring-2 ring-red-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-red-500" />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Críticas
            </p>

            <CircleAlert
              size={19}
              className="text-red-600"
            />
          </div>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data?.totals.critical ?? 0}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setPriority(
              priority === 'HIGH'
                ? ''
                : 'HIGH',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority === 'HIGH'
              ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-400" />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Altas
            </p>

            <AlertTriangle
              size={19}
              className="text-amber-600"
            />
          </div>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data?.totals.high ?? 0}
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            setPriority(
              priority === 'MEDIUM'
                ? ''
                : 'MEDIUM',
            )
          }
          className={`relative overflow-hidden rounded-2xl border p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
            priority === 'MEDIUM'
              ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100'
              : 'border-white/80 bg-white/90'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Medias
            </p>

            <CheckCircle2
              size={19}
              className="text-blue-600"
            />
          </div>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data?.totals.medium ?? 0}
          </p>
        </button>

        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-company-primary" />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Versiones afectadas
            </p>

            <Filter
              size={19}
              className="text-company-primary"
            />
          </div>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data?.totals.affectedVersions ?? 0}
          </p>
        </div>

        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-company-primary" />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-600">
              Servidores afectados
            </p>

            <Server
              size={19}
              className="text-company-primary"
            />
          </div>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {data?.totals.affectedServers ?? 0}
          </p>
        </div>
      </div>

      <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
            Filtros operacionales
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Refinar plan de actualización
          </h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(240px,1fr)_220px_180px_180px_auto] xl:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Buscar
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Software, versión, empresa..."
                className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              />
            </div>
          </div>

          {canSelectCompany && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Empresa
              </label>

              <select
                value={companyId}
                onChange={(event) =>
                  setCompanyId(
                    event.target.value
                      ? Number(
                          event.target.value,
                        )
                      : '',
                  )
                }
                className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="">
                  {isAdmin
                    ? 'Todas las empresas'
                    : 'Todas las empresas accesibles'}
                </option>

                {companies.map(
                  (company) => (
                    <option
                      key={company.id}
                      value={company.id}
                    >
                      {company.name}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ambiente
            </label>

            <select
              value={environment}
              onChange={(event) =>
                setEnvironment(
                  event.target.value as EnvironmentFilter,
                )
              }
              className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            >
              <option value="">
                Todos
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
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Estado soporte
            </label>

            <select
              value={support}
              onChange={(event) =>
                setSupport(
                  event.target.value as SupportFilter,
                )
              }
              className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            >
              <option value="">
                Todos
              </option>
              <option value="EOL">
                Fuera de soporte
              </option>
              <option value="EOL_SOON">
                Próximo a EOL
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={
              clearAllFilters
            }
            disabled={
              !hasAnyFilters
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
            Alcance: {data?.selectedEnvironment ?? 'Todos los ambientes'}
          </span>

          {canSelectCompany && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
              Empresa: {companyId === '' ? 'Todas' : companies.find((company) => company.id === companyId)?.name ?? companyId}
            </span>
          )}

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
            Mostrando {filteredItems.length} de {data?.items.length ?? 0} versiones
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
            {visibleServerIdsCount} impactos de servidor en filas visibles
          </span>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <PageLoader
          variant="table"
          rows={7}
        />
      ) : filteredItems.length === 0 ? (
        <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2
              size={26}
            />
          </div>

          <p className="mt-4 font-semibold text-slate-900">
            No hay actualizaciones pendientes en este alcance
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No se encontraron versiones EOL o próximas a EOL que coincidan con los filtros actuales.
          </p>
        </div>
      ) : (
        <>
          <div className="ui-table-shell ui-panel hidden overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm xl:block">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      Prioridad
                    </th>
                    <th className="px-4 py-3">
                      Software
                    </th>
                    <th className="px-4 py-3">
                      Versión actual
                    </th>
                    <th className="px-4 py-3">
                      Estado / EOL
                    </th>
                    <th className="px-4 py-3">
                      Recomendación
                    </th>
                    <th className="px-4 py-3 text-center">
                      PRD
                    </th>
                    <th className="px-4 py-3 text-center">
                      QAS
                    </th>
                    <th className="px-4 py-3 text-center">
                      DEV
                    </th>
                    <th className="px-4 py-3 text-center">
                      Total
                    </th>
                    <th className="px-4 py-3">
                      Empresas
                    </th>
                    <th className="px-4 py-3 text-right">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(
                    (item) => (
                      <tr
                        key={`${item.softwareId}:${item.installedVersion}`}
                        className="text-sm text-slate-700 transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4 align-top">
                          <PriorityBadge
                            priority={item.priority}
                          />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-900">
                            {item.name}
                          </p>

                          {item.cycle && (
                            <p className="mt-1 text-xs text-slate-500">
                              Ciclo {item.cycle}
                              {item.isLts ? ' · LTS' : ''}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="font-version inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-900">
                            {item.installedVersion}
                          </span>

                          {item.latestInCycle && item.latestInCycle !== item.installedVersion && (
                            <p className="mt-1 text-xs font-normal text-slate-500">
                              Última del ciclo: {item.latestInCycle}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className={item.status === 'EOL' ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>
                            {getEolText(item)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(item.eolDate)}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          {item.recommendation ? (
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.recommendation.latestVersion ?? `Ciclo ${item.recommendation.cycle}`}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Ciclo {item.recommendation.cycle}
                                {item.recommendation.isLts ? ' · LTS' : ''}
                              </p>

                              {item.recommendation.eolDate && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Soporte hasta {formatDate(item.recommendation.eolDate)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Sin recomendación automática
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center align-top font-semibold text-slate-900">
                          {item.prdServers}
                        </td>

                        <td className="px-4 py-4 text-center align-top">
                          {item.qasServers}
                        </td>

                        <td className="px-4 py-4 text-center align-top">
                          {item.devServers}
                        </td>

                        <td className="px-4 py-4 text-center align-top font-semibold text-slate-900">
                          {item.serverCount}
                        </td>

                        <td className="px-4 py-4 align-top">
                          {item.companies.length > 0 ? (
                            <div className="flex max-w-[250px] flex-wrap gap-1.5">
                              {item.companies.map(
                                (company) => (
                                  <span
                                    key={company.id}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                                  >
                                    {company.name} ({company.serverCount})
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Sin empresa
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() =>
                              openServers(item)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-company-primary hover:text-company-primary"
                          >
                            Ver servidores
                            <ArrowRight
                              size={14}
                            />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 xl:hidden">
            {filteredItems.map(
              (item) => (
                <article
                  key={`${item.softwareId}:${item.installedVersion}`}
                  className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
                >
                  <div className="h-0.5 bg-company-primary" />

                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <PriorityBadge
                          priority={item.priority}
                        />

                        <h2 className="mt-3 text-lg font-bold text-slate-900">
                          {item.name}{' '}
                          <span className="font-version">{item.installedVersion}</span>
                        </h2>

                        <p className={`mt-1 text-sm font-medium ${item.status === 'EOL' ? 'text-red-700' : 'text-amber-700'}`}>
                          {getEolText(item)} · {formatDate(item.eolDate)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Servidores
                        </p>

                        <p className="text-2xl font-bold text-slate-900">
                          {item.serverCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
                      <div>
                        <p className="text-xs text-slate-500">
                          PRD
                        </p>
                        <p className="font-bold text-slate-900">
                          {item.prdServers}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          QAS
                        </p>
                        <p className="font-bold text-slate-900">
                          {item.qasServers}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          DEV
                        </p>
                        <p className="font-bold text-slate-900">
                          {item.devServers}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                        Recomendación
                      </p>

                      {item.recommendation ? (
                        <p className="mt-1 text-sm leading-6 text-blue-900">
                          {item.recommendation.latestVersion ?? `Ciclo ${item.recommendation.cycle}`}
                          {' · '}ciclo {item.recommendation.cycle}
                          {item.recommendation.isLts ? ' · LTS' : ''}
                          {item.recommendation.eolDate ? ` · soporte hasta ${formatDate(item.recommendation.eolDate)}` : ''}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-blue-900">
                          Sin recomendación automática disponible.
                        </p>
                      )}
                    </div>

                    {item.companies.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.companies.map(
                          (company) => (
                            <span
                              key={company.id}
                              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                            >
                              {company.name} ({company.serverCount})
                            </span>
                          ),
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        openServers(item)
                      }
                      className="ui-btn ui-btn-primary btn-company-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
                    >
                      Ver servidores afectados
                      <ArrowRight
                        size={16}
                      />
                    </button>
                  </div>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
