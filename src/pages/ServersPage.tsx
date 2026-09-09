import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  Eye,
  FilterX,
  History,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Server as ServerIcon,
  Trash2,
} from 'lucide-react';

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import AuditHistoryModal from '../components/AuditHistoryModal';
import ExportServersModal from '../components/ExportServersModal';
import ServerFormModal from '../components/ServerFormModal';
import ServerImportModal from '../components/ServerImportModal';

import {
  getAuditHistory,
  type AuditLog,
} from '../services/audit.service';

import {
  getServerCatalogs,
  getServerSoftwareVersions,
  type ServerOperatingSystemCatalogItem,
  type ServerSoftwareCatalogItem,
} from '../services/catalogs.service';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  activateServer,
  deactivateServer,
  deleteServer,
  getServers,
  type Server,
  type ServerFilters,
  type ServerInventoryIssue,
  type ServerInventoryFreshness,
  type ServerInventoryConfidence,
  type ServerQualityIssueCount,
  type ServerSoftwareSupportStatus,
  type ServerSortBy,
  type ServerSortOrder,
} from '../services/servers.service';

import {
  getUser,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';


type EnvironmentFilter =
  | ''
  | 'PRD'
  | 'QAS'
  | 'DEV';

type ActiveFilter =
  | ''
  | 'true'
  | 'false';

type InventoryIssueFilter =
  | ''
  | ServerInventoryIssue;

type QualityIssueCountFilter =
  | ''
  | ServerQualityIssueCount;

type SoftwareSupportStatusFilter =
  | ''
  | ServerSoftwareSupportStatus;

type InventoryFreshnessFilter =
  | ''
  | ServerInventoryFreshness;

type InventoryConfidenceFilter =
  | ''
  | ServerInventoryConfidence;

type PageSize =
  | 10
  | 25
  | 50
  | 100;

interface SortHeaderProps {
  label: string;
  field: ServerSortBy;
  sortBy: ServerSortBy;
  sortOrder: ServerSortOrder;

  onSort: (
    field: ServerSortBy,
  ) => void;
}

const VALID_PAGE_SIZES:
  PageSize[] = [
    10,
    25,
    50,
    100,
  ];

const VALID_SORT_FIELDS:
  ServerSortBy[] = [
    'hostname',
    'company',
    'ipAddress',
    'environment',
    'operatingSystem',
    'cpuCores',
    'ramGb',
    'diskGb',
    'updatedAt',
  ];

function parseInventoryIssue(
  value: string | null,
): InventoryIssueFilter {
  if (
    value === 'missingIp' ||
    value === 'missingOperatingSystem' ||
    value === 'incompleteResources' ||
    value === 'missingSoftware'
  ) {
    return value;
  }

  return '';
}

function parseQualityIssueCount(
  value: string | null,
): QualityIssueCountFilter {
  if (
    value === '0' ||
    value === '1' ||
    value === '2' ||
    value === '3plus'
  ) {
    return value;
  }

  return '';
}

function parseSoftwareSupportStatus(
  value: string | null,
): SoftwareSupportStatusFilter {
  if (
    value === 'EOL' ||
    value === 'EOL_SOON'
  ) {
    return value;
  }

  return '';
}

function parseInventoryFreshness(
  value: string | null,
): InventoryFreshnessFilter {
  if (
    value === 'recent' ||
    value === 'days30to59' ||
    value === 'days60to89' ||
    value === 'days90plus'
  ) {
    return value;
  }

  return '';
}

function parseInventoryConfidence(
  value: string | null,
): InventoryConfidenceFilter {
  if (
    value === 'HIGH' ||
    value === 'MEDIUM' ||
    value === 'LOW'
  ) {
    return value;
  }

  return '';
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function parsePageSize(
  value: string | null,
): PageSize {
  const parsed =
    Number(value);

  if (
    VALID_PAGE_SIZES.includes(
      parsed as PageSize,
    )
  ) {
    return parsed as PageSize;
  }

  return 10;
}

function parseEnvironment(
  value: string | null,
): EnvironmentFilter {
  if (
    value === 'PRD' ||
    value === 'QAS' ||
    value === 'DEV'
  ) {
    return value;
  }

  return '';
}

function parseActive(
  value: string | null,
): ActiveFilter {
  if (
    value === 'true' ||
    value === 'false'
  ) {
    return value;
  }

  return '';
}

function parseSortBy(
  value: string | null,
): ServerSortBy {
  if (
    value &&
    VALID_SORT_FIELDS.includes(
      value as ServerSortBy,
    )
  ) {
    return value as ServerSortBy;
  }

  return 'hostname';
}

function parseSortOrder(
  value: string | null,
): ServerSortOrder {
  return value === 'desc'
    ? 'desc'
    : 'asc';
}

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortHeaderProps) {
  const active =
    sortBy === field;

  return (
    <button
      type="button"
      onClick={() =>
        onSort(field)
      }
      className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-company-primary"
      title={`Ordenar por ${label}`}
    >
      <span>
        {label}
      </span>

      {!active ? (
        <ArrowUpDown
          size={14}
          className="text-slate-400"
        />
      ) : sortOrder ===
        'asc' ? (
        <ArrowUp
          size={14}
          className="text-company-primary"
        />
      ) : (
        <ArrowDown
          size={14}
          className="text-company-primary"
        />
      )}
    </button>
  );
}

export default function ServersPage() {
  const toast = useToast();

  const [importOpen, setImportOpen] = useState(false);
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const currentUser =
    getUser();

  const isAdmin =
    currentUser?.role ===
    'ADMIN';

  const canEdit =
    currentUser?.role ===
      'ADMIN' ||
    currentUser?.role ===
      'EDITOR';

  const canDelete =
    currentUser?.role ===
    'ADMIN';

  const [
    servers,
    setServers,
  ] = useState<Server[]>([]);

  const [
    totalServers,
    setTotalServers,
  ] = useState(0);

  const [
    filteredCount,
    setFilteredCount,
  ] = useState(0);

  const [
    page,
    setPage,
  ] = useState(() =>
    parsePositiveInteger(
      searchParams.get(
        'page',
      ),
      1,
    ),
  );

  const [
    pageSize,
    setPageSize,
  ] = useState<PageSize>(
    () =>
      parsePageSize(
        searchParams.get(
          'pageSize',
        ),
      ),
  );

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    sortBy,
    setSortBy,
  ] = useState<ServerSortBy>(
    () =>
      parseSortBy(
        searchParams.get(
          'sortBy',
        ),
      ),
  );

  const [
    sortOrder,
    setSortOrder,
  ] = useState<ServerSortOrder>(
    () =>
      parseSortOrder(
        searchParams.get(
          'sortOrder',
        ),
      ),
  );

  const [
    companies,
    setCompanies,
  ] = useState<AccessibleCompany[]>([]);

  const canSelectCompany =
    isAdmin ||
    companies.length > 1;

  const [
    operatingSystems,
    setOperatingSystems,
  ] = useState<
    ServerOperatingSystemCatalogItem[]
  >([]);

  const [
    softwareCatalog,
    setSoftwareCatalog,
  ] = useState<
    ServerSoftwareCatalogItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    catalogsLoading,
    setCatalogsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    pendingStatusServer,
    setPendingStatusServer,
  ] = useState<Server | null>(null);

  const [
    pendingDeleteServer,
    setPendingDeleteServer,
  ] = useState<Server | null>(null);

  const [
    serverActionBusy,
    setServerActionBusy,
  ] = useState(false);


  const [
    exportOpen,
    setExportOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState(
    () =>
      searchParams.get(
        'search',
      ) ?? '',
  );

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState(
    () =>
      searchParams.get(
        'search',
      ) ?? '',
  );

  const [
    filterCompanyId,
    setFilterCompanyId,
  ] = useState(
    () =>
      searchParams.get(
        'companyId',
      ) ?? '',
  );

  const [
    filterEnvironment,
    setFilterEnvironment,
  ] = useState<
    EnvironmentFilter
  >(
    () =>
      parseEnvironment(
        searchParams.get(
          'environment',
        ),
      ),
  );

  const [
    filterOperatingSystemId,
    setFilterOperatingSystemId,
  ] = useState(
    () =>
      searchParams.get(
        'operatingSystemId',
      ) ?? '',
  );

  const [
    filterSoftwareId,
    setFilterSoftwareId,
  ] = useState(
    () =>
      searchParams.get(
        'softwareId',
      ) ?? '',
  );

  const [
    filterSoftwareVersion,
    setFilterSoftwareVersion,
  ] = useState(
    () =>
      searchParams.get(
        'softwareVersion',
      ) ?? '',
  );

  const [
    softwareVersions,
    setSoftwareVersions,
  ] = useState<string[]>([]);

  const [
    softwareVersionsLoading,
    setSoftwareVersionsLoading,
  ] = useState(false);

  const [
    filterInventoryIssue,
    setFilterInventoryIssue,
  ] = useState<
    InventoryIssueFilter
  >(
    () =>
      parseInventoryIssue(
        searchParams.get(
          'inventoryIssue',
        ),
      ),
  );

  const [
    filterQualityIssueCount,
    setFilterQualityIssueCount,
  ] = useState<
    QualityIssueCountFilter
  >(
    () =>
      parseQualityIssueCount(
        searchParams.get(
          'qualityIssueCount',
        ),
      ),
  );

  const [
    filterSoftwareSupportStatus,
    setFilterSoftwareSupportStatus,
  ] = useState<
    SoftwareSupportStatusFilter
  >(
    () =>
      parseSoftwareSupportStatus(
        searchParams.get(
          'softwareSupportStatus',
        ),
      ),
  );

  const [
    filterInventoryFreshness,
    setFilterInventoryFreshness,
  ] = useState<
    InventoryFreshnessFilter
  >(
    () =>
      parseInventoryFreshness(
        searchParams.get(
          'inventoryFreshness',
        ),
      ),
  );

  const [
    filterInventoryConfidence,
    setFilterInventoryConfidence,
  ] = useState<
    InventoryConfidenceFilter
  >(
    () =>
      parseInventoryConfidence(
        searchParams.get(
          'inventoryConfidence',
        ),
      ),
  );

  const [
    filterActive,
    setFilterActive,
  ] = useState<
    ActiveFilter
  >(
    () =>
      parseActive(
        searchParams.get(
          'active',
        ),
      ),
  );

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingServer,
    setEditingServer,
  ] = useState<
    Server | null
  >(null);


  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);

  const [
    historyTitle,
    setHistoryTitle,
  ] = useState('');

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState('');

  const [
    historyItems,
    setHistoryItems,
  ] = useState<
    AuditLog[]
  >([]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          const nextSearch =
            search.trim();

          setDebouncedSearch(
            nextSearch,
          );

          setPage(1);
        },
        350,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    search,
  ]);

  useEffect(() => {
    async function loadCatalogs() {
      try {
        setCatalogsLoading(
          true,
        );

        setError('');

        const catalogsData =
          await getServerCatalogs();

        setOperatingSystems(
          catalogsData.operatingSystems,
        );

        setSoftwareCatalog(
          catalogsData.software,
        );

        const companiesData =
          await getAccessibleCompanies();

        setCompanies(
          companiesData.filter(
            (item) =>
              item.active,
          ),
        );
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            'No fue posible cargar los catálogos.',
          );
        }
      } finally {
        setCatalogsLoading(
          false,
        );
      }
    }

    loadCatalogs();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSoftwareVersions() {
      if (
        !filterSoftwareId
      ) {
        setSoftwareVersions([]);
        setSoftwareVersionsLoading(false);
        return;
      }

      try {
        setSoftwareVersionsLoading(true);

        const response =
          await getServerSoftwareVersions({
            softwareId:
              Number(filterSoftwareId),

            companyId:
              filterCompanyId
                ? Number(
                    filterCompanyId,
                  )
                : undefined,

            environment:
              filterEnvironment ||
              undefined,
          });

        if (cancelled) {
          return;
        }

        setSoftwareVersions(
          response.versions,
        );

        setFilterSoftwareVersion(
          (current) => {
            if (!current) {
              return '';
            }

            const exists =
              response.versions.some(
                (version) =>
                  version.toLocaleLowerCase() ===
                  current.toLocaleLowerCase(),
              );

            return exists
              ? current
              : '';
          },
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSoftwareVersions([]);
        setFilterSoftwareVersion('');

        setError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar las versiones instaladas.',
        );
      } finally {
        if (!cancelled) {
          setSoftwareVersionsLoading(false);
        }
      }
    }

    loadSoftwareVersions();

    return () => {
      cancelled = true;
    };
  }, [
    filterSoftwareId,
    filterCompanyId,
    filterEnvironment,
  ]);

  useEffect(() => {
    const params =
      new URLSearchParams();

    if (
      debouncedSearch
    ) {
      params.set(
        'search',
        debouncedSearch,
      );
    }

    if (
      filterCompanyId
    ) {
      params.set(
        'companyId',
        filterCompanyId,
      );
    }

    if (
      filterEnvironment
    ) {
      params.set(
        'environment',
        filterEnvironment,
      );
    }

    if (
      filterOperatingSystemId
    ) {
      params.set(
        'operatingSystemId',
        filterOperatingSystemId,
      );
    }

    if (
      filterSoftwareId
    ) {
      params.set(
        'softwareId',
        filterSoftwareId,
      );
    }

    if (
      filterSoftwareVersion.trim()
    ) {
      params.set(
        'softwareVersion',
        filterSoftwareVersion.trim(),
      );
    }

    if (
      filterInventoryIssue
    ) {
      params.set(
        'inventoryIssue',
        filterInventoryIssue,
      );
    }

    if (
      filterQualityIssueCount
    ) {
      params.set(
        'qualityIssueCount',
        filterQualityIssueCount,
      );
    }

    if (
      filterSoftwareSupportStatus
    ) {
      params.set(
        'softwareSupportStatus',
        filterSoftwareSupportStatus,
      );
    }

    if (
      filterInventoryFreshness
    ) {
      params.set(
        'inventoryFreshness',
        filterInventoryFreshness,
      );
    }

    if (
      filterInventoryConfidence
    ) {
      params.set(
        'inventoryConfidence',
        filterInventoryConfidence,
      );
    }

    if (
      filterActive
    ) {
      params.set(
        'active',
        filterActive,
      );
    }

    if (
      page !== 1
    ) {
      params.set(
        'page',
        String(page),
      );
    }

    if (
      pageSize !== 10
    ) {
      params.set(
        'pageSize',
        String(
          pageSize,
        ),
      );
    }

    if (
      sortBy !==
      'hostname'
    ) {
      params.set(
        'sortBy',
        sortBy,
      );
    }

    if (
      sortOrder !==
      'asc'
    ) {
      params.set(
        'sortOrder',
        sortOrder,
      );
    }

    setSearchParams(
      params,
      {
        replace: true,
      },
    );
  }, [
    debouncedSearch,
    filterCompanyId,
    filterEnvironment,
    filterOperatingSystemId,
    filterSoftwareId,
    filterSoftwareVersion,
    filterInventoryIssue,
    filterQualityIssueCount,
    filterSoftwareSupportStatus,
    filterInventoryFreshness,
    filterInventoryConfidence,
    filterActive,
    page,
    pageSize,
    sortBy,
    sortOrder,
    isAdmin,
    setSearchParams,
  ]);

  async function loadServers(
    requestedPage = page,
  ) {
    try {
      setLoading(true);
      setError('');

      const response =
        await getServers({
          search:
            debouncedSearch ||
            undefined,

          companyId:
            filterCompanyId
              ? Number(
                  filterCompanyId,
                )
              : undefined,

          environment:
            filterEnvironment ||
            undefined,

          operatingSystemId:
            filterOperatingSystemId
              ? Number(
                  filterOperatingSystemId,
                )
              : undefined,

          softwareId:
            filterSoftwareId
              ? Number(
                  filterSoftwareId,
                )
              : undefined,

          softwareVersion:
            filterSoftwareVersion.trim() ||
            undefined,

          inventoryIssue:
            filterInventoryIssue ||
            undefined,

          qualityIssueCount:
            filterQualityIssueCount ||
            undefined,

          softwareSupportStatus:
            filterSoftwareSupportStatus ||
            undefined,

          inventoryFreshness:
            filterInventoryFreshness ||
            undefined,

          inventoryConfidence:
            filterInventoryConfidence ||
            undefined,

          active:
            filterActive === ''
              ? undefined
              : filterActive ===
                'true',

          page:
            requestedPage,

          pageSize,

          sortBy,

          sortOrder,
        });

      setServers(
        response.items,
      );

      setTotalServers(
        response.total,
      );

      setFilteredCount(
        response.filtered,
      );

      setTotalPages(
        response.totalPages,
      );

      if (
        response.page !==
        page
      ) {
        setPage(
          response.page,
        );
      }
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          'Ocurrió un error al cargar los servidores.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServers();
  }, [
    page,
    pageSize,
    debouncedSearch,
    filterCompanyId,
    filterEnvironment,
    filterOperatingSystemId,
    filterSoftwareId,
    filterSoftwareVersion,
    filterInventoryIssue,
    filterQualityIssueCount,
    filterSoftwareSupportStatus,
    filterInventoryFreshness,
    filterInventoryConfidence,
    filterActive,
    sortBy,
    sortOrder,
    isAdmin,
  ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    filterCompanyId !== '' ||
    filterEnvironment !== '' ||
    filterOperatingSystemId !== '' ||
    filterSoftwareId !== '' ||
    filterSoftwareVersion.trim() !== '' ||
    filterInventoryIssue !== '' ||
    filterQualityIssueCount !== '' ||
    filterSoftwareSupportStatus !== '' ||
    filterInventoryFreshness !== '' ||
    filterInventoryConfidence !== '' ||
    filterActive !== '';

  function handleSort(
    field: ServerSortBy,
  ) {
    setPage(1);

    if (
      sortBy === field
    ) {
      setSortOrder(
        (current) =>
          current === 'asc'
            ? 'desc'
            : 'asc',
      );

      return;
    }

    setSortBy(
      field,
    );

    setSortOrder(
      'asc',
    );
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setFilterCompanyId('');
    setFilterEnvironment('');
    setFilterOperatingSystemId('');
    setFilterSoftwareId('');
    setFilterSoftwareVersion('');
    setFilterInventoryIssue('');
    setFilterQualityIssueCount('');
    setFilterSoftwareSupportStatus('');
    setFilterInventoryFreshness('');
    setFilterInventoryConfidence('');
    setFilterActive('');
    setPage(1);
  }

  function openCreate() {
    if (!canEdit) {
      return;
    }

    setEditingServer(null);
    setShowForm(true);
  }

  function openEdit(
    server: Server,
  ) {
    if (!canEdit) {
      return;
    }

    setEditingServer(server);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingServer(null);
  }

  function openDetail(
    server: Server,
  ) {
    const returnTo =
      `${location.pathname}${location.search}`;

    navigate(
      `/servers/${server.id}`,
      {
        state: {
          returnTo,
        },
      },
    );
  }

  async function openHistory(
    server: Server,
  ) {
    setHistoryTitle(
      server.hostname,
    );

    setHistoryItems([]);
    setHistoryError('');
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const items =
        await getAuditHistory(
          'SERVER',
          server.id,
        );

      setHistoryItems(
        items,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setHistoryError(
          error.message,
        );
      } else {
        setHistoryError(
          'No fue posible obtener el historial.',
        );
      }
    } finally {
      setHistoryLoading(
        false,
      );
    }
  }

  function closeHistory() {
    setHistoryOpen(false);
    setHistoryTitle('');
    setHistoryItems([]);
    setHistoryError('');
  }

  function handleStatusChange(
    server: Server,
  ) {
    if (!canEdit) {
      return;
    }

    setPendingStatusServer(
      server,
    );
  }

  async function confirmStatusChange() {
    if (!pendingStatusServer) {
      return;
    }

    try {
      setServerActionBusy(true);
      setError('');

      if (pendingStatusServer.active) {
        await deactivateServer(
          pendingStatusServer.id,
        );
      } else {
        await activateServer(
          pendingStatusServer.id,
        );
      }

      const changedServer = pendingStatusServer;

      setPendingStatusServer(null);
      await loadServers();

      toast.success(
        changedServer.active
          ? 'Servidor desactivado'
          : 'Servidor activado',
        changedServer.active
          ? `${changedServer.hostname} quedó inactivo correctamente.`
          : `${changedServer.hostname} quedó activo correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible cambiar el estado',
        error instanceof Error
          ? error.message
          : 'No fue posible cambiar el estado del servidor.',
      );
    } finally {
      setServerActionBusy(false);
    }
  }

  function handleDelete(
    server: Server,
  ) {
    if (!canDelete) {
      return;
    }

    setPendingDeleteServer(
      server,
    );
  }

  async function confirmDeleteServer() {
    if (!pendingDeleteServer) {
      return;
    }

    try {
      setServerActionBusy(true);
      setError('');

      const deletedServer = pendingDeleteServer;

      await deleteServer(
        deletedServer.id,
      );

      setPendingDeleteServer(null);
      await loadServers();

      toast.success(
        'Servidor eliminado',
        `${deletedServer.hostname} fue eliminado correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible eliminar el servidor',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar el servidor.',
      );
    } finally {
      setServerActionBusy(false);
    }
  }

  function renderAuditLine(
    server: Server,
  ) {
    if (
      server.updatedBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Modificado por{' '}
          <span className="font-medium text-slate-500">
            {
              server.updatedBy
                .username
            }
          </span>
        </p>
      );
    }

    if (
      server.createdBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Creado por{' '}
          <span className="font-medium text-slate-500">
            {
              server.createdBy
                .username
            }
          </span>
        </p>
      );
    }

    return null;
  }

  const firstVisible =
    filteredCount === 0
      ? 0
      : (
          page -
          1
        ) *
          pageSize +
        1;

  const lastVisible =
    Math.min(
      page *
        pageSize,
      filteredCount,
    );

  const exportFilters:
    ServerFilters = {
      search:
        debouncedSearch ||
        undefined,

      companyId:
        filterCompanyId
          ? Number(
              filterCompanyId,
            )
          : undefined,

      environment:
        filterEnvironment ||
        undefined,

      operatingSystemId:
        filterOperatingSystemId
          ? Number(
              filterOperatingSystemId,
            )
          : undefined,

      softwareId:
        filterSoftwareId
          ? Number(
              filterSoftwareId,
            )
          : undefined,

      softwareVersion:
        filterSoftwareVersion.trim() ||
        undefined,

      inventoryIssue:
        filterInventoryIssue ||
        undefined,

      qualityIssueCount:
        filterQualityIssueCount ||
        undefined,

      softwareSupportStatus:
        filterSoftwareSupportStatus ||
        undefined,

      inventoryFreshness:
        filterInventoryFreshness ||
        undefined,

      inventoryConfidence:
        filterInventoryConfidence ||
        undefined,

      active:
        filterActive === ''
          ? undefined
          : filterActive ===
            'true',

      sortBy,

      sortOrder,
    };

  return (
    <div className="ui-page space-y-4">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_rgba(15,23,42,0.045)] sm:px-5">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-company-primary" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-company-primary sm:flex">
              <ServerIcon size={20} strokeWidth={1.9} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-[-0.025em] text-slate-950 sm:text-2xl">
                Servidores
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Administración del inventario de servidores.
              </p>
            </div>
          </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canEdit && (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="ui-btn ui-btn-secondary flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FileUp size={18} />
              Carga masiva
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setExportOpen(
                true,
              )
            }
            disabled={
              filteredCount === 0
            }
            className="ui-btn ui-btn-secondary flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download
              size={18}
            />

            Exportar
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={
                openCreate
              }
              className="ui-btn ui-btn-primary btn-company-primary flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-[0_5px_14px_rgba(15,23,42,0.12)] transition hover:-translate-y-px"
            >
              <Plus
                size={18}
              />

              Agregar servidor
            </button>
          )}
        </div>
        </div>
      </section>

      <section className="ui-panel rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Filtros de inventario</p>
            <p className="mt-0.5 text-xs text-slate-500">Refina la vista por empresa, ambiente, plataforma, calidad y estado.</p>
          </div>

          {hasActiveFilters && (
            <span className="hidden rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary sm:inline-flex">
              Filtros activos
            </span>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-10">
          <div className="relative md:col-span-2 xl:col-span-2 2xl:col-span-2">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Buscar hostname, IP, notas, empresa, SO o software..."
              className="ui-control w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            />
          </div>

          {canSelectCompany && (
            <select
              value={
                filterCompanyId
              }
              onChange={(
                event,
              ) => {
                setFilterCompanyId(
                  event.target
                    .value,
                );

                setPage(1);
              }}
              className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
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
              filterEnvironment
            }
            onChange={(
              event,
            ) => {
              setFilterEnvironment(
                event.target
                  .value as EnvironmentFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
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
              filterOperatingSystemId
            }
            onChange={(
              event,
            ) => {
              setFilterOperatingSystemId(
                event.target
                  .value,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los SO
            </option>

            {operatingSystems.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.name
                  }{' '}
                  {
                    item.version
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              filterSoftwareId
            }
            onChange={(
              event,
            ) => {
              setFilterSoftwareId(
                event.target
                  .value,
              );

              setFilterSoftwareVersion(
                '',
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todo el software
            </option>

            {softwareCatalog.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.name
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              filterSoftwareVersion
            }
            onChange={(
              event,
            ) => {
              setFilterSoftwareVersion(
                event.target.value,
              );

              setPage(1);
            }}
            disabled={
              !filterSoftwareId ||
              softwareVersionsLoading
            }
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            title="Filtrar por una versión instalada del software seleccionado"
          >
            <option value="">
              {
                !filterSoftwareId
                  ? 'Seleccione software'
                  : softwareVersionsLoading
                    ? 'Cargando versiones...'
                    : softwareVersions.length === 0
                      ? 'Sin versiones registradas'
                      : 'Todas las versiones'
              }
            </option>

            {softwareVersions.map(
              (version) => (
                <option
                  key={version}
                  value={version}
                >
                  {version}
                </option>
              ),
            )}
          </select>

          <select
            value={
              filterInventoryIssue
            }
            onChange={(
              event,
            ) => {
              setFilterInventoryIssue(
                event.target
                  .value as InventoryIssueFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            title="Filtrar por calidad del inventario"
          >
            <option value="">
              Calidad: todos
            </option>

            <option value="missingIp">
              Sin IP
            </option>

            <option value="missingOperatingSystem">
              Sin sistema operativo
            </option>

            <option value="incompleteResources">
              Recursos incompletos
            </option>

            <option value="missingSoftware">
              Sin software
            </option>
          </select>

          <select
            value={
              filterQualityIssueCount
            }
            onChange={(
              event,
            ) => {
              setFilterQualityIssueCount(
                event.target
                  .value as QualityIssueCountFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            title="Filtrar por cantidad de problemas de calidad"
          >
            <option value="">
              Cantidad de problemas
            </option>

            <option value="0">
              Inventario completo
            </option>

            <option value="1">
              1 problema
            </option>

            <option value="2">
              2 problemas
            </option>

            <option value="3plus">
              3 o más problemas
            </option>
          </select>

          <select
            value={
              filterSoftwareSupportStatus
            }
            onChange={(
              event,
            ) => {
              setFilterSoftwareSupportStatus(
                event.target
                  .value as SoftwareSupportStatusFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            title="Filtrar servidores según soporte de sus versiones de software"
          >
            <option value="">
              Soporte software
            </option>

            <option value="EOL">
              Fuera de soporte
            </option>

            <option value="EOL_SOON">
              Próximo a EOL
            </option>
          </select>

          <select
            value={
              filterInventoryFreshness
            }
            onChange={(
              event,
            ) => {
              setFilterInventoryFreshness(
                event.target
                  .value as InventoryFreshnessFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            title="Filtrar por antigüedad de la última actualización del servidor"
          >
            <option value="">
              Antigüedad inventario
            </option>

            <option value="recent">
              Actualizado &lt; 30 días
            </option>

            <option value="days30to59">
              30 a 59 días
            </option>

            <option value="days60to89">
              60 a 89 días
            </option>

            <option value="days90plus">
              90 días o más
            </option>
          </select>

          <select
            value={
              filterInventoryConfidence
            }
            onChange={(
              event,
            ) => {
              setFilterInventoryConfidence(
                event.target
                  .value as InventoryConfidenceFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
            title="Filtrar según el índice compuesto de completitud y antigüedad del inventario"
          >
            <option value="">
              Confiabilidad inventario
            </option>

            <option value="HIGH">
              Alta (85–100)
            </option>

            <option value="MEDIUM">
              Media (60–84)
            </option>

            <option value="LOW">
              Baja (&lt; 60)
            </option>
          </select>

          <select
            value={
              filterActive
            }
            onChange={(
              event,
            ) => {
              setFilterActive(
                event.target
                  .value as ActiveFilter,
              );

              setPage(1);
            }}
            className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:bg-white focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los estados
            </option>

            <option value="true">
              Activos
            </option>

            <option value="false">
              Inactivos
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Mostrando{' '}
            <span className="font-semibold text-slate-800">
              {
                filteredCount
              }
            </span>{' '}
            de{' '}
            <span className="font-semibold text-slate-800">
              {
                totalServers
              }
            </span>{' '}
            servidores
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="ui-btn ui-btn-secondary flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FilterX
                size={16}
              />

              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {catalogsLoading &&
      !servers.length ? (
        <PageLoader
          variant="table"
          rows={6}
        />
      ) : loading ? (
        <PageLoader
          variant="table"
          rows={6}
        />
      ) : servers.length ===
        0 ? (
        <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/95 px-6 py-14 text-center shadow-sm">
          <ServerIcon
            size={40}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 font-medium text-slate-700">
            No hay servidores que coincidan con los filtros.
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
              className="mt-4 text-sm font-medium text-company-primary"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="ui-panel hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_8px_24px_rgba(15,23,42,0.035)] xl:block">
            <table className="w-full min-w-[1450px]">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-left text-sm text-slate-600">
                <tr>
                  <th className="px-4 py-3">
                    <SortHeader
                      label="Hostname"
                      field="hostname"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="Empresa"
                      field="company"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="IP"
                      field="ipAddress"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="Ambiente"
                      field="environment"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="SO"
                      field="operatingSystem"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="CPU"
                      field="cpuCores"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="RAM"
                      field="ramGb"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="Disco"
                      field="diskGb"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3">
                    Software
                  </th>

                  <th className="px-4 py-3">
                    Estado
                  </th>

                  <th className="px-4 py-3">
                    <SortHeader
                      label="Última modificación"
                      field="updatedAt"
                      sortBy={
                        sortBy
                      }
                      sortOrder={
                        sortOrder
                      }
                      onSort={
                        handleSort
                      }
                    />
                  </th>

                  <th className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {servers.map(
                  (server) => (
                    <tr
                      key={
                        server.id
                      }
                      className="border-t border-slate-100 text-sm align-top transition-colors hover:bg-slate-50/65"
                    >
                      <td className="px-4 py-3">
                        <p className="font-version font-semibold text-slate-900">
                          {
                            server.hostname
                          }
                        </p>

                        {renderAuditLine(
                          server,
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={15}
                            className="text-slate-400"
                          />

                          <span>
                            {server.company
                              ?.name ??
                              'Sin empresa'}
                          </span>
                        </div>
                      </td>

                      <td className="font-version px-4 py-3 text-slate-600">
                        {server.ipAddress ??
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.environment ??
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.operatingSystem
                          ? `${server.operatingSystem.name} ${server.operatingSystem.version}`
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.cpuCores ??
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.ramGb !==
                        null
                          ? `${server.ramGb} GB`
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.diskGb !==
                        null
                          ? `${server.diskGb} GB`
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {server.software
                          .length ===
                        0 ? (
                          '-'
                        ) : (
                          <div className="space-y-1">
                            {server.software.map(
                              (
                                item,
                              ) => (
                                <div
                                  key={
                                    item.id
                                  }
                                >
                                  <span className="font-medium text-slate-700">
                                    {
                                      item
                                        .software
                                        .name
                                    }
                                  </span>{' '}
                                  {
                                    item.version
                                  }
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            server.active
                              ? 'rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
                              : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500'
                          }
                        >
                          {server.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <p>
                          {formatDateTime(
                            server.updatedAt,
                          )}
                        </p>

                        {server.updatedBy && (
                          <p className="mt-1 text-xs text-slate-400">
                            por{' '}
                            <span className="font-medium">
                              {
                                server
                                  .updatedBy
                                  .username
                              }
                            </span>
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openDetail(
                                server,
                              )
                            }
                            title="Ver detalle"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-company-primary"
                          >
                            <Eye
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openHistory(
                                server,
                              )
                            }
                            title="Historial"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-company-primary"
                          >
                            <History
                              size={17}
                            />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(
                                  server,
                                )
                              }
                              title={
                                server.active
                                  ? 'Desactivar servidor'
                                  : 'Activar servidor'
                              }
                              className={
                                server.active
                                  ? 'rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                                  : 'rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-700'
                              }
                            >
                              {server.active ? (
                                <PowerOff size={17} />
                              ) : (
                                <Power size={17} />
                              )}
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  server,
                                )
                              }
                              title="Editar servidor"
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-company-primary"
                            >
                              <Pencil
                                size={17}
                              />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  server,
                                )
                              }
                              title="Eliminar servidor"
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2
                                size={17}
                              />
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

          <div className="space-y-3 xl:hidden">
            {servers.map(
              (server) => (
                <div
                  key={
                    server.id
                  }
                  className="ui-panel rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_8px_20px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-version font-semibold text-slate-900">
                        {
                          server.hostname
                        }
                      </h2>

                      {renderAuditLine(
                        server,
                      )}

                      <p className="font-version mt-2 text-sm text-slate-500">
                        {server.ipAddress ??
                          'Sin IP'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {server.environment ??
                          'N/A'}
                      </span>

                      <span
                        className={
                          server.active
                            ? 'rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
                            : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500'
                        }
                      >
                        {server.active
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-400">
                      Empresa
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {server.company
                        ?.name ??
                        'Sin empresa'}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-slate-400">
                      Sistema Operativo
                    </p>

                    <p className="text-sm text-slate-700">
                      {server.operatingSystem
                        ? `${server.operatingSystem.name} ${server.operatingSystem.version}`
                        : '-'}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">
                        CPU
                      </p>

                      <p>
                        {server.cpuCores ??
                          '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        RAM
                      </p>

                      <p>
                        {server.ramGb !==
                        null
                          ? `${server.ramGb} GB`
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Disco
                      </p>

                      <p>
                        {server.diskGb !==
                        null
                          ? `${server.diskGb} GB`
                          : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-slate-400">
                      Última modificación
                    </p>

                    <p className="text-sm text-slate-700">
                      {formatDateTime(
                        server.updatedAt,
                      )}
                    </p>
                  </div>

                  {server.software
                    .length >
                    0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs text-slate-400">
                        Software
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {server.software.map(
                          (
                            item,
                          ) => (
                            <span
                              key={
                                item.id
                              }
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                            >
                              {
                                item
                                  .software
                                  .name
                              }{' '}
                              {
                                item.version
                              }
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        openDetail(
                          server,
                        )
                      }
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-company-primary"
                    >
                      <Eye
                        size={16}
                      />

                      Ver detalle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openHistory(
                          server,
                        )
                      }
                      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600"
                    >
                      <History
                        size={16}
                      />

                      Historial
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(
                            server,
                          )
                        }
                        className={
                          server.active
                            ? 'flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-amber-700'
                            : 'flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-green-700'
                        }
                      >
                        {server.active ? (
                          <PowerOff size={16} />
                        ) : (
                          <Power size={16} />
                        )}

                        {server.active
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    )}

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            server,
                          )
                        }
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-company-primary"
                      >
                        <Pencil
                          size={16}
                        />

                        Editar
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            server,
                          )
                        }
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600"
                      >
                        <Trash2
                          size={16}
                        />

                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="ui-panel mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.035),0_8px_20px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-500">
                Mostrando{' '}
                <span className="font-semibold text-slate-800">
                  {
                    firstVisible
                  }
                </span>
                {' – '}
                <span className="font-semibold text-slate-800">
                  {
                    lastVisible
                  }
                </span>
                {' de '}
                <span className="font-semibold text-slate-800">
                  {
                    filteredCount
                  }
                </span>
              </p>

              <select
                value={
                  pageSize
                }
                onChange={(
                  event,
                ) => {
                  setPageSize(
                    Number(
                      event.target
                        .value,
                    ) as PageSize,
                  );

                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-company-primary"
              >
                <option value="10">
                  10 por página
                </option>

                <option value="25">
                  25 por página
                </option>

                <option value="50">
                  50 por página
                </option>

                <option value="100">
                  100 por página
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current -
                          1,
                      ),
                  )
                }
                className="ui-btn ui-btn-secondary flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={17}
                />

                Anterior
              </button>

              <span className="text-sm text-slate-600">
                Página{' '}
                <span className="font-semibold text-slate-900">
                  {
                    page
                  }
                </span>
                {' de '}
                <span className="font-semibold text-slate-900">
                  {
                    totalPages
                  }
                </span>
              </span>

              <button
                type="button"
                disabled={
                  page >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        totalPages,
                        current +
                          1,
                      ),
                  )
                }
                className="ui-btn ui-btn-secondary flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente

                <ChevronRight
                  size={17}
                />
              </button>
            </div>
          </div>
        </>
      )}

      <ServerFormModal
        open={
          showForm &&
          canEdit
        }
        server={
          editingServer
        }
        onClose={
          closeForm
        }
        onSaved={async () => {
          const wasEditing =
            Boolean(editingServer);
          const serverName =
            editingServer?.hostname;

          closeForm();
          await loadServers();

          toast.success(
            wasEditing
              ? 'Servidor actualizado'
              : 'Servidor creado',
            wasEditing && serverName
              ? `${serverName} fue actualizado correctamente.`
              : 'El servidor fue registrado correctamente.',
          );
        }}
      />

      <ServerImportModal
        open={importOpen && canEdit}
        onClose={() => setImportOpen(false)}
        onImported={async () => {
          await loadServers();
          toast.success(
            'Importación completada',
            'El inventario de servidores fue actualizado.',
          );
        }}
      />

      <ExportServersModal
        open={
          exportOpen
        }
        filters={
          exportFilters
        }
        totalCount={
          filteredCount
        }
        onClose={() =>
          setExportOpen(
            false,
          )
        }
      />


      <ConfirmDialog
        open={
          pendingStatusServer !== null
        }
        eyebrow="Inventario técnico"
        title={
          pendingStatusServer?.active
            ? 'Desactivar servidor'
            : 'Activar servidor'
        }
        description={
          pendingStatusServer?.active
            ? pendingStatusServer.ipAddress
              ? `La IP ${pendingStatusServer.ipAddress} quedará liberada. El servidor y su historial permanecerán registrados.`
              : 'El servidor quedará inactivo y conservará su historial.'
            : pendingStatusServer?.ipAddress
              ? 'El servidor volverá a estar disponible en el inventario activo.'
              : 'El servidor quedará activo sin una IP hasta que se le asigne una.'
        }
        detail={
          pendingStatusServer ? (
            <div className="space-y-1">
              <p className="font-hostname font-semibold text-slate-900">
                {pendingStatusServer.hostname}
              </p>
              <p className="text-xs text-slate-500">
                {pendingStatusServer.company?.name ?? 'Sin empresa'} · {pendingStatusServer.environment ?? 'Sin ambiente'}
              </p>
            </div>
          ) : null
        }
        tone={
          pendingStatusServer?.active
            ? 'warning'
            : 'info'
        }
        confirmLabel={
          pendingStatusServer?.active
            ? 'Desactivar'
            : 'Activar'
        }
        busy={serverActionBusy}
        onClose={() =>
          setPendingStatusServer(null)
        }
        onConfirm={
          confirmStatusChange
        }
      />

      <ConfirmDialog
        open={
          pendingDeleteServer !== null
        }
        eyebrow="Acción irreversible"
        title="Eliminar servidor"
        description="El servidor se eliminará del inventario. Esta acción no se puede deshacer desde esta pantalla."
        detail={
          pendingDeleteServer ? (
            <div className="space-y-1">
              <p className="font-hostname font-semibold text-slate-900">
                {pendingDeleteServer.hostname}
              </p>
              <p className="text-xs text-slate-500">
                {pendingDeleteServer.company?.name ?? 'Sin empresa'} · {pendingDeleteServer.ipAddress ?? 'Sin IP'}
              </p>
            </div>
          ) : null
        }
        tone="danger"
        confirmLabel="Eliminar servidor"
        busy={serverActionBusy}
        onClose={() =>
          setPendingDeleteServer(null)
        }
        onConfirm={
          confirmDeleteServer
        }
      />

      <AuditHistoryModal
        open={
          historyOpen
        }
        title={
          historyTitle
        }
        loading={
          historyLoading
        }
        error={
          historyError
        }
        items={
          historyItems
        }
        onClose={
          closeHistory
        }
      />
    </div>
  );
}