import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Building2,
  ImagePlus,
  History,
  Pencil,
  Plus,
  Power,
  Server,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import AuditHistoryModal from '../components/AuditHistoryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';

import {
  getAuditHistory,
  type AuditLog,
} from '../services/audit.service';

import {
  createCompany,
  deleteCompany,
  getCompanies,
  removeCompanyLogo,
  updateCompany,
  uploadCompanyLogo,
  type Company,
} from '../services/companies.service';

import {
  companyLogoUrl,
} from '../services/media';

import {
  getUser,
  updateSessionCompany,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';

export default function CompaniesPage() {
  const toast = useToast();

  const [
    companies,
    setCompanies,
  ] = useState<Company[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Company | null>(
    null,
  );

  const [
    name,
    setName,
  ] = useState('');

  const [
    slug,
    setSlug,
  ] = useState('');

  const [
    logoUrl,
    setLogoUrl,
  ] = useState('');

  const [
    logoFile,
    setLogoFile,
  ] = useState<File | null>(null);

  const [
    logoPreviewUrl,
    setLogoPreviewUrl,
  ] = useState('');

  const [
    removeLogoRequested,
    setRemoveLogoRequested,
  ] = useState(false);

  const [
    primaryColor,
    setPrimaryColor,
  ] = useState('#2563EB');

  const [
    secondaryColor,
    setSecondaryColor,
  ] = useState('#0F172A');

  const [
    backgroundColor,
    setBackgroundColor,
  ] = useState('#F1F5F9');

  const [
    surfaceColor,
    setSurfaceColor,
  ] = useState('#FFFFFF');

  const [
    textColor,
    setTextColor,
  ] = useState('#0F172A');

  const [
    logoBackgroundColor,
    setLogoBackgroundColor,
  ] = useState('#FFFFFF');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    pendingCompany,
    setPendingCompany,
  ] = useState<Company | null>(null);

  const [
    companyActionBusy,
    setCompanyActionBusy,
  ] = useState(false);

  const [
    pendingDeleteCompany,
    setPendingDeleteCompany,
  ] = useState<Company | null>(null);

  const [
    deleteCompanyBusy,
    setDeleteCompanyBusy,
  ] = useState(false);

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
  ] = useState<AuditLog[]>([]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const data =
        await getCompanies();

      setCompanies(data);
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setName('');
    setSlug('');
    setLogoUrl('');
    setLogoFile(null);
    setRemoveLogoRequested(false);
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });

    setPrimaryColor(
      '#2563EB',
    );

    setSecondaryColor(
      '#0F172A',
    );

    setBackgroundColor(
      '#F1F5F9',
    );

    setSurfaceColor(
      '#FFFFFF',
    );

    setTextColor(
      '#0F172A',
    );

    setLogoBackgroundColor(
      '#FFFFFF',
    );

    setEditing(null);
  }

  function openCreate() {
    resetForm();

    setShowForm(
      true,
    );
  }

  function openEdit(
    company: Company,
  ) {
    setEditing(
      company,
    );

    setName(
      company.name,
    );

    setSlug(
      company.slug,
    );

    setLogoUrl(
      company.logoUrl ??
        '',
    );

    setLogoFile(null);
    setRemoveLogoRequested(false);
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });

    setPrimaryColor(
      company.primaryColor,
    );

    setSecondaryColor(
      company.secondaryColor,
    );

    setBackgroundColor(
      company.backgroundColor,
    );

    setSurfaceColor(
      company.surfaceColor,
    );

    setTextColor(
      company.textColor,
    );

    setLogoBackgroundColor(
      company.logoBackgroundColor ??
        '#FFFFFF',
    );

    setShowForm(
      true,
    );
  }

  function handleLogoFile(
    file: File | undefined,
  ) {
    if (!file) {
      return;
    }

    const extension =
      file.name
        .toLowerCase()
        .split('.')
        .pop();

    if (
      !['png', 'svg'].includes(
        extension ?? '',
      )
    ) {
      toast.error(
        'Formato no permitido',
        'El logo debe ser PNG o SVG.',
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        'Logo demasiado grande',
        'El logo no puede superar 2 MB.',
      );
      return;
    }

    setLogoPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return extension === 'png'
        ? URL.createObjectURL(file)
        : '';
    });

    setLogoFile(file);
    setRemoveLogoRequested(false);
  }

  function requestDefaultLogo() {
    setLogoFile(null);
    setRemoveLogoRequested(true);
    setLogoPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return '';
    });
  }

  function closeForm() {
    if (saving) {
      return;
    }

    resetForm();

    setShowForm(
      false,
    );
  }

  async function openHistory(
    company: Company,
  ) {
    setHistoryTitle(
      company.name,
    );

    setHistoryItems([]);
    setHistoryError('');
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const items =
        await getAuditHistory(
          'COMPANY',
          company.id,
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
    setHistoryOpen(
      false,
    );

    setHistoryTitle(
      '',
    );

    setHistoryItems(
      [],
    );

    setHistoryError(
      '',
    );
  }

  function syncCurrentCompany(
    company: Company,
  ) {
    const currentUser =
      getUser();

    if (
      currentUser?.company?.id ===
      company.id
    ) {
      updateSessionCompany({
        id:
          company.id,

        name:
          company.name,

        slug:
          company.slug,

        logoUrl:
          company.logoUrl,

        primaryColor:
          company.primaryColor,

        secondaryColor:
          company.secondaryColor,

        backgroundColor:
          company.backgroundColor,

        surfaceColor:
          company.surfaceColor,

        textColor:
          company.textColor,

        logoBackgroundColor:
          company.logoBackgroundColor,
      });
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const payload = {
        name:
          name.trim(),

        slug:
          slug.trim(),

        primaryColor,
        secondaryColor,
        backgroundColor,
        surfaceColor,
        textColor,
        logoBackgroundColor,
      };

      const wasEditing =
        Boolean(editing);
      const companyName =
        name.trim();

      let savedCompany: Company;

      if (editing) {
        savedCompany =
          await updateCompany(
            editing.id,
            payload,
          );
      } else {
        savedCompany =
          await createCompany(
            payload,
          );
      }

      if (logoFile) {
        savedCompany =
          await uploadCompanyLogo(
            savedCompany.id,
            logoFile,
          );
      } else if (
        removeLogoRequested &&
        savedCompany.logoUrl
      ) {
        savedCompany =
          await removeCompanyLogo(
            savedCompany.id,
          );
      }

      syncCurrentCompany(
        savedCompany,
      );

      resetForm();

      setShowForm(
        false,
      );

      await loadData();

      toast.success(
        wasEditing
          ? 'Empresa actualizada'
          : 'Empresa creada',
        `${companyName} fue ${wasEditing ? 'actualizada' : 'creada'} correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible guardar la empresa',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la empresa.',
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  function toggleActive(
    company: Company,
  ) {
    setPendingCompany(
      company,
    );
  }

  async function confirmCompanyState() {
    if (!pendingCompany) {
      return;
    }

    try {
      setCompanyActionBusy(true);
      setError('');

      const updatedCompany =
        await updateCompany(
          pendingCompany.id,
          {
            active:
              !pendingCompany.active,
          },
        );

      syncCurrentCompany(
        updatedCompany,
      );

      const changedCompany =
        pendingCompany;

      setPendingCompany(null);
      await loadData();

      toast.success(
        changedCompany.active
          ? 'Empresa desactivada'
          : 'Empresa activada',
        `${changedCompany.name} fue ${changedCompany.active ? 'desactivada' : 'activada'} correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible cambiar el estado de la empresa',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar la empresa.',
      );
    } finally {
      setCompanyActionBusy(false);
    }
  }

  async function confirmDeleteCompany() {
    if (!pendingDeleteCompany) {
      return;
    }

    try {
      setDeleteCompanyBusy(true);
      setError('');

      const target =
        pendingDeleteCompany;

      const result =
        await deleteCompany(
          target.id,
        );

      setPendingDeleteCompany(null);
      await loadData();

      toast.success(
        'Empresa eliminada',
        `${target.name} fue eliminada. ${result.serversReassigned} servidor(es), ${result.usersReassigned} usuario(s) y ${result.credentialsReassigned} credencial(es) fueron reasignados a ${result.reassignedTo}.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible eliminar la empresa',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la empresa.',
      );
    } finally {
      setDeleteCompanyBusy(false);
    }
  }

  function renderAuditLine(
    company: Company,
  ) {
    if (
      company.updatedBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Modificado por{' '}
          <span className="font-medium text-slate-500">
            {
              company
                .updatedBy
                .username
            }
          </span>{' '}
          ·{' '}
          {formatDateTime(
            company.updatedAt,
          )}
        </p>
      );
    }

    if (
      company.createdBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Creado por{' '}
          <span className="font-medium text-slate-500">
            {
              company
                .createdBy
                .username
            }
          </span>{' '}
          ·{' '}
          {formatDateTime(
            company.createdAt,
          )}
        </p>
      );
    }

    return (
      <p className="mt-1 text-xs text-slate-400">
        Registrada ·{' '}
        {formatDateTime(
          company.createdAt,
        )}
      </p>
    );
  }

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <Building2 size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Gobierno corporativo
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Empresas
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Administración de empresas, alcance, identidad visual y branding.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <Plus size={18} />
            Agregar empresa
          </button>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <PageLoader
          variant="cards"
          rows={6}
        />
      ) : companies.length ===
        0 ? (
        <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 py-14 text-center shadow-sm backdrop-blur-sm">
          <Building2
            size={40}
            className="mx-auto text-slate-400"
          />

          <p className="mt-3 text-slate-600">
            No hay empresas registradas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {companies.map(
            (company) => (
              <div
                key={
                  company.id
                }
                className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
              >
                <div
                  className="h-1"
                  style={{
                    backgroundColor:
                      company.primaryColor,
                  }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-14 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 p-2 shadow-sm"
                        style={{
                          backgroundColor:
                            company.logoBackgroundColor,
                        }}
                      >
                        <img
                          src={
                            companyLogoUrl(
                              company.logoUrl,
                            )
                          }
                          alt={company.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-bold text-slate-900">
                          {
                            company.name
                          }
                        </h2>

                        <p className="font-tech truncate text-sm text-slate-500">
                          {
                            company.slug
                          }
                        </p>

                        {renderAuditLine(
                          company,
                        )}
                      </div>
                    </div>

                    <span
                      className={
                        company.active
                          ? 'shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                          : 'shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'
                      }
                    >
                      {company.active
                        ? 'Activa'
                        : 'Inactiva'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users
                          size={16}
                        />

                        <span className="text-xs">
                          Usuarios
                        </span>
                      </div>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {
                          company
                            ._count
                            .users
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Server
                          size={16}
                        />

                        <span className="text-xs">
                          Servidores
                        </span>
                      </div>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {
                          company
                            ._count
                            .servers
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Paleta
                    </p>

                    <div className="flex gap-2">
                      {[
                        company.primaryColor,
                        company.secondaryColor,
                        company.backgroundColor,
                        company.surfaceColor,
                        company.textColor,
                        company.logoBackgroundColor,
                      ].map(
                        (
                          color,
                          index,
                        ) => (
                          <div
                            key={
                              `${company.id}-${index}`
                            }
                            title={
                              color
                            }
                            className="ui-palette-swatch h-8 flex-1 rounded-xl"
                            style={{
                              backgroundColor:
                                color,
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() =>
                        openHistory(
                          company,
                        )
                      }
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <History
                        size={16}
                      />

                      Historial
                    </button>

                    <button
                      onClick={() =>
                        openEdit(
                          company,
                        )
                      }
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-company-primary hover:bg-slate-50"
                    >
                      <Pencil
                        size={16}
                      />

                      Editar
                    </button>

                    <button
                      onClick={() =>
                        toggleActive(
                          company,
                        )
                      }
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Power
                        size={16}
                      />

                      {company.active
                        ? 'Desactivar'
                        : 'Activar'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingDeleteCompany(
                          company,
                        )
                      }
                      disabled={
                        company.slug
                          .trim()
                          .toLowerCase() ===
                        'onitec'
                      }
                      className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35"
                      title={
                        company.slug
                          .trim()
                          .toLowerCase() ===
                        'onitec'
                          ? 'Onitec es la empresa base y no se puede eliminar'
                          : 'Eliminar empresa'
                      }
                    >
                      <Trash2
                        size={16}
                      />

                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={
              closeForm
            }
          />

          <div className="ui-table-shell ui-panel relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[92vh]">
            <div className="h-1 shrink-0 bg-company-primary" />

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editing
                    ? 'Editar empresa'
                    : 'Agregar empresa'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configura identificación y apariencia de la empresa.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
                {editing && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      Creada{' '}
                      {editing.createdBy
                        ? `por ${editing.createdBy.username}`
                        : ''}
                      {' · '}
                      {formatDateTime(
                        editing.createdAt,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Última modificación{' '}
                      {editing.updatedBy
                        ? `por ${editing.updatedBy.username}`
                        : ''}
                      {' · '}
                      {formatDateTime(
                        editing.updatedAt,
                      )}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nombre *
                    </label>

                    <input
                      required
                      value={
                        name
                      }
                      onChange={(
                        event,
                      ) =>
                        setName(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Onitec"
                      className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Slug *
                    </label>

                    <input
                      required
                      value={
                        slug
                      }
                      onChange={(
                        event,
                      ) =>
                        setSlug(
                          event.target
                            .value,
                        )
                      }
                      placeholder="onitec"
                      className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Logo de empresa
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        PNG o SVG, máximo 2 MB. El backend valida el archivo y lo normaliza a PNG transparente.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        <ImagePlus size={17} />
                        Seleccionar logo
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,.png,.svg"
                          onChange={(event) => {
                            handleLogoFile(
                              event.target.files?.[0],
                            );
                            event.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>

                      {(editing?.logoUrl || logoFile) && (
                        <button
                          type="button"
                          onClick={requestDefaultLogo}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={17} />
                          Usar predeterminado
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Vista previa
                    </p>

                    <div
                      className="flex h-24 items-center justify-center rounded-xl border border-slate-200 p-4"
                      style={{
                        backgroundColor:
                          logoBackgroundColor,
                      }}
                    >
                      {logoFile?.name.toLowerCase().endsWith('.svg') && !logoPreviewUrl ? (
                        <div className="flex flex-col items-center gap-2 text-center text-slate-500">
                          <ImagePlus size={24} className="text-company-primary" />
                          <span className="text-xs font-semibold">
                            SVG seleccionado · se validará y convertirá a PNG al guardar
                          </span>
                        </div>
                      ) : (
                        <img
                          src={
                            logoPreviewUrl ||
                            companyLogoUrl(
                              removeLogoRequested
                                ? null
                                : logoUrl,
                            )
                          }
                          alt="Vista previa del logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Si no cargas un logo, InfraStock utiliza automáticamente el logo predeterminado de Onitec.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Paleta de colores
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField
                      label="Color primario"
                      value={
                        primaryColor
                      }
                      onChange={
                        setPrimaryColor
                      }
                    />

                    <ColorField
                      label="Color secundario"
                      value={
                        secondaryColor
                      }
                      onChange={
                        setSecondaryColor
                      }
                    />

                    <ColorField
                      label="Fondo"
                      value={
                        backgroundColor
                      }
                      onChange={
                        setBackgroundColor
                      }
                    />

                    <ColorField
                      label="Superficie"
                      value={
                        surfaceColor
                      }
                      onChange={
                        setSurfaceColor
                      }
                    />

                    <ColorField
                      label="Texto"
                      value={
                        textColor
                      }
                      onChange={
                        setTextColor
                      }
                    />

                    <ColorField
                      label="Fondo del logo"
                      value={
                        logoBackgroundColor
                      }
                      onChange={
                        setLogoBackgroundColor
                      }
                    />
                  </div>
                </div>

                <div
                  className="rounded-2xl border border-slate-200 p-5"
                  style={{
                    backgroundColor:
                      backgroundColor,

                    color:
                      textColor,
                  }}
                >
                  <p className="mb-3 text-sm font-medium">
                    Vista previa de la paleta
                  </p>

                  <div
                    className="overflow-hidden rounded-2xl border border-black/10 shadow-sm"
                    style={{
                      backgroundColor:
                        surfaceColor,
                    }}
                  >
                    <div
                      className="p-4"
                      style={{
                        backgroundColor:
                          secondaryColor,
                      }}
                    >
                      <div
                        className="mx-auto flex h-14 max-w-[220px] items-center justify-center rounded-xl border border-black/10 px-4 py-2"
                        style={{
                          backgroundColor:
                            logoBackgroundColor,
                        }}
                      >
                        {(logoPreviewUrl || logoUrl || removeLogoRequested) ? (
                          <img
                            src={
                              logoPreviewUrl || companyLogoUrl(removeLogoRequested ? null : logoUrl)
                            }
                            alt="Vista previa del logo en sidebar"
                            className="h-full w-full object-contain object-center"
                          />
                        ) : (
                          <span
                            className="text-sm font-semibold"
                            style={{
                              color:
                                textColor,
                            }}
                          >
                            Logo de empresa
                          </span>
                        )}
                      </div>

                      <div className="mt-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white">
                        Barra / menú
                      </div>
                    </div>

                    <div className="p-4">
                      <button
                        type="button"
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        style={{
                          backgroundColor:
                            primaryColor,
                        }}
                      >
                        Botón principal
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="ui-btn ui-btn-primary btn-company-primary rounded-xl px-4 py-2.5 font-semibold shadow-sm disabled:opacity-60"
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmDialog
        open={
          pendingCompany !== null
        }
        eyebrow="Gobierno corporativo"
        title={
          pendingCompany?.active
            ? 'Desactivar empresa'
            : 'Activar empresa'
        }
        description={
          pendingCompany?.active
            ? 'La empresa dejará de estar disponible para operación normal hasta que vuelva a activarse. Sus datos e historial se conservan.'
            : 'La empresa volverá a estar disponible según los permisos y alcances configurados.'
        }
        detail={
          pendingCompany ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {pendingCompany.name}
              </p>
              <p className="text-xs text-slate-500">
                {pendingCompany._count.users} usuarios · {pendingCompany._count.servers} servidores
              </p>
            </div>
          ) : null
        }
        tone={
          pendingCompany?.active
            ? 'warning'
            : 'info'
        }
        confirmLabel={
          pendingCompany?.active
            ? 'Desactivar empresa'
            : 'Activar empresa'
        }
        busy={companyActionBusy}
        onClose={() =>
          setPendingCompany(null)
        }
        onConfirm={
          confirmCompanyState
        }
      />

      <ConfirmDialog
        open={
          pendingDeleteCompany !== null
        }
        eyebrow="Eliminación definitiva"
        title="Eliminar empresa"
        description="La empresa se eliminará definitivamente. Los servidores y usuarios asociados serán reasignados automáticamente a Onitec para conservar la continuidad operativa y las referencias del inventario."
        detail={
          pendingDeleteCompany ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {pendingDeleteCompany.name}
              </p>
              <p className="text-xs text-slate-500">
                {pendingDeleteCompany._count.users} usuarios · {pendingDeleteCompany._count.servers} servidores
              </p>
              <p className="pt-1 text-xs font-medium text-red-600">
                Esta acción no se puede deshacer.
              </p>
            </div>
          ) : null
        }
        tone="danger"
        confirmLabel="Eliminar y reasignar a Onitec"
        busy={deleteCompanyBusy}
        onClose={() =>
          setPendingDeleteCompany(null)
        }
        onConfirm={
          confirmDeleteCompany
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

interface ColorFieldProps {
  label: string;
  value: string;

  onChange: (
    value: string,
  ) => void;
}

function ColorField({
  label,
  value,
  onChange,
}: ColorFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type="color"
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
        />

        <input
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          className="ui-control font-tech min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
        />
      </div>
    </div>
  );
}
