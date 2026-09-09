import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Building2,
  GitBranch,
  HelpCircle,
  Search,
  Server,
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
  getSoftwareVersionInventory,
  type SoftwareVersionInventoryItem,
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

export default function SoftwareVersionsPage() {
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
    SoftwareVersionInventoryResponse | null
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
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        }
      }
    }

    loadCompanies();
  }, [isAdmin]);

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true);
        setError('');

        const result =
          await getSoftwareVersionInventory({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setData(result);
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            'No fue posible obtener las versiones de software.',
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, [
    companyId,
    environment,
    isAdmin,
  ]);

  const visibleItems =
    useMemo(
      () => {
        if (!data) {
          return [];
        }

        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase();

        if (!normalizedSearch) {
          return data.items;
        }

        return data.items.filter(
          (item) => {
            const values = [
              item.name,
              ...item.versions.map(
                (version) =>
                  version.version,
              ),
              ...item.companies.map(
                (company) =>
                  company.name,
              ),
              ...item.environments,
            ];

            return values.some(
              (value) =>
                value
                  .toLocaleLowerCase()
                  .includes(
                    normalizedSearch,
                  ),
            );
          },
        );
      },
      [data, search],
    );

  function openServers(
    item:
      SoftwareVersionInventoryItem,
    version?: string,
  ) {
    const params =
      new URLSearchParams();

    params.set(
      'softwareId',
      String(
        item.softwareId,
      ),
    );

    if (version) {
      params.set(
        'softwareVersion',
        version,
      );
    }

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

  const currentScope =
    companyId !== ''
      ? companies.find(
          (company) =>
            company.id ===
            companyId,
        )?.name ??
        'Empresa seleccionada'
      : canSelectCompany
        ? isAdmin
          ? 'Todas las empresas'
          : 'Todas las empresas accesibles'
        : currentUser?.company
            ?.name ??
          'Mi empresa';

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex items-start gap-4">
          <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
            <GitBranch size={24} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
              Inventario técnico
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Versiones de software
            </h1>

            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              Distribución de versiones realmente instaladas en los servidores del inventario.
            </p>
          </div>
        </div>
      </section>

      <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
            Alcance del inventario
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Buscar y filtrar versiones
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Filtra por software, versión, empresa o ambiente.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar software, versión, empresa o ambiente..."
              className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
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
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
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
          )}

          <select
            value={environment}
            onChange={(event) =>
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
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">
            Empresa: {currentScope}
          </span>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">
            Ambiente: {environment || 'Todos'}
          </span>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-5">
          <PageLoader
            variant="cards"
            rows={4}
          />

          <PageLoader
            variant="detail"
            rows={3}
          />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Server}
              label="Servidores en alcance"
              value={data.totals.servers}
            />

            <SummaryCard
              icon={Boxes}
              label="Software instalado"
              value={data.totals.software}
            />

            <SummaryCard
              icon={GitBranch}
              label="Versiones detectadas"
              value={data.totals.versions}
            />

            <SummaryCard
              icon={AlertTriangle}
              label="Con múltiples versiones"
              value={
                data.totals
                  .multipleVersionSoftware
              }
              attention={
                data.totals
                  .multipleVersionSoftware >
                0
              }
            />
          </div>

          {visibleItems.length === 0 ? (
            <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={23} />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No hay software que coincida con los filtros actuales.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Ajusta la búsqueda, empresa o ambiente para ampliar los resultados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleItems.map(
                (item) => (
                  <SoftwareVersionCard
                    key={item.softwareId}
                    item={item}
                    onOpenAll={() =>
                      openServers(
                        item,
                      )
                    }
                    onOpenVersion={(version) =>
                      openServers(
                        item,
                        version,
                      )
                    }
                  />
                ),
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

interface SummaryCardProps {
  icon:
    typeof Server;
  label: string;
  value: number;
  attention?: boolean;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  attention = false,
}: SummaryCardProps) {
  return (
    <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${attention ? 'bg-amber-400' : 'bg-company-primary'}`} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={
            attention
              ? 'rounded-xl bg-amber-50 p-2.5 text-amber-600 ring-1 ring-amber-100'
              : 'rounded-xl bg-company-primary/10 p-2.5 text-company-primary ring-1 ring-company-primary/10'
          }
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

interface SoftwareVersionCardProps {
  item:
    SoftwareVersionInventoryItem;
  onOpenAll:
    () => void;
  onOpenVersion:
    (version: string) => void;
}

function SoftwareVersionCard({
  item,
  onOpenAll,
  onOpenVersion,
}: SoftwareVersionCardProps) {
  const recommendation =
    item.endOfLife.recommendation;

  return (
    <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/40 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {item.name}
            </h2>

            {item.hasMultipleVersions && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <AlertTriangle size={13} />
                Múltiples versiones
              </span>
            )}

            {!item.active && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                Catálogo inactivo
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {item.serverCount}{' '}
            {item.serverCount === 1 ? 'servidor' : 'servidores'}{' '}
            · {item.versionCount}{' '}
            {item.versionCount === 1 ? 'versión' : 'versiones'}
          </p>

          {item.endOfLife.status === 'AVAILABLE' && recommendation && (
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-sm text-blue-800">
              Recomendación: ciclo <strong>{recommendation.cycle}</strong>, última versión <strong>{recommendation.latestVersion}</strong>
              {recommendation.isLts ? ' · LTS' : ''}
              {recommendation.eolDate ? ` · soporte hasta ${formatDate(recommendation.eolDate)}` : ''}.
            </div>
          )}

          {item.endOfLife.status === 'NOT_CONFIGURED' && (
            <p className="mt-3 text-xs text-slate-500">
              endoflife.date: producto aún no configurado en InfraStock.
            </p>
          )}

          {item.endOfLife.status === 'UNAVAILABLE' && (
            <p className="mt-3 text-xs font-medium text-amber-700">
              endoflife.date no está disponible en este momento. El inventario continúa operativo.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAll}
          className="shrink-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-company-primary hover:text-company-primary"
        >
          Ver todos los servidores
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {item.versions.map((version) => {
          const support =
            item.endOfLife.versions.find(
              (entry) => entry.installedVersion === version.version,
            );

          return (
            <button
              key={version.version}
              type="button"
              onClick={() => onOpenVersion(version.version)}
              className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50/70 xl:grid-cols-[minmax(110px,0.6fr)_minmax(180px,1fr)_100px_minmax(180px,1.2fr)_minmax(150px,0.8fr)_auto] xl:items-center"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Versión
                </p>

                <p className="font-version mt-1 font-semibold text-slate-900">
                  {version.version}
                </p>

                {support?.cycle && (
                  <p className="mt-1 text-xs text-slate-500">
                    Ciclo {support.cycle}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Soporte
                </p>

                <div className="mt-1">
                  <SupportBadge status={support?.status ?? 'UNKNOWN'} />
                </div>

                {support?.eolDate && (
                  <p className="mt-1 text-xs text-slate-500">
                    EOL: {formatDate(support.eolDate)}
                  </p>
                )}

                {support?.latestInCycle && support.latestInCycle !== version.version && (
                  <p className="mt-1 text-xs text-slate-500">
                    Última del ciclo: {support.latestInCycle}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Servidores
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {version.serverCount}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Building2 size={13} /> Empresas
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-700">
                  {version.companies.length > 0
                    ? version.companies.map((company) => company.name).join(', ')
                    : 'Sin empresa'}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ambientes
                </p>

                <div className="mt-1 flex flex-wrap gap-1.5">
                  {version.environments.length > 0
                    ? version.environments.map((environment) => (
                        <span
                          key={environment}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600"
                        >
                          {environment}
                        </span>
                      ))
                    : <span className="text-sm text-slate-500">Sin ambiente</span>}
                </div>
              </div>

              <div className="text-sm font-semibold text-company-primary">
                Ver servidores →
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SupportBadge({ status }: { status: 'SUPPORTED' | 'EOL_SOON' | 'EOL' | 'UNKNOWN' }) {
  if (status === 'SUPPORTED') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"><CheckCircle2 size={13} />Soportado</span>;
  }

  if (status === 'EOL_SOON') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"><AlertTriangle size={13} />Próximo a EOL</span>;
  }

  if (status === 'EOL') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200"><AlertCircle size={13} />Fuera de soporte</span>;
  }

  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"><HelpCircle size={13} />Sin información</span>;
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}
