import {
  useEffect,
  useState,
} from 'react';

import {
  ArrowUp,
  Boxes,
  Building2,
  Calculator,
  ClipboardList,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Network,
  Server,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  companyLogoUrl,
  mediaUrl,
} from '../services/media';

import {
  getUser,
  logout,
} from '../services/session.service';

const gitTag =
  (
    import.meta.env
      .VITE_GIT_TAG as
      | string
      | undefined
  )?.trim() ||
  'dev';

const menuItems = [
  {
    label: 'Dashboard',
    section: 'GENERAL',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: [
      'ADMIN',
      'EDITOR',
      'VIEWER',
    ],
  },

  {
    label: 'Servidores',
    section: 'INVENTARIO',
    path: '/servers',
    icon: Server,
    roles: [
      'ADMIN',
      'EDITOR',
      'VIEWER',
    ],
  },

  {
    label: 'Sistemas',
    section: 'INVENTARIO',
    path: '/systems',
    icon: Boxes,
    roles: [
      'ADMIN',
      'EDITOR',
    ],
  },

  {
    label:
      'Versiones software',
    section: 'INVENTARIO',
    path:
      '/software-versions',
    icon: GitBranch,
    roles: [
      'ADMIN',
      'EDITOR',
    ],
  },

  {
    label:
      'Plan actualización',
    section: 'OPERACIÓN',
    path:
      '/software-update-plan',
    icon: ClipboardList,
    roles: [
      'ADMIN',
      'EDITOR',
    ],
  },

  {
    label:
      'Plan revisión',
    section: 'OPERACIÓN',
    path:
      '/inventory-review-plan',
    icon: ListChecks,
    roles: [
      'ADMIN',
      'EDITOR',
    ],
  },

  {
    label:
      'Administración IP',
    section: 'OPERACIÓN',
    path:
      '/ip-management',
    icon: Network,
    roles: ['ADMIN'],
  },

  {
    label:
      'Costos y Cotización',
    section: 'GESTIÓN',
    path:
      '/pricing',
    icon: Calculator,
    roles: [
      'ADMIN',
      'EDITOR',
      'VIEWER',
    ],
  },

  {
    label:
      'Credenciales',
    section: 'GESTIÓN',
    path:
      '/credentials',
    icon: KeyRound,
    roles: ['ADMIN'],
  },

  {
    label: 'Empresas',
    section: 'ADMINISTRACIÓN',
    path: '/companies',
    icon: Building2,
    roles: ['ADMIN'],
  },

  {
    label: 'Usuarios',
    section: 'ADMINISTRACIÓN',
    path: '/users',
    icon: Users,
    roles: ['ADMIN'],
  },
] as const;

