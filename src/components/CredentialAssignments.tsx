import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  Check,
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';

import ConfirmDialog from './ConfirmDialog';

import {
  assignCredentialToServer,
  assignCredentialToServerSoftware,
  copyCredentialPassword,
  getCredentials,
  getServerCredentialAssignments,
  getServerSoftwareCredentialAssignments,
  unassignCredentialFromServer,
  unassignCredentialFromServerSoftware,
  type Credential,
  type CredentialAssignment,
} from '../services/credentials.service';

type CredentialTarget =
  | 'SERVER'
  | 'SOFTWARE';

interface CredentialAssignmentsProps {
  target:
    CredentialTarget;

  targetId:
    number;

  environment:
    string | null;

  title?:
    string;

  compact?:
    boolean;
}

const accountTypeLabels:
  Record<
    Credential['accountType'],
    string
  > = {
    ADMINISTRATOR:
      'Administrador',
    OPERATION:
      'Operación',
    SERVICE:
      'Servicio',
    APPLICATION:
      'Aplicación',
    READ_ONLY:
      'Solo lectura',
    DATABASE:
      'Base de datos',
    INTEGRATION:
      'Integración',
    OTHER:
      'Otro',
  };

const scopeLabels:
  Record<
    Credential['scope'],
    string
  > = {
    GLOBAL:
      'Global',
    COMPANY:
      'Empresa',
    SERVER:
      'Servidor',
    SOFTWARE:
      'Software',
  };

function isEnvironmentCompatible(
  credential:
    Credential,
  environment:
    string | null,
) {
  if (
    !credential.environment ||
    !environment
  ) {
    return true;
  }

  return (
    credential.environment.toUpperCase() ===
    environment.toUpperCase()
  );
}

function isScopeCompatible(
  credential:
    Credential,
  target:
    CredentialTarget,
) {
  if (
    target ===
    'SERVER'
  ) {
    return (
      credential.scope !==
      'SOFTWARE'
    );
  }

  return (
    credential.scope !==
    'SERVER'
  );
}

