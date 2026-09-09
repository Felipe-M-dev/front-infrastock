import {
  useEffect,
} from 'react';

import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';

import {
  type RevertPreviewResponse,
} from '../services/audit.service';

interface AuditRevertModalProps {
  open: boolean;
  preview:
    RevertPreviewResponse | null;
  loading: boolean;
  reverting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AuditRevertModal({
  open,
  preview,
  loading,
  reverting,
  error,
  onClose,
  onConfirm,
}: AuditRevertModalProps) {

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );
    };
  }, [open, reverting, onClose]);

  if (!open) {
    return null;
  }

  function formatValue(
    value: unknown,
    field?: string,
  ): string {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'Sin valor';
    }

    if (
      field === 'ramGb' ||
      field === 'diskGb'
    ) {
      return `${String(value)} GB`;
    }

    if (
      field === 'cpuCores'
    ) {
      return `${String(value)} cores`;
    }

    if (
      typeof value ===
      'boolean'
    ) {
      return value
        ? 'Sí'
        : 'No';
    }

    if (
      Array.isArray(
        value,
      )
    ) {
      if (
        value.length ===
        0
      ) {
        return 'Ninguno';
      }

      return value
        .map(
          (item) =>
            typeof item ===
              'string'
              ? item
              : JSON.stringify(
                  item,
                ),
        )
        .join(', ');
    }

    if (
      typeof value ===
      'object'
    ) {
      return JSON.stringify(
        value,
      );
    }

    return String(
      value,
    );
  }

  function handleClose() {
    if (
      reverting
    ) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={
          handleClose
        }
      />

      <div role="alertdialog" aria-modal="true" aria-labelledby="audit-revert-title" className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[90vh]">
        <div className="h-1 shrink-0 bg-amber-500" />

        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <RotateCcw
                size={20}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                Auditoría
              </p>

              <h2 id="audit-revert-title" className="mt-1 text-lg font-bold text-slate-900">
                Revertir cambio
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {preview?.entityName ??
                  'Servidor'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              reverting
            }
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X
              size={20}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {loading ? (
            <div className="flex min-h-44 items-center justify-center">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-500">
                <Loader2
                  size={17}
                  className="animate-spin text-amber-600"
                />

                Preparando reversión...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : !preview ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
              No hay información disponible para la reversión.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-amber-700 ring-1 ring-amber-200">
                    <AlertTriangle
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Esta operación modificará el servidor.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Se restaurarán únicamente los campos incluidos en este evento.
                      La reversión generará una nueva entrada en el historial.
                    </p>
                  </div>
                </div>
              </div>

              {preview.hasLaterChanges && (
                <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-orange-700 ring-1 ring-orange-200">
                      <AlertTriangle
                        size={18}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-orange-900">
                        Hay cambios posteriores.
                      </p>

                      <p className="mt-1 text-sm leading-6 text-orange-800">
                        Uno o más campos fueron modificados nuevamente después de este evento.
                        Revisa cuidadosamente los valores antes de continuar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {preview.changes.map(
                  (change) => (
                    <article
                      key={
                        change.field
                      }
                      className={
                        change.changedAfterEvent
                          ? 'rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm'
                          : 'rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm'
                      }
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            Campo
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {
                              change.label
                            }
                          </p>
                        </div>

                        {change.changedAfterEvent && (
                          <span className="w-fit rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                            Modificado posteriormente
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Valor actual
                          </p>

                          <p className="break-words text-sm font-medium text-slate-800">
                            {formatValue(
                              change.currentDisplay,
                              change.field,
                            )}
                          </p>
                        </div>

                        <div className="hidden rounded-full bg-white px-2 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200 sm:block">
                          →
                        </div>

                        <div className="rounded-xl border border-amber-200 bg-white px-3 py-2.5">
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                            Restaurar a
                          </p>

                          <p className="break-words text-sm font-semibold text-slate-900">
                            {formatValue(
                              change.targetDisplay,
                              change.field,
                            )}
                          </p>
                        </div>
                      </div>

                      {change.warning && (
                        <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                          <p className="text-xs font-semibold leading-5 text-orange-700">
                            {
                              change.warning
                            }
                          </p>
                        </div>
                      )}
                    </article>
                  ),
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              reverting
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              onConfirm
            }
            disabled={
              loading ||
              reverting ||
              !preview ||
              preview.changes.length ===
                0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reverting ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <RotateCcw
                size={17}
              />
            )}

            {reverting
              ? 'Revirtiendo...'
              : 'Confirmar reversión'}
          </button>
        </div>
      </div>
    </div>
  );
}
