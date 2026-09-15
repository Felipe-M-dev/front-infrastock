import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

import {
  KeyRound,
  X,
} from "lucide-react";

export default function PersonalVaultDialog({
  eyebrow = "Bóveda personal",
  title,
  description,
  children,
  onClose,
  busy = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    closeRef.current = onClose;
    busyRef.current = busy;
  }, [onClose, busy]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    ref.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busyRef.current) {
        event.preventDefault();
        closeRef.current();
      }

      if (event.key !== "Tab") {
        return;
      }

      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
        ) ?? [],
      );

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (!first) {
        event.preventDefault();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  function handleBackdropClick() {
    if (!busy) {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-personal-vault-dialog
        className="ui-table-shell ui-panel relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] outline-none sm:max-h-[92vh]"
      >
        <div className="h-1 shrink-0 bg-company-primary" />

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
              <KeyRound size={19} />
            </div>

            <div className="min-w-0">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-company-primary">
                {eyebrow}
              </p>

              <h2
                id={titleId}
                className="mt-1 break-words text-xl font-bold text-company-default"
              >
                {title}
              </h2>

              {description && (
                <p
                  id={descriptionId}
                  className="mt-1 max-w-2xl text-xs leading-5 text-slate-500"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar ventana"
            className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
