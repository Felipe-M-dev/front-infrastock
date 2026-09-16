import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  History,
  MonitorCog,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from 'lucide-react';

import AuditHistoryModal from '../components/AuditHistoryModal';
import DeleteCatalogConfirmModal from '../components/DeleteCatalogConfirmModal';
import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';

import {
  getAuditHistory,
  type AuditLog,
} from '../services/audit.service';

import {
  createOperatingSystem,
  getOperatingSystems,
  updateOperatingSystem,
  type OperatingSystem,
} from '../services/catalogs.service';

import {
  deleteOperatingSystemCatalogItem,
} from '../services/catalog-maintenance.service';

import {
  getUser,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';

interface OperatingSystemsPageProps {
  embedded?: boolean;
}

export default function OperatingSystemsPage({
  embedded = false,
}: OperatingSystemsPageProps) {
  const toast = useToast();

  const currentUser =
    getUser();

  const canEdit =
    currentUser?.role ===
      'ADMIN' ||
    currentUser?.role ===
      'EDITOR';

  const canDelete =
    currentUser?.role ===
    'ADMIN';

  const [
    operatingSystems,
    setOperatingSystems,
  ] = useState<
    OperatingSystem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<
    OperatingSystem | null
  >(null);

  const [
    name,
    setName,
  ] = useState('');

  const [
    version,
    setVersion,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null,
  );

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<
    OperatingSystem | null
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
  ] = useState<AuditLog[]>([]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const data =
        await getOperatingSystems();

      setOperatingSystems(
        data,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible obtener los sistemas operativos.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getOperatingSystems()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setOperatingSystems(
          data,
        );
        setError('');
      })
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'No fue posible obtener los sistemas operativos.',
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

  function resetForm() {
    setName('');
    setVersion('');
    setEditing(null);
  }

  function openCreate() {
    if (!canEdit) {
      return;
    }

    resetForm();
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEdit(
    item: OperatingSystem,
  ) {
    if (!canEdit) {
      return;
    }

    setEditing(item);
    setName(item.name);
    setVersion(
      item.version,
    );
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    resetForm();
    setShowForm(false);
  }

  async function openHistory(
    item: OperatingSystem,
  ) {
    setHistoryTitle(
      `${item.name} ${item.version}`,
    );

    setHistoryItems([]);
    setHistoryError('');
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const items =
        await getAuditHistory(
          'OPERATING_SYSTEM',
          item.id,
        );

      setHistoryItems(
        items,
      );
    } catch (caughtError) {
      setHistoryError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible obtener el historial.',
      );
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

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editing) {
        await updateOperatingSystem(
          editing.id,
          {
            name:
              name.trim(),
            version:
              version.trim(),
          },
        );

        setSuccess(
          'Sistema operativo actualizado correctamente.',
        );
      } else {
        await createOperatingSystem({
          name:
            name.trim(),
          version:
            version.trim(),
        });

        setSuccess(
          'Sistema operativo creado correctamente.',
        );
      }

      resetForm();
      setShowForm(false);

      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible guardar el sistema operativo.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    item: OperatingSystem,
  ) {
    if (!canEdit) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await updateOperatingSystem(
        item.id,
        {
          active:
            !item.active,
        },
      );

      setSuccess(
        item.active
          ? `${item.name} ${item.version} desactivado.`
          : `${item.name} ${item.version} activado.`,
      );

      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible cambiar el estado.',
      );
    }
  }

  function openDelete(
    item: OperatingSystem,
  ) {
    if (
      !canDelete ||
      deletingId !== null
    ) {
      return;
    }

    setDeleteTarget(item);
  }

  function closeDelete() {
    if (deletingId !== null) {
      return;
    }

    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (
      !canDelete ||
      !deleteTarget ||
      deletingId !== null
    ) {
      return;
    }

    const item = deleteTarget;

    try {
      setDeletingId(item.id);
      setError('');
      setSuccess('');

      await deleteOperatingSystemCatalogItem(
        item.id,
      );

      setDeleteTarget(null);

      toast.success(
        'Sistema operativo eliminado',
        `${item.name} ${item.version} fue eliminado definitivamente del catálogo.`,
      );

      await loadData();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible eliminar el sistema operativo.';

      toast.error(
        'No se pudo eliminar el sistema operativo',
        message,
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderAuditLine(
    item: OperatingSystem,
  ) {
    if (
      item.updatedBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Modificado por{' '}
          <span className="font-medium text-slate-500">
            {item.updatedBy.username}
          </span>{' '}
          ·{' '}
          {formatDateTime(
            item.updatedAt,
          )}
        </p>
      );
    }

    if (
      item.createdBy
    ) {
      return (
        <p className="mt-1 text-xs text-slate-400">
          Creado por{' '}
          <span className="font-medium text-slate-500">
            {item.createdBy.username}
          </span>{' '}
          ·{' '}
          {formatDateTime(
            item.createdAt,
          )}
        </p>
      );
    }

    return (
      <p className="mt-1 text-xs text-slate-400">
        Registrado ·{' '}
        {formatDateTime(
          item.createdAt,
        )}
      </p>
    );
  }

  const headerContent = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className={
        embedded
          ? ''
          : 'flex items-start gap-4'
      }>
        {!embedded && (
          <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
            <MonitorCog size={24} />
          </div>
        )}

        <div>
          <p className={
            embedded
              ? 'text-xs font-bold uppercase tracking-[0.14em] text-company-primary'
              : 'text-xs font-bold uppercase tracking-[0.16em] text-company-primary'
          }>
            {embedded
              ? 'Inventario reutilizable'
              : 'Catálogo técnico'}
          </p>

          <h2 className={
            embedded
              ? 'mt-1 text-lg font-bold text-slate-900'
              : 'mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl'
          }>
            Sistemas Operativos
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Administra sistemas operativos y versiones reutilizables en el inventario.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!loading && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {operatingSystems.length} registro{operatingSystems.length === 1 ? '' : 's'}
          </span>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <Plus size={18} />
            Agregar SO
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="ui-page space-y-5">
      {embedded ? (
        <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
          {headerContent}
        </section>
      ) : (
        <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />
          {headerContent}
        </section>
      )}

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="ui-alert ui-alert-success rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </div>
      )}

      {loading ? (
        <PageLoader
          variant="table"
          rows={6}
        />
      ) : operatingSystems.length === 0 ? (
        <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <MonitorCog size={28} />
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            No hay sistemas operativos registrados.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {canEdit
              ? 'Agrega el primer sistema operativo para comenzar el catálogo.'
              : 'Aún no existen registros disponibles.'}
          </p>
        </div>
      ) : (
        <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    Sistema
                  </th>
                  <th className="px-5 py-3.5">
                    Versión
                  </th>
                  <th className="px-5 py-3.5">
                    Estado
                  </th>
                  <th className="px-5 py-3.5 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {operatingSystems.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="text-sm transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        {renderAuditLine(
                          item,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-version inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700">
                          {item.version}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            item.active
                              ? 'inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                              : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'
                          }
                        >
                          {item.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              void openHistory(
                                item,
                              )
                            }
                            title="Historial"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-company-primary hover:shadow-sm"
                          >
                            <History size={17} />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    item,
                                  )
                                }
                                title="Editar"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-company-primary hover:shadow-sm"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void toggleActive(
                                    item,
                                  )
                                }
                                title={
                                  item.active
                                    ? 'Desactivar'
                                    : 'Activar'
                                }
                                className={`rounded-lg p-2 transition hover:bg-white hover:shadow-sm ${
                                  item.active
                                    ? 'text-slate-500 hover:text-amber-700'
                                    : 'text-slate-500 hover:text-emerald-700'
                                }`}
                              >
                                <Power size={17} />
                              </button>
                            </>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                openDelete(
                                  item,
                                )
                              }
                              disabled={
                                deletingId !== null
                              }
                              title="Eliminar"
                              aria-label={`Eliminar ${item.name} ${item.version}`}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={17} />
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

          <div className="divide-y divide-slate-100 md:hidden">
            {operatingSystems.map(
              (item) => (
                <div
                  key={item.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>

                      <span className="font-version mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700">
                        {item.version}
                      </span>

                      {renderAuditLine(
                        item,
                      )}
                    </div>

                    <span
                      className={
                        item.active
                          ? 'shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                          : 'shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'
                      }
                    >
                      {item.active
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        void openHistory(
                          item,
                        )
                      }
                      title="Historial"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-company-primary"
                    >
                      <History size={17} />
                    </button>

                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              item,
                            )
                          }
                          title="Editar"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-company-primary"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleActive(
                              item,
                            )
                          }
                          title={
                            item.active
                              ? 'Desactivar'
                              : 'Activar'
                          }
                          className={`rounded-lg p-2 transition hover:bg-slate-100 ${
                            item.active
                              ? 'text-slate-500 hover:text-amber-700'
                              : 'text-slate-500 hover:text-emerald-700'
                          }`}
                        >
                          <Power size={17} />
                        </button>
                      </>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          openDelete(
                            item,
                          )
                        }
                        disabled={
                          deletingId !== null
                        }
                        title="Eliminar"
                        aria-label={`Eliminar ${item.name} ${item.version}`}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {showForm &&
        canEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              onClick={closeForm}
            />

            <div className="ui-table-shell ui-panel relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <div className="h-1 bg-company-primary" />

              <div className="p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                      Catálogo técnico
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {editing
                        ? 'Editar sistema operativo'
                        : 'Agregar sistema operativo'}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Define sistema y versión.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    aria-label="Cerrar"
                  >
                    <X size={20} />
                  </button>
                </div>

                {editing && (
                  <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      Creado{' '}
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

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Sistema *
                    </label>

                    <input
                      required
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value,
                        )
                      }
                      placeholder="RHEL"
                      className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Versión *
                    </label>

                    <input
                      required
                      value={version}
                      onChange={(event) =>
                        setVersion(
                          event.target.value,
                        )
                      }
                      placeholder="9.8"
                      className="ui-control font-version w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="ui-btn ui-btn-primary btn-company-primary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? 'Guardando...'
                        : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      <DeleteCatalogConfirmModal
        open={deleteTarget !== null}
        title="Eliminar sistema operativo"
        itemName={
          deleteTarget
            ? `${deleteTarget.name} ${deleteTarget.version}`
            : ''
        }
        description="Solo se eliminará si no está asignado a servidores y no deja tarifas sin una familia de SO asociada."
        deleting={
          deleteTarget !== null &&
          deletingId === deleteTarget.id
        }
        onClose={closeDelete}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <AuditHistoryModal
        open={historyOpen}
        title={historyTitle}
        loading={historyLoading}
        error={historyError}
        items={historyItems}
        onClose={closeHistory}
      />
    </div>
  );
}
