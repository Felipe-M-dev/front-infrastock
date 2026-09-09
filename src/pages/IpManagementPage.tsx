import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Network,
  Plus,
  RefreshCcw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

import {
  createNetwork,
  deleteNetwork,
  getIpInventory,
  getNetworks,
  releaseInactiveServerIp,
  releaseReservation,
  reserveIp,
  updateNetwork,
  type IpInventoryItem,
  type IpInventoryResponse,
  type IpStatus,
  type NetworkSummary,
} from '../services/networks.service';

export default function IpManagementPage() {
  const toast = useToast();

  const [
    networks,
    setNetworks,
  ] = useState<NetworkSummary[]>([]);

  const [
    selectedNetworkId,
    setSelectedNetworkId,
  ] = useState<number | null>(null);

  const [
    inventory,
    setInventory,
  ] = useState<IpInventoryResponse | null>(null);

  const [loading, setLoading] =
    useState(true);
  const [inventoryLoading, setInventoryLoading] =
    useState(false);
  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');
  const [status, setStatus] =
    useState<IpStatus | ''>('');
  const [page, setPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(100);

  const [networkModalOpen, setNetworkModalOpen] =
    useState(false);
  const [editingNetwork, setEditingNetwork] =
    useState<NetworkSummary | null>(null);
  const [networkName, setNetworkName] =
    useState('');
  const [networkCidr, setNetworkCidr] =
    useState('');
  const [networkDescription, setNetworkDescription] =
    useState('');
  const [networkActive, setNetworkActive] =
    useState(true);
  const [savingNetwork, setSavingNetwork] =
    useState(false);
  const [deletingNetworkId, setDeletingNetworkId] =
    useState<number | null>(null);

  const [pendingDeleteNetwork, setPendingDeleteNetwork] =
    useState<NetworkSummary | null>(null);
  const [pendingReleaseReservation, setPendingReleaseReservation] =
    useState<IpInventoryItem | null>(null);
  const [pendingHistoricalRelease, setPendingHistoricalRelease] =
    useState<IpInventoryItem | null>(null);
  const [ipActionBusy, setIpActionBusy] =
    useState(false);

  const [reservationOpen, setReservationOpen] =
    useState(false);
  const [reservationIp, setReservationIp] =
    useState('');
  const [reservationDescription, setReservationDescription] =
    useState('');
  const [savingReservation, setSavingReservation] =
    useState(false);

  const selectedNetwork =
    useMemo(
      () =>
        networks.find(
          (network) =>
            network.id === selectedNetworkId,
        ) ?? null,
      [networks, selectedNetworkId],
    );

  async function loadNetworks() {
    try {
      setLoading(true);
      setError('');

      const data = await getNetworks();
      setNetworks(data);

      setSelectedNetworkId(
        (current) =>
          current &&
          data.some(
            (network) =>
              network.id === current,
          )
            ? current
            : data[0]?.id ?? null,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar las redes.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadInventory() {
    if (!selectedNetworkId) {
      setInventory(null);
      return;
    }

    try {
      setInventoryLoading(true);
      setError('');

      const data = await getIpInventory(
        selectedNetworkId,
        {
          search,
          status,
          page,
          pageSize,
        },
      );

      setInventory(data);

      if (data.page !== page) {
        setPage(data.page);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar las IPs.',
      );
    } finally {
      setInventoryLoading(false);
    }
  }

  useEffect(() => {
    loadNetworks();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        loadInventory();
      },
      search ? 250 : 0,
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    selectedNetworkId,
    search,
    status,
    page,
    pageSize,
  ]);

  function openCreateNetwork() {
    setEditingNetwork(null);
    setNetworkName('');
    setNetworkCidr('');
    setNetworkDescription('');
    setNetworkActive(true);
    setNetworkModalOpen(true);
  }

  function openEditNetwork(
    network: NetworkSummary,
  ) {
    setEditingNetwork(network);
    setNetworkName(network.name);
    setNetworkCidr(network.cidr);
    setNetworkDescription(
      network.description ?? '',
    );
    setNetworkActive(network.active);
    setNetworkModalOpen(true);
  }

  async function saveNetwork(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSavingNetwork(true);
      setError('');

      const payload = {
        name: networkName.trim(),
        cidr: networkCidr.trim(),
        description:
          networkDescription.trim(),
        active: networkActive,
      };

      const wasEditing =
        Boolean(editingNetwork);
      const savedNetworkName =
        networkName.trim();

      if (editingNetwork) {
        await updateNetwork(
          editingNetwork.id,
          payload,
        );
      } else {
        await createNetwork(payload);
      }

      setNetworkModalOpen(false);
      await loadNetworks();

      toast.success(
        wasEditing
          ? 'Red/VLAN actualizada'
          : 'Red/VLAN creada',
        `${savedNetworkName} fue ${wasEditing ? 'actualizada' : 'creada'} correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible guardar la red/VLAN',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la red.',
      );
    } finally {
      setSavingNetwork(false);
    }
  }

  function handleDeleteNetwork(
    network: NetworkSummary,
  ) {
    setPendingDeleteNetwork(
      network,
    );
  }

  async function confirmDeleteNetwork() {
    if (!pendingDeleteNetwork) {
      return;
    }

    try {
      setIpActionBusy(true);
      setDeletingNetworkId(
        pendingDeleteNetwork.id,
      );
      setError('');

      await deleteNetwork(
        pendingDeleteNetwork.id,
      );

      if (
        selectedNetworkId ===
        pendingDeleteNetwork.id
      ) {
        setInventory(null);
        setSearch('');
        setStatus('');
        setPage(1);
      }

      const deletedNetwork =
        pendingDeleteNetwork;

      setPendingDeleteNetwork(null);
      await loadNetworks();

      toast.success(
        'Red/VLAN eliminada',
        `${deletedNetwork.name} fue eliminada correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible eliminar la red/VLAN',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la red.',
      );
    } finally {
      setDeletingNetworkId(null);
      setIpActionBusy(false);
    }
  }

  function openReservation(
    ipAddress = '',
  ) {
    setReservationIp(ipAddress);
    setReservationDescription('');
    setReservationOpen(true);
  }

  async function saveReservation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedNetworkId) {
      return;
    }

    try {
      setSavingReservation(true);
      setError('');

      await reserveIp(
        selectedNetworkId,
        {
          ipAddress: reservationIp.trim(),
          description:
            reservationDescription.trim(),
        },
      );

      const reservedIp =
        reservationIp.trim();

      setReservationOpen(false);
      await Promise.all([
        loadNetworks(),
        loadInventory(),
      ]);

      toast.success(
        'IP reservada',
        `${reservedIp} quedó reservada correctamente.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible reservar la IP',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al reservar la IP.',
      );
    } finally {
      setSavingReservation(false);
    }
  }

  function handleReleaseReservation(
    item: IpInventoryItem,
  ) {
    if (!item.reservation) {
      return;
    }

    setPendingReleaseReservation(
      item,
    );
  }

  async function confirmReleaseReservation() {
    if (!pendingReleaseReservation?.reservation) {
      return;
    }

    try {
      setIpActionBusy(true);
      setError('');

      await releaseReservation(
        pendingReleaseReservation.reservation.id,
      );

      const releasedIp =
        pendingReleaseReservation.ipAddress;

      setPendingReleaseReservation(null);
      await Promise.all([
        loadNetworks(),
        loadInventory(),
      ]);

      toast.success(
        'Reserva liberada',
        `${releasedIp} volvió a quedar disponible.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible liberar la reserva',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al liberar la reserva.',
      );
    } finally {
      setIpActionBusy(false);
    }
  }

  function handleReleaseHistorical(
    item: IpInventoryItem,
  ) {
    if (
      !selectedNetworkId ||
      !item.previousServer
    ) {
      return;
    }

    setPendingHistoricalRelease(
      item,
    );
  }

  async function confirmReleaseHistorical() {
    if (
      !selectedNetworkId ||
      !pendingHistoricalRelease?.previousServer
    ) {
      return;
    }

    try {
      setIpActionBusy(true);
      setError('');

      await releaseInactiveServerIp(
        selectedNetworkId,
        pendingHistoricalRelease.ipAddress,
      );

      const releasedIp =
        pendingHistoricalRelease.ipAddress;

      setPendingHistoricalRelease(null);
      await loadInventory();

      toast.success(
        'Vínculo histórico liberado',
        `${releasedIp} ya puede reutilizarse.`,
      );
    } catch (error) {
      toast.error(
        'No fue posible liberar el vínculo histórico',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al liberar el vínculo histórico.',
      );
    } finally {
      setIpActionBusy(false);
    }
  }

  function statusBadge(
    item: IpInventoryItem,
  ) {
    if (item.status === 'USED') {
      return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Usada
        </span>
      );
    }

    if (item.status === 'RESERVED') {
      return (
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          Reservada
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
        Libre
      </span>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <PageLoader
          variant="cards"
          rows={3}
        />

        <PageLoader
          variant="detail"
          rows={2}
        />
      </div>
    );
  }

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <Network size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Redes e IPs
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Administración de IPs
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Controla redes, disponibilidad, reservas y uso de direcciones IPv4.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateNetwork}
            className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
          >
            <Plus size={17} />
            Nueva red/VLAN
          </button>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {networks.map((network) => (
          <button
            key={network.id}
            type="button"
            onClick={() => {
              setSelectedNetworkId(network.id);
              setPage(1);
            }}
            className={[
              'relative overflow-hidden rounded-2xl border bg-white/90 p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 backdrop-blur-sm',
              selectedNetworkId === network.id
                ? 'border-company-primary ring-2 ring-company-primary/10'
                : 'border-white/80 hover:border-slate-300',
            ].join(' ')}
          >
            <div
              className={[
                'absolute inset-x-0 top-0 h-0.5',
                selectedNetworkId === network.id
                  ? 'bg-company-primary'
                  : 'bg-slate-200',
              ].join(' ')}
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {network.name}
                </p>

                <p className="font-ip mt-1 text-sm text-slate-500">
                  {network.cidr}
                </p>
              </div>

              <span
                className={[
                  'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                  network.active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
                ].join(' ')}
              >
                {network.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-2 py-2.5 text-emerald-700">
                <strong className="block text-base">{network.totals.used}</strong>
                usadas
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-2 py-2.5 text-sky-700">
                <strong className="block text-base">{network.totals.free}</strong>
                libres
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-2 py-2.5 text-amber-700">
                <strong className="block text-base">{network.totals.reserved}</strong>
                reservadas
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedNetwork && (
        <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-slate-50/40 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedNetwork.name}
                  </h2>

                  <button
                    type="button"
                    onClick={() => openEditNetwork(selectedNetwork)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-company-primary hover:shadow-sm"
                    title="Editar red"
                    disabled={deletingNetworkId === selectedNetwork.id}
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNetwork(selectedNetwork)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Eliminar red/VLAN"
                    disabled={deletingNetworkId !== null}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="font-ip mt-1 text-sm text-slate-500">
                  {selectedNetwork.range.firstUsable} a {selectedNetwork.range.lastUsable} · {selectedNetwork.range.totalUsable} hosts utilizables
                </p>

                {selectedNetwork.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedNetwork.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => openReservation()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
              >
                <Bookmark size={17} />
                Reservar IP
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Usadas"
                value={inventory?.totals.used ?? selectedNetwork.totals.used}
                icon={<Server size={18} />}
              />

              <MetricCard
                label="Libres"
                value={inventory?.totals.free ?? selectedNetwork.totals.free}
                icon={<ShieldCheck size={18} />}
              />

              <MetricCard
                label="Reservadas"
                value={inventory?.totals.reserved ?? selectedNetwork.totals.reserved}
                icon={<Bookmark size={18} />}
              />
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar IP, hostname, empresa o descripción..."
                  className="ui-control w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                />
              </div>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as IpStatus | '');
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="">Todos los estados</option>
                <option value="FREE">Libres</option>
                <option value="USED">Usadas</option>
                <option value="RESERVED">Reservadas</option>
              </select>

              <button
                type="button"
                onClick={() => loadInventory()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-company-primary hover:text-company-primary"
              >
                <RefreshCcw size={16} />
                Actualizar
              </button>
            </div>

            {inventoryLoading && !inventory ? (
              <div className="mt-5">
                <PageLoader
                  variant="table"
                  rows={6}
                />
              </div>
            ) : (
              <>
                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Servidor / reserva</th>
                        <th className="px-4 py-3">Empresa</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {inventory?.items.map((item) => (
                        <tr
                          key={item.ipAddress}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="font-ip px-4 py-3 font-semibold text-slate-800">
                            {item.ipAddress}
                          </td>

                          <td className="px-4 py-3">
                            {statusBadge(item)}
                          </td>

                          <td className="px-4 py-3 text-slate-700">
                            {item.server ? (
                              <div>
                                <p className="font-hostname font-medium">
                                  {item.server.hostname}
                                </p>
                              </div>
                            ) : item.reservation ? (
                              <div>
                                <p className="font-medium">Reserva</p>
                                <p className="text-xs text-slate-500">
                                  {item.reservation.description || 'Sin descripción'}
                                </p>
                              </div>
                            ) : item.previousServer ? (
                              <div>
                                <p className="font-medium text-slate-600">
                                  Libre · vínculo histórico
                                </p>

                                <p className="text-xs text-slate-500">
                                  <span className="font-hostname">{item.previousServer.hostname}</span> está inactivo
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Disponible</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {item.server?.company?.name ??
                              item.previousServer?.company?.name ??
                              '—'}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {item.status === 'FREE' && !item.requiresRelease && (
                                <button
                                  type="button"
                                  onClick={() => openReservation(item.ipAddress)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                                >
                                  Reservar
                                </button>
                              )}

                              {item.status === 'RESERVED' && item.reservation && (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseReservation(item)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                  Liberar reserva
                                </button>
                              )}

                              {item.requiresRelease && (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseHistorical(item)}
                                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                                >
                                  Liberar vínculo
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {inventory?.items.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                            No hay IPs que coincidan con los filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{inventory?.filtered ?? 0} resultados</span>

                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 outline-none focus:border-company-primary"
                    >
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={(inventory?.page ?? 1) <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      className="rounded-lg border border-slate-300 bg-white p-2 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <span className="text-sm text-slate-600">
                      Página {inventory?.page ?? 1} de {inventory?.totalPages ?? 1}
                    </span>

                    <button
                      type="button"
                      disabled={(inventory?.page ?? 1) >= (inventory?.totalPages ?? 1)}
                      onClick={() => setPage((value) => value + 1)}
                      className="rounded-lg border border-slate-300 bg-white p-2 transition hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {networkModalOpen && (
        <Modal onClose={() => !savingNetwork && setNetworkModalOpen(false)}>
          <form onSubmit={saveNetwork} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Redes e IPs
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {editingNetwork ? 'Editar red/VLAN' : 'Nueva red/VLAN'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setNetworkModalOpen(false)}
                disabled={savingNetwork}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <Field label="Nombre">
              <input
                required
                value={networkName}
                onChange={(event) => setNetworkName(event.target.value)}
                className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                placeholder="Red servidores"
              />
            </Field>

            <Field label="CIDR IPv4">
              <input
                required
                value={networkCidr}
                onChange={(event) => setNetworkCidr(event.target.value)}
                className="ui-control font-ip w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                placeholder="172.20.4.0/22"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={networkDescription}
                onChange={(event) => setNetworkDescription(event.target.value)}
                className="ui-control min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              />
            </Field>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={networkActive}
                onChange={(event) => setNetworkActive(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Red activa
            </label>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setNetworkModalOpen(false)}
                disabled={savingNetwork}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingNetwork}
                className="ui-btn ui-btn-primary btn-company-primary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {savingNetwork ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {reservationOpen && (
        <Modal onClose={() => !savingReservation && setReservationOpen(false)}>
          <form onSubmit={saveReservation} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Redes e IPs
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Reservar IP
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReservationOpen(false)}
                disabled={savingReservation}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <Field label="Dirección IPv4">
              <input
                required
                value={reservationIp}
                onChange={(event) => setReservationIp(event.target.value)}
                className="ui-control font-ip w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                placeholder="172.20.4.10"
              />
            </Field>

            <Field label="Motivo / descripción">
              <textarea
                value={reservationDescription}
                onChange={(event) => setReservationDescription(event.target.value)}
                className="ui-control min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                placeholder="Gateway, VIP, appliance, reserva temporal..."
              />
            </Field>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReservationOpen(false)}
                disabled={savingReservation}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={savingReservation}
                className="ui-btn ui-btn-primary btn-company-primary rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {savingReservation ? 'Reservando...' : 'Reservar'}
              </button>
            </div>
          </form>
        </Modal>
      )}


      <ConfirmDialog
        open={pendingDeleteNetwork !== null}
        eyebrow="Administración IP"
        title="Eliminar red / VLAN"
        description="La red se eliminará de forma definitiva del catálogo de administración IP."
        detail={
          pendingDeleteNetwork ? (
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">
                {pendingDeleteNetwork.name}
              </p>
              <p className="font-ip text-xs text-slate-500">
                {pendingDeleteNetwork.cidr}
              </p>
              <p className="text-xs leading-5 text-slate-500">
                La operación solo se completará si no existen servidores vinculados ni reservas IP activas.
              </p>
            </div>
          ) : null
        }
        tone="danger"
        confirmLabel="Eliminar red"
        busy={ipActionBusy}
        onClose={() => setPendingDeleteNetwork(null)}
        onConfirm={confirmDeleteNetwork}
      />

      <ConfirmDialog
        open={pendingReleaseReservation !== null}
        eyebrow="Administración IP"
        title="Liberar reserva IP"
        description="La dirección volverá a quedar disponible para nuevas asignaciones."
        detail={
          pendingReleaseReservation ? (
            <div className="space-y-1">
              <p className="font-ip font-semibold text-slate-900">
                {pendingReleaseReservation.ipAddress}
              </p>
              {pendingReleaseReservation.reservation?.description && (
                <p className="text-xs text-slate-500">
                  {pendingReleaseReservation.reservation.description}
                </p>
              )}
            </div>
          ) : null
        }
        tone="warning"
        confirmLabel="Liberar IP"
        busy={ipActionBusy}
        onClose={() => setPendingReleaseReservation(null)}
        onConfirm={confirmReleaseReservation}
      />

      <ConfirmDialog
        open={pendingHistoricalRelease !== null}
        eyebrow="Administración IP"
        title="Liberar vínculo histórico"
        description="La IP sigue asociada a un servidor inactivo. Al liberarla podrá reutilizarse en una nueva asignación."
        detail={
          pendingHistoricalRelease ? (
            <div className="space-y-1">
              <p className="font-ip font-semibold text-slate-900">
                {pendingHistoricalRelease.ipAddress}
              </p>
              <p className="font-hostname text-xs text-slate-500">
                {pendingHistoricalRelease.previousServer?.hostname}
              </p>
            </div>
          ) : null
        }
        tone="warning"
        confirmLabel="Liberar vínculo"
        busy={ipActionBusy}
        onClose={() => setPendingHistoricalRelease(null)}
        onConfirm={confirmReleaseHistorical}
      />

    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="rounded-xl bg-company-primary/10 p-2 text-company-primary">
        {icon}
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="ui-table-shell ui-panel w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="h-1 bg-company-primary" />
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
