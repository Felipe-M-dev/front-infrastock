import {
  useEffect,
  useState,
} from 'react';

import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Square,
  X,
} from 'lucide-react';

import {
  exportServersCsv,
  exportServersXlsx,
  SERVER_EXPORT_FIELDS,
  type ServerExportField,
  type ServerFilters,
} from '../services/servers.service';

import {
  getUser,
} from '../services/session.service';

type ExportFormat =
  | 'csv'
  | 'xlsx';

interface ExportServersModalProps {
  open: boolean;

  filters:
    ServerFilters;

  totalCount:
    number;

  onClose: () => void;
}

interface ExportFieldOption {
  field:
    ServerExportField;

  label:
    string;
}

interface StoredExportPreferences {
  format:
    ExportFormat;

  fields:
    ServerExportField[];
}

const EXPORT_FIELD_OPTIONS:
  ExportFieldOption[] = [
    {
      field:
        'hostname',
      label:
        'Hostname',
    },
    {
      field:
        'company',
      label:
        'Empresa',
    },
    {
      field:
        'ipAddress',
      label:
        'IP',
    },
    {
      field:
        'environment',
      label:
        'Ambiente',
    },
    {
      field:
        'operatingSystem',
      label:
        'Sistema Operativo',
    },
    {
      field:
        'cpuCores',
      label:
        'CPU',
    },
    {
      field:
        'ramGb',
      label:
        'RAM GB',
    },
    {
      field:
        'diskGb',
      label:
        'Disco GB',
    },
    {
      field:
        'software',
      label:
        'Software',
    },
    {
      field:
        'active',
      label:
        'Estado',
    },
    {
      field:
        'notes',
      label:
        'Notas',
    },
    {
      field:
        'createdAt',
      label:
        'Fecha creación',
    },
    {
      field:
        'createdBy',
      label:
        'Creado por',
    },
    {
      field:
        'updatedAt',
      label:
        'Última modificación',
    },
    {
      field:
        'updatedBy',
      label:
        'Modificado por',
    },
  ];

const DEFAULT_EXPORT_PREFERENCES:
  StoredExportPreferences = {
    format:
      'xlsx',

    fields: [
      ...SERVER_EXPORT_FIELDS,
    ],
  };

function getPreferenceStorageKey() {
  const user =
    getUser();

  const userKey =
    user?.id ??
    'anonymous';

  return `infrastock:servers:export-preferences:v1:${userKey}`;
}

function isExportFormat(
  value:
    unknown,
): value is ExportFormat {
  return (
    value === 'csv' ||
    value === 'xlsx'
  );
}

function isExportField(
  value:
    unknown,
): value is ServerExportField {
  return (
    typeof value ===
      'string' &&
    SERVER_EXPORT_FIELDS.includes(
      value as ServerExportField,
    )
  );
}

function loadExportPreferences():
  StoredExportPreferences {
  try {
    const stored =
      localStorage.getItem(
        getPreferenceStorageKey(),
      );

    if (!stored) {
      return {
        format:
          DEFAULT_EXPORT_PREFERENCES.format,

        fields: [
          ...DEFAULT_EXPORT_PREFERENCES.fields,
        ],
      };
    }

    const parsed =
      JSON.parse(
        stored,
      ) as Partial<StoredExportPreferences>;

    const format =
      isExportFormat(
        parsed.format,
      )
        ? parsed.format
        : DEFAULT_EXPORT_PREFERENCES.format;

    const storedFields =
      Array.isArray(
        parsed.fields,
      )
        ? parsed.fields.filter(
            isExportField,
          )
        : [];

    const uniqueFields =
      SERVER_EXPORT_FIELDS.filter(
        (field) =>
          storedFields.includes(
            field,
          ),
      );

    if (
      uniqueFields.length ===
      0
    ) {
      return {
        format,

        fields: [
          ...DEFAULT_EXPORT_PREFERENCES.fields,
        ],
      };
    }

    return {
      format,

      fields:
        uniqueFields,
    };
  } catch {
    return {
      format:
        DEFAULT_EXPORT_PREFERENCES.format,

      fields: [
        ...DEFAULT_EXPORT_PREFERENCES.fields,
      ],
    };
  }
}

function saveExportPreferences(
  preferences:
    StoredExportPreferences,
) {
  try {
    localStorage.setItem(
      getPreferenceStorageKey(),

      JSON.stringify(
        preferences,
      ),
    );
  } catch {
    /*
     * La exportación no debe fallar si
     * localStorage está bloqueado.
     */
  }
}

