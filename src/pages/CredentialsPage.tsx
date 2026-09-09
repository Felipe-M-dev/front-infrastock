import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  CalendarClock,
  Copy,
  KeyRound,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  X,
} from 'lucide-react';

import CredentialUsageModal from '../components/CredentialUsageModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  copyCredentialPassword,
  createCredential,
  deactivateCredential,
  getCredentialUsage,
  getCredentials,
  updateCredential,
  type Credential,
  type CredentialAccountType,
  type CredentialCategory,
  type CredentialFilters,
  type CredentialLifecycleStatus,
  type CredentialScope,
} from '../services/credentials.service';

import {
  getUser,
} from '../services/session.service';

const CATEGORY_OPTIONS: Array<{
  value: CredentialCategory;
  label: string;
}> = [
  { value: 'OPERATING_SYSTEM', label: 'Sistema operativo' },
  { value: 'DATABASE', label: 'Base de datos' },
  { value: 'MIDDLEWARE', label: 'Middleware' },
  { value: 'APPLICATION', label: 'Aplicación' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'OTHER', label: 'Otro' },
];

const ACCOUNT_TYPE_OPTIONS: Array<{
  value: CredentialAccountType;
  label: string;
}> = [
  { value: 'ADMINISTRATOR', label: 'Administrador' },
  { value: 'OPERATION', label: 'Operación' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'APPLICATION', label: 'Aplicación' },
  { value: 'READ_ONLY', label: 'Solo lectura' },
  { value: 'DATABASE', label: 'Base de datos' },
  { value: 'INTEGRATION', label: 'Integración' },
  { value: 'OTHER', label: 'Otro' },
];

const SCOPE_OPTIONS: Array<{
  value: CredentialScope;
  label: string;
}> = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'SERVER', label: 'Servidor' },
  { value: 'SOFTWARE', label: 'Software' },
];

const LIFECYCLE_OPTIONS: Array<{
  value: CredentialLifecycleStatus;
  label: string;
}> = [
  { value: 'VALID', label: 'Vigente' },
  { value: 'EXPIRING_SOON', label: 'Próxima a vencer' },
  { value: 'EXPIRED', label: 'Vencida' },
  { value: 'ROTATION_REQUIRED', label: 'Rotación requerida' },
  { value: 'WITHOUT_POLICY', label: 'Sin política' },
];

const ENVIRONMENT_OPTIONS = [
  'PRD',
  'QAS',
  'DEV',
];

interface CredentialForm {
  name: string;
  username: string;
  password: string;
  companyId: string;
  environment: string;
  category: CredentialCategory;
  accountType: CredentialAccountType;
  scope: CredentialScope;
  description: string;
  active: boolean;
  expiresAt: string;
  rotationDays: string;
  rotationRequired: boolean;
}

const EMPTY_FORM: CredentialForm = {
  name: '',
  username: '',
  password: '',
  companyId: '',
  environment: '',
  category: 'OPERATING_SYSTEM',
  accountType: 'OPERATION',
  scope: 'COMPANY',
  description: '',
  active: true,
  expiresAt: '',
  rotationDays: '',
  rotationRequired: false,
};

function optionLabel<T extends string>(
  options: Array<{
    value: T;
    label: string;
  }>,
  value: T,
) {
  return (
    options.find(
      (item) =>
        item.value === value,
    )?.label ??
    value
  );
}

function lifecycleLabel(
  value: CredentialLifecycleStatus,
) {
  return optionLabel(
    LIFECYCLE_OPTIONS,
    value,
  );
}

function lifecycleClass(
  value: CredentialLifecycleStatus,
) {
  switch (value) {
    case 'VALID':
      return 'bg-emerald-100 text-emerald-700';

    case 'EXPIRING_SOON':
      return 'bg-amber-100 text-amber-800';

    case 'EXPIRED':
      return 'bg-red-100 text-red-700';

    case 'ROTATION_REQUIRED':
      return 'bg-orange-100 text-orange-700';

    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return 'No definida';
  }

  return new Intl.DateTimeFormat(
    'es-CL',
    {
      dateStyle: 'medium',
    },
  ).format(
    new Date(value),
  );
}

