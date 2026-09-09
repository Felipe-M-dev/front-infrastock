import {
  useEffect,
  useState,
} from 'react';

import {
  Boxes,
  Link2,
  Loader2,
  Server,
  X,
} from 'lucide-react';

import {
  getCredentialUsage,
  type Credential,
  type CredentialUsage,
} from '../services/credentials.service';

interface CredentialUsageModalProps {
  credential: Credential | null;
  onClose: () => void;
}

function safeCompanyName(
  name: string | undefined,
) {
  return name || 'Sin empresa';
}

export default function CredentialUsageModal({
  credential,
  onClose,
}: CredentialUsageModalProps) {
  const [
    usage,
    setUsage,
  ] = useState<CredentialUsage | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!credential) {
      setUsage(null);
      setError(null);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getCredentialUsage(
            credential.id,
          );

        if (active) {
          setUsage(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No fue posible cargar el mapa de uso.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [credential]);


  useEffect(() => {
    if (!credential) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
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
    credential,
    onClose,
  ]);

  if (!credential) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div role="dialog" aria-modal="true" aria-labelledby="credential-usage-title" className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[92vh]">
        <div className="h-1 shrink-0 bg-company-primary" />

        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary">
              <Link2
                size={20}
              />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
                Bóveda de credenciales
              </p>

              <h2 id="credential-usage-title" className="mt-1 text-xl font-bold text-company-default">
                Mapa de uso
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {credential.name} ·{' '}
                <span className="font-tech">
                  {credential.username}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="space-y-5">
            {loading && (
              <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-8 text-center text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Loader2
                    size={17}
                    className="animate-spin text-company-primary"
                  />
                  Cargando asociaciones...
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {usage && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Uso total
                    </p>

                    <p className="mt-2 text-2xl font-bold text-company-default">
                      {usage.summary.totalAssignments}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Servidores
                        </p>

                        <p className="mt-2 text-2xl font-bold text-company-default">
                          {usage.summary.serverAssignments}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-company-primary shadow-sm ring-1 ring-slate-200">
                        <Server size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Software
                        </p>

                        <p className="mt-2 text-2xl font-bold text-company-default">
                          {usage.summary.softwareAssignments}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-company-primary shadow-sm ring-1 ring-slate-200">
                        <Boxes size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                {usage.summary.totalAssignments === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-200">
                      <Link2
                        size={26}
                      />
                    </div>

                    <p className="mt-4 font-medium text-company-default">
                      Esta credencial no tiene asociaciones.
                    </p>
                  </div>
                ) : (
                  <>
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-company-primary shadow-sm ring-1 ring-slate-200">
                          <Server
                            size={17}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-company-primary">
                            Infraestructura
                          </p>

                          <h3 className="mt-0.5 font-semibold text-company-default">
                            Servidores
                          </h3>
                        </div>
                      </div>

                      {usage.serverAssignments.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">
                          Sin asociaciones directas a servidores.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {usage.serverAssignments.map(
                            (assignment) => (
                              <div
                                key={assignment.id}
                                className="grid gap-3 p-4 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_minmax(180px,auto)]"
                              >
                                <div className="min-w-0">
                                  <p className="font-hostname font-semibold text-company-default">
                                    {assignment.server.hostname}
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500">
                                    <span className="font-ip">
                                      {assignment.server.ipAddress ?? 'Sin IP'}
                                    </span>

                                    <span>·</span>

                                    <span>
                                      {assignment.server.environment ?? 'Sin ambiente'}
                                    </span>

                                    <span>·</span>

                                    <span>
                                      {safeCompanyName(
                                        assignment.server.company?.name,
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-sm text-slate-600 sm:text-right">
                                  {assignment.purpose || 'Sin propósito indicado'}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-company-primary shadow-sm ring-1 ring-slate-200">
                          <Boxes
                            size={17}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-company-primary">
                            Aplicaciones
                          </p>

                          <h3 className="mt-0.5 font-semibold text-company-default">
                            Software instalado
                          </h3>
                        </div>
                      </div>

                      {usage.softwareAssignments.length === 0 ? (
                        <p className="p-4 text-sm text-slate-500">
                          Sin asociaciones directas a software.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {usage.softwareAssignments.map(
                            (assignment) => (
                              <div
                                key={assignment.id}
                                className="grid gap-3 p-4 transition hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_minmax(180px,auto)]"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-company-default">
                                    {assignment.serverSoftware.software.name}
                                    {' '}
                                    <span className="font-version font-normal text-slate-500">
                                      {assignment.serverSoftware.version}
                                    </span>
                                  </p>

                                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500">
                                    <span className="font-hostname">
                                      {assignment.serverSoftware.server.hostname}
                                    </span>

                                    <span>·</span>

                                    <span>
                                      {assignment.serverSoftware.server.environment ?? 'Sin ambiente'}
                                    </span>

                                    <span>·</span>

                                    <span>
                                      {safeCompanyName(
                                        assignment.serverSoftware.server.company?.name,
                                      )}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-sm text-slate-600 sm:text-right">
                                  {assignment.purpose || 'Sin propósito indicado'}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
