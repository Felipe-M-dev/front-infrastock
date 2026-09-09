import {
  useEffect,
  useState,
} from 'react';

import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Building2,
  CheckCircle2,
  Clock3,
  Cpu,
  FlaskConical,
  HardDrive,
  MemoryStick,
  PowerOff,
  Server,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  useNavigate,
} from 'react-router-dom';

import PageLoader from '../components/PageLoader';

import {
  getInventoryConfidenceSummary,
  getInventoryFreshnessSummary,
  getSoftwareSupportSummary,
  getSoftwareUpdatePriorities,
  getTechnologyRisk,
  type InventoryConfidenceSummaryResponse,
  type InventoryFreshnessSummaryResponse,
  type SoftwareSupportSummaryResponse,
  type SoftwareUpdatePrioritiesResponse,
  type SoftwareUpdatePriorityItem,
  type TechnologyRiskResponse,
  type TechnologyRiskLevel,
} from '../services/catalogs.service';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  getDashboardSummary,
  type CompanyFilter,
  type DashboardActivity,
  type DashboardSummary,
  type EnvironmentFilter,
} from '../services/dashboard.service';


import {
  getServerValuations,
  type ServerValuationResponse,
} from '../services/pricing.service';

import {
  getUser,
} from '../services/session.service';

import {
  type ServerInventoryIssue,
  type ServerInventoryFreshness,
  type ServerInventoryConfidence,
  type ServerQualityIssueCount,
  type ServerSoftwareSupportStatus,
} from '../services/servers.service';

import {
  formatDateTime,
} from '../utils/date';

