import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BadgeDollarSign,
  CheckCircle2,
  CircleAlert,
  Download,
  RefreshCw,
  Search,
  Server,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import ExcelJS from 'exceljs';

import {
  getServerValuations,
  type ServerValuationResponse,
} from '../services/pricing.service';

function formatUf(value: number) {
  return new Intl.NumberFormat(
    'es-CL',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}



function formatExcelDateTime(value: string | Date) {
  return new Intl.DateTimeFormat(
    'es-CL',
    {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Santiago',
    },
  ).format(
    typeof value === 'string'
      ? new Date(value)
      : value,
  );
}

function formatExcelDate(value: string | Date) {
  return new Intl.DateTimeFormat(
    'es-CL',
    {
      dateStyle: 'short',
      timeZone: 'America/Santiago',
    },
  ).format(
    typeof value === 'string'
      ? new Date(value)
      : value,
  );
}

function fileSafeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function formatClp(value: number | null) {
  if (value === null) {
    return '-';
  }

  return new Intl.NumberFormat(
    'es-CL',
    {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default function ServerValuationPanel() {
  const navigate = useNavigate();

  const [data, setData] =
    useState<ServerValuationResponse | null>(null);
  const [companyId, setCompanyId] =
    useState<number | ''>('');
  const [environment, setEnvironment] =
    useState('');
  const [search, setSearch] =
    useState('');
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');
  const [exporting, setExporting] =
    useState(false);
  const [page, setPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(10);

  async function load() {
    try {
      setLoading(true);
      setError('');

      const result =
        await getServerValuations({
          companyId:
            companyId === ''
              ? undefined
              : companyId,
          environment:
            environment || undefined,
        });

      setData(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible valorizar los servidores.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [companyId, environment]);

  const visibleItems = useMemo(() => {
    if (!data) {
      return [];
    }

    const term = search
      .trim()
      .toLocaleLowerCase();

    if (!term) {
      return data.items;
    }

    return data.items.filter((item) => {
      const databaseNames =
        item.databases
          .map((database) => database.name)
          .join(' ');

      return [
        item.hostname,
        item.company?.name ?? '',
        item.environment ?? '',
        item.operatingSystem?.name ?? '',
        databaseNames,
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(term);
    });
  }, [data, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      visibleItems.length / pageSize,
    ),
  );

  const effectivePage = Math.min(
    page,
    totalPages,
  );

  const paginatedItems = useMemo(() => {
    const start =
      (effectivePage - 1) * pageSize;

    return visibleItems.slice(
      start,
      start + pageSize,
    );
  }, [
    visibleItems,
    effectivePage,
    pageSize,
  ]);

  const paginationStart =
    visibleItems.length === 0
      ? 0
      : (effectivePage - 1) *
          pageSize +
        1;

  const paginationEnd = Math.min(
    effectivePage * pageSize,
    visibleItems.length,
  );

  useEffect(() => {
    setPage(1);
  }, [
    companyId,
    environment,
    search,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleDownloadExcel() {
    if (
      !data ||
      visibleItems.length === 0 ||
      exporting
    ) {
      return;
    }

    setExporting(true);

    try {
      const selectedCompany =
        companyId === ''
          ? 'Todas las empresas'
          : data.availableCompanies.find(
              (company) => company.id === companyId,
            )?.name ?? `Empresa ${companyId}`;

      const selectedEnvironment =
        environment || 'Todos los ambientes';

      const searchFilter =
        search.trim() || 'Sin filtro de búsqueda';

      const exportedTotalUf =
        visibleItems.reduce(
          (total, item) => total + item.totalUf,
          0,
        );

      const exportedClpValues =
        visibleItems
          .map((item) => item.totalClp)
          .filter(
            (value): value is number => value !== null,
          );

      const exportedTotalClp =
        exportedClpValues.length === visibleItems.length
          ? exportedClpValues.reduce(
              (total, value) => total + value,
              0,
            )
          : null;

      const completeServers =
        visibleItems.filter(
          (item) => item.status === 'COMPLETE',
        ).length;

      const partialServers =
        visibleItems.length - completeServers;

      const workbook =
        new ExcelJS.Workbook();

      workbook.creator = 'InfraStock';
      workbook.lastModifiedBy = 'InfraStock';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.company = 'InfraStock';
      workbook.subject =
        'Valorización automática de servidores';
      workbook.title =
        'InfraStock - Valorización automática de servidores';

      const worksheet =
        workbook.addWorksheet(
          'Valorización',
          {
            properties: {
              defaultRowHeight: 18,
            },
          },
        );

      worksheet.mergeCells('A1:P1');

      const titleCell =
        worksheet.getCell('A1');

      titleCell.value =
        'InfraStock - Valorización automática de servidores';

      titleCell.font = {
        bold: true,
        size: 16,
        color: {
          argb: 'FFFFFFFF',
        },
      };

      titleCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
      };

      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF0F172A',
        },
      };

      worksheet.getRow(1).height = 28;

      worksheet.mergeCells('A3:P3');

      const filtersTitle =
        worksheet.getCell('A3');

      filtersTitle.value =
        'Filtros aplicados';

      filtersTitle.font = {
        bold: true,
        color: {
          argb: 'FFFFFFFF',
        },
      };

      filtersTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF334155',
        },
      };

      const metadataRows: Array<
        [string, string | number]
      > = [
        [
          'Empresa',
          selectedCompany,
        ],
        [
          'Ambiente',
          selectedEnvironment,
        ],
        [
          'Búsqueda',
          searchFilter,
        ],
        [
          'Generado',
          formatExcelDateTime(new Date()),
        ],
        [
          'Cálculo de valorización',
          formatExcelDateTime(data.checkedAt),
        ],
        [
          'UF utilizada',
          data.uf
            ? `${new Intl.NumberFormat(
                'es-CL',
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              ).format(data.uf.value)} CLP - ${formatExcelDate(
                data.uf.date,
              )}`
            : 'Sin valor UF',
        ],
      ];

      metadataRows.forEach(
        ([label, value], index) => {
          const row =
            worksheet.getRow(4 + index);

          row.getCell(1).value = label;
          row.getCell(1).font = {
            bold: true,
          };

          row.getCell(2).value = value;

          worksheet.mergeCells(
            row.number,
            2,
            row.number,
            16,
          );
        },
      );

      worksheet.mergeCells('A11:P11');

      const summaryTitle =
        worksheet.getCell('A11');

      summaryTitle.value =
        'Resumen exportado';

      summaryTitle.font = {
        bold: true,
        color: {
          argb: 'FFFFFFFF',
        },
      };

      summaryTitle.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: 'FF334155',
        },
      };

      const summaryRows: Array<
        [string, string | number]
      > = [
        [
          'Servidores',
          visibleItems.length,
        ],
        [
          'Valorización completa',
          completeServers,
        ],
        [
          'Requieren revisión',
          partialServers,
        ],
        [
          'Total mensual UF',
          exportedTotalUf,
        ],
        [
          'Total mensual CLP',
          exportedTotalClp ?? 'No disponible',
        ],
      ];

      summaryRows.forEach(
        ([label, value], index) => {
          const row =
            worksheet.getRow(12 + index);

          row.getCell(1).value = label;
          row.getCell(1).font = {
            bold: true,
          };

          row.getCell(2).value = value;
        },
      );

      worksheet.getCell('B15').numFmt =
        '#,##0.00';

      if (
        typeof worksheet.getCell('B16').value ===
        'number'
      ) {
        worksheet.getCell('B16').numFmt =
          '$#,##0';
      }

      const detailHeaderRowNumber = 18;

      const headers = [
        'Hostname',
        'Empresa',
        'Ambiente',
        'Sistema operativo',
        'Versión SO',
        'Bases de datos',
        'CPU vCPU',
        'RAM GB',
        'Disco GB',
        'Estado',
        'Observaciones',
        'Servicios Onitec',
        'Subtotal base UF',
        'Total mensual UF',
        'Total mensual CLP',
        'Detalle valorización',
      ];

      const headerRow =
        worksheet.getRow(
          detailHeaderRowNumber,
        );

      headers.forEach(
        (header, index) => {
          const cell =
            headerRow.getCell(index + 1);

          cell.value = header;
          cell.font = {
            bold: true,
            color: {
              argb: 'FFFFFFFF',
            },
          };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb: 'FF475569',
            },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
        },
      );

      headerRow.height = 30;

      visibleItems.forEach(
        (item, index) => {
          const row =
            worksheet.getRow(
              detailHeaderRowNumber +
                1 +
                index,
            );

          row.values = [
            item.hostname,
            item.company?.name ?? '',
            item.environment ?? '',
            item.operatingSystem?.name ?? '',
            item.operatingSystem?.version ?? '',
            item.databases
              .map((database) =>
                database.version
                  ? `${database.name} ${database.version}`
                  : database.name,
              )
              .join(', '),
            item.resources.cpuCores ?? '',
            item.resources.ramGb ?? '',
            item.resources.diskGb ?? '',
            item.status === 'COMPLETE'
              ? 'Completa'
              : 'Parcial',
            item.missing.join(' · '),
            item.servicesOnitec ? 'Sí' : 'No',
            item.subtotalUf,
            item.totalUf,
            item.totalClp ?? '',
            item.rows
              .map((valuationRow) => {
                const detail =
                  valuationRow.detail
                    ? ` (${valuationRow.detail})`
                    : '';

                return `${valuationRow.resource}${detail}: ${new Intl.NumberFormat(
                  'es-CL',
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6,
                  },
                ).format(
                  valuationRow.valueUf,
                )} UF`;
              })
              .join(' | '),
          ];

          row.getCell(13).numFmt =
            '#,##0.00';
          row.getCell(15).numFmt =
            '#,##0.00';

          if (
            typeof row.getCell(15).value ===
            'number'
          ) {
            row.getCell(14).numFmt =
              '$#,##0';
          }

          row.alignment = {
            vertical: 'top',
            wrapText: true,
          };

          if (item.status === 'PARTIAL') {
            row.getCell(10).font = {
              bold: true,
              color: {
                argb: 'FFB45309',
              },
            };
          }
        },
      );

      worksheet.columns = [
        {
          key: 'hostname',
          width: 28,
        },
        {
          key: 'company',
          width: 22,
        },
        {
          key: 'environment',
          width: 12,
        },
        {
          key: 'os',
          width: 24,
        },
        {
          key: 'osVersion',
          width: 16,
        },
        {
          key: 'databases',
          width: 34,
        },
        {
          key: 'cpu',
          width: 12,
        },
        {
          key: 'ram',
          width: 12,
        },
        {
          key: 'disk',
          width: 14,
        },
        {
          key: 'status',
          width: 14,
        },
        {
          key: 'observations',
          width: 34,
        },
        {
          key: 'servicesOnitec',
          width: 18,
        },
        {
          key: 'subtotalUf',
          width: 16,
        },
        {
          key: 'totalUf',
          width: 16,
        },
        {
          key: 'totalClp',
          width: 18,
        },
        {
          key: 'detail',
          width: 60,
        },
      ];

      worksheet.autoFilter = {
        from: {
          row: detailHeaderRowNumber,
          column: 1,
        },
        to: {
          row:
            detailHeaderRowNumber +
            visibleItems.length,
          column: headers.length,
        },
      };

      worksheet.views = [
        {
          state: 'frozen',
          xSplit: 0,
          ySplit: detailHeaderRowNumber,
          activeCell: `A${detailHeaderRowNumber + 1}`,
        },
      ];

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argb: 'FFE2E8F0',
              },
            },
            left: {
              style: 'thin',
              color: {
                argb: 'FFE2E8F0',
              },
            },
            bottom: {
              style: 'thin',
              color: {
                argb: 'FFE2E8F0',
              },
            },
            right: {
              style: 'thin',
              color: {
                argb: 'FFE2E8F0',
              },
            },
          };
        });
      });

      const buffer =
        await workbook.xlsx.writeBuffer();

      const blob =
        new Blob(
          [
            buffer as unknown as BlobPart,
          ],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      const date =
        new Date()
          .toISOString()
          .slice(0, 10);

      const companyPart =
        companyId === ''
          ? 'todas-empresas'
          : fileSafeText(
              selectedCompany,
            );

      const environmentPart =
        environment
          ? environment.toLowerCase()
          : 'todos-ambientes';

      link.href = url;
      link.download =
        `valorizacion-servidores_${companyPart}_${environmentPart}_${date}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(
        () => URL.revokeObjectURL(url),
        1000,
      );
    } catch (exportError) {
      console.error(
        'No fue posible generar el Excel de valorización.',
        exportError,
      );

      setError(
        'No fue posible generar el Excel de valorización.',
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="ui-panel rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BadgeDollarSign
                size={20}
                className="text-company-primary"
              />
              <h2 className="text-lg font-bold text-slate-900">
                Valorización automática de servidores
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Calculada desde el inventario activo y las tarifas vigentes de SO, CPU, RAM, disco, bases de datos y servicios.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleDownloadExcel()}
              disabled={
                loading ||
                exporting ||
                !data ||
                visibleItems.length === 0
              }
              className="ui-btn ui-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {exporting
                ? 'Generando Excel...'
                : 'Descargar Excel'}
            </button>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Recalcular
            </button>
          </div>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total mensual
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {formatUf(data.totals.totalUf)} UF
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatClp(data.totals.totalClp)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Servidores activos
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {data.totals.servers}
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Valorización completa
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {data.totals.fullyValued}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Requieren revisión
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {data.totals.partial}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px_180px]">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar hostname, empresa, SO o BD"
                  className="ui-control w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm"
                />
              </div>

              <select
                value={companyId}
                onChange={(event) =>
                  setCompanyId(
                    event.target.value
                      ? Number(event.target.value)
                      : '',
                  )
                }
                className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Todas las empresas</option>
                {data.availableCompanies.map((company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>

              <select
                value={environment}
                onChange={(event) => setEnvironment(event.target.value)}
                className="ui-control rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Todos los ambientes</option>
                <option value="PRD">PRD</option>
                <option value="QAS">QAS</option>
                <option value="DEV">DEV</option>
              </select>
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-lg border border-slate-200 xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Servidor</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Ambiente</th>
                      <th className="px-4 py-3">SO / BD</th>
                      <th className="px-4 py-3">Servicios Onitec</th>
                      <th className="px-4 py-3 text-right">Total UF</th>
                      <th className="px-4 py-3 text-right">CLP</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.hostname}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.company?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.environment ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{item.operatingSystem?.name ?? 'Sin SO'}</div>
                          {item.databases.length > 0 && (
                            <div className="mt-1 text-xs text-slate-400">
                              {item.databases.map((database) => database.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={
                            item.servicesOnitec
                              ? 'inline-flex rounded-full bg-company-primary/10 px-2.5 py-1 text-xs font-semibold text-company-primary'
                              : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500'
                          }>
                            {item.servicesOnitec ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
                          {formatUf(item.totalUf)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                          {formatClp(item.totalClp)}
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'COMPLETE' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 size={14} /> Completa
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                <CircleAlert size={14} /> Parcial
                              </span>
                              <p className="mt-1 max-w-[300px] text-xs text-slate-400">
                                {item.missing.join(' · ')}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/servers/${item.id}`)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-company-primary"
                          >
                            <Server size={15} /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 space-y-3 xl:hidden">
              {paginatedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/servers/${item.id}`)}
                  className="w-full rounded-lg border border-slate-200 p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.hostname}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.company?.name ?? '-'} · {item.environment ?? '-'} · Servicios Onitec: {item.servicesOnitec ? 'Sí' : 'No'}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatUf(item.totalUf)} UF
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className={
                      item.status === 'COMPLETE'
                        ? 'font-semibold text-emerald-700'
                        : 'font-semibold text-amber-700'
                    }>
                      {item.status === 'COMPLETE' ? 'Completa' : 'Parcial'}
                    </span>
                    <span className="text-slate-500">{formatClp(item.totalClp)}</span>
                  </div>
                </button>
              ))}
            </div>

            {!loading && visibleItems.length > 0 && (
              <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>
                    Mostrando{' '}
                    <strong className="text-slate-800">
                      {paginationStart}-{paginationEnd}
                    </strong>{' '}
                    de{' '}
                    <strong className="text-slate-800">
                      {visibleItems.length}
                    </strong>{' '}
                    servidores
                  </span>

                  <label className="inline-flex items-center gap-2">
                    <span className="text-slate-500">
                      Por página
                    </span>
                    <select
                      value={pageSize}
                      onChange={(event) =>
                        setPageSize(
                          Number(event.target.value),
                        )
                      }
                      className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(1, current - 1),
                      )
                    }
                    disabled={effectivePage <= 1}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <span className="min-w-[110px] text-center text-sm font-medium text-slate-600">
                    Página {effectivePage} de {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1,
                        ),
                      )
                    }
                    disabled={
                      effectivePage >= totalPages
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {!loading && visibleItems.length === 0 && (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No hay servidores que coincidan con los filtros.
              </div>
            )}
          </>
        )}

        {loading && !data && (
          <div className="py-10 text-center text-sm text-slate-500">
            Calculando valorización...
          </div>
        )}
      </div>
    </section>
  );
}
