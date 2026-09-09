import {
  useEffect,
  type ReactNode,
} from 'react';

import {
  AlertTriangle,
  Info,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react';

export type ConfirmDialogTone =
  | 'info'
  | 'warning'
  | 'danger';

interface ConfirmDialogProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  detail?: ReactNode;
  tone?: ConfirmDialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

const toneConfig = {
  info: {
    bar: 'bg-company-primary',
    iconWrap:
      'bg-company-primary/10 text-company-primary ring-company-primary/15',
    eyebrow: 'text-company-primary',
    confirm:
      'btn-company-primary shadow-sm',
    icon: Info,
  },
  warning: {
    bar: 'bg-amber-500',
    iconWrap:
      'bg-amber-50 text-amber-700 ring-amber-200',
    eyebrow: 'text-amber-700',
    confirm:
      'bg-amber-600 text-white shadow-sm transition hover:bg-amber-700',
    icon: AlertTriangle,
  },
  danger: {
    bar: 'bg-red-500',
    iconWrap:
      'bg-red-50 text-red-700 ring-red-200',
    eyebrow: 'text-red-700',
    confirm:
      'bg-red-600 text-white shadow-sm transition hover:bg-red-700',
    icon: ShieldAlert,
  },
} as const;

export default function ConfirmDialog({
  open,
  eyebrow = 'Confirmación',
  title,
  description,
  detail,
  tone = 'info',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key === 'Escape' &&
        !busy
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
    open,
    busy,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const config =
    toneConfig[tone];
  const Icon = config.icon;

  function handleClose() {
    if (busy) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onMouseDown={handleClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="infrastock-confirm-title"
        aria-describedby={description ? "infrastock-confirm-description" : undefined}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.26)]"
      >
        <div
          className={`h-1 ${config.bar}`}
        />

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${config.iconWrap}`}
            >
              <Icon size={20} />
            </div>

            <div className="min-w-0">
              <p
                className={`text-xs font-bold uppercase tracking-[0.14em] ${config.eyebrow}`}
              >
                {eyebrow}
              </p>

              <h2
                id="infrastock-confirm-title"
                className="mt-1 text-lg font-bold text-slate-900"
              >
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          {description && (
            <p id="infrastock-confirm-description" className="text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}

          {detail && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              {detail}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${config.confirm}`}
          >
            {busy && (
              <Loader2
                size={17}
                className="animate-spin"
              />
            )}

            {busy
              ? 'Procesando...'
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
