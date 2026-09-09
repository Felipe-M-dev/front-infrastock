import {
  useEffect,
} from 'react';

import {
  Activity,
  CheckCircle2,
  FilePlus2,
  History,
  Loader2,
  Pencil,
  Power,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';

import {
  type AuditLog,
} from '../services/audit.service';

import {
  formatDateTime,
} from '../utils/date';

interface AuditChange {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
  beforeValue?: unknown;
  afterValue?: unknown;
}

interface AuditHistoryModalProps {
  open: boolean;
  title: string;
  loading: boolean;
  error: string;
  items: AuditLog[];
  canRevert?: boolean;
  onClose: () => void;
  onRevert?: (
    item: AuditLog,
  ) => void;
}

export default function AuditHistoryModal({
  open,
  title,
  loading,
  error,
  items,
  canRevert = false,
  onClose,
  onRevert,
}: AuditHistoryModalProps) {

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose();
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
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function getActionLabel(
    action: string,
  ) {
    switch (action) {
      case 'CREATE':
        return 'Creado';

      case 'UPDATE':
        return 'Modificado';

      case 'DELETE':
        return 'Eliminado';

      case 'ACTIVATE':
        return 'Activado';

      case 'DEACTIVATE':
        return 'Desactivado';

      case 'REVERT':
        return 'Cambio revertido';

      default:
        return action;
    }
  }

  function getActionIcon(
    action: string,
  ) {
    switch (action) {
      case 'CREATE':
        return (
          <FilePlus2
            size={18}
          />
        );

      case 'UPDATE':
        return (
          <Pencil
            size={18}
          />
        );

      case 'DELETE':
        return (
          <Trash2
            size={18}
          />
        );

      case 'ACTIVATE':
        return (
          <CheckCircle2
            size={18}
          />
        );

      case 'DEACTIVATE':
        return (
          <Power
            size={18}
          />
        );

      case 'REVERT':
        return (
          <RotateCcw
            size={18}
          />
        );

      default:
        return (
          <Activity
            size={18}
          />
        );
    }
  }

  function getActionTone(
    action: string,
  ) {
    switch (action) {
      case 'CREATE':
      case 'ACTIVATE':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';

      case 'DELETE':
      case 'DEACTIVATE':
        return 'border-red-200 bg-red-50 text-red-700';

      case 'REVERT':
        return 'border-amber-200 bg-amber-50 text-amber-700';

      case 'UPDATE':
        return 'border-company-primary/20 bg-company-primary/10 text-company-primary';

      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  }

  function getMessage(
    item: AuditLog,
  ) {
    const message =
      item.details?.message;

    if (
      typeof message ===
      'string'
    ) {
      return message;
    }

    return getActionLabel(
      item.action,
    );
  }

  function getFields(
    item: AuditLog,
  ): string[] {
    const fields =
      item.details?.fields;

    if (
      !Array.isArray(fields)
    ) {
      return [];
    }

    return fields.filter(
      (
        field,
      ): field is string =>
        typeof field ===
        'string',
    );
  }

  function getChanges(
    item: AuditLog,
  ): AuditChange[] {
    const changes =
      item.details?.changes;

    if (
      !Array.isArray(changes)
    ) {
      return [];
    }

    return changes.filter(
      (
        change,
      ): change is AuditChange => {
        if (
          typeof change !==
            'object' ||
          change === null
        ) {
          return false;
        }

        const value =
          change as Record<
            string,
            unknown
          >;

        return (
          typeof value.field ===
            'string' &&
          typeof value.label ===
            'string'
        );
      },
    );
  }

  function getRevertEventId(
    item: AuditLog,
  ): number | null {
    if (
      item.action !==
        'UPDATE'
    ) {
      return null;
    }

    const revertEvent =
      items.find(
        (historyItem) =>
          historyItem.action ===
            'REVERT' &&
          historyItem.details
            ?.sourceAuditLogId ===
            item.id,
      );

    return (
      revertEvent?.id ??
      null
    );
  }

  function isReversible(
    item: AuditLog,
  ) {
    if (
      !canRevert ||
      !onRevert ||
      item.action !==
        'UPDATE'
    ) {
      return false;
    }

    if (
      getRevertEventId(
        item,
      ) !==
      null
    ) {
      return false;
    }

    const changes =
      getChanges(
        item,
      );

    if (
      changes.length ===
      0
    ) {
      return false;
    }

    return changes.every(
      (change) =>
        Object.prototype.hasOwnProperty.call(
          change,
          'beforeValue',
        ) &&
        Object.prototype.hasOwnProperty.call(
          change,
          'afterValue',
        ),
    );
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
      typeof value ===
      'boolean'
    ) {
      return value
        ? 'Sí'
        : 'No';
    }

    if (
      Array.isArray(value)
    ) {
      if (
        value.length === 0
      ) {
        return 'Ninguno';
      }

      return value
        .map((item) =>
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

    return String(value);
  }

  function renderChange(
    change: AuditChange,
  ) {
    const before =
      formatValue(
        change.before,
        change.field,
      );

    const after =
      formatValue(
        change.after,
        change.field,
      );

    return (
      <div
        key={
          change.field
        }
        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          {change.label}
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Antes
            </p>

            <p className="break-words text-sm text-slate-700">
              {before}
            </p>
          </div>

          <div className="hidden rounded-full bg-white px-2 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200 sm:block">
            →
          </div>

          <div className="rounded-xl border border-company-primary/20 bg-white px-3 py-2.5 shadow-sm">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-company-primary">
              Después
            </p>

            <p className="break-words text-sm font-semibold text-slate-900">
              {after}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div role="dialog" aria-modal="true" aria-labelledby="audit-history-title" className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[90vh]">
        <div className="h-1 shrink-0 bg-company-primary" />

        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
              <History
                size={20}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Auditoría
              </p>

              <h2 id="audit-history-title" className="mt-1 text-lg font-bold text-slate-900">
                Historial
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
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
                  className="animate-spin text-company-primary"
                />

                Cargando historial...
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : items.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-200">
                <History
                  size={24}
                />
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Este recurso todavía no tiene eventos registrados.
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute bottom-0 left-[19px] top-0 w-px bg-slate-200" />

              <div className="space-y-7">
                {items.map(
                  (item) => {
                    const fields =
                      getFields(
                        item,
                      );

                    const changes =
                      getChanges(
                        item,
                      );

                    const reversible =
                      isReversible(
                        item,
                      );

                    const revertedByEventId =
                      getRevertEventId(
                        item,
                      );

                    return (
                      <article
                        key={
                          item.id
                        }
                        className="relative flex gap-4"
                      >
                        <div
                          className={[
                            'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm',
                            getActionTone(
                              item.action,
                            ),
                          ].join(' ')}
                        >
                          {getActionIcon(
                            item.action,
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pb-1">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-900">
                                    {getMessage(
                                      item,
                                    )}
                                  </p>

                                  <span
                                    className={[
                                      'rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
                                      getActionTone(
                                        item.action,
                                      ),
                                    ].join(' ')}
                                  >
                                    {getActionLabel(
                                      item.action,
                                    )}
                                  </span>
                                </div>

                                <p className="mt-2 text-sm text-slate-500">
                                  por{' '}
                                  <span className="font-tech font-semibold text-slate-700">
                                    {item.user
                                      ?.username ??
                                      'Usuario desconocido'}
                                  </span>

                                  {item.user
                                    ?.name &&
                                    ` · ${item.user.name}`}
                                </p>
                              </div>

                              <span className="shrink-0 text-xs text-slate-400">
                                {formatDateTime(
                                  item.createdAt,
                                )}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.company && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  Empresa: {
                                    item
                                      .company
                                      .name
                                  }
                                </span>
                              )}

                              {item.action ===
                                'REVERT' &&
                                typeof item.details
                                  ?.sourceAuditLogId ===
                                  'number' && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                                    Evento origen #
                                    {
                                      item
                                        .details
                                        .sourceAuditLogId as number
                                    }
                                  </span>
                                )}
                            </div>

                            {changes.length >
                              0 && (
                              <div className="mt-4 space-y-3">
                                {changes.map(
                                  (
                                    change,
                                  ) =>
                                    renderChange(
                                      change,
                                    ),
                                )}
                              </div>
                            )}

                            {changes.length ===
                              0 &&
                              fields.length >
                                0 && (
                                <div className="mt-4">
                                  <p className="mb-2 text-xs font-semibold text-slate-500">
                                    Campos incluidos en la modificación
                                  </p>

                                  <div className="flex flex-wrap gap-1.5">
                                    {fields.map(
                                      (
                                        field,
                                      ) => (
                                        <span
                                          key={
                                            field
                                          }
                                          className="font-tech rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                        >
                                          {
                                            field
                                          }
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {revertedByEventId !==
                              null && (
                              <div className="mt-4 flex justify-end">
                                <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                  <CheckCircle2
                                    size={16}
                                  />

                                  Revertido · evento #
                                  {
                                    revertedByEventId
                                  }
                                </span>
                              </div>
                            )}

                            {reversible && (
                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRevert?.(
                                      item,
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                                >
                                  <RotateCcw
                                    size={16}
                                  />

                                  Revertir cambio
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
