import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Building2,
  CalendarClock,
  Cpu,
  Database,
  HardDrive,
  History,
  MemoryStick,
  MonitorCog,
  Network,
  Pencil,
  Server as ServerIcon,
  UserRound,
} from 'lucide-react';

import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import AuditHistoryModal from '../components/AuditHistoryModal';
import AuditRevertModal from '../components/AuditRevertModal';
import CredentialAssignments from '../components/CredentialAssignments';
import PageLoader from '../components/PageLoader';
import ServerFormModal from '../components/ServerFormModal';

import {
  getAuditHistory,
  getRevertPreview,
  revertAuditLog,
  type AuditLog,
  type RevertPreviewResponse,
} from '../services/audit.service';

import {
  getServer,
  type Server,
} from '../services/servers.service';

import {
  getLatestUf,
  getServerValuation,
  type EconomicIndicator,
  type ServerValuationItem,
} from '../services/pricing.service';

import {
  getUser,
} from '../services/session.service';

import {
  formatDateTime,
} from '../utils/date';

interface ServerDetailLocationState {
  returnTo?: string;
}

export default function ServerDetailPage() {
  const currentUser =
    getUser();

  const canEdit =
    currentUser?.role ===
      'ADMIN' ||
    currentUser?.role ===
      'EDITOR';

  const canManageCredentials =
    currentUser?.role ===
      'ADMIN';

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    id,
  } =
    useParams<{
      id: string;
    }>();

  const [
    server,
    setServer,
  ] = useState<
    Server | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    error,
    setError,
  ] = useState(
    '',
  );

  const [
    editOpen,
    setEditOpen,
  ] = useState(
    false,
  );

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(
    false,
  );

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(
    false,
  );

  const [
    historyError,
    setHistoryError,
  ] = useState(
    '',
  );

  const [
    historyItems,
    setHistoryItems,
  ] = useState<
    AuditLog[]
  >([]);

  const [
    revertOpen,
    setRevertOpen,
  ] = useState(
    false,
  );

  const [
    revertPreview,
    setRevertPreview,
  ] = useState<
    RevertPreviewResponse | null
  >(null);

  const [
    revertPreviewLoading,
    setRevertPreviewLoading,
  ] = useState(
    false,
  );

  const [
    reverting,
    setReverting,
  ] = useState(
    false,
  );

  const [
    revertError,
    setRevertError,
  ] = useState(
    '',
  );

  const [
    selectedAuditLog,
    setSelectedAuditLog,
  ] = useState<
    AuditLog | null
  >(null);

  const [
    valuation,
    setValuation,
  ] = useState<ServerValuationItem | null>(null);

  const [
    uf,
    setUf,
  ] = useState<EconomicIndicator | null>(null);

  const [
    valuationLoading,
    setValuationLoading,
  ] = useState(false);

  const [
    valuationError,
    setValuationError,
  ] = useState('');

  async function loadValuation(
    serverId: number,
    active: boolean,
  ) {
    if (!active) {
      setValuation(null);
      setUf(null);
      setValuationError('');
      return;
    }

    try {
      setValuationLoading(true);
      setValuationError('');

      const [valuationData, ufData] =
        await Promise.all([
          getServerValuation(serverId),
          getLatestUf(),
        ]);

      setValuation(valuationData);
      setUf(ufData);
    } catch (caughtError) {
      setValuation(null);
      setUf(null);
      setValuationError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible cargar la valorización.',
      );
    } finally {
      setValuationLoading(false);
    }
  }

  useEffect(() => {
    async function loadServer() {
      const serverId =
        Number(
          id,
        );

      if (
        !Number.isInteger(
          serverId,
        ) ||
        serverId <= 0
      ) {
        setError(
          'Identificador de servidor inválido.',
        );

        setLoading(
          false,
        );

        return;
      }

      try {
        setLoading(
          true,
        );

        setError(
          '',
        );

        const data =
          await getServer(
            serverId,
          );

        setServer(
          data,
        );

        await loadValuation(
          data.id,
          data.active,
        );
      } catch (error) {
        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            'No fue posible cargar el servidor.',
          );
        }
      } finally {
        setLoading(
          false,
        );
      }
    }

    loadServer();
  }, [
    id,
  ]);

  async function refreshServer() {
    if (
      !server
    ) {
      return;
    }

    const refreshedServer =
      await getServer(
        server.id,
      );

    setServer(
      refreshedServer,
    );

    await loadValuation(
      refreshedServer.id,
      refreshedServer.active,
    );
  }

  async function refreshHistory() {
    if (
      !server
    ) {
      return;
    }

    setHistoryLoading(
      true,
    );

    setHistoryError(
      '',
    );

    try {
      const items =
        await getAuditHistory(
          'SERVER',
          server.id,
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

  async function openHistory() {
    if (
      !server
    ) {
      return;
    }

    setHistoryItems(
      [],
    );

    setHistoryError(
      '',
    );

    setHistoryOpen(
      true,
    );

    await refreshHistory();
  }

  function closeHistory() {
    if (
      reverting ||
      revertPreviewLoading
    ) {
      return;
    }

    setHistoryOpen(
      false,
    );

    setHistoryItems(
      [],
    );

    setHistoryError(
      '',
    );
  }

  async function openRevert(
    item: AuditLog,
  ) {
    if (
      !canEdit
    ) {
      return;
    }

    setSelectedAuditLog(
      item,
    );

    setRevertPreview(
      null,
    );

    setRevertError(
      '',
    );

    setRevertOpen(
      true,
    );

    setRevertPreviewLoading(
      true,
    );

    try {
      const preview =
        await getRevertPreview(
          item.id,
        );

      setRevertPreview(
        preview,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setRevertError(
          error.message,
        );
      } else {
        setRevertError(
          'No fue posible preparar la reversión.',
        );
      }
    } finally {
      setRevertPreviewLoading(
        false,
      );
    }
  }

  function closeRevert() {
    if (
      reverting
    ) {
      return;
    }

    setRevertOpen(
      false,
    );

    setSelectedAuditLog(
      null,
    );

    setRevertPreview(
      null,
    );

    setRevertError(
      '',
    );
  }

  async function confirmRevert() {
    if (
      !selectedAuditLog ||
      reverting
    ) {
      return;
    }

    try {
      setReverting(
        true,
      );

      setRevertError(
        '',
      );

      await revertAuditLog(
        selectedAuditLog.id,
      );

      await refreshServer();

      await refreshHistory();

      closeRevert();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setRevertError(
          error.message,
        );
      } else {
        setRevertError(
          'No fue posible revertir el cambio.',
        );
      }
    } finally {
      setReverting(
        false,
      );
    }
  }

  function handleBack() {
    const state =
      location.state as
        | ServerDetailLocationState
        | null;

    navigate(
      state?.returnTo ??
        '/servers',
    );
  }

  if (
    loading
  ) {
    return (
      <div className="space-y-5">
        <PageLoader
          variant="detail"
          rows={3}
        />

        <PageLoader
          variant="cards"
          rows={4}
        />
      </div>
    );
  }

  if (
    error ||
    !server
  ) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={
            handleBack
          }
          className="ui-btn ui-btn-secondary inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-company-primary shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft
            size={17}
          />

          Volver
        </button>

        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700 shadow-sm">
          {error ||
            'Servidor no encontrado.'}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-page space-y-6">
      <button
        type="button"
        onClick={
          handleBack
        }
        className="ui-btn ui-btn-secondary inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-company-primary shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft
          size={17}
        />

        Volver a servidores
      </button>

      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <ServerIcon
                size={24}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Inventario de infraestructura
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="font-hostname truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {
                    server.hostname
                  }
                </h1>

                <span
                  className={
                    server.active
                      ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                      : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200'
                  }
                >
                  {server.active
                    ? 'Activo'
                    : 'Inactivo'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                <span className="font-ip">
                  {server.ipAddress ??
                    'Sin IP'}
                </span>

                <span aria-hidden="true">
                  ·
                </span>

                <span>
                  {server.environment ??
                    'Sin ambiente'}
                </span>

                <span aria-hidden="true">
                  ·
                </span>

                <span>
                  {server.company?.name ??
                    'Sin empresa'}
                </span>
              </div>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() =>
                setEditOpen(
                  true,
                )
              }
              className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
            >
              <Pencil
                size={17}
              />

              Editar servidor
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <SectionHeader
              title="Información general"
              description="Empresa, ambiente, red y sistema operativo registrado."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={
                  Network
                }
                label="Dirección IP"
                value={
                  server.ipAddress ??
                  'Sin IP'
                }
                technical
              />

              <InfoItem
                icon={
                  Building2
                }
                label="Empresa"
                value={
                  server.company
                    ?.name ??
                  'Sin empresa'
                }
              />

              <InfoItem
                icon={
                  Database
                }
                label="Ambiente"
                value={
                  server.environment ??
                  'Sin ambiente'
                }
              />

              <InfoItem
                icon={
                  MonitorCog
                }
                label="Sistema Operativo"
                value={
                  server.operatingSystem
                    ? `${server.operatingSystem.name} ${server.operatingSystem.version}`
                    : 'Sin sistema operativo'
                }
              />
            </div>
          </section>

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <SectionHeader
              title="Recursos"
              description="Capacidad registrada del servidor."
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <ResourceCard
                icon={
                  Cpu
                }
                label="CPU"
                value={
                  server.cpuCores !==
                    null
                    ? `${server.cpuCores} cores`
                    : '-'
                }
              />

              <ResourceCard
                icon={
                  MemoryStick
                }
                label="RAM"
                value={
                  server.ramGb !==
                    null
                    ? `${server.ramGb} GB`
                    : '-'
                }
              />

              <ResourceCard
                icon={
                  HardDrive
                }
                label="Disco"
                value={
                  server.diskGb !==
                    null
                    ? `${server.diskGb} GB`
                    : '-'
                }
              />
            </div>
          </section>

          {canManageCredentials && (
            <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
              <CredentialAssignments
                target="SERVER"
                targetId={
                  server.id
                }
                environment={
                  server.environment
                }
                title="Accesos del sistema operativo"
              />
            </section>
          )}

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <SectionHeader
                title="Software instalado"
                description="Sistemas y versiones registrados en este servidor."
                compact
              />

              <span className="rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary ring-1 ring-company-primary/10">
                {
                  server.software
                    .length
                }
              </span>
            </div>

            {server.software.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
                No hay software registrado.
              </div>
            ) : (
              <div className="space-y-3">
                {server.software.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
                              <Boxes
                                size={16}
                              />
                            </div>

                            <p className="font-medium text-slate-900">
                              {
                                item
                                  .software
                                  .name
                              }
                            </p>
                          </div>

                          {item.notes && (
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {
                                item.notes
                              }
                            </p>
                          )}
                        </div>

                        <span className="font-version w-fit rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {
                            item.version
                          }
                        </span>
                      </div>

                      {canManageCredentials && (
                        <CredentialAssignments
                          target="SOFTWARE"
                          targetId={
                            item.id
                          }
                          environment={
                            server.environment
                          }
                          compact
                        />
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <SectionHeader
              title="Notas"
              description="Información operativa adicional asociada al servidor."
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {server.notes ||
                  'Sin notas registradas.'}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <SectionHeader
              title="Valorización mensual"
              description="Costo calculado con las tarifas vigentes del inventario."
            />

            {!server.active ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                La valorización está disponible para servidores activos.
              </div>
            ) : valuationLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Calculando valorización...
              </div>
            ) : valuationError ? (
              <div className="ui-alert ui-alert-error rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {valuationError}
              </div>
            ) : valuation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign size={17} className="text-company-primary" />
                    <span className="text-sm font-semibold text-slate-700">
                      Servicios Onitec
                    </span>
                  </div>
                  <span className={
                    valuation.servicesOnitec
                      ? 'rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary'
                      : 'rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500'
                  }>
                    {valuation.servicesOnitec ? 'Incluido' : 'No incluido'}
                  </span>
                </div>

                <div className="space-y-2">
                  {valuation.rows
                    .filter((row) => row.key !== 'services')
                    .map((row) => (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700">{row.resource}</p>
                          {row.detail && (
                            <p className="text-xs text-slate-400">{row.detail}</p>
                          )}
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                          {formatUf(row.valueUf)} UF
                        </span>
                      </div>
                    ))}
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-start justify-between gap-3 text-sm text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Subtotal base</span>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Recursos, sistema operativo y bases de datos aplicables.
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatUf(valuation.subtotalUf)} UF
                    </span>
                  </div>

                  {valuation.servicesOnitec && (
                    <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-company-primary/5 px-3 py-2.5 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">Servicios Onitec</span>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Recargo porcentual aplicado sobre el subtotal base.
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-company-primary">
                        {formatUf(
                          valuation.rows.find((row) => row.key === 'services')?.valueUf ??
                            Math.max(0, valuation.totalUf - valuation.subtotalUf),
                        )} UF
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <span className="font-bold text-slate-900">Total mensual</span>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Subtotal base{valuation.servicesOnitec ? ' + Servicios Onitec' : ''}.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums text-slate-900">
                        {formatUf(valuation.totalUf)} UF
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatClp(valuation.totalClp)}
                      </p>
                    </div>
                  </div>
                </div>

                {uf && (
                  <div className="ui-btn ui-btn-secondary rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    UF utilizada: {formatClp(uf.value)} · {formatDateOnly(uf.date)} · Fuente: {uf.source}
                  </div>
                )}

                {valuation.missing.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {valuation.missing.join(' · ')}
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
            <SectionHeader
              title="Auditoría"
              description="Creación y última modificación del recurso."
            />

            <div className="space-y-5">
              <AuditInfo
                icon={
                  UserRound
                }
                label="Creado por"
                user={
                  server.createdBy
                }
                date={
                  server.createdAt
                }
              />

              <AuditInfo
                icon={
                  CalendarClock
                }
                label="Última modificación"
                user={
                  server.updatedBy
                }
                date={
                  server.updatedAt
                }
              />
            </div>

            <button
              type="button"
              onClick={
                openHistory
              }
              className="ui-control mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-company-primary hover:text-company-primary"
            >
              <History
                size={17}
              />

              Abrir historial completo
            </button>
          </section>
        </div>
      </div>

      <ServerFormModal
        open={
          editOpen &&
          canEdit
        }
        server={
          server
        }
        onClose={() =>
          setEditOpen(
            false,
          )
        }
        onSaved={async () => {
          await refreshServer();

          setEditOpen(
            false,
          );
        }}
      />

      <AuditHistoryModal
        open={
          historyOpen
        }
        title={
          server.hostname
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
        canRevert={
          canEdit
        }
        onRevert={
          openRevert
        }
        onClose={
          closeHistory
        }
      />

      <AuditRevertModal
        open={
          revertOpen
        }
        preview={
          revertPreview
        }
        loading={
          revertPreviewLoading
        }
        reverting={
          reverting
        }
        error={
          revertError
        }
        onClose={
          closeRevert
        }
        onConfirm={
          confirmRevert
        }
      />
    </div>
  );
}

function formatUf(value: number) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatClp(value: number | null) {
  if (value === null) {
    return 'CLP no disponible';
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(new Date(value));
}

interface SectionHeaderProps {
  title:
    string;

  description:
    string;

  compact?:
    boolean;
}

function SectionHeader({
  title,
  description,
  compact = false,
}: SectionHeaderProps) {
  return (
    <div className={compact ? '' : 'mb-5'}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
        Detalle técnico
      </p>

      <h2 className="mt-1 font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

interface InfoItemProps {
  icon:
    typeof ServerIcon;

  label:
    string;

  value:
    string;

  technical?:
    boolean;
}

function InfoItem({
  icon:
    Icon,
  label,
  value,
  technical = false,
}: InfoItemProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
          <Icon
            size={16}
          />
        </div>

        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p
        className={[
          'mt-2 font-medium text-slate-900',
          technical
            ? 'font-ip'
            : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

interface ResourceCardProps {
  icon:
    typeof ServerIcon;

  label:
    string;

  value:
    string;
}

function ResourceCard({
  icon:
    Icon,
  label,
  value,
}: ResourceCardProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <div className="rounded-lg bg-white p-1.5 text-company-primary shadow-sm">
          <Icon
            size={18}
          />
        </div>
      </div>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

interface AuditInfoProps {
  icon:
    typeof ServerIcon;

  label:
    string;

  user:
    Server['createdBy'];

  date:
    string;
}

function AuditInfo({
  icon:
    Icon,
  label,
  user,
  date,
}: AuditInfoProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 rounded-xl bg-company-primary/10 p-2 text-company-primary">
        <Icon
          size={17}
        />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-800">
          {user
            ? `${user.username} · ${user.name}`
            : 'Usuario no registrado'}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {formatDateTime(
            date,
          )}
        </p>
      </div>
    </div>
  );
}
