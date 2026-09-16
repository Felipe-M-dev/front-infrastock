import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';

interface DeleteCatalogConfirmModalProps {
  open: boolean;
  title: string;
  itemName: string;
  description: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteCatalogConfirmModal({
  open,
  title,
  itemName,
  description,
  deleting,
  onClose,
  onConfirm,
}: DeleteCatalogConfirmModalProps) {
  if (!open) {
    return null;
  }

  function handleClose() {
    if (deleting) {
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-catalog-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.26)]"
      >
        <div className="h-1 bg-red-500" />

        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-200">
              <Trash2 size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                Eliminación definitiva
              </p>

              <h2
                id="delete-catalog-title"
                className="mt-1 text-lg font-bold text-slate-900"
              >
                {title}
              </h2>

              <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                {itemName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-900">
                  Esta acción no se puede deshacer.
                </p>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  {description}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            InfraStock validará las dependencias antes de eliminar el registro.
            Si está en uso, la operación será bloqueada y el catálogo permanecerá sin cambios.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={17} />
            )}

            {deleting
              ? 'Eliminando...'
              : 'Eliminar definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
}
