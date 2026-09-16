import {
  Activity,
  ClipboardCheck,
  GitBranch,
  MonitorCog,
  ShieldCheck,
} from 'lucide-react';

import {
  useSearchParams,
} from 'react-router-dom';

import InventoryReviewPlanPage from './InventoryReviewPlanPage';
import OperatingSystemLifecyclePage from './OperatingSystemLifecyclePage';
import SoftwareLifecycleSupportPage from './SoftwareLifecycleSupportPage';
import SoftwareUpdatePlanPage from './SoftwareUpdatePlanPage';
import SoftwareVersionsPage from './SoftwareVersionsPage';

type LifecycleTab =
  | 'versions'
  | 'support'
  | 'actions';

type LifecycleEntity =
  | 'software'
  | 'os';

type LifecycleAction =
  | 'update'
  | 'review';

const mainTabs = [
  {
    id: 'versions' as const,
    label: 'Versiones',
    description:
      'Distribución instalada',
    icon: GitBranch,
  },
  {
    id: 'support' as const,
    label: 'EOL y soporte',
    description:
      'Estado de ciclo de vida',
    icon: ShieldCheck,
  },
  {
    id: 'actions' as const,
    label: 'Plan de acción',
    description:
      'Prioridades operacionales',
    icon: ClipboardCheck,
  },
];

function normalizeTab(
  value: string | null,
): LifecycleTab {
  if (
    value === 'support' ||
    value === 'actions'
  ) {
    return value;
  }

  return 'versions';
}

function normalizeEntity(
  value: string | null,
): LifecycleEntity {
  return value === 'os'
    ? 'os'
    : 'software';
}

function normalizeAction(
  value: string | null,
): LifecycleAction {
  return value === 'review'
    ? 'review'
    : 'update';
}

export default function LifecyclePage() {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const tab =
    normalizeTab(
      searchParams.get(
        'tab',
      ),
    );

  const entity =
    normalizeEntity(
      searchParams.get(
        'entity',
      ),
    );

  const action =
    normalizeAction(
      searchParams.get(
        'action',
      ),
    );

  function setTab(
    nextTab: LifecycleTab,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    next.set(
      'tab',
      nextTab,
    );

    if (
      nextTab === 'actions'
    ) {
      if (
        !next.has(
          'action',
        )
      ) {
        next.set(
          'action',
          'update',
        );
      }
    } else {
      if (
        !next.has(
          'entity',
        )
      ) {
        next.set(
          'entity',
          'software',
        );
      }
    }

    setSearchParams(
      next,
      {
        replace: true,
      },
    );
  }

  function setEntity(
    nextEntity:
      LifecycleEntity,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    next.set(
      'entity',
      nextEntity,
    );

    setSearchParams(
      next,
      {
        replace: true,
      },
    );
  }

  function setAction(
    nextAction:
      LifecycleAction,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );

    next.set(
      'action',
      nextAction,
    );

    setSearchParams(
      next,
      {
        replace: true,
      },
    );
  }

  return (
    <div className="space-y-5">
      <section className="ui-table-shell ui-panel relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <Activity
                size={22}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-company-primary">
                Operación tecnológica
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Ciclo de vida
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Versiones instaladas, soporte EOL y acciones de actualización o revisión en una sola sección.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Vistas de ciclo de vida"
            className="grid gap-2 sm:grid-cols-3"
          >
            {mainTabs.map(
              (item) => {
                const Icon =
                  item.icon;
                const active =
                  tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() =>
                      setTab(
                        item.id,
                      )
                    }
                    className={[
                      'flex min-w-[170px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition',
                      active
                        ? 'border-company-primary/30 bg-company-primary/10 text-company-primary shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <Icon
                      size={18}
                      className="shrink-0"
                    />
                    <span>
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                      <span
                        className={[
                          'mt-0.5 block text-[11px]',
                          active
                            ? 'text-company-primary/70'
                            : 'text-slate-400',
                        ].join(' ')}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {tab !== 'actions' ? (
            <>
              <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Tecnología
              </span>

              <button
                type="button"
                onClick={() =>
                  setEntity(
                    'software',
                  )
                }
                className={[
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                  entity ===
                  'software'
                    ? 'border-company-primary/30 bg-company-primary/10 text-company-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <GitBranch
                  size={16}
                />
                Software
              </button>

              <button
                type="button"
                onClick={() =>
                  setEntity('os')
                }
                className={[
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                  entity === 'os'
                    ? 'border-company-primary/30 bg-company-primary/10 text-company-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <MonitorCog
                  size={16}
                />
                Sistemas Operativos
              </button>
            </>
          ) : (
            <>
              <span className="mr-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Acción
              </span>

              <button
                type="button"
                onClick={() =>
                  setAction(
                    'update',
                  )
                }
                className={[
                  'rounded-xl border px-3 py-2 text-sm font-semibold transition',
                  action === 'update'
                    ? 'border-company-primary/30 bg-company-primary/10 text-company-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                Actualización
              </button>

              <button
                type="button"
                onClick={() =>
                  setAction(
                    'review',
                  )
                }
                className={[
                  'rounded-xl border px-3 py-2 text-sm font-semibold transition',
                  action === 'review'
                    ? 'border-company-primary/30 bg-company-primary/10 text-company-primary'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                Revisión de inventario
              </button>
            </>
          )}
        </div>
      </section>

      {tab === 'versions' &&
        entity === 'software' && (
          <SoftwareVersionsPage />
        )}

      {tab === 'versions' &&
        entity === 'os' && (
          <OperatingSystemLifecyclePage
            mode="versions"
          />
        )}

      {tab === 'support' &&
        entity === 'software' && (
          <SoftwareLifecycleSupportPage />
        )}

      {tab === 'support' &&
        entity === 'os' && (
          <OperatingSystemLifecyclePage
            mode="support"
          />
        )}

      {tab === 'actions' &&
        action === 'update' && (
          <SoftwareUpdatePlanPage />
        )}

      {tab === 'actions' &&
        action === 'review' && (
          <InventoryReviewPlanPage />
        )}
    </div>
  );
}