function toDateInput(
  value: string | null,
) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function Badge({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        muted
          ? 'bg-slate-100 text-slate-600'
          : 'bg-company-primary/10 text-company-primary',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default function CredentialsPage() {
  const toast = useToast();

  const user = getUser();

  const isAdmin =
    user?.role === 'ADMIN';

  const [
    credentials,
    setCredentials,
  ] = useState<Credential[]>([]);

  const [
    companies,
    setCompanies,
  ] = useState<AccessibleCompany[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<CredentialFilters>({
    search: '',
    companyId: '',
    environment: '',
    category: '',
    accountType: '',
    scope: '',
    active: true,
    lifecycleStatus: '',
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);


  const [
    copyingId,
    setCopyingId,
  ] = useState<number | null>(null);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingCredential,
    setEditingCredential,
  ] = useState<Credential | null>(null);

  const [
    usageCredential,
    setUsageCredential,
  ] = useState<Credential | null>(null);

  const [
    form,
    setForm,
  ] = useState<CredentialForm>(
    EMPTY_FORM,
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deactivatePreview,
    setDeactivatePreview,
  ] = useState<{
    credential: Credential;
    totalAssignments: number;
    serverAssignments: number;
    softwareAssignments: number;
  } | null>(null);

  const [
    deactivateBusy,
    setDeactivateBusy,
  ] = useState(false);

  const clearMessages =
    useCallback(() => {
      setError(null);
    }, []);

  const loadCompanies =
    useCallback(async () => {
      try {
        const data =
          await getAccessibleCompanies();

        setCompanies(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible obtener las empresas.',
        );
      }
    }, []);

  const loadCredentials =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getCredentials(filters);

        setCredentials(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible obtener las credenciales.',
        );
      } finally {
        setLoading(false);
      }
    }, [filters]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          void loadCredentials();
        },
        250,
      );

    return () =>
      window.clearTimeout(timeout);
  }, [loadCredentials]);

  const stats =
    useMemo(() => {
      const count = (
        status: CredentialLifecycleStatus,
      ) =>
        credentials.filter(
          (credential) =>
            credential.lifecycleStatus ===
            status,
        ).length;

      return {
        total:
          credentials.length,
        valid:
          count('VALID'),
        expiring:
          count('EXPIRING_SOON'),
        attention:
          count('EXPIRED') +
          count('ROTATION_REQUIRED'),
        withoutPolicy:
          count('WITHOUT_POLICY'),
      };
    }, [credentials]);

  const openCreateModal = () => {
    clearMessages();

    setEditingCredential(null);

    setForm({
      ...EMPTY_FORM,
      companyId:
        user?.company?.id
          ? String(user.company.id)
          : '',
    });

    setModalOpen(true);
  };

  const openEditModal = (
    credential: Credential,
  ) => {
    clearMessages();

    setEditingCredential(
      credential,
    );

    setForm({
      name:
        credential.name,
      username:
        credential.username,
      password: '',
      companyId:
        credential.companyId
          ? String(
              credential.companyId,
            )
          : '',
      environment:
        credential.environment ?? '',
      category:
        credential.category,
      accountType:
        credential.accountType,
      scope:
        credential.scope,
      description:
        credential.description ?? '',
      active:
        credential.active,
      expiresAt:
        toDateInput(
          credential.expiresAt,
        ),
      rotationDays:
        credential.rotationDays
          ? String(
              credential.rotationDays,
            )
          : '',
      rotationRequired:
        credential.rotationRequired,
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCredential(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      return;
    }

    clearMessages();

    if (
      !form.name.trim() ||
      !form.username.trim()
    ) {
      setError(
        'Nombre y usuario son obligatorios.',
      );
      return;
    }

    if (
      !editingCredential &&
      !form.password
    ) {
      setError(
        'La contraseña es obligatoria al crear una credencial.',
      );
      return;
    }

    if (
      form.scope !== 'GLOBAL' &&
      !form.companyId
    ) {
      setError(
        'Debes seleccionar una empresa para este alcance.',
      );
      return;
    }

    const rotationDays =
      form.rotationDays
        ? Number(form.rotationDays)
        : null;

    if (
      rotationDays !== null &&
      (
        !Number.isInteger(
          rotationDays,
        ) ||
        rotationDays < 1 ||
        rotationDays > 3650
      )
    ) {
      setError(
        'Los días de rotación deben estar entre 1 y 3650.',
      );
      return;
    }

    setSaving(true);

    try {
      const commonPayload = {
        name:
          form.name.trim(),
        username:
          form.username.trim(),
        category:
          form.category,
        accountType:
          form.accountType,
        environment:
          form.environment.trim() ||
          undefined,
        scope:
          form.scope,
        description:
          form.description.trim() ||
          undefined,
        companyId:
          form.scope === 'GLOBAL'
            ? undefined
            : Number(
                form.companyId,
              ),
        active:
          form.active,
        expiresAt:
          form.expiresAt
            ? `${form.expiresAt}T23:59:59Z`
            : null,
        rotationDays,
        rotationRequired:
          form.rotationRequired,
      };

      if (editingCredential) {
        await updateCredential(
          editingCredential.id,
          {
            ...commonPayload,
            ...(form.password
              ? {
                  password:
                    form.password,
                }
              : {}),
          },
        );

        toast.success(
          'Credencial actualizada',
          form.password
            ? 'La credencial fue modificada y la rotación quedó registrada.'
            : 'La credencial fue modificada correctamente.',
        );
      } else {
        await createCredential({
          ...commonPayload,
          password:
            form.password,
        });

        toast.success(
          'Credencial creada',
          'La credencial fue registrada correctamente.',
        );
      }

      setModalOpen(false);
      setEditingCredential(null);
      setForm(EMPTY_FORM);

      await loadCredentials();
    } catch (saveError) {
      toast.error(
        'No fue posible guardar la credencial',
        saveError instanceof Error
          ? saveError.message
          : 'Ocurrió un error al guardar la credencial.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (
    credential: Credential,
  ) => {
    clearMessages();
    setCopyingId(credential.id);

    try {
      await copyCredentialPassword(
        credential.id,
      );

      toast.success(
        'Contraseña copiada',
        `La contraseña de ${credential.username} quedó en el portapapeles.`,
      );
    } catch (copyError) {
      toast.error(
        'No fue posible copiar la contraseña',
        copyError instanceof Error
          ? copyError.message
          : 'Ocurrió un error al copiar la contraseña.',
      );
    } finally {
      setCopyingId(null);
    }
  };

  const handleDeactivate = async (
    credential: Credential,
  ) => {
    if (
      !isAdmin ||
      !credential.active
    ) {
      return;
    }

    clearMessages();

    try {
      const usage =
        await getCredentialUsage(
          credential.id,
        );

      setDeactivatePreview({
        credential,
        totalAssignments:
          usage.summary.totalAssignments,
        serverAssignments:
          usage.summary.serverAssignments,
        softwareAssignments:
          usage.summary.softwareAssignments,
      });
    } catch (deactivateError) {
      toast.error(
        'No fue posible revisar la credencial',
        deactivateError instanceof Error
          ? deactivateError.message
          : 'No fue posible obtener el uso de la credencial.',
      );
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivatePreview) {
      return;
    }

    try {
      setDeactivateBusy(true);
      clearMessages();

      await deactivateCredential(
        deactivatePreview.credential.id,
      );

      const credentialName =
        deactivatePreview.credential.name;

      setDeactivatePreview(null);
      await loadCredentials();

      toast.success(
        'Credencial desactivada',
        `${credentialName} fue desactivada correctamente.`,
      );
    } catch (deactivateError) {
      toast.error(
        'No fue posible desactivar la credencial',
        deactivateError instanceof Error
          ? deactivateError.message
          : 'Ocurrió un error al desactivar la credencial.',
      );
    } finally {
      setDeactivateBusy(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      companyId: '',
      environment: '',
      category: '',
      accountType: '',
      scope: '',
      active: true,
      lifecycleStatus: '',
    });
  };

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <KeyRound size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Accesos protegidos
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-company-default sm:text-3xl">
                Bóveda de Credenciales
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Accesos centralizados con control de vencimiento, rotación y mapa de uso.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              <Plus size={18} />
              Nueva credencial
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}


      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Visibles
          </p>
          <p className="mt-2 text-2xl font-bold text-company-default">
            {stats.total}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Vigentes
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {stats.valid}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Próximas a vencer
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {stats.expiring}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-red-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            Requieren atención
          </p>
          <p className="mt-2 text-2xl font-bold text-red-800">
            {stats.attention}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sin política
          </p>
          <p className="mt-2 text-2xl font-bold text-company-default">
            {stats.withoutPolicy}
          </p>
        </div>
      </section>

      <section className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={filters.search ?? ''}
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    search:
                      event.target.value,
                  }),
                )
              }
              className="ui-control w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              placeholder="Buscar por nombre o usuario"
            />
          </label>

          <select
            value={filters.companyId ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  companyId:
                    event.target.value
                      ? Number(
                          event.target.value,
                        )
                      : '',
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todas las empresas
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

          <select
            value={filters.lifecycleStatus ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  lifecycleStatus:
                    event.target.value as
                      CredentialLifecycleStatus
                      | '',
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los estados de vigencia
            </option>

            {LIFECYCLE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.environment ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  environment:
                    event.target.value,
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los ambientes
            </option>

            {ENVIRONMENT_OPTIONS.map(
              (environment) => (
                <option
                  key={environment}
                  value={environment}
                >
                  {environment}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.category ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  category:
                    event.target.value as
                      CredentialCategory
                      | '',
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todas las categorías
            </option>

            {CATEGORY_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.accountType ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  accountType:
                    event.target.value as
                      CredentialAccountType
                      | '',
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los tipos
            </option>

            {ACCOUNT_TYPE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.scope ?? ''}
            onChange={(event) =>
              setFilters(
                (current) => ({
                  ...current,
                  scope:
                    event.target.value as
                      CredentialScope
                      | '',
                }),
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
          >
            <option value="">
              Todos los alcances
            </option>

            {SCOPE_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <div className="flex gap-2">
            <select
              value={
                filters.active === ''
                  ? ''
                  : String(
                      filters.active,
                    )
              }
              onChange={(event) =>
                setFilters(
                  (current) => ({
                    ...current,
                    active:
                      event.target.value === ''
                        ? ''
                        : event.target.value ===
                          'true',
                  }),
                )
              }
              className="ui-control min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
            >
              <option value="">
                Activas e inactivas
              </option>
              <option value="true">
                Activas
              </option>
              <option value="false">
                Inactivas
              </option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 text-slate-600 transition hover:bg-slate-50"
              title="Restablecer filtros"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        {loading ? (
          <div className="p-4 sm:p-5">
            <PageLoader
              variant="table"
              rows={7}
            />
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound
              size={36}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-medium text-company-default">
              No hay credenciales para los filtros seleccionados.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">
                      Credencial
                    </th>
                    <th className="px-4 py-3">
                      Empresa / ambiente
                    </th>
                    <th className="px-4 py-3">
                      Clasificación
                    </th>
                    <th className="px-4 py-3">
                      Vigencia / rotación
                    </th>
                    <th className="px-4 py-3">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {credentials.map(
                    (credential) => (
                      <tr
                        key={credential.id}
                        className="align-top transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-company-default">
                            {credential.name}
                          </p>

                          <p className="font-tech mt-1 text-sm text-slate-600">
                            {credential.username}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge>
                              {optionLabel(
                                CATEGORY_OPTIONS,
                                credential.category,
                              )}
                            </Badge>

                            <Badge muted>
                              {optionLabel(
                                ACCOUNT_TYPE_OPTIONS,
                                credential.accountType,
                              )}
                            </Badge>

                            <Badge muted>
                              {optionLabel(
                                SCOPE_OPTIONS,
                                credential.scope,
                              )}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          <p>
                            {credential.company?.name ?? 'Global'}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {credential.environment ?? 'Todos los ambientes'}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          <p>
                            Vence: {formatDate(credential.expiresAt)}
                          </p>

                          <p className="mt-1">
                            Rotación:{' '}
                            {credential.rotationDays
                              ? `cada ${credential.rotationDays} días`
                              : 'sin política'}
                          </p>

                          {credential.nextRotationAt && (
                            <p className="mt-1 text-xs text-slate-400">
                              Próxima: {formatDate(credential.nextRotationAt)}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                              lifecycleClass(
                                credential.lifecycleStatus,
                              ),
                            ].join(' ')}
                          >
                            {lifecycleLabel(
                              credential.lifecycleStatus,
                            )}
                          </span>

                          <p className="mt-2 text-xs text-slate-400">
                            {credential.active
                              ? 'Activa'
                              : 'Inactiva'}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                              credential.active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500',
                            ].join(' ')}
                          >
                            {credential.active
                              ? 'Habilitada'
                              : 'Deshabilitada'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setUsageCredential(
                                  credential,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Link2 size={16} />
                              Uso
                            </button>

                            <button
                              type="button"
                              disabled={
                                !credential.active ||
                                copyingId ===
                                  credential.id
                              }
                              onClick={() =>
                                void handleCopy(
                                  credential,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Copy size={16} />
                              {copyingId === credential.id
                                ? 'Copiando...'
                                : 'Copiar'}
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      credential,
                                    )
                                  }
                                  className="inline-flex items-center rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                                  title="Editar credencial"
                                >
                                  <Pencil size={17} />
                                </button>

                                {credential.active && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleDeactivate(
                                        credential,
                                      )
                                    }
                                    className="inline-flex items-center rounded-xl border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50"
                                    title="Desactivar credencial"
                                  >
                                    <X size={17} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {credentials.map(
                (credential) => (
                  <article
                    key={credential.id}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-company-default">
                          {credential.name}
                        </h2>

                        <p className="font-tech mt-1 break-all text-sm text-slate-600">
                          {credential.username}
                        </p>
                      </div>

                      <span
                        className={[
                          'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                          lifecycleClass(
                            credential.lifecycleStatus,
                          ),
                        ].join(' ')}
                      >
                        {lifecycleLabel(
                          credential.lifecycleStatus,
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge>
                        {optionLabel(
                          CATEGORY_OPTIONS,
                          credential.category,
                        )}
                      </Badge>

                      <Badge muted>
                        {optionLabel(
                          ACCOUNT_TYPE_OPTIONS,
                          credential.accountType,
                        )}
                      </Badge>

                      <Badge muted>
                        {optionLabel(
                          SCOPE_OPTIONS,
                          credential.scope,
                        )}
                      </Badge>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-400">
                          Empresa / ambiente
                        </p>
                        <p className="mt-1 text-slate-700">
                          {credential.company?.name ?? 'Global'} ·{' '}
                          {credential.environment ?? 'Todos'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Vencimiento
                        </p>
                        <p className="mt-1 text-slate-700">
                          {formatDate(
                            credential.expiresAt,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Política de rotación
                        </p>
                        <p className="mt-1 text-slate-700">
                          {credential.rotationDays
                            ? `Cada ${credential.rotationDays} días`
                            : 'Sin política'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Última rotación
                        </p>
                        <p className="mt-1 text-slate-700">
                          {formatDate(
                            credential.lastRotatedAt,
                          )}
                        </p>
                      </div>
                    </div>

                    {credential.description && (
                      <p className="text-sm text-slate-500">
                        {credential.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setUsageCredential(
                            credential,
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        <Link2 size={16} />
                        Uso
                      </button>

                      <button
                        type="button"
                        disabled={
                          !credential.active ||
                          copyingId ===
                            credential.id
                        }
                        onClick={() =>
                          void handleCopy(
                            credential,
                          )
                        }
                        className="ui-control inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                      >
                        <Copy size={16} />
                        {copyingId === credential.id
                          ? 'Copiando...'
                          : 'Copiar contraseña'}
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                credential,
                              )
                            }
                            className="inline-flex items-center justify-center rounded-xl border border-slate-300 p-2 text-slate-600"
                            title="Editar credencial"
                          >
                            <Pencil size={17} />
                          </button>

                          {credential.active && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeactivate(
                                  credential,
                                )
                              }
                              className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2 text-red-600"
                              title="Desactivar credencial"
                            >
                              <X size={17} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </section>

      {modalOpen && isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={closeModal}
          />

          <div className="ui-table-shell ui-panel relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[92vh]">
            <div className="h-1 shrink-0 bg-company-primary" />
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-company-default">
                  {editingCredential
                    ? 'Editar credencial'
                    : 'Nueva credencial'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  La contraseña nunca se mostrará nuevamente en la interfaz.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Nombre *
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          name:
                            event.target.value,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    placeholder="Ej: Acceso Linux PRD"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Usuario *
                  </span>
                  <input
                    required
                    autoComplete="off"
                    value={form.username}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          username:
                            event.target.value,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    placeholder="egtadmin"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Contraseña
                    {!editingCredential
                      ? ' *'
                      : ''}
                  </span>
                  <input
                    type="password"
                    required={
                      !editingCredential
                    }
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          password:
                            event.target.value,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    placeholder={
                      editingCredential
                        ? 'Dejar vacío para conservar la actual'
                        : 'Ingresa la contraseña'
                    }
                  />

                  {editingCredential && (
                    <p className="text-xs text-slate-400">
                      Al ingresar una nueva contraseña se actualizará automáticamente la última rotación y se quitará la marca de rotación requerida.
                    </p>
                  )}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Categoría *
                  </span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          category:
                            event.target.value as
                              CredentialCategory,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    {CATEGORY_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Tipo de cuenta *
                  </span>
                  <select
                    value={form.accountType}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          accountType:
                            event.target.value as
                              CredentialAccountType,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    {ACCOUNT_TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Alcance *
                  </span>
                  <select
                    value={form.scope}
                    onChange={(event) => {
                      const scope =
                        event.target.value as
                          CredentialScope;

                      setForm(
                        (current) => ({
                          ...current,
                          scope,
                          companyId:
                            scope === 'GLOBAL'
                              ? ''
                              : current.companyId,
                        }),
                      );
                    }}
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    {SCOPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Empresa
                    {form.scope !== 'GLOBAL'
                      ? ' *'
                      : ''}
                  </span>
                  <select
                    disabled={
                      form.scope === 'GLOBAL'
                    }
                    value={form.companyId}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          companyId:
                            event.target.value,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">
                      {form.scope === 'GLOBAL'
                        ? 'No aplica'
                        : 'Seleccionar empresa'}
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
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Ambiente
                  </span>
                  <select
                    value={form.environment}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          environment:
                            event.target.value,
                        }),
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    <option value="">
                      Todos / no aplica
                    </option>

                    {ENVIRONMENT_OPTIONS.map(
                      (environment) => (
                        <option
                          key={environment}
                          value={environment}
                        >
                          {environment}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock
                    size={18}
                    className="text-company-primary"
                  />
                  <h3 className="font-semibold text-company-default">
                    Vencimiento y rotación
                  </h3>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Fecha de vencimiento
                    </span>
                    <input
                      type="date"
                      value={form.expiresAt}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            expiresAt:
                              event.target.value,
                          }),
                        )
                      }
                      className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">
                      Rotar cada N días
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={form.rotationDays}
                      onChange={(event) =>
                        setForm(
                          (current) => ({
                            ...current,
                            rotationDays:
                              event.target.value,
                          }),
                        )
                      }
                      className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                      placeholder="Ej: 90"
                    />
                  </label>
                </div>

                {editingCredential && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400">
                        Última rotación
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(
                          editingCredential.lastRotatedAt,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-400">
                        Próxima rotación
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {formatDate(
                          editingCredential.nextRotationAt,
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <input
                    type="checkbox"
                    checked={
                      form.rotationRequired
                    }
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          rotationRequired:
                            event.target.checked,
                        }),
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-company-primary focus:ring-company-primary"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-amber-900">
                      Marcar rotación requerida
                    </span>
                    <span className="mt-1 block text-xs text-amber-700">
                      Útil cuando una contraseña debe cambiarse inmediatamente aunque su fecha o periodicidad aún no se cumplan.
                    </span>
                  </span>
                </label>
              </section>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">
                  Descripción
                </span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  className="ui-control w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  placeholder="Uso previsto de la credencial"
                />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        active:
                          event.target.checked,
                      }),
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-company-primary focus:ring-company-primary"
                />
                <span className="text-sm font-medium text-slate-700">
                  Credencial activa
                </span>
              </label>

              {editingCredential && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <ShieldCheck
                      size={18}
                      className="text-company-primary"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-company-default">
                        Estado actual: {lifecycleLabel(
                          editingCredential.lifecycleStatus,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        El estado se recalcula automáticamente en el backend.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {editingCredential &&
                  form.password ? (
                    <TimerReset size={17} />
                  ) : (
                    <ShieldCheck size={17} />
                  )}

                  {saving
                    ? 'Guardando...'
                    : editingCredential
                      ? 'Guardar cambios'
                      : 'Crear credencial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmDialog
        open={
          deactivatePreview !== null
        }
        eyebrow="Bóveda de credenciales"
        title="Desactivar credencial"
        description="La credencial quedará inactiva, pero no se eliminarán sus asociaciones ni su historial de uso."
        detail={
          deactivatePreview ? (
            <div className="space-y-2">
              <div>
                <p className="font-semibold text-slate-900">
                  {deactivatePreview.credential.name}
                </p>
                <p className="font-tech text-xs text-slate-500">
                  {deactivatePreview.credential.username}
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                {deactivatePreview.totalAssignments > 0
                  ? `${deactivatePreview.totalAssignments} asociaciones activas: ${deactivatePreview.serverAssignments} servidor(es) y ${deactivatePreview.softwareAssignments} software(s).`
                  : 'Actualmente no tiene asociaciones.'}
              </p>
            </div>
          ) : null
        }
        tone="warning"
        confirmLabel="Desactivar credencial"
        busy={deactivateBusy}
        onClose={() =>
          setDeactivatePreview(null)
        }
        onConfirm={
          confirmDeactivate
        }
      />

      <CredentialUsageModal
        credential={usageCredential}
        onClose={() =>
          setUsageCredential(null)
        }
      />
    </div>
  );
}
