import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Upload,
  X,
} from 'lucide-react';

import {
  confirmServerImport,
  downloadServerImportTemplate,
  getServerImportHistory,
  previewServerImport,
  type ServerImportAction,
  type ServerImportBatch,
} from '../services/server-imports.service';

interface ServerImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => Promise<void> | void;
}

const ACTION_LABELS: Record<ServerImportAction, string> = {
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  REACTIVATE: 'Reactivar',
  SKIP: 'Omitir',
};

function getBatchStatusClasses(
  status: ServerImportBatch['status'],
) {
  if (
    status === 'COMPLETED'
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    status === 'PARTIAL'
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (
    status === 'FAILED'
  ) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export default function ServerImportModal({
  open,
  onClose,
  onImported,
}: ServerImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ServerImportBatch | null>(null);
  const [history, setHistory] = useState<ServerImportBatch[]>([]);
  const [decisions, setDecisions] = useState<Record<number, ServerImportAction>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setFile(null);
    setBatch(null);
    setDecisions({});
    setError('');
    void loadHistory();
  }, [open]);

  async function loadHistory() {
    try {
      setHistory(
        await getServerImportHistory(),
      );
    } catch {
      setHistory([]);
    }
  }

  async function handlePreview() {
    if (!file) {
      setError(
        'Selecciona un archivo CSV o XLSX.',
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result =
        await previewServerImport(
          file,
        );

      setBatch(
        result,
      );

      const initial:
        Record<
          number,
          ServerImportAction
        > = {};

      result.rows?.forEach(
        (row) => {
          initial[row.id] =
            row.suggestedAction;
        },
      );

      setDecisions(
        initial,
      );

      await loadHistory();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No fue posible prevalidar el archivo.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!batch?.rows) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result =
        await confirmServerImport(
          batch.id,
          batch.rows.map(
            (row) => ({
              rowId:
                row.id,
              action:
                decisions[row.id] ??
                row.suggestedAction,
            }),
          ),
        );

      setBatch(
        result,
      );

      await loadHistory();
      await onImported();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No fue posible confirmar la carga masiva.',
      );
    } finally {
      setLoading(false);
    }
  }

  const executableRows =
    useMemo(
      () =>
        batch?.rows?.filter(
          (row) =>
            row.validationStatus ===
              'VALID' &&
            (
              decisions[row.id] ??
              row.suggestedAction
            ) !==
              'SKIP',
        ).length ??
        0,
      [
        batch,
        decisions,
      ],
    );


  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !loading
      ) {
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
  }, [
    open,
    loading,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={
          onClose
        }
      />

      <div role="dialog" aria-modal="true" aria-labelledby="server-import-title" className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[92vh]">
        <div className="h-1 shrink-0 bg-company-primary" />

        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-company-primary">
              <Upload
                size={20}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Inventario de infraestructura
              </p>

              <h2 id="server-import-title" className="mt-1 text-lg font-bold text-slate-900">
                Carga masiva de servidores
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                CSV/XLSX · prevalidación · vista previa · confirmación explícita
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X
              size={20}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Paso 1
                  </p>

                  <h3 className="mt-1 font-bold text-slate-900">
                    Seleccionar archivo
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Máximo 5 MB y 1000 filas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void downloadServerImportTemplate()
                      .catch(
                        (caught) =>
                          setError(
                            caught instanceof Error
                              ? caught.message
                              : 'No fue posible descargar la plantilla.',
                          ),
                      )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-company-primary hover:text-company-primary"
                >
                  <Download
                    size={17}
                  />

                  Plantilla oficial
                </button>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 transition hover:border-company-primary hover:bg-slate-50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-company-primary">
                  <FileSpreadsheet
                    size={23}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {file?.name ??
                      'Seleccionar CSV o XLSX'}
                  </div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    La carga todavía no modifica datos.
                  </div>
                </div>

                <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">
                  Examinar
                </span>

                <input
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(
                    event,
                  ) => {
                    setFile(
                      event.target.files?.[0] ??
                        null,
                    );
                    setBatch(null);
                    setDecisions({});
                    setError('');
                  }}
                />
              </label>

              <button
                type="button"
                disabled={
                  !file ||
                  loading
                }
                onClick={() =>
                  void handlePreview()
                }
                className="btn-company-primary mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Upload
                    size={17}
                  />
                )}

                Prevalidar archivo
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-company-primary">
                  <History
                    size={17}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Actividad reciente
                  </p>

                  <h3 className="mt-1 font-bold text-slate-900">
                    Últimas cargas
                  </h3>
                </div>
              </div>

              <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
                {history.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-5 text-center text-sm text-slate-500">
                    Sin cargas registradas.
                  </div>
                ) : (
                  history
                    .slice(
                      0,
                      6,
                    )
                    .map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-slate-700">
                                #{item.id} · {item.fileName}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {item.totalRows} filas ·{' '}
                                {new Date(
                                  item.createdAt,
                                ).toLocaleString(
                                  'es-CL',
                                )}
                              </div>
                            </div>

                            <span
                              className={[
                                'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                getBatchStatusClasses(
                                  item.status,
                                ),
                              ].join(' ')}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ),
                    )
                )}
              </div>
            </section>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              {error}
            </div>
          )}

          {batch && (
            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Paso 2
                  </p>

                  <h3 className="mt-1 font-bold text-slate-900">
                    Vista previa #{batch.id}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {batch.fileName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700">
                    Total {batch.totalRows}
                  </span>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                    Válidas {batch.validRows}
                  </span>

                  <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">
                    Con error {batch.errorRows}
                  </span>
                </div>
              </div>

              <div className="max-h-[42vh] overflow-auto overscroll-contain">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-100/95 text-xs uppercase tracking-wide text-slate-600 backdrop-blur-sm">
                    <tr>
                      <th className="px-3 py-3">
                        Fila
                      </th>
                      <th className="px-3 py-3">
                        Hostname
                      </th>
                      <th className="px-3 py-3">
                        Empresa
                      </th>
                      <th className="px-3 py-3">
                        Amb.
                      </th>
                      <th className="px-3 py-3">
                        IP
                      </th>
                      <th className="px-3 py-3">
                        SO
                      </th>
                      <th className="px-3 py-3">
                        Estado
                      </th>
                      <th className="px-3 py-3">
                        Acción
                      </th>
                      <th className="px-3 py-3">
                        Validación / resultado
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {batch.rows?.map(
                      (row) => {
                        const normalized =
                          row.normalizedData;

                        const finished =
                          batch.status !==
                          'PREVIEWED';

                        return (
                          <tr
                            key={
                              row.id
                            }
                            className="align-top transition hover:bg-slate-50/70"
                          >
                            <td className="px-3 py-3 text-slate-500">
                              {row.rowNumber}
                            </td>

                            <td className="font-hostname px-3 py-3 font-semibold text-slate-800">
                              {normalized?.hostname ??
                                row.rawData.hostname ??
                                '—'}
                            </td>

                            <td className="px-3 py-3 text-slate-700">
                              {normalized?.companyName ??
                                row.rawData.empresa ??
                                '—'}
                            </td>

                            <td className="px-3 py-3">
                              {normalized?.environment ? (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                                  {normalized.environment}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>

                            <td className="font-ip px-3 py-3 text-xs text-slate-700">
                              {normalized?.ipAddress ??
                                '—'}
                            </td>

                            <td className="px-3 py-3 text-slate-700">
                              {normalized?.operatingSystemLabel ??
                                '—'}
                            </td>

                            <td className="px-3 py-3">
                              {row.validationStatus ===
                              'VALID' ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2
                                    size={14}
                                  />
                                  Válida
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  <AlertCircle
                                    size={14}
                                  />
                                  Error
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-3">
                              {finished ? (
                                <span className="font-semibold text-slate-700">
                                  {
                                    ACTION_LABELS[
                                      row.selectedAction ??
                                        row.suggestedAction
                                    ]
                                  }
                                </span>
                              ) : (
                                <select
                                  value={
                                    decisions[row.id] ??
                                    row.suggestedAction
                                  }
                                  disabled={
                                    row.validationStatus !==
                                    'VALID'
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDecisions(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [row.id]:
                                          event.target.value as ServerImportAction,
                                      }),
                                    )
                                  }
                                  className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-company-primary disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  {row.suggestedAction ===
                                    'CREATE' && (
                                    <option value="CREATE">
                                      Crear
                                    </option>
                                  )}

                                  {row.suggestedAction !==
                                    'CREATE' && (
                                    <option value="UPDATE">
                                      Actualizar
                                    </option>
                                  )}

                                  {row.suggestedAction ===
                                    'REACTIVATE' && (
                                    <option value="REACTIVATE">
                                      Reactivar
                                    </option>
                                  )}

                                  <option value="SKIP">
                                    Omitir
                                  </option>
                                </select>
                              )}
                            </td>

                            <td className="max-w-md px-3 py-3 text-xs">
                              {row.resultMessage ? (
                                <span
                                  className={
                                    row.resultStatus ===
                                    'FAILED'
                                      ? 'font-medium text-red-700'
                                      : 'text-slate-600'
                                  }
                                >
                                  {row.resultMessage}
                                </span>
                              ) : row.errors?.length ? (
                                <ul className="space-y-1 text-red-700">
                                  {row.errors.map(
                                    (
                                      item,
                                    ) => (
                                      <li
                                        key={
                                          item
                                        }
                                      >
                                        • {item}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : row.warnings?.length ? (
                                <ul className="space-y-1 text-amber-700">
                                  {row.warnings.map(
                                    (
                                      item,
                                    ) => (
                                      <li
                                        key={
                                          item
                                        }
                                      >
                                        • {item}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <span className="text-slate-400">
                                  Sin observaciones
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                {batch.status ===
                'PREVIEWED' ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Se ejecutarán{' '}
                        <span className="font-bold text-slate-900">
                          {executableRows}
                        </span>{' '}
                        filas.
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Las filas con error siempre serán omitidas.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        loading ||
                        executableRows ===
                          0
                      }
                      onClick={() =>
                        void handleConfirm()
                      }
                      className="btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading && (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      )}

                      3. Confirmar carga
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span
                      className={[
                        'w-fit rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                        getBatchStatusClasses(
                          batch.status,
                        ),
                      ].join(' ')}
                    >
                      Resultado: {batch.status}
                    </span>

                    <span className="text-sm text-slate-500">
                      Creados {batch.createdCount} · Actualizados {batch.updatedCount} · Reactivados {batch.reactivatedCount} · Omitidos {batch.skippedCount} · Fallidos {batch.failedCount}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
