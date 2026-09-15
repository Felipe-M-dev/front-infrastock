import { useEffect, useState, type FormEvent } from "react";
import {
  Copy,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import ConfirmDialog from "./ConfirmDialog";
import PersonalVaultDialog from "./PersonalVaultDialog";
import { useToast } from "./ToastProvider";
import {
  copyPersonalPassword,
  deletePersonalCredential,
  getPersonalCredentials,
  savePersonalCredential,
  type PersonalCredential,
  type PersonalCredentialList,
} from "../services/personal-credentials.service";

const control =
  "ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-company-primary focus:ring-2 focus:ring-company-primary/10";

const emptyForm = {
  name: "",
  username: "",
  password: "",
  location: "",
  notes: "",
};

export default function PersonalCredentialsPanel({
  ownerId,
}: {
  ownerId?: number;
}) {
  const readOnly = ownerId !== undefined;
  const toast = useToast();

  const [response, setResponse] = useState<{
    key: string;
    data: PersonalCredentialList | null;
    error: string;
  } | null>(null);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<PersonalCredential | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PersonalCredential | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const requestKey = JSON.stringify([search, page, ownerId, revision]);
  const loading = response?.key !== requestKey;
  const data = loading ? null : response?.data;
  const error = loading ? "" : response?.error;

  useEffect(() => {
    const abort = new AbortController();

    getPersonalCredentials(search, page, ownerId, abort.signal)
      .then((result) => {
        if (!abort.signal.aborted) {
          setResponse({ key: requestKey, data: result, error: "" });
        }
      })
      .catch((err: unknown) => {
        if (!abort.signal.aborted) {
          setResponse({
            key: requestKey,
            data: null,
            error:
              err instanceof Error
                ? err.message
                : "No fue posible cargar las credenciales.",
          });
        }
      });

    return () => abort.abort();
  }, [search, page, ownerId, requestKey]);

  function openForm(item?: PersonalCredential) {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            username: item.username,
            password: "",
            location: item.location ?? "",
            notes: item.notes ?? "",
          }
        : emptyForm,
    );
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (!saving) {
      setFormOpen(false);
      setForm(emptyForm);
      setEditing(null);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (saving || readOnly) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await savePersonalCredential(
        {
          ...form,
          name: form.name.trim(),
          username: form.username.trim(),
          password: editing && !form.password ? undefined : form.password,
        },
        editing?.id,
      );

      setForm(emptyForm);
      setFormOpen(false);
      setEditing(null);
      setRevision((value) => value + 1);

      toast.success(
        "Credencial guardada",
        "Tu credencial personal se guardó correctamente.",
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar la credencial.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copy(item: PersonalCredential) {
    if (copying !== null) {
      return;
    }

    setCopying(item.id);

    try {
      await copyPersonalPassword(item.id, ownerId);
      toast.success(
        "Contraseña copiada",
        "La contraseña está en el portapapeles.",
      );
    } catch (err) {
      toast.error(
        "No fue posible copiar",
        err instanceof Error ? err.message : "Intenta nuevamente.",
      );
    } finally {
      setCopying(null);
    }
  }

  async function remove() {
    if (!pendingDelete || deleting || readOnly) {
      return;
    }

    setDeleting(true);

    try {
      await deletePersonalCredential(pendingDelete.id);
      setPendingDelete(null);
      setRevision((value) => value + 1);
      toast.success(
        "Credencial eliminada",
        "La credencial personal fue eliminada.",
      );
    } catch (err) {
      toast.error(
        "No fue posible eliminar",
        err instanceof Error ? err.message : "Intenta nuevamente.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const visibleItems = data?.items.length ?? 0;
  const totalItems = data?.total ?? 0;
  const withLocation = data?.items.filter((item) => Boolean(item.location)).length ?? 0;
  const withNotes = data?.items.filter((item) => Boolean(item.notes)).length ?? 0;
  const ownerLabel = data?.owner
    ? `${data.owner.name} (${data.owner.username})`
    : "Usuario";



  return (
    <section
      className="space-y-6"
      aria-label={
        readOnly ? "Consulta de credenciales personales" : "Mis credenciales"
      }
    >
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <KeyRound size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                {readOnly ? "Consulta supervisada" : "Accesos personales protegidos"}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-company-default sm:text-3xl">
                {readOnly
                  ? "Credenciales personales del usuario"
                  : "Mis credenciales"}
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                {readOnly
                  ? "Vista de solo lectura. Las contraseñas permanecen ocultas, solo pueden copiarse y cada consulta queda registrada en auditoría."
                  : "Tu bóveda privada para guardar accesos personales."}
              </p>

              {readOnly && data?.owner && (
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  <ShieldCheck size={14} className="shrink-0 text-company-primary" />
                  <span className="truncate">Propietario: {ownerLabel}</span>
                </div>
              )}
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={() => openForm()}
              type="button"
              className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              <Plus size={18} />
              Nueva credencial
            </button>
          )}
        </div>
      </section>

      <section
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumen de credenciales personales"
      >
        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {readOnly ? "Visibles" : "Guardadas"}
          </p>
          <p className="mt-2 text-2xl font-bold text-company-default">
            {loading ? "—" : totalItems}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Con sitio
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-800">
            {loading ? "—" : withLocation}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Con notas
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            {loading ? "—" : withNotes}
          </p>
        </div>

        <div className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            En página
          </p>
          <p className="mt-2 text-2xl font-bold text-company-default">
            {loading ? "—" : visibleItems}
          </p>
        </div>
      </section>

      <section className="ui-table-shell ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-5">
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(draftSearch.trim());
          }}
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Buscar credenciales personales"
              className={`${control} pl-10`}
              value={draftSearch}
              maxLength={160}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Buscar por nombre, usuario o sitio"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              aria-label="Buscar credenciales personales"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-company-primary transition hover:bg-company-primary/5"
            >
              <Search size={17} />
              Buscar
            </button>
            {draftSearch || search ? (
              <button
                type="button"
                onClick={() => {
                  setDraftSearch("");
                  setSearch("");
                  setPage(1);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => setRevision((value) => value + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading && (
        <div className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-8 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p role="status" className="flex items-center gap-2">
            <LoaderCircle size={18} className="animate-spin" />
            Cargando credenciales…
          </p>
        </div>
      )}

      {!loading && data && (
        <>
          {data.items.length === 0 ? (
            <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 py-14 text-center shadow-sm backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-500">
                {search
                  ? "No hay credenciales que coincidan con la búsqueda."
                  : "Todavía no hay credenciales personales guardadas."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.items.map((item) => (
                <article
                  key={item.id}
                  className="ui-panel min-w-0 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold text-company-default">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Actualizada {new Date(item.updatedAt).toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="rounded-xl bg-company-primary/10 p-2 text-company-primary ring-1 ring-company-primary/10">
                        <KeyRound size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Usuario
                        </dt>
                        <dd className="mt-1 break-all font-mono text-company-default">
                          {item.username}
                        </dd>
                      </div>

                      {item.location ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Sitio / sistema
                          </dt>
                          <dd className="mt-1 break-words text-company-default">
                            {item.location}
                          </dd>
                        </div>
                      ) : null}

                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Contraseña
                        </dt>
                        <dd
                          className="mt-1 tracking-[0.28em] text-slate-500"
                          aria-label="Contraseña oculta"
                        >
                          ••••••••••••
                        </dd>
                      </div>

                      {item.notes ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:col-span-2">
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Notas
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap break-words text-company-default">
                            {item.notes}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4">
                    <button
                      type="button"
                      disabled={copying !== null}
                      onClick={() => void copy(item)}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-company-primary transition hover:bg-company-primary/10 disabled:opacity-50"
                    >
                      {copying === item.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Copy size={16} />
                      )}
                      Copiar contraseña
                    </button>

                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => openForm(item)}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <nav
            aria-label="Paginación de credenciales"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm text-slate-500 shadow-sm backdrop-blur-sm"
          >
            <span>
              {data.total} credenciales · Página {data.page} de {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => setPage(data.page - 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage(data.page + 1)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </nav>
        </>
      )}

      {formOpen && !readOnly && (
        <PersonalVaultDialog
          eyebrow="Bóveda personal"
          title={editing ? "Editar credencial personal" : "Nueva credencial personal"}
          description={
            editing
              ? "Actualiza los datos de acceso. Si no ingresas una nueva contraseña, se conservará la actual."
              : "Registra un acceso de uso personal. La contraseña permanecerá oculta después de guardar."
          }
          busy={saving}
          onClose={closeForm}
        >
          <form
            onSubmit={(event) => void save(event)}
            className="space-y-4"
            autoComplete="off"
          >
            {formError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {formError}
              </p>
            )}

            <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold text-company-default">
                <span>Nombre *</span>
                <input
                  required
                  maxLength={160}
                  className={control}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ej: Portal de soporte"
                />
              </label>

              <label className="space-y-1 text-sm font-semibold text-company-default">
                <span>Usuario *</span>
                <input
                  required
                  maxLength={254}
                  className={control}
                  value={form.username}
                  onChange={(event) =>
                    setForm({ ...form, username: event.target.value })
                  }
                  autoComplete="off"
                />
              </label>

              <label className="space-y-1 text-sm font-semibold text-company-default">
                <span>{editing ? "Nueva contraseña" : "Contraseña *"}</span>
                <input
                  type="password"
                  required={!editing}
                  maxLength={4096}
                  className={control}
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  autoComplete="new-password"
                />
                {editing && (
                  <span className="block text-xs font-normal text-slate-500">
                    Déjala vacía para conservar la contraseña actual.
                  </span>
                )}
              </label>

              <label className="space-y-1 text-sm font-semibold text-company-default">
                <span>Sitio / sistema</span>
                <input
                  maxLength={500}
                  className={control}
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                  placeholder="URL, equipo o aplicación"
                />
              </label>

              <label className="space-y-1 text-sm font-semibold text-company-default sm:col-span-2">
                <span>Notas</span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  className={control}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                />
              </label>
            </fieldset>

            <footer className="-mx-5 -mb-5 mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="ui-btn inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
              >
                {saving && <LoaderCircle size={17} className="animate-spin" />}
                Guardar credencial
              </button>
            </footer>
          </form>
        </PersonalVaultDialog>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar credencial personal"
        description="La credencial se eliminará de tu bóveda. Esta acción no se puede deshacer."
        detail={<p className="break-words font-semibold">{pendingDelete?.name}</p>}
        tone="danger"
        confirmLabel="Eliminar credencial"
        busy={deleting}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={remove}
      />
    </section>
  );
}
