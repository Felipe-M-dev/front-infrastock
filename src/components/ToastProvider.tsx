import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';

export type ToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

interface ToastInput {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
  type: ToastType;
}

interface ToastApi {
  show: (input: ToastInput) => number;
  success: (title: string, message?: string) => number;
  error: (title: string, message?: string) => number;
  warning: (title: string, message?: string) => number;
  info: (title: string, message?: string) => number;
  dismiss: (id: number) => void;
  dismissAll: () => void;
}

const ToastContext =
  createContext<ToastApi | null>(null);

let nextToastId = 1;

const DEFAULT_DURATION = 4500;
const ERROR_DURATION = 7000;

function getTone(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        iconClass:
          'bg-emerald-50 text-emerald-700 ring-emerald-200',
        accentClass:
          'bg-emerald-500',
      };

    case 'error':
      return {
        icon: AlertCircle,
        iconClass:
          'bg-red-50 text-red-700 ring-red-200',
        accentClass:
          'bg-red-500',
      };

    case 'warning':
      return {
        icon: AlertTriangle,
        iconClass:
          'bg-amber-50 text-amber-700 ring-amber-200',
        accentClass:
          'bg-amber-500',
      };

    default:
      return {
        icon: Info,
        iconClass:
          'bg-company-primary/10 text-company-primary ring-company-primary/20',
        accentClass:
          'bg-company-primary',
      };
  }
}

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] =
    useState<ToastItem[]>([]);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id,
        ),
      );
    },
    [],
  );

  const dismissAll = useCallback(
    () => {
      setToasts([]);
    },
    [],
  );

  const show = useCallback(
    (input: ToastInput) => {
      const id = nextToastId++;
      const type =
        input.type ?? 'info';

      const duration =
        input.duration ??
        (type === 'error'
          ? ERROR_DURATION
          : DEFAULT_DURATION);

      setToasts((current) => [
        ...current.slice(-3),
        {
          ...input,
          id,
          type,
        },
      ]);

      if (duration > 0) {
        window.setTimeout(
          () => {
            dismiss(id);
          },
          duration,
        );
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      dismissAll,
      success: (
        title,
        message,
      ) =>
        show({
          type: 'success',
          title,
          message,
        }),
      error: (
        title,
        message,
      ) =>
        show({
          type: 'error',
          title,
          message,
        }),
      warning: (
        title,
        message,
      ) =>
        show({
          type: 'warning',
          title,
          message,
        }),
      info: (
        title,
        message,
      ) =>
        show({
          type: 'info',
          title,
          message,
        }),
    }),
    [
      dismiss,
      dismissAll,
      show,
    ],
  );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}

      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[120] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[390px]"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const tone =
            getTone(toast.type);
          const Icon = tone.icon;

          return (
            <div
              key={toast.id}
              role={
                toast.type ===
                'error'
                  ? 'alert'
                  : 'status'
              }
              className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-md"
            >
              <div
                className={`absolute inset-y-0 left-0 w-1 ${tone.accentClass}`}
              />

              <div className="flex items-start gap-3 py-3.5 pl-4 pr-3">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tone.iconClass}`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    {toast.title}
                  </p>

                  {toast.message && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-500">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    dismiss(toast.id)
                  }
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar notificación"
                  title="Cerrar notificación"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast debe utilizarse dentro de ToastProvider.',
    );
  }

  return context;
}