function formatValuationUf(value: number) {
  return new Intl.NumberFormat(
    'es-CL',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatValuationClp(value: number | null) {
  if (value === null) {
    return '-';
  }

  return new Intl.NumberFormat(
    'es-CL',
    {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default function DashboardPage() {
  const navigate =
    useNavigate();

  const currentUser =
    getUser();

  const isAdmin =
    currentUser?.role ===
    'ADMIN';

  const isEditor =
    currentUser?.role ===
    'EDITOR';

  const isViewer =
    currentUser?.role ===
    'VIEWER';

  const canSeeCosts =
    isAdmin ||
    isEditor ||
    isViewer;

  const [
    summary,
    setSummary,
  ] =
    useState<
      DashboardSummary | null
    >(null);


  const [
    valuation,
    setValuation,
  ] = useState<
    ServerValuationResponse | null
  >(null);

  const [
    valuationLoading,
    setValuationLoading,
  ] = useState(false);

  const [
    valuationError,
    setValuationError,
  ] = useState('');

  const [
    supportSummary,
    setSupportSummary,
  ] = useState<
    SoftwareSupportSummaryResponse | null
  >(null);

  const [
    supportLoading,
    setSupportLoading,
  ] = useState(true);

  const [
    supportError,
    setSupportError,
  ] = useState('');


  const [
    updatePriorities,
    setUpdatePriorities,
  ] = useState<
    SoftwareUpdatePrioritiesResponse | null
  >(null);

  const [
    prioritiesLoading,
    setPrioritiesLoading,
  ] = useState(true);

  const [
    prioritiesError,
    setPrioritiesError,
  ] = useState('');

  const [
    technologyRisk,
    setTechnologyRisk,
  ] = useState<
    TechnologyRiskResponse | null
  >(null);

  const [
    technologyRiskLoading,
    setTechnologyRiskLoading,
  ] = useState(true);

  const [
    technologyRiskError,
    setTechnologyRiskError,
  ] = useState('');

  const [
    inventoryFreshness,
    setInventoryFreshness,
  ] = useState<
    InventoryFreshnessSummaryResponse | null
  >(null);

  const [
    inventoryFreshnessLoading,
    setInventoryFreshnessLoading,
  ] = useState(true);

  const [
    inventoryFreshnessError,
    setInventoryFreshnessError,
  ] = useState('');

  const [
    inventoryConfidence,
    setInventoryConfidence,
  ] = useState<
    InventoryConfidenceSummaryResponse | null
  >(null);

  const [
    inventoryConfidenceLoading,
    setInventoryConfidenceLoading,
  ] = useState(true);

  const [
    inventoryConfidenceError,
    setInventoryConfidenceError,
  ] = useState('');

  const [
    companies,
    setCompanies,
  ] =
    useState<
      AccessibleCompany[]
    >([]);

  const [
    companyId,
    setCompanyId,
  ] =
    useState<
      CompanyFilter
    >('');

  const [
    environment,
    setEnvironment,
  ] =
    useState<
      EnvironmentFilter
    >('');

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    error,
    setError,
  ] =
    useState(
      '',
    );

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data =
          await getAccessibleCompanies();

        setCompanies(
          data.filter(
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
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(
          true,
        );

        setError(
          '',
        );

        const data =
          await getDashboardSummary(
            environment,
            companyId,
          );

        setSummary(
          data,
        );
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        }
      } finally {
        setLoading(
          false,
        );
      }
    }

    loadData();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);

  useEffect(() => {
    async function loadValuation() {
      if (!canSeeCosts) {
        setValuation(null);
        setValuationError('');
        setValuationLoading(false);
        return;
      }

      try {
        setValuationLoading(true);
        setValuationError('');

        const data =
          await getServerValuations({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,
            environment:
              environment ||
              undefined,
          });

        setValuation(data);
      } catch (error) {
        setValuation(null);
        setValuationError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener la valorización de servidores.',
        );
      } finally {
        setValuationLoading(false);
      }
    }

    void loadValuation();
  }, [
    environment,
    companyId,
    canSeeCosts,
  ]);

  useEffect(() => {
    async function loadSupportSummary() {
      try {
        setSupportLoading(true);
        setSupportError('');

        const data =
          await getSoftwareSupportSummary({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setSupportSummary(
          data,
        );
      } catch (error) {
        setSupportSummary(
          null,
        );

        setSupportError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener el estado de soporte del software.',
        );
      } finally {
        setSupportLoading(false);
      }
    }

    loadSupportSummary();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);

  useEffect(() => {
    async function loadUpdatePriorities() {
      try {
        setPrioritiesLoading(
          true,
        );
        setPrioritiesError(
          '',
        );

        const data =
          await getSoftwareUpdatePriorities({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setUpdatePriorities(
          data,
        );
      } catch (error) {
        setUpdatePriorities(
          null,
        );

        setPrioritiesError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener las prioridades de actualización.',
        );
      } finally {
        setPrioritiesLoading(
          false,
        );
      }
    }

    loadUpdatePriorities();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);

  useEffect(() => {
    async function loadTechnologyRisk() {
      try {
        setTechnologyRiskLoading(true);
        setTechnologyRiskError('');

        const data =
          await getTechnologyRisk({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,
            environment:
              environment ||
              undefined,
          });

        setTechnologyRisk(data);
      } catch (error) {
        setTechnologyRisk(null);
        setTechnologyRiskError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener el riesgo tecnológico.',
        );
      } finally {
        setTechnologyRiskLoading(false);
      }
    }

    loadTechnologyRisk();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);

  useEffect(() => {
    async function loadInventoryFreshness() {
      try {
        setInventoryFreshnessLoading(
          true,
        );

        setInventoryFreshnessError(
          '',
        );

        const data =
          await getInventoryFreshnessSummary({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setInventoryFreshness(
          data,
        );
      } catch (error) {
        setInventoryFreshness(
          null,
        );

        setInventoryFreshnessError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener la antigüedad del inventario.',
        );
      } finally {
        setInventoryFreshnessLoading(
          false,
        );
      }
    }

    loadInventoryFreshness();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);

  useEffect(() => {
    async function loadInventoryConfidence() {
      try {
        setInventoryConfidenceLoading(
          true,
        );

        setInventoryConfidenceError(
          '',
        );

        const data =
          await getInventoryConfidenceSummary({
            companyId:
              companyId !== ''
                ? companyId
                : undefined,

            environment:
              environment ||
              undefined,
          });

        setInventoryConfidence(
          data,
        );
      } catch (error) {
        setInventoryConfidence(
          null,
        );

        setInventoryConfidenceError(
          error instanceof Error
            ? error.message
            : 'No fue posible obtener la confiabilidad del inventario.',
        );
      } finally {
        setInventoryConfidenceLoading(
          false,
        );
      }
    }

    loadInventoryConfidence();
  }, [
    environment,
    companyId,
    isAdmin,
  ]);


  if (
    loading &&
    !summary
  ) {
    return (
      <div className="space-y-5">
        <PageLoader
          variant="cards"
          rows={6}
        />

        <PageLoader
          variant="detail"
          rows={2}
        />
      </div>
    );
  }

  if (
    error &&
    !summary
  ) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (
    !summary
  ) {
    return null;
  }

  const canSelectCompany =
    isAdmin ||
    companies.length > 1;

  const selectedCompany =
    companyId !== ''
      ? companies.find(
          (company) =>
            company.id ===
            companyId,
        )
      : null;

  const dashboardScope =
    selectedCompany
      ? selectedCompany.name
      : canSelectCompany
        ? 'Todas las empresas accesibles'
        : currentUser
            ?.company
            ?.name ??
          'Mi empresa';

  const currentScopeLabel =
    environment
      ? `${dashboardScope} · ${environment}`
      : dashboardScope;

  const resourceCards = [
    {
      label:
        'Servidores visibles',
      value:
        summary.totals.filtered,
      suffix:
        '',
      icon:
        Server,
    },
    {
      label:
        'Activos',
      value:
        summary.totals.filteredActive,
      suffix:
        '',
      icon:
        CheckCircle2,
    },
    {
      label:
        'Inactivos',
      value:
        summary.totals.filteredInactive,
      suffix:
        '',
      icon:
        PowerOff,
    },
    {
      label:
        'CPU total',
      value:
        summary.resources.cpuCores,
      suffix:
        ' cores',
      icon:
        Cpu,
    },
    {
      label:
        'RAM total',
      value:
        summary.resources.ramGb,
      suffix:
        ' GB',
      icon:
        MemoryStick,
    },
    {
      label:
        'Disco total',
      value:
        summary.resources.diskGb,
      suffix:
        ' GB',
      icon:
        HardDrive,
    },
  ];

  const environmentCards = [
    {
      label:
        'PRD',
      value:
        summary.totals.prd,
      icon:
        ShieldCheck,
    },
    {
      label:
        'QAS',
      value:
        summary.totals.qas,
      icon:
        FlaskConical,
    },
    {
      label:
        'DEV',
      value:
        summary.totals.dev,
      icon:
        Wrench,
    },
  ];

  const qualityCards: {
    label: string;
    value: number;
    description: string;
    issue: ServerInventoryIssue;
  }[] = [
    {
      label:
        'Sin IP',
      value:
        summary.quality.missingIp,
      description:
        'Servidores sin dirección IP registrada.',
      issue:
        'missingIp',
    },
    {
      label:
        'Sin sistema operativo',
      value:
        summary.quality.missingOperatingSystem,
      description:
        'Servidores sin SO asociado.',
      issue:
        'missingOperatingSystem',
    },
    {
      label:
        'Recursos incompletos',
      value:
        summary.quality.incompleteResources,
      description:
        'Falta CPU, RAM o disco.',
      issue:
        'incompleteResources',
    },
    {
      label:
        'Sin software',
      value:
        summary.quality.missingSoftware,
      description:
        'Servidores sin software registrado.',
      issue:
        'missingSoftware',
    },
  ];

  const softwareChartData =
    summary.software.slice(
      0,
      10,
    );

  const operatingSystemsChartData =
    summary.operatingSystems.slice(
      0,
      10,
    );

  const companyChartData =
    summary.companies.slice(
      0,
      10,
    );

  function openServers(
    extraFilters: {
      companyId?: number;
      environment?: 'PRD' | 'QAS' | 'DEV';
      operatingSystemId?: number;
      softwareId?: number;
      softwareVersion?: string;
      inventoryIssue?:
        ServerInventoryIssue;
      qualityIssueCount?:
        ServerQualityIssueCount;
      softwareSupportStatus?:
        ServerSoftwareSupportStatus;
      inventoryFreshness?:
        ServerInventoryFreshness;
      inventoryConfidence?:
        ServerInventoryConfidence;
      active?: boolean;
    } = {},
  ) {
    const params =
      new URLSearchParams();

    const targetCompanyId =
      extraFilters.companyId ??
      (
        companyId !== ''
          ? companyId
          : undefined
      );

    const targetEnvironment =
      extraFilters.environment ??
      (
        environment ||
        undefined
      );

    if (
      targetCompanyId !==
        undefined
    ) {
      params.set(
        'companyId',
        String(
          targetCompanyId,
        ),
      );
    }

    if (
      targetEnvironment
    ) {
      params.set(
        'environment',
        targetEnvironment,
      );
    }

    if (
      extraFilters.operatingSystemId !==
        undefined
    ) {
      params.set(
        'operatingSystemId',
        String(
          extraFilters.operatingSystemId,
        ),
      );
    }

    if (
      extraFilters.softwareId !==
        undefined
    ) {
      params.set(
        'softwareId',
        String(
          extraFilters.softwareId,
        ),
      );
    }

    if (
      extraFilters.softwareVersion
    ) {
      params.set(
        'softwareVersion',
        extraFilters.softwareVersion,
      );
    }

    if (
      extraFilters.inventoryIssue
    ) {
      params.set(
        'inventoryIssue',
        extraFilters.inventoryIssue,
      );
    }

    if (
      extraFilters.qualityIssueCount
    ) {
      params.set(
        'qualityIssueCount',
        extraFilters.qualityIssueCount,
      );
    }

    if (
      extraFilters.softwareSupportStatus
    ) {
      params.set(
        'softwareSupportStatus',
        extraFilters.softwareSupportStatus,
      );
    }

    if (
      extraFilters.inventoryFreshness
    ) {
      params.set(
        'inventoryFreshness',
        extraFilters.inventoryFreshness,
      );
    }

    if (
      extraFilters.inventoryConfidence
    ) {
      params.set(
        'inventoryConfidence',
        extraFilters.inventoryConfidence,
      );
    }

    if (
      extraFilters.active !==
        undefined
    ) {
      params.set(
        'active',
        String(
          extraFilters.active,
        ),
      );
    }

    const query =
      params.toString();

    navigate(
      query
        ? `/servers?${query}`
        : '/servers',
    );
  }

  return (
    <div>
      <div className="ui-table-shell ui-panel relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Resumen operativo de la infraestructura inventariada.
          </p>

          <div className="ui-btn ui-btn-secondary mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2.5 text-sm text-slate-600 shadow-sm">
            <Building2
              size={16}
              className="text-company-primary"
            />

            <span>
              Vista:
            </span>

            <span className="font-semibold tracking-tight text-slate-900">
              {currentScopeLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {canSelectCompany && (
            <div className="min-w-[220px]">
              <label
                htmlFor="dashboard-company"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filtrar por empresa
              </label>

              <select
                id="dashboard-company"
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
                className="ui-control ui-btn ui-btn-secondary w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
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
            <p className="mb-2 text-sm font-medium text-slate-700">
              Filtrar por ambiente
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Todos', value: '' },
                { label: 'PRD', value: 'PRD' },
                { label: 'QAS', value: 'QAS' },
                { label: 'DEV', value: 'DEV' },
              ].map(
                (item) => {
                  const active =
                    environment ===
                    item.value;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() =>
                        setEnvironment(
                          item.value as
                            EnvironmentFilter,
                        )
                      }
                      className={
                        active
                          ? 'btn-company-primary rounded-lg px-4 py-2 text-sm font-semibold'
                          : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
                      }
                    >
                      {item.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
            Actualizando...
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {resourceCards.map(
            (card) => {
              const Icon =
                card.icon;

              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => {
                    if (
                      card.label ===
                      'Servidores visibles'
                    ) {
                      openServers();
                    }

                    if (
                      card.label ===
                      'Activos'
                    ) {
                      openServers({
                        active: true,
                      });
                    }

                    if (
                      card.label ===
                      'Inactivos'
                    ) {
                      openServers({
                        active: false,
                      });
                    }
                  }}
                  disabled={
                    ![
                      'Servidores visibles',
                      'Activos',
                      'Inactivos',
                    ].includes(
                      card.label,
                    )
                  }
                  className={
                    [
                      'Servidores visibles',
                      'Activos',
                      'Inactivos',
                    ].includes(
                      card.label,
                    )
                      ? 'rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-company-primary hover:shadow-sm'
                      : 'cursor-default rounded-xl border border-slate-200 bg-white p-5 text-left'
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-500">
                        {card.label}
                      </p>

                      <p className="mt-2 truncate text-2xl font-bold text-slate-900">
                        {card.value}{card.suffix}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-xl bg-company-primary/10 p-3 text-company-primary ring-1 ring-company-primary/10">
                      <Icon size={22} />
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>

        {canSeeCosts && (
          <section className="ui-panel mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BadgeDollarSign
                    size={20}
                    className="text-company-primary"
                  />

                  <h2 className="font-semibold tracking-tight text-slate-900">
                    Valorización mensual
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {isViewer
                    ? `Resumen informativo de costos para ${currentScopeLabel}.`
                    : `Costos calculados con las tarifas vigentes para ${currentScopeLabel}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate('/pricing')
                }
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {isViewer
                  ? 'Abrir Centro de Costos'
                  : 'Abrir Costos y Cotización'}
              </button>
            </div>

            {valuationError && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {valuationError}
              </div>
            )}

            <div className="relative mt-4">
              {valuationLoading && (
                <div className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                  Actualizando valorización...
                </div>
              )}

              {valuation ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total mensual
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatValuationUf(
                        valuation.totals.totalUf,
                      )} UF
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {formatValuationClp(
                        valuation.totals.totalClp,
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Servidores valorizados
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {valuation.totals.servers}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Servidores activos incluidos
                    </p>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Valorización completa
                    </p>

                    <p className="mt-1 text-2xl font-bold text-emerald-800">
                      {valuation.totals.fullyValued}
                    </p>

                    <p className="mt-1 text-xs text-emerald-700">
                      Sin conceptos pendientes
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Requieren revisión
                    </p>

                    <p className="mt-1 text-2xl font-bold text-amber-800">
                      {valuation.totals.partial}
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      Valorizaciones parciales
                    </p>
                  </div>
                </div>
              ) : (
                !valuationLoading &&
                !valuationError && (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    No hay información de valorización disponible para los filtros actuales.
                  </div>
                )
              )}
            </div>
          </section>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {environmentCards.map(
            (card) => {
              const Icon =
                card.icon;

              const selected =
                environment ===
                card.label;

              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() =>
                    openServers({
                      environment:
                        card.label as
                          'PRD' |
                          'QAS' |
                          'DEV',
                    })
                  }
                  className={
                    selected
                      ? 'rounded-xl border border-company-primary bg-white p-4 text-left ring-1 ring-company-primary'
                      : 'rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300 hover:bg-slate-50'
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.label}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {card.value}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
                      <Icon size={20} />
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>

        <section className="ui-panel mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold tracking-tight text-slate-900">
                Calidad del inventario
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Datos faltantes y dispersión de versiones para {currentScopeLabel}.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                openServers({
                  qualityIssueCount:
                    '0',
                })
              }
              className="inline-flex items-center gap-3 self-start rounded-lg bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 ring-1 ring-slate-200 transition hover:ring-company-primary"
            >
              <CheckCircle2
                size={18}
                className="text-company-primary"
              />

              <div>
                <p className="font-medium text-slate-700">
                  Completitud
                </p>

                <p className="mt-0.5 text-xl font-bold text-slate-900">
                  {summary.quality.completenessPercentage}%
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {summary.quality.completeInventory} de {summary.totals.filtered} completos
                </p>
              </div>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {qualityCards.map(
              (card) => (
                <button
                  key={card.issue}
                  type="button"
                  onClick={() =>
                    openServers({
                      inventoryIssue:
                        card.issue,
                    })
                  }
                  className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-company-primary hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        {card.label}
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {card.value}
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <AlertTriangle
                        size={19}
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {card.description}
                  </p>
                </button>
              ),
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Servidores según cantidad de problemas
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Cada servidor se clasifica por cantidad de categorías de calidad pendientes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Inventario completo',
                  value:
                    summary.quality.issueCountDistribution.zero,
                  filter:
                    '0' as ServerQualityIssueCount,
                },
                {
                  label: '1 problema',
                  value:
                    summary.quality.issueCountDistribution.one,
                  filter:
                    '1' as ServerQualityIssueCount,
                },
                {
                  label: '2 problemas',
                  value:
                    summary.quality.issueCountDistribution.two,
                  filter:
                    '2' as ServerQualityIssueCount,
                },
                {
                  label: '3 o más problemas',
                  value:
                    summary.quality.issueCountDistribution.threePlus,
                  filter:
                    '3plus' as ServerQualityIssueCount,
                },
              ].map(
                (item) => (
                  <button
                    key={item.filter}
                    type="button"
                    onClick={() =>
                      openServers({
                        qualityIssueCount:
                          item.filter,
                      })
                    }
                    className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-company-primary hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-sm font-medium text-slate-600">
                      {item.label}
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Soporte de versiones de software
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Estado calculado con endoflife.date. Próximo a EOL considera los próximos 180 días.
                </p>
              </div>

              {supportSummary && (
                <p className="text-xs text-slate-400">
                  {supportSummary.totals.availableProducts} producto{supportSummary.totals.availableProducts === 1 ? '' : 's'} con información disponible
                </p>
              )}
            </div>

            {supportLoading ? (
              <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Consultando estado de soporte...
              </div>
            ) : supportError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {supportError}
              </div>
            ) : supportSummary ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      openServers({
                        softwareSupportStatus:
                          'EOL',
                      })
                    }
                    className="rounded-lg border border-red-200 bg-red-50 p-4 text-left transition hover:border-red-300 hover:bg-red-100/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          Fuera de soporte
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {supportSummary.totals.eol}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/70 p-2 text-red-600">
                        <AlertTriangle size={19} />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-red-700/80">
                      Servidores con al menos una versión cuyo ciclo ya alcanzó EOL.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openServers({
                        softwareSupportStatus:
                          'EOL_SOON',
                      })
                    }
                    className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-left transition hover:border-amber-300 hover:bg-amber-100/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-amber-700">
                          Próximos a EOL
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {supportSummary.totals.eolSoon}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white/70 p-2 text-amber-600">
                        <Clock3 size={19} />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-amber-700/80">
                      Servidores con versiones que alcanzarán EOL dentro de {supportSummary.thresholdDays} días.
                    </p>
                  </button>
                </div>

                {(supportSummary.totals.unknown > 0 ||
                  supportSummary.totals.notConfiguredProducts > 0 ||
                  supportSummary.totals.unavailableProducts > 0) && (
                  <p className="mt-3 text-xs text-slate-500">
                    Sin clasificación completa: {supportSummary.totals.unknown} servidor{supportSummary.totals.unknown === 1 ? '' : 'es'}; {supportSummary.totals.notConfiguredProducts} producto{supportSummary.totals.notConfiguredProducts === 1 ? '' : 's'} sin mapping; {supportSummary.totals.unavailableProducts} consulta{supportSummary.totals.unavailableProducts === 1 ? '' : 's'} no disponible{supportSummary.totals.unavailableProducts === 1 ? '' : 's'}.
                  </p>
                )}
              </>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Prioridad de actualización
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Ordena versiones EOL y próximas a EOL según impacto. EOL presente en PRD se considera crítico.
                </p>
              </div>

              {updatePriorities && (
                <p className="text-xs text-slate-400">
                  {updatePriorities.totals.affectedVersions} versión{updatePriorities.totals.affectedVersions === 1 ? '' : 'es'} afectada{updatePriorities.totals.affectedVersions === 1 ? '' : 's'} · {updatePriorities.totals.affectedServers} servidor{updatePriorities.totals.affectedServers === 1 ? '' : 'es'}
                </p>
              )}
            </div>

            {prioritiesLoading ? (
              <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Calculando prioridades de actualización...
              </div>
            ) : prioritiesError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {prioritiesError}
              </div>
            ) : updatePriorities && updatePriorities.items.length > 0 ? (
              <>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: 'Críticas',
                      value: updatePriorities.totals.critical,
                      className: 'border-red-200 bg-red-50 text-red-700',
                    },
                    {
                      label: 'Altas',
                      value: updatePriorities.totals.high,
                      className: 'border-orange-200 bg-orange-50 text-orange-700',
                    },
                    {
                      label: 'Medias',
                      value: updatePriorities.totals.medium,
                      className: 'border-amber-200 bg-amber-50 text-amber-700',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-lg border px-4 py-3 ${item.className}`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {updatePriorities.items.slice(0, 8).map((item) => (
                    <SoftwareUpdatePriorityRow
                      key={`${item.softwareId}-${item.installedVersion}`}
                      item={item}
                      onOpen={() =>
                        openServers({
                          softwareId:
                            item.softwareId,
                          softwareVersion:
                            item.installedVersion,
                        })
                      }
                    />
                  ))}
                </div>

                {updatePriorities.items.length > 8 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Se muestran las 8 prioridades principales de {updatePriorities.items.length} versiones afectadas.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                No se detectaron versiones EOL ni próximas a EOL en el alcance seleccionado.
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Riesgo tecnológico por empresa y ambiente
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Ranking de exposición según versiones EOL o próximas a EOL. El puntaje pondera prioridad y cantidad de servidores afectados.
                </p>
              </div>

              {technologyRisk && (
                <p className="text-xs text-slate-400">
                  {technologyRisk.totals.companiesAtRisk} empresa{technologyRisk.totals.companiesAtRisk === 1 ? '' : 's'} con exposición · {technologyRisk.totals.criticalCompanies} crítica{technologyRisk.totals.criticalCompanies === 1 ? '' : 's'}
                </p>
              )}
            </div>

            {technologyRiskLoading ? (
              <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Calculando exposición tecnológica...
              </div>
            ) : technologyRiskError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {technologyRiskError}
              </div>
            ) : technologyRisk ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Por ambiente
                  </h4>

                  <div className="mt-3 space-y-2">
                    {technologyRisk.byEnvironment.map((item) => (
                      <button
                        key={item.environment}
                        type="button"
                        onClick={() =>
                          openServers({
                            environment: item.environment,
                            softwareSupportStatus: 'EOL',
                          })
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {item.environment}
                            </span>
                            <TechnologyRiskBadge level={item.riskLevel} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.affectedServers} impacto{item.affectedServers === 1 ? '' : 's'} · {item.eolVersions} EOL · {item.eolSoonVersions} próximo{item.eolSoonVersions === 1 ? '' : 's'} a EOL
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.exposurePoints} pts
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Empresas con mayor exposición
                  </h4>

                  {technologyRisk.byCompany.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No hay empresas con versiones EOL o próximas a EOL en el alcance seleccionado.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {technologyRisk.byCompany.slice(0, 8).map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            openServers({
                              companyId: item.id,
                              softwareSupportStatus: 'EOL',
                            })
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">
                                #{index + 1}
                              </span>
                              <span className="truncate font-semibold text-slate-800">
                                {item.name}
                              </span>
                              <TechnologyRiskBadge level={item.riskLevel} />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.affectedServers} impacto{item.affectedServers === 1 ? '' : 's'} · {item.criticalVersions} crítica{item.criticalVersions === 1 ? '' : 's'} · {item.highVersions} alta{item.highVersions === 1 ? '' : 's'} · {item.mediumVersions} media{item.mediumVersions === 1 ? '' : 's'}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-slate-700">
                            {item.exposurePoints} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Antigüedad y confiabilidad del inventario
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Clasifica los servidores según los días transcurridos desde su última actualización en InfraStock.
                </p>
              </div>

              {inventoryFreshness && (
                <p className="text-xs text-slate-400">
                  {inventoryFreshness.totals.freshnessPercentage}% actualizado en los últimos 30 días
                </p>
              )}
            </div>

            {inventoryFreshnessLoading ? (
              <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Calculando antigüedad del inventario...
              </div>
            ) : inventoryFreshnessError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {inventoryFreshnessError}
              </div>
            ) : inventoryFreshness ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Menos de 30 días',
                      value: inventoryFreshness.totals.recent,
                      filter: 'recent' as ServerInventoryFreshness,
                      className: 'border-emerald-200 bg-emerald-50',
                    },
                    {
                      label: '30 a 59 días',
                      value: inventoryFreshness.totals.days30to59,
                      filter: 'days30to59' as ServerInventoryFreshness,
                      className: 'border-amber-200 bg-amber-50',
                    },
                    {
                      label: '60 a 89 días',
                      value: inventoryFreshness.totals.days60to89,
                      filter: 'days60to89' as ServerInventoryFreshness,
                      className: 'border-orange-200 bg-orange-50',
                    },
                    {
                      label: '90 días o más',
                      value: inventoryFreshness.totals.days90plus,
                      filter: 'days90plus' as ServerInventoryFreshness,
                      className: 'border-red-200 bg-red-50',
                    },
                  ].map((item) => (
                    <button
                      key={item.filter}
                      type="button"
                      onClick={() =>
                        openServers({
                          inventoryFreshness:
                            item.filter,
                        })
                      }
                      className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${item.className}`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                        {item.label}
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {item.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Ver servidores
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {inventoryFreshness.totals.stale30plus} de {inventoryFreshness.totals.total} servidor{inventoryFreshness.totals.total === 1 ? '' : 'es'} llevan 30 días o más sin actualización.
                  </span>

                  {inventoryFreshness.oldest && (
                    <span className="text-xs text-slate-500">
                      Más antiguo: <strong>{inventoryFreshness.oldest.hostname}</strong> · {inventoryFreshness.oldest.ageDays} días
                    </span>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Confiabilidad del inventario
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Índice operativo de 0 a 100 que combina completitud de datos y antigüedad de la última actualización.
                </p>
              </div>

              {inventoryConfidence && (
                <div className="text-right text-xs text-slate-400">
                  <p>
                    Promedio: <strong className="text-slate-700">{inventoryConfidence.totals.averageScore}</strong>/100
                  </p>
                  <p className="mt-1">
                    {inventoryConfidence.totals.reliablePercentage}% con confiabilidad alta
                  </p>
                </div>
              )}
            </div>

            {inventoryConfidenceLoading ? (
              <div className="rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Calculando confiabilidad del inventario...
              </div>
            ) : inventoryConfidenceError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                {inventoryConfidenceError}
              </div>
            ) : inventoryConfidence ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: 'Alta',
                      range: '85–100',
                      value: inventoryConfidence.totals.high,
                      filter: 'HIGH' as ServerInventoryConfidence,
                      className: 'border-emerald-200 bg-emerald-50',
                    },
                    {
                      label: 'Media',
                      range: '60–84',
                      value: inventoryConfidence.totals.medium,
                      filter: 'MEDIUM' as ServerInventoryConfidence,
                      className: 'border-amber-200 bg-amber-50',
                    },
                    {
                      label: 'Baja',
                      range: '< 60',
                      value: inventoryConfidence.totals.low,
                      filter: 'LOW' as ServerInventoryConfidence,
                      className: 'border-red-200 bg-red-50',
                    },
                  ].map((item) => (
                    <button
                      key={item.filter}
                      type="button"
                      onClick={() =>
                        openServers({
                          inventoryConfidence:
                            item.filter,
                        })
                      }
                      className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${item.className}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                          {item.label}
                        </p>

                        <span className="text-xs text-slate-400">
                          {item.range}
                        </span>
                      </div>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {item.value}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Ver servidores
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p>
                    Puntaje: hasta <strong>60 puntos</strong> por completitud y hasta <strong>40 puntos</strong> por vigencia de la información.
                  </p>

                  {inventoryConfidence.lowest && (
                    <p className="mt-1 text-xs text-slate-500">
                      Menor confiabilidad: <strong>{inventoryConfidence.lowest.hostname}</strong> · {inventoryConfidence.lowest.score}/100 · {inventoryConfidence.lowest.issueCount} problema{inventoryConfidence.lowest.issueCount === 1 ? '' : 's'} de calidad · {inventoryConfidence.lowest.ageDays} días desde la última actualización.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                Software con múltiples versiones
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Software que actualmente tiene más de una versión registrada en el alcance seleccionado.
              </p>
            </div>

            {summary.softwareVersionSpread.length ===
            0 ? (
              <div className="rounded-lg bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No se detectó dispersión de versiones.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {summary.softwareVersionSpread.map(
                  (item) => (
                    <button
                      key={item.softwareId}
                      type="button"
                      onClick={() =>
                        openServers({
                          softwareId:
                            item.softwareId,
                        })
                      }
                      className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-company-primary hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold tracking-tight text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.serverCount} servidor{item.serverCount === 1 ? '' : 'es'} · {item.versionCount} versiones
                          </p>
                        </div>

                        <Wrench
                          size={18}
                          className="shrink-0 text-slate-400"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.versions.map(
                          (version) => (
                            <span
                              key={version}
                              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                            >
                              {version}
                            </span>
                          ),
                        )}
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <DashboardBarSection
            title="Sistemas Operativos"
            description={`Distribución por SO y versión para ${currentScopeLabel}.`}
            data={operatingSystemsChartData}
            emptyText="Sin información de sistemas operativos."
            onSelect={(item) =>
              openServers({
                operatingSystemId:
                  item.id,
              })
            }
          />

          <DashboardBarSection
            title="Software y versiones"
            description={`Principales instalaciones registradas para ${currentScopeLabel}.`}
            data={softwareChartData}
            emptyText="Sin información de software."
            onSelect={(item) =>
              openServers({
                softwareId:
                  item.id,
                softwareVersion:
                  item.version,
              })
            }
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {canSelectCompany && (
            <DashboardBarSection
              title="Servidores por empresa"
              description={`Distribución de servidores para ${environment || 'todos los ambientes'}.`}
              data={companyChartData}
              emptyText="Sin información de empresas."
              onSelect={(item) =>
                openServers({
                  companyId:
                    item.id,
                })
              }
            />
          )}

          <section
            className={
              canSelectCompany
                ? 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6'
                : 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2'
            }
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold tracking-tight text-slate-900">
                  Actividad reciente
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Últimos cambios registrados sobre los servidores visibles.
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                <Clock3 size={19} />
              </div>
            </div>

            {summary.recentActivity.length ===
            0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No hay actividad reciente para este filtro.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentActivity.map(
                  (item) => (
                    <ActivityRow
                      key={item.id}
                      item={item}
                      onOpen={(serverId) =>
                        navigate(
                          `/servers/${serverId}`,
                          {
                            state: {
                              returnTo:
                                '/dashboard',
                            },
                          },
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


function TechnologyRiskBadge({
  level,
}: {
  level: TechnologyRiskLevel;
}) {
  const label =
    level === 'CRITICAL'
      ? 'Crítico'
      : level === 'HIGH'
        ? 'Alto'
        : level === 'MEDIUM'
          ? 'Medio'
          : 'Bajo';

  const classes =
    level === 'CRITICAL'
      ? 'border-red-200 bg-red-50 text-red-700'
      : level === 'HIGH'
        ? 'border-orange-200 bg-orange-50 text-orange-700'
        : level === 'MEDIUM'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${classes}`}
    >
      {label}
    </span>
  );
}

function SoftwareUpdatePriorityRow({
  item,
  onOpen,
}: {
  item:
    SoftwareUpdatePriorityItem;
  onOpen: () => void;
}) {
  const priorityStyles = {
    CRITICAL:
      'border-red-200 bg-red-50 text-red-700',
    HIGH:
      'border-orange-200 bg-orange-50 text-orange-700',
    MEDIUM:
      'border-amber-200 bg-amber-50 text-amber-700',
  } as const;

  const priorityLabels = {
    CRITICAL:
      'Crítico',
    HIGH:
      'Alto',
    MEDIUM:
      'Medio',
  } as const;

  const supportText =
    item.status === 'EOL'
      ? item.daysToEol !== null
        ? `EOL hace ${Math.abs(item.daysToEol)} día${Math.abs(item.daysToEol) === 1 ? '' : 's'}`
        : 'Fuera de soporte'
      : item.daysToEol !== null
        ? `EOL en ${item.daysToEol} día${item.daysToEol === 1 ? '' : 's'}`
        : 'Próximo a EOL';

  const recommendation =
    item.recommendation;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="ui-control w-full rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-company-primary hover:shadow-md"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${priorityStyles[item.priority]}`}
            >
              {priorityLabels[item.priority]}
            </span>

            <span className="text-xs font-medium text-slate-500">
              {supportText}
            </span>
          </div>

          <p className="mt-2 text-base font-semibold text-slate-900">
            {item.name} {item.installedVersion}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {item.serverCount} servidor{item.serverCount === 1 ? '' : 'es'} · PRD {item.prdServers} · QAS {item.qasServers} · DEV {item.devServers}
          </p>

          {item.companies.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {item.companies.map((company) => `${company.name} (${company.serverCount})`).join(' · ')}
            </p>
          )}
        </div>

        <div className="xl:max-w-[380px] xl:text-right">
          {recommendation ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Recomendación
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-700">
                Ciclo {recommendation.cycle}
                {recommendation.latestVersion ? ` · ${recommendation.latestVersion}` : ''}
                {recommendation.isLts ? ' · LTS' : ''}
              </p>
              {recommendation.eolDate && (
                <p className="mt-1 text-xs text-slate-500">
                  Soporte hasta {new Date(`${recommendation.eolDate}T00:00:00`).toLocaleDateString('es-CL')}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              Sin recomendación automática disponible.
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

interface DashboardBarSectionProps {
  title: string;
  description: string;
  data: {
    id: number;
    name: string;
    count: number;
  }[];
  emptyText: string;

  onSelect?: (
    item: {
      id: number;
      name: string;
      count: number;
      version?: string;
    },
  ) => void;
}

function DashboardBarSection({
  title,
  description,
  data,
  emptyText,
  onSelect,
}: DashboardBarSectionProps) {
  return (
    <section className="ui-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="font-semibold tracking-tight text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {data.length ===
      0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                left: 20,
                right: 20,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                allowDecimals={false}
              />

              <YAxis
                type="category"
                dataKey="name"
                width={135}
                tick={{
                  fontSize: 12,
                }}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                fill="var(--color-primary)"
                radius={[
                  0,
                  4,
                  4,
                  0,
                ]}
                cursor={
                  onSelect
                    ? 'pointer'
                    : 'default'
                }
                onClick={(entry) => {
                  if (
                    !onSelect
                  ) {
                    return;
                  }

                  const selected =
                    entry as {
                      id?: number;
                      name?: string;
                      count?: number;
                      version?: string;
                      payload?: {
                        id?: number;
                        name?: string;
                        count?: number;
                        version?: string;
                      };
                    };

                  const item =
                    selected.payload ??
                    selected;

                  if (
                    typeof item.id ===
                      'number' &&
                    typeof item.name ===
                      'string' &&
                    typeof item.count ===
                      'number'
                  ) {
                    onSelect({
                      id:
                        item.id,
                      name:
                        item.name,
                      count:
                        item.count,

                      version:
                        item.version,
                    });
                  }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

interface ActivityRowProps {
  item:
    DashboardActivity;

  onOpen: (
    serverId: number,
  ) => void;
}

function ActivityRow({
  item,
  onOpen,
}: ActivityRowProps) {
  const content = (
    <>
      <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500">
        <Activity size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {item.entityName ?? 'Servidor'}
            </p>

            <p className="mt-0.5 text-sm text-slate-600">
              {item.message}
            </p>
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {formatDateTime(
              item.createdAt,
            )}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {item.user
            ? `${item.user.username} · ${item.user.name}`
            : 'Usuario desconocido'}

          {item.company
            ? ` · ${item.company.name}`
            : ''}
        </p>
      </div>
    </>
  );

  if (
    item.entityId ===
    null
  ) {
    return (
      <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        onOpen(
          item.entityId as number,
        )
      }
      className="-mx-2 flex w-[calc(100%+1rem)] gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-slate-50 first:pt-0 last:pb-0"
      title="Abrir servidor"
    >
      {content}
    </button>
  );
}
