import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  BadgeDollarSign,
  Boxes,
  Building2,
  Cpu,
  HardDrive,
  MemoryStick,
  MonitorCog,
  Plus,
  Server as ServerIcon,
  Trash2,
  X,
} from 'lucide-react';

import {
  getServerCatalogs,
  type ServerOperatingSystemCatalogItem,
  type ServerSoftwareCatalogItem,
} from '../services/catalogs.service';

import {
  getAccessibleCompanies,
  type AccessibleCompany,
} from '../services/company-scope.service';

import {
  createServer,
  updateServer,
  type CreateServerPayload,
  type Server,
  type ServerSoftwarePayload,
} from '../services/servers.service';

import {
  getUser,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';

interface SoftwareFormRow {
  softwareId: string;
  version: string;
  notes: string;
}

interface ServerFormModalProps {
  open: boolean;
  server?: Server | null;
  onClose: () => void;
  onSaved: (
    server: Server,
  ) => void | Promise<void>;
}

export default function ServerFormModal({
  open,
  server,
  onClose,
  onSaved,
}: ServerFormModalProps) {
  const currentUser =
    getUser();

  const isAdmin =
    currentUser?.role ===
    'ADMIN';

  const canEdit =
    currentUser?.role ===
      'ADMIN' ||
    currentUser?.role ===
      'EDITOR';

  const [hostname, setHostname] =
    useState('');
  const [ipAddress, setIpAddress] =
    useState('');
  const [environment, setEnvironment] =
    useState('');
  const [companyId, setCompanyId] =
    useState('');
  const [cpuCores, setCpuCores] =
    useState('');
  const [ramGb, setRamGb] =
    useState('');
  const [diskGb, setDiskGb] =
    useState('');
  const [notes, setNotes] =
    useState('');
  const [servicesOnitec, setServicesOnitec] =
    useState(true);
  const [operatingSystemId, setOperatingSystemId] =
    useState('');
  const [softwareRows, setSoftwareRows] =
    useState<SoftwareFormRow[]>([]);

  const [companies, setCompanies] =
    useState<AccessibleCompany[]>([]);
  const [operatingSystems, setOperatingSystems] =
    useState<ServerOperatingSystemCatalogItem[]>([]);
  const [softwareCatalog, setSoftwareCatalog] =
    useState<ServerSoftwareCatalogItem[]>([]);

  const [loadingCatalogs, setLoadingCatalogs] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [formError, setFormError] =
    useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setHostname(
      server?.hostname ?? '',
    );
    setIpAddress(
      server?.ipAddress ?? '',
    );
    setEnvironment(
      server?.environment ?? '',
    );
    setCompanyId(
      server?.companyId?.toString() ?? '',
    );
    setCpuCores(
      server?.cpuCores?.toString() ?? '',
    );
    setRamGb(
      server?.ramGb?.toString() ?? '',
    );
    setDiskGb(
      server?.diskGb?.toString() ?? '',
    );
    setNotes(
      server?.notes ?? '',
    );
    setServicesOnitec(
      server?.servicesOnitec ?? true,
    );
    setOperatingSystemId(
      server?.operatingSystemId?.toString() ?? '',
    );
    setSoftwareRows(
      server?.software.map(
        (item) => ({
          softwareId:
            item.softwareId.toString(),
          version:
            item.version,
          notes:
            item.notes ?? '',
        }),
      ) ?? [],
    );
    setFormError('');
  }, [
    open,
    server,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadCatalogs() {
      try {
        setLoadingCatalogs(true);
        setFormError('');

        const catalogs =
          await getServerCatalogs();

        setOperatingSystems(
          catalogs.operatingSystems,
        );
        setSoftwareCatalog(
          catalogs.software,
        );

        const companiesData =
          await getAccessibleCompanies();

        setCompanies(
          companiesData,
        );

        if (!server) {
          setCompanyId(
            (current) =>
              current ||
              currentUser?.company?.id?.toString() ||
              companiesData[0]?.id.toString() ||
              '',
          );
        }
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los catálogos.',
        );
      } finally {
        setLoadingCatalogs(false);
      }
    }

    loadCatalogs();
  }, [
    open,
    server,
    currentUser?.company?.id,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !saving
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
    saving,
    onClose,
  ]);

  function closeForm() {
    if (saving) {
      return;
    }

    onClose();
  }

  function addSoftwareRow() {
    setSoftwareRows(
      (current) => [
        ...current,
        {
          softwareId: '',
          version: '',
          notes: '',
        },
      ],
    );
  }

  function removeSoftwareRow(
    index: number,
  ) {
    setSoftwareRows(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index,
        ),
    );
  }

  function updateSoftwareRow(
    index: number,
    field: keyof SoftwareFormRow,
    value: string,
  ) {
    setSoftwareRows(
      (current) =>
        current.map(
          (row, currentIndex) =>
            currentIndex === index
              ? {
                  ...row,
                  [field]: value,
                }
              : row,
        ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (
        !companyId
      ) {
        throw new Error(
          'Debe seleccionar una empresa.',
        );
      }

      const softwarePayload:
        ServerSoftwarePayload[] =
        softwareRows
          .filter(
            (row) =>
              row.softwareId &&
              row.version.trim(),
          )
          .map(
            (row) => ({
              softwareId:
                Number(row.softwareId),
              version:
                row.version.trim(),
              notes:
                row.notes.trim() ||
                undefined,
            }),
          );

      const payload:
        CreateServerPayload = {
        hostname:
          hostname.trim(),
        ipAddress:
          ipAddress.trim()
            ? ipAddress.trim()
            : server
              ? null
              : undefined,
        environment:
          environment.trim() ||
          undefined,
        cpuCores:
          cpuCores
            ? Number(cpuCores)
            : server
              ? null
              : undefined,
        ramGb:
          ramGb
            ? Number(ramGb)
            : server
              ? null
              : undefined,
        diskGb:
          diskGb
            ? Number(diskGb)
            : server
              ? null
              : undefined,
        notes:
          notes.trim() ||
          undefined,
        servicesOnitec,
        operatingSystemId:
          operatingSystemId
            ? Number(operatingSystemId)
            : server
              ? null
              : undefined,
        software:
          softwarePayload,
        companyId:
          companyId
            ? Number(companyId)
            : undefined,
      };

      const savedServer =
        server
          ? await updateServer(
              server.id,
              payload,
            )
          : await createServer(
              payload,
            );

      await onSaved(
        savedServer,
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el servidor.',
      );
    } finally {
      setSaving(false);
    }
  }

  const canSelectCompany =
    isAdmin ||
    companies.length > 1;

  const fixedCompany =
    companies.length === 1
      ? companies[0]
      : currentUser?.company ??
        null;

  if (
    !open ||
    !canEdit
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={
          closeForm
        }
      />

      <div role="dialog" aria-modal="true" aria-labelledby="server-form-title" className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[92vh]">
        <div className="sticky top-0 z-30 h-1 bg-company-primary" />

        <div className="sticky top-1 z-20 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
              <ServerIcon size={20} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Inventario técnico
              </p>

              <h2 id="server-form-title" className="mt-1 text-xl font-bold text-slate-900">
                {server
                  ? 'Editar servidor'
                  : 'Agregar servidor'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Registra empresa, recursos, sistema operativo y software.
              </p>
            </div>
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
          className="block"
        >
          <div className="p-5 sm:p-6">
            {server && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Creado{' '}
                  {server.createdBy
                    ? `por ${server.createdBy.username}`
                    : ''}
                  {' · '}
                  {formatDateTime(
                    server.createdAt,
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Última modificación{' '}
                  {server.updatedBy
                    ? `por ${server.updatedBy.username}`
                    : ''}
                  {' · '}
                  {formatDateTime(
                    server.updatedAt,
                  )}
                </p>
              </div>
            )}

            {loadingCatalogs && (
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                Cargando catálogos...
              </div>
            )}

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Identificación
                  </p>

                  <h3 className="mt-1 font-bold text-slate-900">
                    Datos principales
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Hostname *
                    </label>

                    <input
                      required
                      value={
                        hostname
                      }
                      onChange={(event) => {
                        setHostname(
                          event.target.value,
                        );
                        setFormError('');
                      }}
                      className="font-hostname w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    />
                  </div>

                  {canSelectCompany && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Empresa *
                      </label>

                      <select
                        required
                        value={
                          companyId
                        }
                        onChange={(event) =>
                          setCompanyId(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                      >
                        <option value="">
                          Seleccionar empresa
                        </option>

                        {companies.map(
                          (company) => (
                            <option
                              key={company.id}
                              value={company.id}
                            >
                              {company.name}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  )}

                  {!canSelectCompany &&
                    fixedCompany && (
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Empresa
                        </label>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700">
                          <Building2
                            size={16}
                            className="text-company-primary"
                          />

                          {fixedCompany.name}
                        </div>
                      </div>
                    )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        IP
                      </label>

                      <input
                        value={
                          ipAddress
                        }
                        onChange={(event) => {
                          setIpAddress(
                            event.target.value,
                          );
                          setFormError('');
                        }}
                        placeholder="172.20.x.x"
                        className={
                          formError
                            .toLowerCase()
                            .includes('ip ')
                            ? 'font-ip w-full rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100'
                            : 'font-ip w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10'
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Ambiente
                      </label>

                      <select
                        value={
                          environment
                        }
                        onChange={(event) =>
                          setEnvironment(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                      >
                        <option value="">
                          Seleccionar
                        </option>
                        <option value="PRD">
                          PRD
                        </option>
                        <option value="QAS">
                          QAS
                        </option>
                        <option value="DEV">
                          DEV
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
                    <MonitorCog size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                      Plataforma
                    </p>

                    <h3 className="mt-0.5 font-bold text-slate-900">
                      Sistema operativo
                    </h3>
                  </div>
                </div>

                <select
                  value={
                    operatingSystemId
                  }
                  onChange={(event) =>
                    setOperatingSystemId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                >
                  <option value="">
                    Sin sistema operativo
                  </option>

                  {operatingSystems.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}{' '}
                        {item.version}
                      </option>
                    ),
                  )}
                </select>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Capacidad
                  </p>

                  <h3 className="mt-1 font-bold text-slate-900">
                    Recursos del servidor
                  </h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <ResourceField
                    icon={Cpu}
                    label="CPU cores"
                    value={cpuCores}
                    onChange={setCpuCores}
                  />

                  <ResourceField
                    icon={MemoryStick}
                    label="RAM GB"
                    value={ramGb}
                    onChange={setRamGb}
                  />

                  <ResourceField
                    icon={HardDrive}
                    label="Disco GB"
                    value={diskGb}
                    onChange={setDiskGb}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
                    <BadgeDollarSign size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                          Valorización
                        </p>
                        <h3 className="mt-0.5 font-bold text-slate-900">
                          Servicios Onitec
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Al estar activo, el porcentaje vigente de Servicios Onitec se suma al subtotal base para obtener el total mensual.
                        </p>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-3 self-start sm:self-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {servicesOnitec ? 'Incluido' : 'No incluido'}
                        </span>
                        <input
                          type="checkbox"
                          checked={servicesOnitec}
                          onChange={(event) =>
                            setServicesOnitec(event.target.checked)
                          }
                          className="peer sr-only"
                        />
                        <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-company-primary peer-focus-visible:ring-2 peer-focus-visible:ring-company-primary/30 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
                        <Boxes size={17} />
                      </div>

                      <h3 className="font-bold text-slate-900">
                        Software instalado
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Agrega software y versión instalada.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addSoftwareRow}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-company-primary hover:text-company-primary"
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>

                {softwareRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                    No hay software agregado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {softwareRows.map(
                      (row, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_auto]">
                            <select
                              value={row.softwareId}
                              onChange={(event) =>
                                updateSoftwareRow(
                                  index,
                                  'softwareId',
                                  event.target.value,
                                )
                              }
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                            >
                              <option value="">
                                Seleccionar software
                              </option>

                              {softwareCatalog.map(
                                (item) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                  >
                                    {item.name}
                                  </option>
                                ),
                              )}
                            </select>

                            <input
                              value={row.version}
                              onChange={(event) =>
                                updateSoftwareRow(
                                  index,
                                  'version',
                                  event.target.value,
                                )
                              }
                              placeholder="Versión"
                              className="font-version rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeSoftwareRow(
                                  index,
                                )
                              }
                              className="rounded-xl p-2 text-red-600 transition hover:bg-red-50"
                              title="Eliminar software"
                              aria-label="Eliminar software"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <input
                            value={row.notes}
                            onChange={(event) =>
                              updateSoftwareRow(
                                index,
                                'notes',
                                event.target.value,
                              )
                            }
                            placeholder="Notas del software (opcional)"
                            className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Notas
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                />
              </section>

              {formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/95 px-5 py-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingCatalogs
              }
              className="btn-company-primary rounded-xl px-4 py-2.5 font-semibold shadow-sm disabled:opacity-60"
            >
              {saving
                ? 'Guardando...'
                : server
                  ? 'Guardar cambios'
                  : 'Guardar servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResourceFieldProps {
  icon: typeof ServerIcon;
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
}

function ResourceField({
  icon:
    Icon,
  label,
  value,
  onChange,
}: ResourceFieldProps) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Icon
          size={16}
          className="text-company-primary"
        />

        {label}
      </label>

      <input
        type="number"
        min="1"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
      />
    </div>
  );
}
