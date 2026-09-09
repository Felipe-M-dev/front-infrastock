import {
  useEffect,
  useState,
} from 'react';

import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import {
  validateSession,
} from '../services/auth.service';

import {
  getToken,
  logout,
  SESSION_EXPIRED_EVENT,
} from '../services/session.service';

export default function ProtectedRoute() {
  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let active = true;

    const handleSessionExpired = () => {
      if (!active) {
        return;
      }

      setAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleSessionExpired,
    );

    async function checkSession() {
      const token = getToken();

      if (!token) {
        if (active) {
          setAuthenticated(false);
          setLoading(false);
        }

        return;
      }

      try {
        await validateSession(token);

        if (active) {
          setAuthenticated(true);
        }
      } catch {
        /*
         * Un 401 ya es procesado de forma global por api.service:
         * elimina la sesión, guarda el mensaje y dispara
         * SESSION_EXPIRED_EVENT.
         *
         * Para otros errores de validación cerramos la sesión
         * local para no dejar una ruta protegida en un estado
         * ambiguo.
         */
        if (getToken()) {
          logout();
        }

        if (active) {
          setAuthenticated(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;

      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            Validando sesión...
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}
