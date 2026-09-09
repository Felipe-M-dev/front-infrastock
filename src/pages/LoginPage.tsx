import {
  type FormEvent,
  useState,
} from 'react';

import {
  BarChart3,
  Box,
  KeyRound,
  LockKeyhole,
  Server,
  ShieldCheck,
  User,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  login,
} from '../services/auth.service';

import {
  consumeSessionMessage,
  saveSession,
} from '../services/session.service';

const gitTag =
  (
    import.meta.env
      .VITE_GIT_TAG as
      | string
      | undefined
  )?.trim() ||
  'dev';

export default function LoginPage() {
  const navigate =
    useNavigate();

  const [
    username,
    setUsername,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState(() =>
    consumeSessionMessage() ??
    '',
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');

    if (
      !username.trim() ||
      !password.trim()
    ) {
      setError(
        'Debe ingresar usuario y contraseña.',
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await login(
          username.trim(),
          password,
        );

      /*
       * Por ahora usamos sessionStorage.
       * Al cerrar la pestaña/sesión del navegador desaparece.
       *
       * Más adelante podemos migrar a cookie HttpOnly
       * antes de llevarlo a producción.
       */
      saveSession(
        response.accessToken,
        response.user,
      );

      navigate(
        '/dashboard',
      );
    } catch (loginError) {
      if (
        loginError instanceof Error
      ) {
        setError(
          loginError.message,
        );
      } else {
        setError(
          'Ocurrió un error al iniciar sesión.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#07121f] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(59,130,246,0.18),transparent_26%),radial-gradient(circle_at_82%_20%,rgba(148,163,184,0.14),transparent_25%),radial-gradient(circle_at_76%_82%,rgba(37,99,235,0.13),transparent_28%),linear-gradient(135deg,#06101c_0%,#0b1b2d_46%,#07121f_100%)]" />

        <div className="absolute -left-20 top-[12%] h-[520px] w-[160px] rotate-[36deg] border border-white/[0.06] bg-white/[0.025]" />

        <div className="absolute right-[4%] top-[-14%] h-[620px] w-[220px] rotate-[36deg] border border-white/[0.05] bg-white/[0.02]" />

        <div className="absolute -bottom-64 right-[10%] h-[620px] w-[220px] rotate-[36deg] border border-white/[0.05] bg-white/[0.02]" />

        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 xl:gap-16 xl:px-16">
        <section className="hidden lg:block">
          <div className="max-w-[590px]">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/15 blur-lg" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl">
                  <Box
                    size={27}
                    strokeWidth={1.8}
                    className="text-blue-300"
                  />
                </div>
              </div>

              <div>
                <p className="text-[30px] font-bold tracking-[-0.035em] text-white">
                  Infra
                  <span className="text-blue-400">
                    Stock
                  </span>
                </p>

                <p className="mt-0.5 text-sm tracking-[0.08em] text-slate-400">
                  Inventario de Infraestructura
                </p>
              </div>
            </div>

            <div className="mt-14">
              <div className="mb-6 h-[3px] w-12 rounded-full bg-blue-400" />

              <h1 className="max-w-[520px] text-[42px] font-bold leading-[1.12] tracking-[-0.035em] text-slate-50 xl:text-[48px]">
                Toda tu infraestructura
                en un solo lugar.
              </h1>

              <p className="mt-6 max-w-[510px] text-[17px] leading-8 text-slate-300">
                Gestiona servidores,
                software, redes y
                credenciales de forma
                simple, segura y
                centralizada.
              </p>
            </div>

            <div className="mt-10 grid max-w-[540px] gap-5">
              <Feature
                icon={
                  <Server
                    size={21}
                  />
                }
                title="Infraestructura"
                description="Servidores, recursos, ambientes y administración centralizada."
              />

              <Feature
                icon={
                  <Box
                    size={21}
                  />
                }
                title="Software"
                description="Sistemas, versiones y dependencias en un único inventario."
              />

              <Feature
                icon={
                  <ShieldCheck
                    size={21}
                  />
                }
                title="Seguridad"
                description="Control de accesos, credenciales y trazabilidad operativa."
              />

              <Feature
                icon={
                  <BarChart3
                    size={21}
                  />
                }
                title="Visibilidad"
                description="Información técnica actualizada para tomar mejores decisiones."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[570px]">
          <div className="mb-7 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-400/10 backdrop-blur-xl">
                <Box
                  size={21}
                  className="text-blue-300"
                />
              </div>

              <div>
                <p className="font-bold text-white">
                  Infra
                  <span className="text-blue-400">
                    Stock
                  </span>
                </p>

                <p className="text-[11px] text-slate-400">
                  Inventario de Infraestructura
                </p>
              </div>
            </div>
          </div>

          <div className="ui-login-card relative overflow-hidden rounded-[30px] border border-white/20 bg-white/[0.10] shadow-[0_30px_90px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl backdrop-saturate-150">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015)_55%,rgba(59,130,246,0.04))]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />

            <div className="relative px-6 py-8 sm:px-10 sm:py-10 xl:px-12 xl:py-12">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] shadow-inner shadow-white/5 backdrop-blur-xl">
                  <KeyRound
                    size={22}
                    className="text-blue-300"
                  />
                </div>

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-white">
                  Bienvenido
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Ingresa a tu cuenta de
                  InfraStock
                </p>
              </div>

              <form
                className="mt-9 space-y-5"
                onSubmit={
                  handleSubmit
                }
              >
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Usuario
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />

                    <input
                      id="username"
                      type="text"
                      value={
                        username
                      }
                      onChange={(
                        event,
                      ) =>
                        setUsername(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="username"
                      placeholder="Ingrese su usuario"
                      disabled={
                        loading
                      }
                      autoFocus
                      className="ui-login-control w-full rounded-2xl border border-white/20 bg-slate-950/20 py-3.5 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-slate-400 hover:border-white/30 focus:border-blue-300/70 focus:bg-slate-950/25 focus:ring-4 focus:ring-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Contraseña
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    />

                    <input
                      id="password"
                      type="password"
                      value={
                        password
                      }
                      onChange={(
                        event,
                      ) =>
                        setPassword(
                          event.target
                            .value,
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Ingrese su contraseña"
                      disabled={
                        loading
                      }
                      className="ui-login-control w-full rounded-2xl border border-white/20 bg-slate-950/20 py-3.5 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-slate-400 hover:border-white/30 focus:border-blue-300/70 focus:bg-slate-950/25 focus:ring-4 focus:ring-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-100 backdrop-blur-xl"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.30)] transition hover:-translate-y-0.5 hover:from-blue-400 hover:to-blue-600 hover:shadow-[0_16px_34px_rgba(37,99,235,0.38)] focus:outline-none focus:ring-4 focus:ring-blue-400/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {loading
                    ? 'Ingresando...'
                    : 'Ingresar'}
                </button>
              </form>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <div className="flex items-center gap-2 text-center text-xs text-slate-400">
                  <LockKeyhole
                    size={13}
                  />

                  <span>
                    Acceso restringido
                  </span>
                </div>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-500">
                Solo usuarios autorizados
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 px-1 text-[11px] text-slate-500">
            <span>
              InfraStock
            </span>

            <span
              className="font-version rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-400"
            >
              {gitTag}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}

interface FeatureProps {
  icon:
    React.ReactNode;

  title:
    string;

  description:
    string;
}

function Feature({
  icon,
  title,
  description,
}: FeatureProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        {icon}
      </div>

      <div>
        <p className="text-[15px] font-semibold text-slate-100">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
