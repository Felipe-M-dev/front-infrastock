import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import {
  Boxes,
  Database,
  History,
  Pencil,
  Plus,
  Power,
  Save,
  X,
} from 'lucide-react';

import {
  useSearchParams,
} from 'react-router-dom';

import AuditHistoryModal from '../components/AuditHistoryModal';
import PageLoader from '../components/PageLoader';
import OperatingSystemsPage from './OperatingSystemsPage';

import {
  createSoftware,
  getSoftwareCatalog,
  updateSoftware,
  type SoftwareCatalogItem,
  type SoftwareCategory,
} from '../services/catalogs.service';

import {
  getAuditHistory,
  type AuditLog,
} from '../services/audit.service';

import {
  formatDateTime,
} from '../utils/date';

const CATEGORY_OPTIONS: {
  value: SoftwareCategory;
  label: string;
  description: string;
}[] = [
  {
    value: 'DATABASE',
    label: 'Bases de datos',
    description: 'Motores y plataformas de base de datos.',
  },
  {
    value: 'APP_SERVER',
    label: 'Aplicaciones / servidores web',
    description: 'Servidores de aplicaciones, web y middleware.',
  },
  {
    value: 'RUNTIME_FRAMEWORK',
    label: 'Lenguajes / runtimes / frameworks',
    description: 'Lenguajes, runtimes y frameworks de aplicación.',
  },
  {
    value: 'CONTAINER_ORCHESTRATION',
    label: 'Contenedores / orquestación',
    description: 'Motores de contenedores y plataformas de orquestación.',
  },
  {
    value: 'OBSERVABILITY',
    label: 'Observabilidad',
    description: 'Monitoreo, métricas, logs y visualización.',
  },
  {
    value: 'DEVOPS',
    label: 'DevOps',
    description: 'Herramientas de CI/CD y gestión de código.',
  },
  {
    value: 'MESSAGING_CACHE',
    label: 'Mensajería / caché',
    description: 'Colas, mensajería y almacenamiento en caché.',
  },
  {
    value: 'OTHER',
    label: 'Otros',
    description: 'Sistemas aún no clasificados en otra categoría.',
  },
];

function categoryLabel(
  category: SoftwareCategory,
) {
  return (
    CATEGORY_OPTIONS.find(
      (item) =>
        item.value === category,
    )?.label ?? 'Otros'
  );
}

