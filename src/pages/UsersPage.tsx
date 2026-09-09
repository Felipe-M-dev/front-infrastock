import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Camera,
  History,
  Pencil,
  Plus,
  Power,
  Trash2,
  UserRound,
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
  getCompanies,
  type Company,
} from '../services/companies.service';

import {
  createUser,
  getUsers,
  removeUserAvatar,
  updateUser,
  uploadUserAvatar,
  type AppUser,
  type UserRole,
} from '../services/users.service';

import {
  mediaUrl,
} from '../services/media';

import {
  getToken,
  getUser,
  saveSession,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';

export default function UsersPage() {
  const toast = useToast();

  const [
    users,
    setUsers,
  ] = useState<AppUser[]>([]);

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
  ] = useState<AppUser | null>(
    null,
  );

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    name,
    setName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    role,
    setRole,
  ] = useState<UserRole>(
    'VIEWER',
  );

  const [
    companyId,
    setCompanyId,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    avatarBusy,
    setAvatarBusy,
  ] = useState(false);

  const [
    pendingUser,
    setPendingUser,
  ] = useState<AppUser | null>(null);

  const [
    userActionBusy,
    setUserActionBusy,
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

      const [
        usersData,
        companiesData,
      ] =
        await Promise.all([
          getUsers(),
          getCompanies(),
        ]);

      setUsers(
        usersData,
      );

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
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setUsername('');
    setPassword('');
    setName('');
    setEmail('');
    setRole('VIEWER');
    setCompanyId('');
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(
    user: AppUser,
  ) {
    setEditing(user);

    setUsername(
      user.username,
    );

    setPassword('');

    setName(
      user.name,
    );

    setEmail(
      user.email ?? '',
    );

    setRole(
      user.role,
    );

    setCompanyId(
      user.companyId?.toString() ??
        '',
    );

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
    user: AppUser,
  ) {
    setHistoryTitle(
      `${user.username} · ${user.name}`,
    );

    setHistoryItems([]);
    setHistoryError('');
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const items =
        await getAuditHistory(
          'USER',
          user.id,
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

  function syncOwnAvatar(
    updated: AppUser,
  ) {
    const current = getUser();
    const token = getToken();

    if (
      !current ||
      !token ||
      current.id !== updated.id
    ) {
      return;
    }

    const sessionUser = {
      ...current,
      avatarUrl:
        updated.avatarUrl,
    };

    saveSession(
      token,
      sessionUser,
    );

    window.dispatchEvent(
      new Event(
        'infrastock-session-updated',
      ),
    );
  }

  async function handleAdminAvatarChange(
    file: File | undefined,
  ) {
    if (!editing || !file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        'Foto demasiado grande',
        'La foto no puede superar 5 MB.',
      );
      return;
    }

    if (
      ![
        'image/jpeg',
        'image/png',
        'image/webp',
      ].includes(file.type)
    ) {
      toast.error(
        'Formato no permitido',
        'Usa una imagen JPG, PNG o WebP.',
      );
      return;
    }

    try {
      setAvatarBusy(true);

      const updated =
        await uploadUserAvatar(
          editing.id,
          file,
        );

      setEditing(updated);
      syncOwnAvatar(updated);
      await loadData();

      toast.success(
        'Foto actualizada',
        `Se actualizó la foto de ${updated.username}.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible actualizar la foto',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al procesar la imagen.',
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAdminRemoveAvatar() {
    if (!editing) {
      return;
    }

    try {
      setAvatarBusy(true);

      const updated =
        await removeUserAvatar(
          editing.id,
        );

      setEditing(updated);
      syncOwnAvatar(updated);
      await loadData();

      toast.success(
        'Foto eliminada',
        `Se restauró la silueta predeterminada para ${updated.username}.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible eliminar la foto',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la imagen.',
      );
    } finally {
      setAvatarBusy(false);
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

      if (!companyId) {
        throw new Error(
          'Debe seleccionar una empresa.',
        );
      }

      const wasEditing =
        Boolean(editing);
      const savedUsername =
        username.trim();

      if (editing) {
        await updateUser(
          editing.id,
          {
            username:
              username.trim(),

            name:
              name.trim(),

            email:
              email.trim() ||
              undefined,

            role,

            companyId:
              Number(
                companyId,
              ),

            password:
              password.trim() ||
              undefined,
          },
        );
      } else {
        await createUser({
          username:
            username.trim(),

          password,

          name:
            name.trim(),

          email:
            email.trim() ||
            undefined,

          role,

          companyId:
            Number(
              companyId,
            ),

          active: true,
        });
      }

      resetForm();
      setShowForm(false);

      await loadData();

      toast.success(
        wasEditing
          ? 'Usuario actualizado'
          : 'Usuario creado',
        `${savedUsername} fue ${wasEditing ? 'actualizado' : 'creado'} correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible guardar el usuario',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar el usuario.',
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(
    user: AppUser,
  ) {
    setPendingUser(
      user,
    );
  }

  async function confirmUserState() {
    if (!pendingUser) {
      return;
    }

    try {
      setUserActionBusy(true);
      setError('');

      const changedUser =
        pendingUser;

      await updateUser(
        changedUser.id,
        {
          active:
            !changedUser.active,
        },
      );

      setPendingUser(null);
      await loadData();

      toast.success(
        changedUser.active
          ? 'Usuario desactivado'
          : 'Usuario activado',
        `${changedUser.username} fue ${changedUser.active ? 'desactivado' : 'activado'} correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible cambiar el estado del usuario',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al actualizar el usuario.',
      );
    } finally {
      setUserActionBusy(false);
    }
  }

  function renderAuditLine(
    user: AppUser,
  ) {
    return (
      <p className="mt-1 text-xs text-slate-400">
        Actualizado ·{' '}
        {formatDateTime(
          user.updatedAt,
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
              <Users size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Control de acceso
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Usuarios
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Administración de usuarios, roles, empresas y estado de acceso.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openCreate
            }
            className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <Plus size={18} />
            Agregar usuario
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
          variant="table"
          rows={7}
        />
      ) : users.length ===
        0 ? (
        <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 py-14 text-center shadow-sm backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users
              size={28}
            />
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            No hay usuarios registrados.
          </p>
        </div>
      ) : (
        <>
          <div className="ui-table-shell ui-panel hidden overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm md:block">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    Usuario
                  </th>

                  <th className="px-4 py-3">
                    Nombre
                  </th>

                  <th className="px-4 py-3">
                    Empresa
                  </th>

                  <th className="px-4 py-3">
                    Rol
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
                {users.map(
                  (user) => (
                    <tr
                      key={
                        user.id
                      }
                      className="text-sm transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-company-primary/10 text-company-primary">
                            {mediaUrl(user.avatarUrl) ? (
                              <img
                                src={mediaUrl(user.avatarUrl)!}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-tech font-semibold text-slate-900">
                              {user.username}
                            </p>
                            {renderAuditLine(user)}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {
                          user.name
                        }
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {user.company
                          ?.name ??
                          '-'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary ring-1 ring-company-primary/10">
                          {
                            user.role
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            user.active
                              ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                              : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'
                          }
                        >
                          {user.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              openHistory(
                                user,
                              )
                            }
                            title="Historial"
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-company-primary"
                          >
                            <History
                              size={
                                17
                              }
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                user,
                              )
                            }
                            title="Editar"
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-company-primary"
                          >
                            <Pencil
                              size={
                                17
                              }
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                user,
                              )
                            }
                            title={
                              user.active
                                ? 'Desactivar'
                                : 'Activar'
                            }
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                          >
                            <Power
                              size={
                                17
                              }
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {users.map(
              (user) => (
                <article
                  key={
                    user.id
                  }
                  className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <div className="h-0.5 bg-company-primary" />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {
                            user.name
                          }
                        </h2>

                        <p className="font-tech mt-1 text-sm text-slate-500">
                          {
                            user.username
                          }
                        </p>

                        {renderAuditLine(
                          user,
                        )}
                      </div>

                      <span className="rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary ring-1 ring-company-primary/10">
                        {
                          user.role
                        }
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                        <p className="text-xs text-slate-400">
                          Empresa
                        </p>

                        <p className="mt-1 text-slate-700">
                          {user.company
                            ?.name ??
                            '-'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                        <p className="text-xs text-slate-400">
                          Estado
                        </p>

                        <p
                          className={
                            user.active
                              ? 'mt-1 font-semibold text-emerald-700'
                              : 'mt-1 font-semibold text-slate-600'
                          }
                        >
                          {user.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          openHistory(
                            user,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <History
                          size={16}
                        />

                        Historial
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEdit(
                            user,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-company-primary transition hover:bg-slate-50"
                      >
                        <Pencil
                          size={16}
                        />

                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleActive(
                            user,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        <Power
                          size={16}
                        />

                        {user.active
                          ? 'Desactivar'
                          : 'Activar'}
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={
              closeForm
            }
          />

          <div className="ui-table-shell ui-panel relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[92vh]">
            <div className="h-1 shrink-0 bg-company-primary" />

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Gestión de acceso
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editing
                    ? 'Editar usuario'
                    : 'Agregar usuario'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configura cuenta, empresa y permisos.
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
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
                {editing && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs text-slate-500">
                      Creado ·{' '}
                      {formatDateTime(
                        editing.createdAt,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Última modificación ·{' '}
                      {formatDateTime(
                        editing.updatedAt,
                      )}
                    </p>
                  </div>
                )}

                {editing && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
                        {mediaUrl(editing.avatarUrl) ? (
                          <img
                            src={mediaUrl(editing.avatarUrl)!}
                            alt={editing.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={34} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Foto de perfil
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Como administrador puedes cambiar o eliminar el avatar de cualquier usuario. JPG, PNG o WebP, máximo 5 MB.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-company-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105">
                            <Camera size={15} />
                            {avatarBusy ? 'Procesando...' : 'Cambiar foto'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={avatarBusy}
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                void handleAdminAvatarChange(file);
                              }}
                            />
                          </label>

                          {editing.avatarUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleAdminRemoveAvatar()
                              }
                              disabled={avatarBusy}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                              Eliminar foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Usuario *
                  </label>

                  <input
                    required
                    value={
                      username
                    }
                    onChange={(
                      event,
                    ) =>
                      setUsername(
                        event.target
                          .value,
                      )
                    }
                    className="ui-control font-tech w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
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
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target
                          .value,
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Empresa *
                  </label>

                  <select
                    required
                    value={
                      companyId
                    }
                    onChange={(
                      event,
                    ) =>
                      setCompanyId(
                        event.target
                          .value,
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    <option value="">
                      Seleccionar
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
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Rol *
                  </label>

                  <select
                    value={
                      role
                    }
                    onChange={(
                      event,
                    ) =>
                      setRole(
                        event.target
                          .value as UserRole,
                      )
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    <option value="ADMIN">
                      ADMIN
                    </option>

                    <option value="EDITOR">
                      EDITOR
                    </option>

                    <option value="VIEWER">
                      VIEWER
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    {editing
                      ? 'Nueva contraseña'
                      : 'Contraseña *'}
                  </label>

                  <input
                    type="password"
                    required={
                      !editing
                    }
                    minLength={8}
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target
                          .value,
                      )
                    }
                    placeholder={
                      editing
                        ? 'Dejar vacío para no cambiar'
                        : ''
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />

                  {editing && (
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">
                      La contraseña nunca se almacena en el historial. Solo se registra que fue actualizada.
                    </p>
                  )}
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
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
                    : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      <ConfirmDialog
        open={
          pendingUser !== null
        }
        eyebrow="Control de acceso"
        title={
          pendingUser?.active
            ? 'Desactivar usuario'
            : 'Activar usuario'
        }
        description={
          pendingUser?.active
            ? 'El usuario perderá acceso a InfraStock hasta que vuelva a activarse. Su cuenta y su historial se conservarán.'
            : 'El usuario recuperará el acceso según su rol y la empresa configurada.'
        }
        detail={
          pendingUser ? (
            <div className="space-y-1">
              <p className="font-tech font-semibold text-slate-900">
                {pendingUser.username}
              </p>
              <p className="text-xs text-slate-500">
                {pendingUser.name} · {pendingUser.role} · {pendingUser.company?.name ?? 'Sin empresa'}
              </p>
            </div>
          ) : null
        }
        tone={
          pendingUser?.active
            ? 'warning'
            : 'info'
        }
        confirmLabel={
          pendingUser?.active
            ? 'Desactivar usuario'
            : 'Activar usuario'
        }
        busy={userActionBusy}
        onClose={() =>
          setPendingUser(null)
        }
        onConfirm={
          confirmUserState
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