export default function AppLayout() {
  const navigate =
    useNavigate();

  const user =
    getUser();

  const company =
    user?.company;

  const resolvedLogoUrl =
    companyLogoUrl(
      company?.logoUrl,
    );

  const avatarUrl =
    mediaUrl(
      (user as
        | { avatarUrl?: string | null }
        | null
        | undefined)?.avatarUrl,
    );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    logoError,
    setLogoError,
  ] = useState(false);

  const [
    showScrollTop,
    setShowScrollTop,
  ] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [resolvedLogoUrl]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(
        window.scrollY > 280,
      );
    };

    handleScroll();

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll,
      );
    };
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const visibleMenuItems =
    menuItems.filter(
      (item) =>
        user &&
        (
          item.roles as
            readonly string[]
        ).includes(
          user.role,
        ),
    );

  const handleLogout = () => {
    logout();

    navigate(
      '/login',
      {
        replace: true,
      },
    );
  };

  const renderBrand = (
    compact = false,
  ) => (
    <div className="flex min-w-0 items-center">
      {!logoError ? (
        <div
          className={[
            'sidebar-brand-panel bg-company-logo flex min-w-0 items-center justify-center rounded-xl',
            compact
              ? 'h-10 w-[168px] px-3 py-2'
              : 'h-12 w-full max-w-[204px] px-4 py-2',
          ].join(
            ' ',
          )}
        >
          <img
            src={
              resolvedLogoUrl
            }
            alt={
              company?.name ??
              'InfraStock'
            }
            onError={() =>
              setLogoError(
                true,
              )
            }
            className="h-full w-full object-contain object-center"
          />
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              'flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-xl',
              compact
                ? 'h-10 w-10'
                : 'h-12 w-12',
            ].join(
              ' ',
            )}
          >
            <Server
              size={
                compact
                  ? 20
                  : 23
              }
              strokeWidth={
                1.9
              }
            />
          </div>

          <div className="min-w-0">
            <p
              className={[
                'truncate font-bold tracking-[-0.02em] text-white',
                compact
                  ? 'text-sm'
                  : 'text-base',
              ].join(
                ' ',
              )}
            >
              {company?.name ??
                'InfraStock'}
            </p>

            {!compact && (
              <p className="mt-0.5 truncate text-[10px] font-semibold tracking-[0.16em] text-white/40">
                INFRASTOCK
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderMenu = (
    onNavigate?: () => void,
  ) => {
    let previousSection = '';

    return visibleMenuItems.map(
      (item) => {
        const Icon =
          item.icon;

        const label =
          item.path ===
            '/pricing' &&
          user?.role ===
            'VIEWER'
            ? 'Centro de Costos'
            : item.label;

        const showSection =
          item.section !==
          previousSection;

        previousSection =
          item.section;

        return (
          <div
            key={item.path}
          >
            {showSection && (
              <p className="sidebar-section-label mb-1.5 mt-4 px-3 first:mt-0">
                {item.section}
              </p>
            )}

            <NavLink
              to={item.path}
              onClick={onNavigate}
              className={({
                isActive,
              }) =>
                [
                  'sidebar-nav-item group relative flex min-h-[42px] items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                  isActive
                    ? 'sidebar-nav-item-active text-white'
                    : 'text-white/68 hover:bg-white/[0.055] hover:text-white',
                ].join(' ')
              }
            >
              {({
                isActive,
              }) => (
                <>
                  {isActive && (
                    <span className="sidebar-active-indicator absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-company-primary" />
                  )}

                  <span
                    className={[
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all duration-200',
                      isActive
                        ? 'text-company-primary'
                        : 'text-white/48 group-hover:text-white/90',
                    ].join(' ')}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.9}
                    />
                  </span>

                  <span className="truncate">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </div>
        );
      },
    );
  };

  const renderUserCard = () => (
    <div className="sidebar-account">
      <button
        type="button"
        onClick={() =>
          navigate('/profile')
        }
        className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.055]"
      >
        <div className="sidebar-avatar bg-company-primary flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name ?? 'Usuario'}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound
              size={19}
              strokeWidth={1.8}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {user?.name ?? 'Usuario'}
          </p>

          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white/42">
            {user?.role} · {company?.name}
          </p>
        </div>

        <span className="font-version rounded-md bg-white/[0.05] px-2 py-1 text-[9px] text-white/35">
          {gitTag}
        </span>
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() =>
            navigate('/profile')
          }
          className="sidebar-footer-action flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:text-white"
        >
          <UserRound size={15} />
          Mi perfil
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-footer-action flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-white/52 transition hover:text-white"
        >
          <LogOut size={15} />
          Salir
        </button>
      </div>
    </div>
  );

  const renderSidebarBackground =
    () => (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-slate-950/35"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:38px_38px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-12 h-52 w-52 rounded-full bg-company-primary opacity-[0.10] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-24 left-[-80px] h-44 w-44 rounded-full bg-white opacity-[0.025] blur-3xl"
        />
      </>
    );

  return (
    <div className="min-h-screen bg-company-background text-company-default">
      <aside className="sidebar-shell fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col overflow-hidden text-white md:flex">
        {renderSidebarBackground()}

        <div className="relative px-5 pb-4 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">
              InfraStock
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-company-primary shadow-[0_0_10px_currentColor]" />
          </div>

          {renderBrand()}
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 pb-4 pt-1 [scrollbar-color:rgba(255,255,255,0.14)_transparent] [scrollbar-width:thin]">
          {renderMenu()}
        </nav>

        <div className="relative px-3 pb-3 pt-2">
          {renderUserCard()}
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between overflow-hidden border-b border-black/[0.06] bg-company-secondary px-4 py-3 text-white shadow-sm md:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-slate-950/35"
        />

        <div className="relative">
          {renderBrand(
            true,
          )}
        </div>

        <button
          onClick={() =>
            setMobileMenuOpen(
              true,
            )
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] transition hover:bg-white/[0.13]"
          aria-label="Abrir menú"
        >
          <Menu
            size={
              22
            }
          />
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() =>
              setMobileMenuOpen(
                false,
              )
            }
          />

          <aside className="sidebar-shell absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col overflow-hidden text-white shadow-2xl">
            {renderSidebarBackground()}

            <div className="relative flex items-center justify-between border-b border-white/[0.075] px-4 py-4">
              {renderBrand()}

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    false,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] transition hover:bg-white/[0.13]"
                aria-label="Cerrar menú"
              >
                <X
                  size={
                    21
                  }
                />
              </button>
            </div>

            <nav className="relative flex-1 overflow-y-auto px-3 pb-4 pt-2">
              {renderMenu(
                () =>
                  setMobileMenuOpen(
                    false,
                  ),
              )}
            </nav>

            <div className="relative px-3 pb-3 pt-2">
              {renderUserCard()}
            </div>
          </aside>
        </div>
      )}

      <main className="app-content-background min-h-screen md:ml-[280px]">
        <div className="relative z-[1] mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={
          handleScrollTop
        }
        aria-label="Volver arriba"
        title="Volver arriba"
        className={[
          'fixed bottom-5 right-5 z-[70] flex h-10 w-10 items-center justify-center rounded-full bg-company-secondary text-white shadow-[0_10px_30px_rgba(15,23,42,0.30),0_3px_10px_rgba(15,23,42,0.22)] ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-company-primary sm:bottom-6 sm:right-6',
          showScrollTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        ].join(
          ' ',
        )}
      >
        <ArrowUp
          size={
            18
          }
          strokeWidth={
            2.2
          }
        />
      </button>
    </div>
  );
}