export default function SystemsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const activeTab =
    searchParams.get('tab') === 'os'
      ? 'os'
      : 'software';

  const [items, setItems] =
    useState<SoftwareCatalogItem[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');
  const [showForm, setShowForm] =
    useState(false);
  const [editing, setEditing] =
    useState<SoftwareCatalogItem | null>(null);
  const [name, setName] =
    useState('');
  const [category, setCategory] =
    useState<SoftwareCategory>('OTHER');
  const [active, setActive] =
    useState(true);
  const [saving, setSaving] =
    useState(false);

  const [historyOpen, setHistoryOpen] =
    useState(false);
  const [historyTitle, setHistoryTitle] =
    useState('');
  const [historyItems, setHistoryItems] =
    useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [historyError, setHistoryError] =
    useState('');

  async function loadSystems() {
    try {
      setLoading(true);
      setError('');
      setItems(
        await getSoftwareCatalog(),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible cargar los sistemas.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSystems();
  }, []);

  const grouped =
    useMemo(
      () =>
        CATEGORY_OPTIONS.map(
          (group) => ({
            ...group,
            items: items.filter(
              (item) =>
                item.category ===
                group.value,
            ),
          }),
        ).filter(
          (group) =>
            group.items.length > 0,
        ),
      [items],
    );

  function selectTab(
    tab: 'software' | 'os',
  ) {
    if (tab === 'os') {
      setSearchParams({ tab: 'os' });
      return;
    }

    setSearchParams({});
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setCategory('OTHER');
    setActive(true);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEdit(
    item: SoftwareCatalogItem,
  ) {
    setEditing(item);
    setName(item.name);
    setCategory(item.category);
    setActive(item.active);
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError('Debe indicar el nombre del sistema.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editing) {
        await updateSoftware(
          editing.id,
          {
            name: name.trim(),
            category,
            active,
          },
        );
        setSuccess('Sistema actualizado correctamente.');
      } else {
        await createSoftware({
          name: name.trim(),
          category,
          active,
        });
        setSuccess('Sistema creado correctamente.');
      }

      setShowForm(false);
      setEditing(null);
      await loadSystems();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible guardar el sistema.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    item: SoftwareCatalogItem,
  ) {
    try {
      setError('');
      setSuccess('');
      await updateSoftware(
        item.id,
        {
          active: !item.active,
        },
      );
      setSuccess(
        item.active
          ? `${item.name} desactivado.`
          : `${item.name} activado.`,
      );
      await loadSystems();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible cambiar el estado.',
      );
    }
  }

  async function openHistory(
    item: SoftwareCatalogItem,
  ) {
    setHistoryOpen(true);
    setHistoryTitle(item.name);
    setHistoryItems([]);
    setHistoryError('');
    setHistoryLoading(true);

    try {
      setHistoryItems(
        await getAuditHistory(
          'SOFTWARE',
          item.id,
        ),
      );
    } catch (caughtError) {
      setHistoryError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible obtener el historial.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="ui-page space-y-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <Boxes size={24} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
                Catálogo técnico
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Sistemas
              </h1>

              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                Catálogos técnicos de aplicaciones, bases de datos y sistemas operativos.
              </p>
            </div>
          </div>

          {activeTab === 'software' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {items.length} sistema{items.length === 1 ? '' : 's'}
              </span>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {grouped.length} categoría{grouped.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="ui-panel flex flex-wrap gap-2 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <button
          type="button"
          onClick={() => selectTab('software')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'software'
              ? 'btn-company-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Boxes size={17} />
          Aplicaciones y software
        </button>

        <button
          type="button"
          onClick={() => selectTab('os')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'os'
              ? 'btn-company-primary shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database size={17} />
          Sistemas Operativos
        </button>
      </div>

      {activeTab === 'os' ? (
        <OperatingSystemsPage embedded />
      ) : (
        <>
          <section className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                  Inventario reutilizable
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Aplicaciones y software
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Cada sistema se clasifica para reutilizarlo en inventario, tarifas y reportes.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreate}
                className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
              >
                <Plus size={17} />
                Agregar sistema
              </button>
            </div>
          </section>

          {error && (
            <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="ui-alert ui-alert-success rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
              {success}
            </div>
          )}

          {loading ? (
            <PageLoader
              variant="cards"
              rows={4}
            />
          ) : grouped.length === 0 ? (
            <div className="ui-panel rounded-2xl border border-dashed border-slate-300 bg-white/90 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Boxes size={24} />
              </div>

              <p className="mt-4 font-semibold text-slate-700">
                No hay sistemas registrados.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Agrega el primer sistema para comenzar a construir el catálogo técnico.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {grouped.map((group) => (
                <section
                  key={group.value}
                  className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
                >
                  <div className="border-b border-slate-100 bg-slate-50/75 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {group.label}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {group.description}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">
                        {group.items.length}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="group grid gap-4 px-5 py-4 transition hover:bg-slate-50/70 md:grid-cols-[minmax(220px,1fr)_130px_140px] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-900">
                            {item.name}
                          </div>

                          <div className="mt-1 text-xs leading-5 text-slate-400">
                            {item.updatedBy
                              ? `Modificado por ${item.updatedBy.username} · ${formatDateTime(item.updatedAt)}`
                              : `Registrado · ${formatDateTime(item.createdAt)}`}
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.active
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                            }`}
                          >
                            {item.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Historial"
                            onClick={() => void openHistory(item)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-company-primary hover:shadow-sm"
                          >
                            <History size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar"
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-company-primary hover:shadow-sm"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title={item.active ? 'Desactivar' : 'Activar'}
                            onClick={() => void toggleActive(item)}
                            className={`rounded-lg p-2 transition hover:bg-white hover:shadow-sm ${
                              item.active
                                ? 'text-slate-500 hover:text-amber-700'
                                : 'text-slate-500 hover:text-emerald-700'
                            }`}
                          >
                            <Power size={17} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={closeForm}
          />

          <div className="ui-table-shell ui-panel relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="h-1 bg-company-primary" />

            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                    Catálogo técnico
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {editing ? 'Editar sistema' : 'Agregar sistema'}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Elige una categoría para mantener el catálogo ordenado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nombre
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                    placeholder="Ej. MariaDB"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Categoría
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as SoftwareCategory)
                    }
                    className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-500">
                    {categoryLabel(category)}
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => setActive(event.target.checked)}
                    className="h-4 w-4 accent-[var(--color-primary)]"
                  />
                  Activo
                </label>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={17} />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <AuditHistoryModal
        open={historyOpen}
        title={historyTitle}
        loading={historyLoading}
        error={historyError}
        items={historyItems}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
