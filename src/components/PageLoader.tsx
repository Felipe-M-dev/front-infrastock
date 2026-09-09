interface PageLoaderProps {
  variant?: 'table' | 'cards' | 'detail';
  rows?: number;
  className?: string;
}

function SkeletonLine({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={[
        'page-loader-shimmer rounded-md bg-slate-200/80',
        className,
      ].join(' ')}
    />
  );
}

export default function PageLoader({
  variant = 'table',
  rows = 5,
  className = '',
}: PageLoaderProps) {
  if (variant === 'cards') {
    return (
      <div
        className={[
          'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
          className,
        ].join(' ')}
        aria-busy="true"
        aria-label="Cargando contenido"
        role="status"
      >
        {Array.from({
          length: Math.max(1, rows),
        }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-7 w-20" />
              </div>

              <div className="page-loader-shimmer h-10 w-10 rounded-xl bg-slate-200/80" />
            </div>

            <SkeletonLine className="mt-6 h-3 w-3/4" />
          </div>
        ))}

        <span className="sr-only">
          Cargando contenido
        </span>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div
        className={[
          'space-y-5',
          className,
        ].join(' ')}
        aria-busy="true"
        aria-label="Cargando contenido"
        role="status"
      >
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-6 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="mt-4 h-8 w-64 max-w-full" />
          <SkeletonLine className="mt-3 h-4 w-96 max-w-[80%]" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({
            length: Math.max(2, rows),
          }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm"
            >
              <SkeletonLine className="h-4 w-36" />

              <div className="mt-5 space-y-4">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-5/6" />
                <SkeletonLine className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">
          Cargando contenido
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm',
        className,
      ].join(' ')}
      aria-busy="true"
      aria-label="Cargando contenido"
      role="status"
    >
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <div className="grid grid-cols-12 gap-4">
          <SkeletonLine className="col-span-3 h-3" />
          <SkeletonLine className="col-span-2 h-3" />
          <SkeletonLine className="col-span-2 h-3" />
          <SkeletonLine className="col-span-2 h-3" />
          <SkeletonLine className="col-span-3 h-3" />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({
          length: Math.max(1, rows),
        }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-12 items-center gap-4 px-5 py-4"
          >
            <div className="col-span-3 space-y-2">
              <SkeletonLine className="h-4 w-4/5" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>

            <SkeletonLine className="col-span-2 h-4 w-4/5" />
            <SkeletonLine className="col-span-2 h-4 w-3/4" />
            <SkeletonLine className="col-span-2 h-6 w-20 rounded-full" />

            <div className="col-span-3 flex justify-end gap-2">
              <div className="page-loader-shimmer h-8 w-8 rounded-lg bg-slate-200/80" />
              <div className="page-loader-shimmer h-8 w-8 rounded-lg bg-slate-200/80" />
              <div className="page-loader-shimmer h-8 w-8 rounded-lg bg-slate-200/80" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">
        Cargando contenido
      </span>
    </div>
  );
}
