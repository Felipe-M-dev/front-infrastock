import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import {
  Cpu,
  FileSpreadsheet,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  Network,
  X,
} from 'lucide-react';

import {
  getServerCatalogs,
  type ServerOperatingSystemCatalogItem,
  type ServerSoftwareCatalogItem,
} from '../services/catalogs.service';

import {
  getProvisioningAvailableIps,
  getProvisioningNetworks,
  type ProvisioningNetwork,
} from '../services/networks.service';

import {
  generateProviderQuotation,
} from '../services/pricing.service';

import {
  getUser,
} from '../services/session.service';

interface ProviderQuotationModalProps {
  companyId: number;
  companyName: string;
  reference: string;
  initialOperatingSystemName?: string | null;
  initialDatabaseSoftwareId?: number | null;
  initialCpuCores?: number;
  initialRamGb?: number;
  initialDiskGb?: number;
  onClose: () => void;
  onGenerated: (
    hostname: string,
  ) => void;
}

type Architecture =
  | '32 bits'
  | '64 bits';

function positiveInteger(
  value: string,
  label: string,
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `${label} debe ser un número entero mayor que cero.`,
    );
  }

  return parsed;
}

function initialResourceValue(
  value?: number,
) {
  return Number.isInteger(value) &&
    (value ?? 0) > 0
    ? String(value)
    : '';
}

