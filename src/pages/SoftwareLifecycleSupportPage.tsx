import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  HelpCircle,
  Search,
  Server,
  ShieldCheck,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import PageLoader from '../components/PageLoader';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  getSoftwareVersionInventory,
  type EndOfLifeSupportStatus,
  type SoftwareVersionInventoryResponse,
} from '../services/catalogs.service';

import {
  getUser,
} from '../services/session.service';

type EnvironmentFilter =
  | ''
  | 'PRD'
  | 'QAS'
  | 'DEV';

type SupportFilter =
  | ''
  | EndOfLifeSupportStatus;

function statusLabel(
  status: EndOfLifeSupportStatus,
) {
  if (status === 'EOL') {
    return 'Fuera de soporte';
  }

  if (status === 'EOL_SOON') {
    return 'Próximo a EOL';
  }

  if (status === 'SUPPORTED') {
    return 'Soportado';
  }

  return 'Sin información';
}

function statusClasses(
  status: EndOfLifeSupportStatus,
) {
  if (status === 'EOL') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (status === 'EOL_SOON') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (status === 'SUPPORTED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-500';
}

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

export default function SoftwareLifecycleSupportPage() {
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
  ] = useState<SoftwareVersionInventoryResponse | null>(null);

  const [
    companies,
    setCompanies,
  ] = useState<AccessibleCompany[]>([]);

  const [
    companyId,
    setCompanyId,
  ] = useState<number | ''>('');

  const [
    environment,
    setEnvironment,
  ] = useState<EnvironmentFilter>('');

  const [
    support,
    setSupport,
  ] = useState<SupportFilter>('');

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

  const canSelectCompany =
    isAdmin ||
    companies.length > 1;

  useEffect(() => {
    let cancelled = false;

    getAccessibleCompanies()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setCompanies(
          result.filter(
            (company) =>
              company.active,
          ),
        );
      })
      .catch((caughtError) => {
        if (
          cancelled ||
          !(caughtError instanceof Error)
        ) {
          return;
        }

        setError(
          caughtError.message,
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) {
          return null;
        }

        setLoading(true);
        setError('');

        return getSoftwareVersionInventory({
          companyId:
            companyId !== ''
              ? companyId
              : undefined,
          environment:
            environment ||
            undefined,
        });
      })
      .then((result) => {
        if (
          cancelled ||
          !result
        ) {
          return;
        }

        setData(result);
      })
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'No fue posible obtener el estado EOL del software.',
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
  }, [
    companyId,
    environment,
  ]);

  const rows =
    useMemo(() => {
      if (!data) {
        return [];
      }

      return data.items.flatMap(
        (item) =>
          item.versions.map(
            (version) => {
              const lifecycle =
                item.endOfLife.versions.find(
                  (candidate) =>
                    candidate.installedVersion ===
                    version.version,
                );

              return {
                softwareId:
                  item.softwareId,
                name:
                  item.name,
                product:
                  item.endOfLife.product,
                installedVersion:
                  version.version,
                serverCount:
                  version.serverCount,
                companies:
                  version.companies,
                environments:
                  version.environments,
                status:
                  lifecycle?.status ??
                  'UNKNOWN' as EndOfLifeSupportStatus,
                cycle:
                  lifecycle?.cycle ??
                  null,
                eolDate:
                  lifecycle?.eolDate ??
                  null,
                daysToEol:
                  lifecycle?.daysToEol ??
                  null,
                latestInCycle:
                  lifecycle?.latestInCycle ??
                  null,
              };
            },
          ),
      );
    }, [data]);

  const visibleRows =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase();

      return rows.filter(
        (row) => {
          if (
            support &&
            row.status !== support
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          return [
            row.name,
            row.product ?? '',
            row.installedVersion,
            row.cycle ?? '',
            row.latestInCycle ?? '',
            ...row.companies.map(
              (company) =>
                company.name,
            ),
            ...row.environments,
          ]
            .join(' ')
            .toLocaleLowerCase()
            .includes(
              normalizedSearch,
            );
        },
      );
    }, [
      rows,
      search,
      support,
    ]);

  const totals =
    useMemo(() => ({
      eol:
        rows.filter(
          (row) =>
            row.status === 'EOL',
        ).length,
      eolSoon:
        rows.filter(
          (row) =>
            row.status ===
            'EOL_SOON',
        ).length,
      supported:
        rows.filter(
          (row) =>
            row.status ===
            'SUPPORTED',
        ).length,
      unknown:
        rows.filter(
          (row) =>
            row.status ===
            'UNKNOWN',
        ).length,
    }), [rows]);

  function openServers(
    softwareId: number,
    version: string,
  ) {
    const params =
      new URLSearchParams();

    params.set(
      'softwareId',
      String(softwareId),
    );
    params.set(
      'softwareVersion',
      version,
    );

    if (
      companyId !== ''
    ) {
      params.set(
        'companyId',
        String(companyId),
      );
    }

    if (environment) {
      params.set(
        'environment',
        environment,
      );
    }

    navigate(
      `/servers?${params.toString()}`,
    );
  }

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <ShieldCheck
                size={24}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Ciclo de vida tecnológico
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                EOL y soporte de software
              </h2>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Estado de soporte de las versiones realmente instaladas, utilizando las correspondencias configuradas con endoflife.date.
              </p>
            </div>
          </div>

          <a
            href="https://endoflife.date/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ExternalLink
              size={16}
            />
            Consultar endoflife.date
          </a>
        </div>
      </section>

      <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_190px_210px]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar software, versión o ciclo..."
              className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            />
          </div>

          {canSelectCompany && (
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
              className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              <option value="">
                {isAdmin
                  ? 'Todas las empresas'
                  : 'Empresas accesibles'}
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
          )}

          <select
            value={environment}
            onChange={(event) =>
              setEnvironment(
                event.target.value as
                  EnvironmentFilter,
              )
            }
            className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
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
            value={support}
            onChange={(event) =>
              setSupport(
                event.target.value as
                  SupportFilter,
              )
            }
            className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="">
              Todos los estados
            </option>
            <option value="EOL">
              Fuera de soporte
            </option>
            <option value="EOL_SOON">
              Próximo a EOL
            </option>
            <option value="SUPPORTED">
              Soportado
            </option>
            <option value="UNKNOWN">
              Sin información
            </option>
          </select>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <PageLoader
          variant="detail"
          rows={4}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatusCard
              label="Fuera de soporte"
              value={totals.eol}
              icon={CircleAlert}
              tone="danger"
            />
            <StatusCard
              label="Próximo a EOL"
              value={totals.eolSoon}
              icon={AlertTriangle}
              tone="warning"
            />
            <StatusCard
              label="Soportadas"
              value={totals.supported}
              icon={CheckCircle2}
              tone="success"
            />
            <StatusCard
              label="Sin información"
              value={totals.unknown}
              icon={HelpCircle}
              tone="neutral"
            />
          </div>

          <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">
                      Software
                    </th>
                    <th className="px-5 py-3.5">
                      Versión / ciclo
                    </th>
                    <th className="px-5 py-3.5">
                      Soporte
                    </th>
                    <th className="px-5 py-3.5">
                      EOL / última
                    </th>
                    <th className="px-5 py-3.5">
                      Servidores
                    </th>
                    <th className="px-5 py-3.5 text-right">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map(
                    (row) => (
                      <tr
                        key={`${row.softwareId}-${row.installedVersion}`}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {row.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {row.product ?? 'Sin correspondencia EOL'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-mono font-semibold text-slate-800">
                            {row.installedVersion}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Ciclo: {row.cycle ?? '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <p>
                            {formatDate(row.eolDate)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Última: {row.latestInCycle ?? '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                            <Server size={15} />
                            {row.serverCount}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openServers(
                                row.softwareId,
                                row.installedVersion,
                              )
                            }
                            className="text-xs font-semibold text-company-primary hover:underline"
                          >
                            Ver servidores
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {visibleRows.map(
                (row) => (
                  <article
                    key={`${row.softwareId}-${row.installedVersion}-mobile`}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {row.name}
                        </p>
                        <p className="mt-1 font-mono text-sm text-slate-600">
                          {row.installedVersion}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                        {statusLabel(row.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      <span>
                        Ciclo: <strong>{row.cycle ?? '—'}</strong>
                      </span>
                      <span>
                        EOL: <strong>{formatDate(row.eolDate)}</strong>
                      </span>
                      <span>
                        Última: <strong>{row.latestInCycle ?? '—'}</strong>
                      </span>
                      <span>
                        Servidores: <strong>{row.serverCount}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openServers(
                          row.softwareId,
                          row.installedVersion,
                        )
                      }
                      className="text-sm font-semibold text-company-primary"
                    >
                      Ver servidores →
                    </button>
                  </article>
                ),
              )}
            </div>

            {visibleRows.length === 0 && (
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                No hay versiones que coincidan con los filtros seleccionados.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  icon: typeof CircleAlert;
  tone:
    | 'danger'
    | 'warning'
    | 'success'
    | 'neutral';
}

function StatusCard({
  label,
  value,
  icon: Icon,
  tone,
}: StatusCardProps) {
  const classes = {
    danger:
      'border-red-200 bg-red-50 text-red-700',
    warning:
      'border-amber-200 bg-amber-50 text-amber-700',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
    neutral:
      'border-slate-200 bg-white text-slate-600',
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${classes}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {label}
        </p>
        <Icon size={19} />
      </div>
      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
