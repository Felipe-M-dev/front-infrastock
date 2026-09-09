import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  Building2,
  Camera,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  User,
  UserRound,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';

import {
  getMyProfile,
  removeMyAvatar,
  updateMyProfile,
  uploadMyAvatar,
  type ProfileUser,
} from '../services/profile.service';

import { mediaUrl } from '../services/media';

import {
  getToken,
  logout,
  saveSession,
} from '../services/session.service';

export default function ProfilePage() {
  const toast = useToast();

  const navigate =
    useNavigate();

  const [
    profile,
    setProfile,
  ] =
    useState<ProfileUser | null>(
      null,
    );

  const [
    name,
    setName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    avatarBusy,
    setAvatarBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const data =
          await getMyProfile();

        setProfile(
          data,
        );

        setName(
          data.name,
        );

        setEmail(
          data.email ?? '',
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof
          Error
            ? caughtError.message
            : 'No fue posible cargar tu usuario.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function syncSessionProfile(
    updated: ProfileUser,
  ) {
    const token =
      getToken();

    if (token) {
      saveSession(
        token,
        updated,
      );

      window.dispatchEvent(
        new Event(
          'infrastock-session-updated',
        ),
      );
    }
  }

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        'Foto demasiado grande',
        'La foto de perfil no puede superar 5 MB.',
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
        await uploadMyAvatar(file);

      setProfile(updated);
      syncSessionProfile(updated);

      toast.success(
        'Foto actualizada',
        'Tu nueva foto de perfil ya está disponible.',
      );
    } catch (caughtError) {
      toast.error(
        'No fue posible actualizar la foto',
        caughtError instanceof Error
          ? caughtError.message
          : 'Ocurrió un error al procesar la imagen.',
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    try {
      setAvatarBusy(true);

      const updated =
        await removeMyAvatar();

      setProfile(updated);
      syncSessionProfile(updated);

      toast.success(
        'Foto eliminada',
        'Se volverá a mostrar la silueta predeterminada.',
      );
    } catch (caughtError) {
      toast.error(
        'No fue posible eliminar la foto',
        caughtError instanceof Error
          ? caughtError.message
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

    const cleanName =
      name.trim();

    if (!cleanName) {
      setError(
        'El nombre no puede quedar vacío.',
      );
      return;
    }

    if (
      password &&
      !currentPassword
    ) {
      setError(
        'Debes ingresar tu contraseña actual para cambiarla.',
      );
      return;
    }

    if (
      password &&
      password.length < 8
    ) {
      setError(
        'La nueva contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    if (
      password !==
      passwordConfirmation
    ) {
      setError(
        'Las contraseñas no coinciden.',
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updated =
        await updateMyProfile({
          name:
            cleanName,

          email:
            email.trim() ||
            undefined,

          currentPassword:
            password
              ? currentPassword
              : undefined,

          password:
            password ||
            undefined,
        });

      setProfile(
        updated,
      );

      setName(
        updated.name,
      );

      setEmail(
        updated.email ?? '',
      );

      const passwordWasChanged =
        Boolean(password);

      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');

      if (passwordWasChanged) {
        logout();

        window.dispatchEvent(
          new Event(
            'infrastock-session-updated',
          ),
        );

        navigate(
          '/login',
          {
            replace: true,
          },
        );

        return;
      }

      syncSessionProfile(updated);

      setSuccess(
        'Usuario actualizado correctamente.',
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof
        Error
          ? caughtError.message
          : 'No fue posible actualizar tu usuario.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageLoader
          variant="detail"
          rows={3}
        />

        <PageLoader
          variant="cards"
          rows={2}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700 shadow-sm">
        {error ||
          'No fue posible cargar tu usuario.'}
      </div>
    );
  }

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex items-start gap-4">
          <div className="ui-page-icon ui-panel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-company-primary shadow-sm">
            <User
              size={24}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
              Cuenta personal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Mi usuario
            </h1>

            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              Administra tus datos personales y cambia tu contraseña sin modificar tu rol ni la empresa asignada.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="ui-alert ui-alert-success flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          <Check
            size={18}
          />

          {success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          onSubmit={
            handleSubmit
          }
          className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
        >
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-slate-900">
              Datos de la cuenta
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              El usuario, rol y empresa son administrados por un usuario ADMIN.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Usuario
                </span>

                <div className="relative">
                  <User
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      profile.username
                    }
                    readOnly
                    className="ui-control font-tech w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3.5 text-sm text-slate-500 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombre *
                </span>

                <input
                  required
                  value={
                    name
                  }
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target.value,
                    )
                  }
                  className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </span>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="usuario@empresa.cl"
                  className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-company-primary"
                />
              </div>
            </label>

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <KeyRound
                    size={18}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Cambiar contraseña
                  </h3>

                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    Para cambiarla debes confirmar tu contraseña actual. Al guardar, tu sesión se cerrará por seguridad.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Contraseña actual
                  </span>

                  <input
                    type="password"
                    autoComplete="current-password"
                    value={
                      currentPassword
                    }
                    onChange={(
                      event,
                    ) =>
                      setCurrentPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Obligatoria solo si cambiarás la contraseña"
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nueva contraseña
                  </span>

                  <input
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Mínimo 8 caracteres"
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Confirmar contraseña
                  </span>

                  <input
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={
                      passwordConfirmation
                    }
                    onChange={(
                      event,
                    ) =>
                      setPasswordConfirmation(
                        event.target.value,
                      )
                    }
                    placeholder="Repite la contraseña"
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
            <button
              type="submit"
              disabled={
                saving
              }
              className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              <Save
                size={17}
              />

              {saving
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-company-primary">
              <Camera size={19} />
              <h2 className="font-bold text-slate-900">
                Foto de perfil
              </h2>
            </div>

            <div className="mt-5 flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-slate-400 shadow-lg ring-1 ring-slate-200">
                {profile.avatarUrl ? (
                  <img
                    src={mediaUrl(profile.avatarUrl) ?? undefined}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={54} strokeWidth={1.5} />
                )}
              </div>

              <p className="mt-4 text-sm font-semibold text-slate-900">
                {profile.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                JPG, PNG o WebP. Máximo 5 MB. La imagen se normaliza y se eliminan sus metadatos.
              </p>

              <div className="mt-4 flex w-full flex-col gap-2">
                <label className="ui-btn ui-btn-primary btn-company-primary inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
                  {avatarBusy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Camera size={17} />
                  )}
                  {profile.avatarUrl
                    ? 'Cambiar foto'
                    : 'Subir foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    disabled={avatarBusy}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

                {profile.avatarUrl && (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => void handleRemoveAvatar()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Eliminar foto
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="flex items-center gap-2 text-company-primary">
              <ShieldCheck
                size={19}
              />

              <h2 className="font-bold text-slate-900">
                Acceso asignado
              </h2>
            </div>

            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Rol
                </dt>

                <dd className="mt-1">
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {profile.role}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Empresa
                </dt>

                <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Building2
                    size={16}
                    className="text-company-primary"
                  />

                  {profile.company.name}
                </dd>
              </div>
            </dl>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
              Para cambiar rol, empresa, estado o nombre de usuario, debe intervenir un administrador de InfraStock.
            </p>
          </section>


        </aside>
      </div>
    </div>
  );
}