export default function ProviderQuotationModal({
  companyId,
  companyName,
  reference,
  initialOperatingSystemName,
  initialDatabaseSoftwareId,
  initialCpuCores,
  initialRamGb,
  initialDiskGb,
  onClose,
  onGenerated,
}: ProviderQuotationModalProps) {
  const currentUser =
    getUser();

  const [operatingSystems, setOperatingSystems] =
    useState<ServerOperatingSystemCatalogItem[]>([]);

  const [databaseSoftware, setDatabaseSoftware] =
    useState<ServerSoftwareCatalogItem[]>([]);

  const [networks, setNetworks] =
    useState<ProvisioningNetwork[]>([]);

  const [availableIps, setAvailableIps] =
    useState<string[]>([]);

  const [operatingSystemId, setOperatingSystemId] =
    useState('');

  const [architecture, setArchitecture] =
    useState<Architecture>('64 bits');

  const [databaseSoftwareId, setDatabaseSoftwareId] =
    useState(
      initialDatabaseSoftwareId
        ? String(
            initialDatabaseSoftwareId,
          )
        : '',
    );

  const [cpuCores, setCpuCores] =
    useState(
      initialResourceValue(
        initialCpuCores,
      ),
    );

  const [ramGb, setRamGb] =
    useState(
      initialResourceValue(
        initialRamGb,
      ),
    );

  const [diskGb, setDiskGb] =
    useState(
      initialResourceValue(
        initialDiskGb,
      ),
    );

  const [networkId, setNetworkId] =
    useState('');

  const [ipAddress, setIpAddress] =
    useState('');

  const [loadingCatalogs, setLoadingCatalogs] =
    useState(true);

  const [loadingIps, setLoadingIps] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  const requestDate =
    new Intl.DateTimeFormat(
      'es-CL',
      {
        dateStyle: 'long',
        timeZone:
          'America/Santiago',
      },
    ).format(
      new Date(),
    );

  useEffect(() => {
    let cancelled =
      false;

    async function loadCatalogs() {
      try {
        const [catalogs, networkOptions] =
          await Promise.all([
            getServerCatalogs(),
            getProvisioningNetworks(),
          ]);

        if (cancelled) {
          return;
        }

        setOperatingSystems(
          catalogs.operatingSystems,
        );
        setDatabaseSoftware(
          catalogs.software.filter(
            (item) =>
              item.active &&
              item.category ===
                'DATABASE',
          ),
        );
        setNetworks(
          networkOptions,
        );

        const normalizedName =
          initialOperatingSystemName
            ?.trim()
            .toLocaleLowerCase(
              'es-CL',
            );

        const matchingOperatingSystem =
          normalizedName
            ? catalogs.operatingSystems.find(
                (item) =>
                  item.name
                    .trim()
                    .toLocaleLowerCase(
                      'es-CL',
                    ) ===
                  normalizedName,
              )
            : null;

        setOperatingSystemId(
          matchingOperatingSystem
            ? String(
                matchingOperatingSystem.id,
              )
            : '',
        );
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar los datos del formulario.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCatalogs(
            false,
          );
        }
      }
    }

    void loadCatalogs();

    return () => {
      cancelled = true;
    };
  }, [
    initialOperatingSystemName,
  ]);

  useEffect(() => {
    if (!networkId) {
      return;
    }

    let cancelled =
      false;

    async function loadIps() {
      try {
        const response =
          await getProvisioningAvailableIps(
            Number(networkId),
          );

        if (!cancelled) {
          setAvailableIps(
            response.items,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : 'No fue posible cargar las IP disponibles.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingIps(false);
        }
      }
    }

    void loadIps();

    return () => {
      cancelled = true;
    };
  }, [
    networkId,
  ]);

  useEffect(() => {
    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !generating
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
    generating,
    onClose,
  ]);

  function closeModal() {
    if (!generating) {
      onClose();
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedReference =
      reference.trim();

    if (!normalizedReference) {
      setFormError(
        'La referencia de la cotización es obligatoria.',
      );
      return;
    }

    if (
      !currentUser?.email?.trim() ||
      !currentUser.phone?.trim()
    ) {
      setFormError(
        'Completa el correo y el teléfono de tu perfil antes de generar la solicitud XLSX.',
      );
      return;
    }

    if (
      !operatingSystemId ||
      !networkId ||
      !ipAddress
    ) {
      setFormError(
        'Selecciona sistema operativo, red/VLAN e IP disponible.',
      );
      return;
    }

    try {
      const parsedCpu =
        positiveInteger(
          cpuCores,
          'vCPU',
        );

      const parsedRam =
        positiveInteger(
          ramGb,
          'Memoria RAM',
        );

      const parsedDisk =
        positiveInteger(
          diskGb,
          'Tamaño de disco',
        );

      setGenerating(true);
      setFormError('');

      const result =
        await generateProviderQuotation({
          companyId,
          reference:
            normalizedReference,
          operatingSystemId:
            Number(
              operatingSystemId,
            ),
          architecture,
          databaseSoftwareId:
            databaseSoftwareId
              ? Number(
                  databaseSoftwareId,
                )
              : undefined,
          cpuCores:
            parsedCpu,
          ramGb:
            parsedRam,
          diskGb:
            parsedDisk,
          networkId:
            Number(
              networkId,
            ),
          ipAddress,
        });

      const objectUrl =
        URL.createObjectURL(
          result.blob,
        );

      const link =
        document.createElement(
          'a',
        );

      link.href =
        objectUrl;
      link.download =
        result.filename;
      document.body.appendChild(
        link,
      );
      link.click();
      link.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            objectUrl,
          ),
        1000,
      );

      onGenerated(
        normalizedReference,
      );
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No fue posible generar la solicitud XLSX.',
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={closeModal}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-quotation-title"
        className="relative z-10 max-h-[calc(100vh-1.5rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[92vh]"
      >
        <div className="sticky top-0 z-30 h-1 bg-company-primary" />

        <div className="sticky top-1 z-20 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
              <FileSpreadsheet size={21} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Aprovisionamiento
              </p>

              <h2
                id="provider-quotation-title"
                className="mt-1 text-xl font-bold text-slate-900"
              >
                Solicitud XLSX proveedor
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                La descarga registrará el servidor como inactivo y reservará la IP seleccionada.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={generating}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Datos automáticos
              </p>

              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <SummaryValue
                  label="Fecha solicitud"
                  value={requestDate}
                />
                <SummaryValue
                  label="Empresa / cliente"
                  value={companyName}
                />
                <SummaryValue
                  label="Nombre máquina virtual"
                  value={reference}
                />
                <SummaryValue
                  label="Solicitante"
                  value={currentUser?.name ?? 'No disponible'}
                />
                <SummaryValue
                  label="Correo"
                  value={currentUser?.email ?? 'No informado'}
                />
                <SummaryValue
                  label="Teléfono"
                  value={currentUser?.phone ?? 'No informado'}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Plataforma
                </p>
                <h3 className="mt-1 font-bold text-slate-900">
                  Sistema operativo y base de datos
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sistema operativo / versión *">
                  <select
                    required
                    value={operatingSystemId}
                    onChange={(event) =>
                      setOperatingSystemId(
                        event.target.value,
                      )
                    }
                    disabled={loadingCatalogs || generating}
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">
                      Seleccionar sistema operativo
                    </option>
                    {operatingSystems.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name} {item.version}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Arquitectura *">
                  <select
                    required
                    value={architecture}
                    onChange={(event) =>
                      setArchitecture(
                        event.target.value as Architecture,
                      )
                    }
                    disabled={generating}
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="64 bits">
                      64 bits
                    </option>
                    <option value="32 bits">
                      32 bits
                    </option>
                  </select>
                </Field>

                <Field label="Idioma">
                  <input
                    value="Inglés"
                    disabled
                    className="ui-control w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600"
                  />
                </Field>

                <Field label="Base de datos (opcional)">
                  <select
                    value={databaseSoftwareId}
                    onChange={(event) =>
                      setDatabaseSoftwareId(
                        event.target.value,
                      )
                    }
                    disabled={loadingCatalogs || generating}
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">
                      Sin base de datos
                    </option>
                    {databaseSoftware.map(
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
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Capacidad
                </p>
                <h3 className="mt-1 font-bold text-slate-900">
                  Recursos del servidor
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField
                  icon={Cpu}
                  label="vCPU *"
                  value={cpuCores}
                  onChange={setCpuCores}
                  disabled={generating}
                />
                <NumberField
                  icon={MemoryStick}
                  label="Memoria RAM (GB) *"
                  value={ramGb}
                  onChange={setRamGb}
                  disabled={generating}
                />
                <NumberField
                  icon={HardDrive}
                  label="Disco total (GB) *"
                  value={diskGb}
                  onChange={setDiskGb}
                  disabled={generating}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-company-primary/10 p-2 text-company-primary">
                  <Network size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Conectividad
                  </p>
                  <h3 className="mt-0.5 font-bold text-slate-900">
                    Red/VLAN e IP disponible
                  </h3>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Red / VLAN *">
                  <select
                    required
                    value={networkId}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      setNetworkId(
                        value,
                      );
                      setAvailableIps([]);
                      setIpAddress('');
                      setFormError('');
                      setLoadingIps(
                        Boolean(value),
                      );
                    }}
                    disabled={loadingCatalogs || generating}
                    className="font-ip ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">
                      Seleccionar red/VLAN
                    </option>
                    {networks.map(
                      (network) => (
                        <option
                          key={network.id}
                          value={network.id}
                        >
                          {network.name} · {network.cidr}
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field label="Dirección IP *">
                  <select
                    required
                    value={ipAddress}
                    onChange={(event) =>
                      setIpAddress(
                        event.target.value,
                      )
                    }
                    disabled={!networkId || loadingIps || generating}
                    className="font-ip ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
                  >
                    <option value="">
                      {!networkId
                        ? 'Selecciona primero una red/VLAN'
                        : loadingIps
                          ? 'Cargando IP disponibles...'
                          : availableIps.length === 0
                            ? 'No hay IP disponibles'
                            : 'Seleccionar IP disponible'}
                    </option>
                    {availableIps.map(
                      (ip) => (
                        <option
                          key={ip}
                          value={ip}
                        >
                          {ip}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
            </section>

            {loadingCatalogs && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <LoaderCircle
                  size={17}
                  className="animate-spin text-company-primary"
                />
                Cargando catálogos y redes disponibles...
              </div>
            )}

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/95 px-5 py-4 backdrop-blur-sm sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={generating}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loadingCatalogs || loadingIps || generating}
              className="btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
            >
              {generating ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <FileSpreadsheet size={17} />
              )}
              {generating
                ? 'Generando y registrando...'
                : 'Generar XLSX y registrar servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({
  label,
  children,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

interface SummaryValueProps {
  label: string;
  value: string;
}

function SummaryValue({
  label,
  value,
}: SummaryValueProps) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-slate-800">
        {value || 'No informado'}
      </p>
    </div>
  );
}

interface NumberFieldProps {
  icon: typeof Cpu;
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  disabled: boolean;
}

function NumberField({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
}: NumberFieldProps) {
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
        required
        type="number"
        min="1"
        step="1"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        disabled={disabled}
        className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10 disabled:bg-slate-100"
      />
    </div>
  );
}