export default function CredentialAssignments({
  target,
  targetId,
  environment,
  title,
  compact = false,
}: CredentialAssignmentsProps) {
  const [
    assignments,
    setAssignments,
  ] = useState<
    CredentialAssignment[]
  >([]);

  const [
    availableCredentials,
    setAvailableCredentials,
  ] = useState<
    Credential[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    success,
    setSuccess,
  ] = useState<
    string | null
  >(null);

  const [
    assignOpen,
    setAssignOpen,
  ] = useState(
    false,
  );

  const [
    credentialId,
    setCredentialId,
  ] = useState(
    '',
  );

  const [
    purpose,
    setPurpose,
  ] = useState(
    '',
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );

  const [
    copyingId,
    setCopyingId,
  ] = useState<
    number | null
  >(null);

  const [
    removingId,
    setRemovingId,
  ] = useState<
    number | null
  >(null);

  const [
    pendingRemove,
    setPendingRemove,
  ] = useState<
    CredentialAssignment | null
  >(null);

  const loadAssignments =
    useCallback(async () => {
      setLoading(
        true,
      );

      setError(
        null,
      );

      try {
        const data =
          target ===
          'SERVER'
            ? await getServerCredentialAssignments(
                targetId,
              )
            : await getServerSoftwareCredentialAssignments(
                targetId,
              );

        setAssignments(
          data,
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No fue posible cargar las credenciales asociadas.',
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, [
      target,
      targetId,
    ]);

  useEffect(() => {
    void loadAssignments();
  }, [
    loadAssignments,
  ]);

  const assignmentCredentialIds =
    useMemo(
      () =>
        new Set(
          assignments.map(
            (item) =>
              item.credential.id,
          ),
        ),
      [assignments],
    );

  const selectableCredentials =
    useMemo(
      () =>
        availableCredentials.filter(
          (credential) =>
            credential.active &&
            !assignmentCredentialIds.has(
              credential.id,
            ) &&
            isScopeCompatible(
              credential,
              target,
            ) &&
            isEnvironmentCompatible(
              credential,
              environment,
            ),
        ),
      [
        availableCredentials,
        assignmentCredentialIds,
        target,
        environment,
      ],
    );

  async function openAssign() {
    setError(
      null,
    );

    setSuccess(
      null,
    );

    setCredentialId(
      '',
    );

    setPurpose(
      '',
    );

    setAssignOpen(
      true,
    );

    try {
      const data =
        await getCredentials({
          active:
            true,
        });

      setAvailableCredentials(
        data,
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible obtener las credenciales disponibles.',
      );
    }
  }

  async function handleAssign(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedCredentialId =
      Number(
        credentialId,
      );

    if (
      !Number.isInteger(
        parsedCredentialId,
      ) ||
      parsedCredentialId <= 0
    ) {
      setError(
        'Selecciona una credencial.',
      );

      return;
    }

    setSaving(
      true,
    );

    setError(
      null,
    );

    try {
      const payload = {
        credentialId:
          parsedCredentialId,

        purpose:
          purpose.trim() ||
          undefined,
      };

      if (
        target ===
        'SERVER'
      ) {
        await assignCredentialToServer(
          targetId,
          payload,
        );
      } else {
        await assignCredentialToServerSoftware(
          targetId,
          payload,
        );
      }

      setAssignOpen(
        false,
      );

      setSuccess(
        'Credencial asociada correctamente.',
      );

      await loadAssignments();
    } catch (assignError) {
      setError(
        assignError instanceof Error
          ? assignError.message
          : 'No fue posible asociar la credencial.',
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  async function handleCopy(
    assignment:
      CredentialAssignment,
  ) {
    setError(
      null,
    );

    setSuccess(
      null,
    );

    setCopyingId(
      assignment.credential.id,
    );

    try {
      await copyCredentialPassword(
        assignment.credential.id,
      );

      setSuccess(
        '✓ Contraseña copiada al portapapeles',
      );
    } catch (copyError) {
      setError(
        copyError instanceof Error
          ? copyError.message
          : 'No fue posible copiar la contraseña.',
      );
    } finally {
      setCopyingId(
        null,
      );
    }
  }

  function handleRemove(
    assignment:
      CredentialAssignment,
  ) {
    setPendingRemove(
      assignment,
    );
  }

  async function confirmRemove() {
    const assignment =
      pendingRemove;

    if (!assignment) {
      return;
    }

    setRemovingId(
      assignment.credential.id,
    );

    setError(
      null,
    );

    setSuccess(
      null,
    );

    try {
      if (
        target ===
        'SERVER'
      ) {
        await unassignCredentialFromServer(
          targetId,
          assignment.credential.id,
        );
      } else {
        await unassignCredentialFromServerSoftware(
          targetId,
          assignment.credential.id,
        );
      }

      setSuccess(
        'Credencial desvinculada correctamente.',
      );

      setPendingRemove(
        null,
      );

      await loadAssignments();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'No fue posible desvincular la credencial.',
      );
    } finally {
      setRemovingId(
        null,
      );
    }
  }

  return (
    <div
      className={
        compact
          ? 'mt-4 border-t border-slate-100 pt-4'
          : ''
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
                <KeyRound
                  size={
                    17
                  }
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Accesos vinculados
                </p>

                <h3 className="mt-1 font-bold text-slate-900">
                  {title}
                </h3>
              </div>
            </div>
          )}

          {!compact && (
            <p className={title ? 'mt-3 text-sm leading-6 text-slate-500' : 'text-sm leading-6 text-slate-500'}>
              Las contraseñas no se muestran en pantalla. Solo pueden copiarse al portapapeles.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            void openAssign()
          }
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-company-primary/30 bg-white px-3 py-2 text-sm font-semibold text-company-primary shadow-sm transition hover:bg-company-primary/5"
        >
          <Link2
            size={
              16
            }
          />

          Asociar credencial
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
          <Check
            size={
              16
            }
          />

          {success}
        </div>
      )}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-500">
          <Loader2
            size={
              16
            }
            className="animate-spin text-company-primary"
          />

          Cargando accesos...
        </div>
      ) : assignments.length ===
        0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-5 text-center text-sm text-slate-500">
          Sin credenciales asociadas.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {assignments.map(
            (assignment) => (
              <article
                key={
                  assignment.id
                }
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {
                          assignment
                            .credential
                            .name
                        }
                      </p>

                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        {
                          accountTypeLabels[
                            assignment
                              .credential
                              .accountType
                          ]
                        }
                      </span>

                      <span className="rounded-full bg-company-primary/10 px-2 py-0.5 text-xs font-semibold text-company-primary ring-1 ring-company-primary/10">
                        {
                          scopeLabels[
                            assignment
                              .credential
                              .scope
                          ]
                        }
                      </span>

                      {assignment.credential.environment && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                          {assignment.credential.environment}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>
                        Usuario:{' '}
                        <strong className="font-tech font-semibold text-slate-800">
                          {
                            assignment
                              .credential
                              .username
                          }
                        </strong>
                      </span>

                      {assignment.purpose && (
                        <span>
                          Uso:{' '}
                          {
                            assignment.purpose
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        copyingId ===
                        assignment
                          .credential
                          .id
                      }
                      onClick={() =>
                        void handleCopy(
                          assignment,
                        )
                      }
                      className="btn-company-primary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {copyingId ===
                      assignment
                        .credential
                        .id ? (
                        <Loader2
                          size={
                            16
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Copy
                          size={
                            16
                          }
                        />
                      )}

                      {copyingId ===
                      assignment
                        .credential
                        .id
                        ? 'Copiando...'
                        : 'Copiar contraseña'}
                    </button>

                    <button
                      type="button"
                      disabled={
                        removingId ===
                        assignment
                          .credential
                          .id
                      }
                      onClick={() =>
                        void handleRemove(
                          assignment,
                        )
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      title="Desvincular credencial"
                      aria-label="Desvincular credencial"
                    >
                      {removingId ===
                      assignment
                        .credential
                        .id ? (
                        <Loader2
                          size={
                            16
                          }
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={
                            16
                          }
                        />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => {
              if (!saving) {
                setAssignOpen(
                  false,
                );
              }
            }}
          />

          <div className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[90vh]">
            <div className="h-1 shrink-0 bg-company-primary" />

            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
                  <KeyRound
                    size={
                      17
                    }
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Bóveda de credenciales
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    Asociar credencial
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Selecciona una credencial existente de la bóveda.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  setAssignOpen(
                    false,
                  )
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X
                  size={
                    20
                  }
                />
              </button>
            </div>

            <form
              onSubmit={
                handleAssign
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">
                    Credencial *
                  </span>

                  <select
                    required
                    value={
                      credentialId
                    }
                    onChange={(
                      event,
                    ) =>
                      setCredentialId(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    <option value="">
                      Seleccionar credencial
                    </option>

                    {selectableCredentials.map(
                      (credential) => (
                        <option
                          key={
                            credential.id
                          }
                          value={
                            credential.id
                          }
                        >
                          {credential.name} · {credential.username} · {credential.company?.name ?? 'Global'}{credential.environment ? ` · ${credential.environment}` : ''}
                        </option>
                      ),
                    )}
                  </select>

                  {selectableCredentials.length ===
                    0 && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      No hay credenciales activas compatibles disponibles para asociar.
                    </p>
                  )}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-slate-700">
                    Propósito / uso
                  </span>

                  <input
                    value={
                      purpose
                    }
                    onChange={(
                      event,
                    ) =>
                      setPurpose(
                        event.target.value,
                      )
                    }
                    placeholder={
                      target ===
                      'SERVER'
                        ? 'Ej: Acceso administrativo al sistema operativo'
                        : 'Ej: Acceso administrativo a la aplicación'
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  />
                </label>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    setAssignOpen(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !credentialId
                  }
                  className="btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2
                      size={
                        16
                      }
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? 'Asociando...'
                    : 'Asociar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        eyebrow="Acceso vinculado"
        title="Desvincular credencial"
        description={
          pendingRemove
            ? `¿Desvincular la credencial "${pendingRemove.credential.name}"? La credencial seguirá existiendo en la bóveda.`
            : ''
        }
        tone="warning"
        confirmLabel="Desvincular"
        busy={removingId !== null}
        onClose={() => {
          if (removingId === null) {
            setPendingRemove(null);
          }
        }}
        onConfirm={() =>
          void confirmRemove()
        }
      />
    </div>
  );
}