export default function ExportServersModal({
  open,
  filters,
  totalCount,
  onClose,
}: ExportServersModalProps) {
  const [
    format,
    setFormat,
  ] = useState<ExportFormat>(
    'xlsx',
  );

  const [
    selectedFields,
    setSelectedFields,
  ] = useState<
    ServerExportField[]
  >([
    ...SERVER_EXPORT_FIELDS,
  ]);

  const [
    exporting,
    setExporting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    const preferences =
      loadExportPreferences();

    setFormat(
      preferences.format,
    );

    setSelectedFields([
      ...preferences.fields,
    ]);

    setError('');
  }, [
    open,
  ]);


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
  }, [
    open,
    exporting,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const allSelected =
    selectedFields.length ===
    SERVER_EXPORT_FIELDS.length;

  function toggleField(
    field:
      ServerExportField,
  ) {
    setError('');

    setSelectedFields(
      (current) => {
        if (
          current.includes(
            field,
          )
        ) {
          return current.filter(
            (item) =>
              item !==
              field,
          );
        }

        return SERVER_EXPORT_FIELDS.filter(
          (item) =>
            item === field ||
            current.includes(
              item,
            ),
        );
      },
    );
  }

  function selectAll() {
    setSelectedFields([
      ...SERVER_EXPORT_FIELDS,
    ]);

    setError('');
  }

  function clearAll() {
    setSelectedFields([]);

    setError('');
  }

  function downloadBlob(
    blob:
      Blob,

    filename:
      string,
  ) {
    const objectUrl =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        'a',
      );

    anchor.href =
      objectUrl;

    anchor.download =
      filename;

    document.body.appendChild(
      anchor,
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      objectUrl,
    );
  }

  async function handleExport() {
    if (
      selectedFields.length ===
      0
    ) {
      setError(
        'Debe seleccionar al menos un campo para exportar.',
      );

      return;
    }

    try {
      setExporting(true);
      setError('');

      const exportFilters:
        ServerFilters = {
        ...filters,

        fields:
          selectedFields,
      };

      const result =
        format === 'csv'
          ? await exportServersCsv(
              exportFilters,
            )
          : await exportServersXlsx(
              exportFilters,
            );

      saveExportPreferences({
        format,

        fields: [
          ...selectedFields,
        ],
      });

      downloadBlob(
        result.blob,
        result.filename,
      );

      onClose();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          'No fue posible exportar los servidores.',
        );
      }
    } finally {
      setExporting(false);
    }
  }

  function handleClose() {
    if (
      exporting
    ) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={
          handleClose
        }
      />

      <div role="dialog" aria-modal="true" aria-labelledby="export-servers-title" className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[92vh]">
        <div className="h-1 bg-company-primary" />

        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-company-primary">
              <Download
                size={20}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Inventario de infraestructura
              </p>

              <h2 id="export-servers-title" className="mt-1 text-xl font-bold text-slate-900">
                Exportar servidores
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Se exportarán{' '}
                <span className="font-semibold text-slate-700">
                  {totalCount}
                </span>{' '}
                servidores respetando los filtros y el orden actual.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              exporting
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
          <section>
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Formato de salida
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Elige el formato más adecuado para trabajar con el inventario.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setFormat(
                    'xlsx',
                  )
                }
                disabled={
                  exporting
                }
                className={
                  format ===
                  'xlsx'
                    ? 'rounded-2xl border-2 border-company-primary bg-slate-50 p-4 text-left shadow-sm transition'
                    : 'rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50'
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-company-primary">
                    <FileSpreadsheet
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Excel
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Inventario y hoja Resumen.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormat(
                    'csv',
                  )
                }
                disabled={
                  exporting
                }
                className={
                  format ===
                  'csv'
                    ? 'rounded-2xl border-2 border-company-primary bg-slate-50 p-4 text-left shadow-sm transition'
                    : 'rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50'
                }
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-company-primary">
                    <FileText
                      size={21}
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      CSV
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Archivo separado por punto y coma.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Campos del inventario
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Campos a incluir
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedFields.length} de{' '}
                  {SERVER_EXPORT_FIELDS.length} seleccionados
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    selectAll
                  }
                  disabled={
                    allSelected ||
                    exporting
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Seleccionar todos
                </button>

                <button
                  type="button"
                  onClick={
                    clearAll
                  }
                  disabled={
                    selectedFields.length ===
                      0 ||
                    exporting
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EXPORT_FIELD_OPTIONS.map(
                (option) => {
                  const checked =
                    selectedFields.includes(
                      option.field,
                    );

                  return (
                    <button
                      key={
                        option.field
                      }
                      type="button"
                      onClick={() =>
                        toggleField(
                          option.field,
                        )
                      }
                      disabled={
                        exporting
                      }
                      className={
                        checked
                          ? 'flex items-center gap-2 rounded-xl border border-company-primary bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-800 shadow-sm transition'
                          : 'flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50'
                      }
                    >
                      {checked ? (
                        <CheckSquare
                          size={17}
                          className="shrink-0 text-company-primary"
                        />
                      ) : (
                        <Square
                          size={17}
                          className="shrink-0 text-slate-400"
                        />
                      )}

                      <span>
                        {option.label}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              Tus preferencias de formato y campos se guardan por usuario para la próxima exportación.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              exporting
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              handleExport
            }
            disabled={
              exporting ||
              selectedFields.length ===
                0 ||
              totalCount ===
                0
            }
            className="btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Download
                size={18}
              />
            )}

            {exporting
              ? 'Exportando...'
              : format === 'xlsx'
                ? 'Exportar Excel'
                : 'Exportar CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
