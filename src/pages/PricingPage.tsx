import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BadgeDollarSign,
  Calculator,
  Check,
  Download,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import ServerValuationPanel from '../components/ServerValuationPanel';
import PageLoader from '../components/PageLoader';
import { useToast } from '../components/ToastProvider';

import {
  createPricingTariff,
  deletePricingTariff,
  getLatestUf,
  getPricingSummary,
  refreshUf,
  setManualUf,
  updatePricingTariff,
  type PricingSummary,
  type PricingTariff,
  type PricingValueType,
} from '../services/pricing.service';

import {
  getUser,
} from '../services/session.service';

interface TariffDraft {
  name: string;
  value: string;
  active: boolean;
  sourceNote: string;
}

interface QuoteRow {
  resource: string;
  detail: string;
  value: number;
  showValue: boolean;
}

function formatUf(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-CL',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    },
  ).format(value);
}

function formatQuoteUf(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-CL',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatClp(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-CL',
    {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'es-CL',
    {
      dateStyle: 'medium',
      timeZone: 'America/Santiago',
    },
  ).format(
    new Date(value),
  );
}

function valueLabel(
  tariff: PricingTariff,
) {
  if (
    tariff.valueType ===
    'PERCENT'
  ) {
    return `${formatUf(tariff.value)} %`;
  }

  return `${formatUf(tariff.value)} UF`;
}

function billingDetail(
  tariff: PricingTariff,
) {
  if (
    tariff.category ===
    'SISTEMA_OPERATIVO'
  ) {
    return 'Cargo fijo por servidor según sistema operativo.';
  }

  if (
    tariff.category ===
    'BASE_DATOS'
  ) {
    return 'Cargo fijo por servidor según motor de base de datos.';
  }

  if (
    tariff.category ===
      'SERVICIOS' &&
    tariff.valueType ===
      'PERCENT'
  ) {
    return 'Porcentaje aplicado sobre el subtotal de la cotización.';
  }

  if (
    tariff.valueType ===
    'UF_PER_UNIT'
  ) {
    return `Se cobra por cada ${tariff.unit}.`;
  }

  if (
    tariff.valueType ===
    'PERCENT'
  ) {
    return 'Porcentaje aplicado sobre el subtotal.';
  }

  return 'Cargo fijo por servidor.';
}

function parseQuantity(
  value: string,
) {
  const parsed =
    Number(
      value.replace(
        ',',
        '.',
      ),
    );

  return Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : 0;
}

export default function PricingPage() {
  const toast = useToast();

  const user =
    getUser();

  const isAdmin =
    user?.role === 'ADMIN';

  const isEditor =
    user?.role === 'EDITOR';

  const isViewer =
    user?.role === 'VIEWER';

  const canManageCosts =
    isAdmin;

  const canManageUf =
    isAdmin || isEditor;

  const canGenerateQuote =
    isAdmin || isEditor;

  const canViewTariffs =
    isAdmin || isEditor;

  const [summary, setSummary] =
    useState<PricingSummary | null>(null);

  const [drafts, setDrafts] =
    useState<Record<number, TariffDraft>>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [refreshingUf, setRefreshingUf] =
    useState(false);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [deleteCandidate, setDeleteCandidate] =
    useState<PricingTariff | null>(null);

  const [addingCategory, setAddingCategory] =
    useState<string | null>(null);

  const [newTariffName, setNewTariffName] =
    useState('');

  const [newTariffUnit, setNewTariffUnit] =
    useState('');

  const [newTariffValue, setNewTariffValue] =
    useState('');

  const [newTariffValueType, setNewTariffValueType] =
    useState<PricingValueType>('UF_FIXED');

  const [creatingTariff, setCreatingTariff] =
    useState(false);

  const [manualDate, setManualDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

  const [manualValue, setManualValue] =
    useState('');

  const [quoteCompany, setQuoteCompany] =
    useState('');

  const [quoteReference, setQuoteReference] =
    useState('');

  const [quoteOsCode, setQuoteOsCode] =
    useState('');

  const [quoteCpu, setQuoteCpu] =
    useState('');

  const [quoteRam, setQuoteRam] =
    useState('');

  const [quoteDisk, setQuoteDisk] =
    useState('');

  const [quoteDbCode, setQuoteDbCode] =
    useState('');

  const [quoteServices, setQuoteServices] =
    useState(true);

  const [quoteGenerated, setQuoteGenerated] =
    useState(false);

  const groupedTariffs =
    useMemo(() => {
      const groups =
        new Map<
          string,
          PricingTariff[]
        >();

      for (
        const tariff
        of summary?.tariffs ?? []
      ) {
        const items =
          groups.get(
            tariff.category,
          ) ?? [];

        items.push(
          tariff,
        );

        groups.set(
          tariff.category,
          items,
        );
      }

      return Array.from(
        groups.entries(),
      );
    }, [summary]);

  const tariffByCode =
    useMemo(
      () =>
        new Map(
          (summary?.tariffs ?? [])
            .filter(
              (tariff) =>
                tariff.active,
            )
            .map(
              (tariff) => [
                tariff.code,
                tariff,
              ],
            ),
        ),
      [summary],
    );

  const osTariffs =
    useMemo(
      () =>
        (summary?.tariffs ?? [])
          .filter(
            (tariff) =>
              tariff.active &&
              tariff.category ===
                'SISTEMA_OPERATIVO',
          ),
      [summary],
    );

  const dbTariffs =
    useMemo(
      () =>
        (summary?.tariffs ?? [])
          .filter(
            (tariff) =>
              tariff.active &&
              tariff.category ===
                'BASE_DATOS',
          ),
      [summary],
    );

  const assignedOperatingSystemNames =
    useMemo(
      () =>
        new Set(
          (summary?.tariffs ?? [])
            .filter(
              (tariff) =>
                tariff.category ===
                'SISTEMA_OPERATIVO',
            )
            .map(
              (tariff) =>
                (
                  tariff.operatingSystemName ??
                  tariff.name
                ).toLocaleLowerCase(
                  'es-CL',
                ),
            ),
        ),
      [summary],
    );

  const availableOperatingSystemNames =
    useMemo(
      () =>
        (summary?.operatingSystemNames ?? [])
          .filter(
            (name) =>
              !assignedOperatingSystemNames.has(
                name.toLocaleLowerCase(
                  'es-CL',
                ),
              ),
          ),
      [
        assignedOperatingSystemNames,
        summary?.operatingSystemNames,
      ],
    );

  function operatingSystemOptionsForTariff(
    tariff: PricingTariff,
  ) {
    const currentName =
      (
        tariff.operatingSystemName ??
        tariff.name
      ).toLocaleLowerCase(
        'es-CL',
      );

    const usedByOthers =
      new Set(
        (summary?.tariffs ?? [])
          .filter(
            (item) =>
              item.category ===
                'SISTEMA_OPERATIVO' &&
              item.id !==
                tariff.id,
          )
          .map(
            (item) =>
              (
                item.operatingSystemName ??
                item.name
              ).toLocaleLowerCase(
                'es-CL',
              ),
          ),
      );

    return (
      summary?.operatingSystemNames ?? []
    ).filter(
      (name) => {
        const normalized =
          name.toLocaleLowerCase(
            'es-CL',
          );

        return (
          normalized ===
            currentName ||
          !usedByOthers.has(
            normalized,
          )
        );
      },
    );
  }

  const assignedDatabaseNames =
    useMemo(
      () =>
        new Set(
          (summary?.tariffs ?? [])
            .filter(
              (tariff) =>
                tariff.category ===
                'BASE_DATOS',
            )
            .map((tariff) =>
              tariff.name.toLocaleLowerCase(
                'es-CL',
              ),
            ),
        ),
      [summary],
    );

  const availableDatabaseNames =
    useMemo(
      () =>
        (summary?.databaseSoftwareNames ?? [])
          .filter(
            (name) =>
              !assignedDatabaseNames.has(
                name.toLocaleLowerCase(
                  'es-CL',
                ),
              ),
          ),
      [
        assignedDatabaseNames,
        summary?.databaseSoftwareNames,
      ],
    );

  function databaseOptionsForTariff(
    tariff: PricingTariff,
  ) {
    const currentName =
      tariff.name.toLocaleLowerCase(
        'es-CL',
      );

    const usedByOthers =
      new Set(
        (summary?.tariffs ?? [])
          .filter(
            (item) =>
              item.category ===
                'BASE_DATOS' &&
              item.id !== tariff.id,
          )
          .map((item) =>
            item.name.toLocaleLowerCase(
              'es-CL',
            ),
          ),
      );

    return (
      summary?.databaseSoftwareNames ?? []
    ).filter((name) => {
      const normalized =
        name.toLocaleLowerCase(
          'es-CL',
        );

      return (
        normalized === currentName ||
        !usedByOthers.has(normalized)
      );
    });
  }

  const quoteCalculation =
    useMemo(() => {
      const cpu =
        parseQuantity(
          quoteCpu,
        );

      const ram =
        parseQuantity(
          quoteRam,
        );

      const disk =
        parseQuantity(
          quoteDisk,
        );

      const osTariff =
        quoteOsCode
          ? tariffByCode.get(
              quoteOsCode,
            )
          : undefined;

      const cpuTariff =
        tariffByCode.get(
          'CPU_VCPU',
        );

      const ramTariff =
        tariffByCode.get(
          'RAM_GB',
        );

      const diskTariff =
        tariffByCode.get(
          'DISK_GB',
        );

      const dbTariff =
        quoteDbCode
          ? tariffByCode.get(
              quoteDbCode,
            )
          : undefined;

      const servicesTariff =
        (summary?.tariffs ?? [])
          .find(
            (tariff) =>
              tariff.active &&
              tariff.category ===
                'SERVICIOS' &&
              tariff.valueType ===
                'PERCENT',
          );

      const osValue =
        osTariff?.value ?? 0;

      const cpuValue =
        cpu *
        (cpuTariff?.value ?? 0);

      const ramValue =
        ram *
        (ramTariff?.value ?? 0);

      const diskValue =
        disk *
        (diskTariff?.value ?? 0);

      const dbValue =
        dbTariff?.value ?? 0;

      const subtotal =
        osValue +
        cpuValue +
        ramValue +
        diskValue +
        dbValue;

      const servicesValue =
        quoteServices &&
        servicesTariff
          ? subtotal *
            (servicesTariff.value /
              100)
          : 0;

      const total =
        subtotal +
        servicesValue;

      const rows: QuoteRow[] = [
        {
          resource: 'S.O.',
          detail:
            osTariff?.name ??
            'No seleccionado',
          value:
            osValue,
          showValue:
            Boolean(
              osTariff,
            ),
        },
        {
          resource: 'CPU',
          detail:
            cpu > 0
              ? `${formatUf(cpu)} vCPU`
              : '0 vCPU',
          value:
            cpuValue,
          showValue:
            cpu > 0 &&
            Boolean(
              cpuTariff,
            ),
        },
        {
          resource: 'RAM',
          detail:
            ram > 0
              ? `${formatUf(ram)} GB`
              : '0 GB',
          value:
            ramValue,
          showValue:
            ram > 0 &&
            Boolean(
              ramTariff,
            ),
        },
        {
          resource: 'DISCO',
          detail:
            disk > 0
              ? `${formatUf(disk)} GB`
              : '0 GB',
          value:
            diskValue,
          showValue:
            disk > 0 &&
            Boolean(
              diskTariff,
            ),
        },
        {
          resource: 'BD',
          detail:
            dbTariff?.name ??
            'No',
          value:
            dbValue,
          showValue:
            Boolean(
              dbTariff,
            ),
        },
        {
          resource:
            servicesTariff?.name ??
            'Servicios',
          detail:
            quoteServices &&
            servicesTariff
              ? `${formatUf(servicesTariff.value)}% subtotal`
              : 'No',
          value:
            servicesValue,
          showValue:
            quoteServices &&
            Boolean(
              servicesTariff,
            ),
        },
      ];

      return {
        rows,
        subtotal,
        servicesValue,
        total,
        totalClp:
          summary?.uf
            ? total *
              summary.uf.value
            : null,
      };
    }, [
      quoteCpu,
      quoteDbCode,
      quoteDisk,
      quoteOsCode,
      quoteRam,
      quoteServices,
      summary?.tariffs,
      summary?.uf,
      tariffByCode,
    ]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      if (canViewTariffs) {
        const data =
          await getPricingSummary();

        setSummary(data);

        setDrafts(
          Object.fromEntries(
            data.tariffs.map(
              (tariff) => [
                tariff.id,
                {
                  name:
                    tariff.name,
                  value:
                    String(
                      tariff.value,
                    ),
                  active:
                    tariff.active,
                  sourceNote:
                    tariff.sourceNote ?? '',
                },
              ],
            ),
          ),
        );

        return;
      }

      const uf =
        await getLatestUf();

      setSummary({
        uf,
        tariffs: [],
        operatingSystemNames: [],
        databaseSoftwareNames: [],
        configuration: {
          bcchConfigured: false,
          ufSeries: '',
        },
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar el módulo de cotización.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [canViewTariffs]);

  async function handleRefreshUf() {
    try {
      setRefreshingUf(true);
      setError('');
      setSuccess('');

      const uf =
        await refreshUf();

      setSummary(
        (current) =>
          current
            ? {
                ...current,
                uf,
              }
            : current,
      );

      setSuccess(
        'UF actualizada correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la UF.',
      );
    } finally {
      setRefreshingUf(false);
    }
  }

  async function handleManualUf() {
    const value =
      Number(
        manualValue.replace(
          ',',
          '.',
        ),
      );

    if (
      !manualDate ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setError(
        'Indica una fecha y un valor UF válido.',
      );
      return;
    }

    try {
      setError('');
      setSuccess('');

      const uf =
        await setManualUf(
          manualDate,
          value,
        );

      setSummary(
        (current) =>
          current
            ? {
                ...current,
                uf,
              }
            : current,
      );

      setManualValue('');
      setSuccess(
        'UF manual registrada correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible registrar la UF.',
      );
    }
  }

  function updateDraft(
    id: number,
    patch: Partial<TariffDraft>,
  ) {
    setDrafts(
      (current) => ({
        ...current,
        [id]: {
          ...current[id],
          ...patch,
        },
      }),
    );
  }

  async function saveTariff(
    tariff: PricingTariff,
  ) {
    const draft =
      drafts[tariff.id];

    if (!draft) {
      return;
    }

    const name =
      draft.name.trim();

    const value =
      Number(
        draft.value.replace(
          ',',
          '.',
        ),
      );

    if (!name) {
      setError(
        'El nombre del recurso no puede quedar vacío.',
      );
      return;
    }

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      setError(
        `Valor inválido para ${tariff.name}.`,
      );
      return;
    }

    try {
      setSavingId(
        tariff.id,
      );
      setError('');
      setSuccess('');

      const updated =
        await updatePricingTariff(
          tariff.id,
          {
            name,
            value,
            active:
              draft.active,
          },
        );

      setSummary(
        (current) =>
          current
            ? {
                ...current,
                tariffs:
                  current.tariffs.map(
                    (item) =>
                      item.id ===
                      updated.id
                        ? updated
                        : item,
                  ),
              }
            : current,
      );

      updateDraft(
        updated.id,
        {
          name:
            updated.name,
        },
      );

      setSuccess(
        `Tarifa ${updated.name} actualizada.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la tarifa.',
      );
    } finally {
      setSavingId(null);
    }
  }


  function requestDeleteTariff(
    tariff: PricingTariff,
  ) {
    setError('');
    setSuccess('');
    setDeleteCandidate(tariff);
  }

  function closeDeleteTariff() {
    if (deletingId !== null) {
      return;
    }

    setDeleteCandidate(null);
  }

  async function confirmDeleteTariff() {
    if (!deleteCandidate) {
      return;
    }

    try {
      setDeletingId(
        deleteCandidate.id,
      );
      setError('');
      setSuccess('');

      await deletePricingTariff(
        deleteCandidate.id,
      );

      setSummary(
        (current) =>
          current
            ? {
                ...current,
                tariffs:
                  current.tariffs.filter(
                    (item) =>
                      item.id !==
                      deleteCandidate.id,
                  ),
              }
            : current,
      );

      setDrafts(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            deleteCandidate.id
          ];

          return next;
        },
      );

      setSuccess(
        `Tarifa ${deleteCandidate.name} eliminada correctamente.`,
      );
      setDeleteCandidate(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar la tarifa.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function startAddTariff(
    category: string,
  ) {
    setAddingCategory(
      category,
    );
    setNewTariffName('');
    setNewTariffValue('');

    if (
      category ===
      'RECURSOS'
    ) {
      setNewTariffUnit(
        'unidad',
      );
      setNewTariffValueType(
        'UF_PER_UNIT',
      );
      return;
    }

    if (
      category ===
      'SERVICIOS'
    ) {
      setNewTariffUnit(
        '% subtotal',
      );
      setNewTariffValueType(
        'PERCENT',
      );
      return;
    }

    setNewTariffUnit(
      'servidor',
    );
    setNewTariffValueType(
      'UF_FIXED',
    );
  }

  function cancelAddTariff() {
    if (creatingTariff) {
      return;
    }

    setAddingCategory(
      null,
    );
    setNewTariffName('');
    setNewTariffUnit('');
    setNewTariffValue('');
  }

  async function handleCreateTariff(
    category: string,
  ) {
    const value =
      Number(
        newTariffValue.replace(
          ',',
          '.',
        ),
      );

    if (
      !newTariffName.trim() ||
      !newTariffUnit.trim() ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      setError(
        'Completa nombre, unidad y un valor válido para la nueva tarifa.',
      );
      return;
    }

    try {
      setCreatingTariff(
        true,
      );
      setError('');
      setSuccess('');

      const created =
        await createPricingTariff({
          category,
          name:
            newTariffName.trim(),
          unit:
            newTariffUnit.trim(),
          value,
          valueType:
            newTariffValueType,
          active: true,
        });

      setSummary(
        (current) =>
          current
            ? {
                ...current,
                tariffs: [
                  ...current.tariffs,
                  created,
                ],
              }
            : current,
      );

      setDrafts(
        (current) => ({
          ...current,
          [created.id]: {
            name:
              created.name,
            value:
              String(
                created.value,
              ),
            active:
              created.active,
            sourceNote:
              created.sourceNote ?? '',
          },
        }),
      );

      setAddingCategory(
        null,
      );
      setNewTariffName('');
      setNewTariffUnit('');
      setNewTariffValue('');
      setSuccess(
        `Tarifa ${created.name} creada correctamente.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear la tarifa.',
      );
    } finally {
      setCreatingTariff(
        false,
      );
    }
  }

  function markQuoteDirty() {
    if (
      quoteGenerated
    ) {
      setQuoteGenerated(
        false,
      );
    }
  }

  function handleGenerateQuote() {
    if (
      quoteCalculation.total <= 0
    ) {
      const message =
        'Selecciona al menos un recurso con valor para generar la cotización.';

      setError(message);
      toast.error(
        'No fue posible generar la cotización',
        message,
      );
      return;
    }

    setError('');
    setSuccess('');
    setQuoteGenerated(true);

    toast.success(
      'Cotización generada',
      `Total mensual: ${formatQuoteUf(quoteCalculation.total)} UF${
        quoteCalculation.totalClp !== null
          ? ` · ${formatClp(quoteCalculation.totalClp)}`
          : ''
      }`,
    );
  }

  function handleDownloadQuoteImage() {
    if (
      !quoteGenerated
    ) {
      return;
    }

    const canvas =
      document.createElement(
        'canvas',
      );

    const width =
      1200;

    const rowHeight =
      68;

    const headerHeight =
      250;

    const footerHeight =
      250;

    const height =
      headerHeight +
      quoteCalculation.rows.length *
        rowHeight +
      footerHeight;

    canvas.width =
      width;
    canvas.height =
      height;

    const ctx =
      canvas.getContext(
        '2d',
      );

    if (!ctx) {
      setError(
        'No fue posible generar la imagen.',
      );
      return;
    }

    const primary =
      '#334155';

    const secondary =
      '#64748b';

    const light =
      '#f8fafc';

    const border =
      '#cbd5e1';

    ctx.fillStyle =
      '#ffffff';
    ctx.fillRect(
      0,
      0,
      width,
      height,
    );

    ctx.fillStyle =
      primary;
    ctx.fillRect(
      0,
      0,
      width,
      110,
    );

    ctx.fillStyle =
      '#ffffff';
    ctx.font =
      '700 42px Arial';
    ctx.fillText(
      'Cotización de servidor',
      54,
      70,
    );

    ctx.fillStyle =
      primary;
    ctx.font =
      '700 27px Arial';
    ctx.fillText(
      quoteCompany.trim() ||
        'InfraStock',
      54,
      155,
    );

    ctx.fillStyle =
      secondary;
    ctx.font =
      '400 22px Arial';

    const quoteDate =
      new Intl.DateTimeFormat(
        'es-CL',
        {
          dateStyle:
            'long',
        },
      ).format(
        new Date(),
      );

    ctx.fillText(
      quoteReference.trim()
        ? `${quoteReference.trim()} · ${quoteDate}`
        : quoteDate,
      54,
      195,
    );

    const tableTop =
      230;

    ctx.fillStyle =
      primary;
    ctx.fillRect(
      40,
      tableTop,
      width - 80,
      56,
    );

    ctx.fillStyle =
      '#ffffff';
    ctx.font =
      '700 22px Arial';
    ctx.fillText(
      'Recurso',
      62,
      tableTop + 36,
    );
    ctx.fillText(
      'Detalle',
      390,
      tableTop + 36,
    );
    ctx.textAlign =
      'right';
    ctx.fillText(
      'Valor UF',
      width - 62,
      tableTop + 36,
    );
    ctx.textAlign =
      'left';

    quoteCalculation.rows.forEach(
      (
        row,
        index,
      ) => {
        const y =
          tableTop +
          56 +
          index *
            rowHeight;

        ctx.fillStyle =
          index % 2 === 0
            ? '#ffffff'
            : light;
        ctx.fillRect(
          40,
          y,
          width - 80,
          rowHeight,
        );

        ctx.strokeStyle =
          border;
        ctx.beginPath();
        ctx.moveTo(
          40,
          y + rowHeight,
        );
        ctx.lineTo(
          width - 40,
          y + rowHeight,
        );
        ctx.stroke();

        ctx.fillStyle =
          primary;
        ctx.font =
          '700 22px Arial';
        ctx.fillText(
          row.resource,
          62,
          y + 42,
        );

        ctx.font =
          '400 22px Arial';
        ctx.fillText(
          row.detail,
          390,
          y + 42,
        );

        ctx.textAlign =
          'right';
        ctx.fillText(
          row.showValue
            ? formatQuoteUf(
                row.value,
              )
            : '-',
          width - 62,
          y + 42,
        );
        ctx.textAlign =
          'left';
      },
    );

    const totalTop =
      tableTop +
      56 +
      quoteCalculation.rows.length *
        rowHeight +
      28;

    ctx.fillStyle =
      primary;
    ctx.fillRect(
      40,
      totalTop,
      width - 80,
      82,
    );

    ctx.fillStyle =
      '#ffffff';
    ctx.font =
      '700 28px Arial';
    ctx.fillText(
      'Total mensual',
      62,
      totalTop + 52,
    );
    ctx.textAlign =
      'right';
    ctx.fillText(
      `${formatQuoteUf(
        quoteCalculation.total,
      )} UF`,
      width - 62,
      totalTop + 52,
    );
    ctx.textAlign =
      'left';

    let infoY =
      totalTop + 125;

    ctx.fillStyle =
      secondary;
    ctx.font =
      '400 21px Arial';

    if (
      summary?.uf
    ) {
      ctx.fillText(
        `UF utilizada: ${formatClp(
          summary.uf.value,
        )} · ${formatDate(
          summary.uf.date,
        )}`,
        54,
        infoY,
      );

      infoY += 38;

      ctx.fillStyle =
        primary;
      ctx.font =
        '700 25px Arial';
      ctx.fillText(
        `Referencia en CLP: ${formatClp(
          quoteCalculation.totalClp ??
            0,
        )}`,
        54,
        infoY,
      );
    } else {
      ctx.fillText(
        'Valor CLP no disponible: no existe una UF almacenada.',
        54,
        infoY,
      );
    }

    const link =
      document.createElement(
        'a',
      );

    const safeName =
      (quoteCompany.trim() ||
        quoteReference.trim() ||
        'servidor')
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )
        .replace(
          /[^a-zA-Z0-9_-]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '',
        )
        .toLowerCase();

    link.download =
      `cotizacion-${safeName || 'servidor'}.png`;

    link.href =
      canvas.toDataURL(
        'image/png',
      );

    link.click();
  }

  if (loading) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <PageLoader
          variant="cards"
          rows={4}
        />

        <PageLoader
          variant="detail"
          rows={2}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-company-primary" />

        <div className="flex items-start gap-4">
          <div className="ui-page-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-company-primary/10 text-company-primary ring-1 ring-company-primary/10">
            <BadgeDollarSign size={24} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-company-primary">
              {isViewer ? 'Información financiera' : isEditor ? 'Consulta y cotización' : 'Gestión financiera'}
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isViewer
                ? 'Centro de Costos'
                : 'Costos y Cotización'}
            </h1>

            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
              {isViewer
                ? 'Consulta el valor de la UF y la valorización mensual de los servidores de tus empresas habilitadas.'
                : isEditor
                  ? 'Consulta las tarifas vigentes, genera cotizaciones y revisa la valorización mensual de los servidores.'
                  : 'Centraliza costos, genera cotizaciones y administra las tarifas en UF.'}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="ui-alert ui-alert-error rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="ui-alert ui-alert-success flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-sm">
          <Check size={18} />
          {success}
        </div>
      )}

      <section className="ui-table-shell ui-panel ui-page-header relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Unidad de Fomento
            </p>

            {summary?.uf ? (
              <>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatClp(
                    summary.uf.value,
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Fecha {formatDate(summary.uf.date)} · Fuente {summary.uf.source === 'BCCH' ? 'Banco Central de Chile' : 'Manual'}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Última carga {formatDate(summary.uf.fetchedAt)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Aún no hay un valor UF almacenado.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {canManageUf && (
              <button
                type="button"
                onClick={() => void handleRefreshUf()}
                disabled={refreshingUf}
                className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={refreshingUf ? 'animate-spin' : ''}
                />
                {refreshingUf
                  ? 'Consultando...'
                  : 'Actualizar UF'}
              </button>
            )}
          </div>
        </div>

        {canManageUf && (
          <div className="mt-5 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-700">
              UF manual
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Úsala como respaldo si la actualización automática no está disponible.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-[180px_220px_auto]">
              <input
                type="date"
                value={manualDate}
                onChange={(event) => setManualDate(event.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              />

              <input
                inputMode="decimal"
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder="Valor UF en CLP"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              />

              <button
                type="button"
                onClick={() => void handleManualUf()}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Guardar UF manual
              </button>
            </div>
          </div>
        )}
      </section>

      {canGenerateQuote && (
        <section className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Calculator
              size={20}
              className="text-company-primary"
            />

            <h2 className="text-lg font-bold text-slate-900">
              Generador de cotización
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Selecciona los componentes del servidor. El total se calcula en UF y, si existe una UF vigente, también en CLP.
          </p>
        </div>

        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa / cliente
                </label>

                <input
                  value={quoteCompany}
                  onChange={(event) => {
                    setQuoteCompany(event.target.value);
                    markQuoteDirty();
                  }}
                  placeholder="Opcional"
                  className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Referencia
                </label>

                <input
                  value={quoteReference}
                  onChange={(event) => {
                    setQuoteReference(event.target.value);
                    markQuoteDirty();
                  }}
                  placeholder="Ej. APP-PRD-01"
                  className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Sistema operativo
              </label>

              <select
                value={quoteOsCode}
                onChange={(event) => {
                  setQuoteOsCode(event.target.value);
                  markQuoteDirty();
                }}
                className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="">
                  Sin sistema operativo facturable
                </option>

                {osTariffs.map(
                  (tariff) => (
                    <option
                      key={tariff.id}
                      value={tariff.code}
                    >
                      {tariff.name} · {formatQuoteUf(tariff.value)} UF
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  CPU
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteCpu}
                    onChange={(event) => {
                      setQuoteCpu(event.target.value);
                      markQuoteDirty();
                    }}
                    placeholder="0"
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-16 text-sm"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    vCPU
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  RAM
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteRam}
                    onChange={(event) => {
                      setQuoteRam(event.target.value);
                      markQuoteDirty();
                    }}
                    placeholder="0"
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    GB
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Disco
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quoteDisk}
                    onChange={(event) => {
                      setQuoteDisk(event.target.value);
                      markQuoteDirty();
                    }}
                    placeholder="0"
                    className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-12 text-sm"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    GB
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Base de datos
              </label>

              <select
                value={quoteDbCode}
                onChange={(event) => {
                  setQuoteDbCode(event.target.value);
                  markQuoteDirty();
                }}
                className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-company-primary focus:ring-2 focus:ring-company-primary/10"
              >
                <option value="">
                  No
                </option>

                {dbTariffs.map(
                  (tariff) => (
                    <option
                      key={tariff.id}
                      value={tariff.code}
                    >
                      {tariff.name} · {formatQuoteUf(tariff.value)} UF
                    </option>
                  ),
                )}
              </select>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={quoteServices}
                onChange={(event) => {
                  setQuoteServices(event.target.checked);
                  markQuoteDirty();
                }}
                className="mt-0.5 h-4 w-4"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-700">
                  Incluir servicios
                </span>

                <span className="mt-0.5 block text-xs text-slate-500">
                  Se aplica el porcentaje configurado sobre el subtotal.
                </span>
              </span>
            </label>

            <button
              type="button"
              onClick={handleGenerateQuote}
              className="ui-btn ui-btn-primary btn-company-primary inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold sm:w-auto"
            >
              <Calculator size={18} />
              Generar cotización
            </button>
          </div>

          <div>
            <div className="overflow-hidden rounded-xl border border-slate-300">
              <div className="grid grid-cols-[130px_1fr_110px] bg-company-secondary px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white">
                <span>
                  Recurso
                </span>
                <span>
                  Detalle
                </span>
                <span className="text-right">
                  Valor UF
                </span>
              </div>

              {quoteCalculation.rows.map(
                (row) => (
                  <div
                    key={row.resource}
                    className="grid grid-cols-[130px_1fr_110px] border-t border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-slate-700">
                      {row.resource}
                    </span>

                    <span className="text-slate-600">
                      {row.detail}
                    </span>

                    <span className="text-right tabular-nums text-slate-700">
                      {row.showValue
                        ? formatQuoteUf(row.value)
                        : '-'}
                    </span>
                  </div>
                ),
              )}

              <div className="grid grid-cols-[130px_1fr_110px] border-t border-slate-300 bg-company-secondary px-3 py-3 text-sm font-bold text-white">
                <span />
                <span>
                  Total
                </span>
                <span className="text-right tabular-nums">
                  {formatQuoteUf(
                    quoteCalculation.total,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1 text-sm text-slate-500">
              <div className="flex justify-between gap-4">
                <span>
                  Total mensual
                </span>
                <strong className="text-slate-800">
                  {formatQuoteUf(
                    quoteCalculation.total,
                  )} UF
                </strong>
              </div>

              {quoteCalculation.totalClp !== null && (
                <div className="flex justify-between gap-4">
                  <span>
                    Referencia CLP
                  </span>
                  <strong className="text-slate-800">
                    {formatClp(
                      quoteCalculation.totalClp,
                    )}
                  </strong>
                </div>
              )}
            </div>

            {quoteGenerated && (
              <button
                type="button"
                onClick={handleDownloadQuoteImage}
                className="quote-download-button group mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-bold"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 transition group-hover:bg-white/20">
                  <Download size={17} strokeWidth={2.2} />
                </span>
                Descargar cotización en PNG
              </button>
            )}
          </div>
        </div>
      </section>
      )}

      <ServerValuationPanel />

      {canViewTariffs && (

      <section className="space-y-5">
        <div className="ui-panel rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-company-primary">
            Configuración financiera
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Tarifas base
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {canManageCosts
              ? 'Administra valores, activa o desactiva conceptos y agrega nuevas tarifas por categoría.'
              : 'Consulta los valores vigentes utilizados por el generador de cotizaciones y la valorización mensual.'}
          </p>
        </div>

        {groupedTariffs.map(
          ([category, tariffs]) => (
            <div
              key={category}
              className="ui-table-shell ui-panel overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm"
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {category.replaceAll('_', ' ')}
                </h3>

                {canManageCosts && (
                  <button
                    type="button"
                    onClick={() =>
                      addingCategory === category
                        ? cancelAddTariff()
                        : startAddTariff(category)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {addingCategory === category ? (
                      <X size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                    {addingCategory === category
                      ? 'Cancelar'
                      : 'Agregar tarifa'}
                  </button>
                )}
              </div>

              {canManageCosts && addingCategory === category && (
                <div className="border-b border-slate-200 bg-white p-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_180px_auto] xl:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Nombre
                      </label>
                      {category ===
                      'SISTEMA_OPERATIVO' ? (
                        <select
                          value={
                            newTariffName
                          }
                          onChange={(event) =>
                            setNewTariffName(
                              event.target.value,
                            )
                          }
                          className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">
                            Seleccionar SO
                          </option>

                          {availableOperatingSystemNames.map(
                            (name) => (
                              <option
                                key={name}
                                value={name}
                              >
                                {name}
                              </option>
                            ),
                          )}
                        </select>
                      ) : category ===
                        'BASE_DATOS' ? (
                        <select
                          value={newTariffName}
                          onChange={(event) =>
                            setNewTariffName(
                              event.target.value,
                            )
                          }
                          className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">
                            Seleccionar base de datos
                          </option>
                          {availableDatabaseNames.map(
                            (name) => (
                              <option
                                key={name}
                                value={name}
                              >
                                {name}
                              </option>
                            ),
                          )}
                        </select>
                      ) : (
                        <input
                          value={newTariffName}
                          onChange={(event) =>
                            setNewTariffName(
                              event.target.value,
                            )
                          }
                          placeholder="Nombre de la tarifa"
                          className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Unidad
                      </label>
                      <input
                        value={newTariffUnit}
                        onChange={(event) => setNewTariffUnit(event.target.value)}
                        placeholder="servidor, GB, unidad..."
                        className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Tipo de cobro
                      </label>
                      <select
                        value={newTariffValueType}
                        onChange={(event) => setNewTariffValueType(event.target.value as PricingValueType)}
                        className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="UF_FIXED">UF fija</option>
                        <option value="UF_PER_UNIT">UF por unidad</option>
                        <option value="PERCENT">Porcentaje</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Valor
                      </label>
                      <input
                        value={newTariffValue}
                        onChange={(event) => setNewTariffValue(event.target.value)}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCreateTariff(category)}
                      disabled={creatingTariff}
                      className="ui-btn ui-btn-primary btn-company-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <Plus size={16} />
                      {creatingTariff ? 'Creando' : 'Crear'}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {tariffs.map(
                  (tariff) => {
                    const draft =
                      drafts[tariff.id];

                    if (!draft) {
                      return null;
                    }

                    return (
                      <div
                        key={tariff.id}
                        className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1.4fr)_170px_120px_minmax(190px,auto)] lg:items-start"
                      >
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">
                            Nombre del recurso
                          </label>

                          {tariff.category ===
                          'SISTEMA_OPERATIVO' ? (
                            <select
                              value={
                                draft.name
                              }
                              disabled={!canManageCosts}
                              onChange={(event) =>
                                updateDraft(
                                  tariff.id,
                                  {
                                    name:
                                      event.target.value,
                                  },
                                )
                              }
                              className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-600"
                            >
                              {!operatingSystemOptionsForTariff(
                                tariff,
                              ).includes(
                                draft.name,
                              ) && (
                                <option
                                  value={draft.name}
                                >
                                  {draft.name} · catálogo inactivo
                                </option>
                              )}

                              {operatingSystemOptionsForTariff(
                                tariff,
                              ).map(
                                (name) => (
                                  <option
                                    key={name}
                                    value={name}
                                  >
                                    {name}
                                  </option>
                                ),
                              )}
                            </select>
                          ) : tariff.category ===
                            'BASE_DATOS' ? (
                            <select
                              value={draft.name}
                              disabled={!canManageCosts}
                              onChange={(event) =>
                                updateDraft(
                                  tariff.id,
                                  {
                                    name:
                                      event.target.value,
                                  },
                                )
                              }
                              className="ui-control w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-600"
                            >
                              {!databaseOptionsForTariff(
                                tariff,
                              ).includes(
                                draft.name,
                              ) && (
                                <option
                                  value={draft.name}
                                >
                                  {draft.name} · catálogo inactivo
                                </option>
                              )}

                              {databaseOptionsForTariff(
                                tariff,
                              ).map((name) => (
                                <option
                                  key={name}
                                  value={name}
                                >
                                  {name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={
                                draft.name
                              }
                              disabled={!canManageCosts}
                              onChange={(event) =>
                                updateDraft(
                                  tariff.id,
                                  {
                                    name:
                                      event.target.value,
                                  },
                                )
                              }
                              className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-600"
                            />
                          )}

                          <p className="mt-2 text-xs text-slate-500">
                            {billingDetail(tariff)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {tariff.unit} · {valueLabel(tariff)}
                          </p>
                        </div>

                        <div className="lg:pt-5">
                          <label className="mb-1 block text-xs font-medium text-slate-500 lg:hidden">
                            Valor
                          </label>

                          <input
                            value={draft.value}
                            disabled={!canManageCosts}
                            onChange={(event) => updateDraft(tariff.id, { value: event.target.value })}
                            className="ui-control w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-600"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-600 lg:pt-7">
                          <input
                            type="checkbox"
                            checked={draft.active}
                            disabled={!canManageCosts}
                            onChange={(event) => updateDraft(tariff.id, { active: event.target.checked })}
                            className="h-4 w-4"
                          />
                          Activa
                        </label>

                        {canManageCosts ? (
                          <div className="flex flex-col gap-2 lg:mt-5 sm:flex-row lg:flex-col xl:flex-row">
                            <button
                              type="button"
                              onClick={() => void saveTariff(tariff)}
                              disabled={
                                savingId === tariff.id ||
                                deletingId === tariff.id
                              }
                              className="ui-control inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              <Save size={16} />
                              {savingId === tariff.id ? 'Guardando' : 'Guardar'}
                            </button>

                            <button
                              type="button"
                              onClick={() => requestDeleteTariff(tariff)}
                              disabled={
                                savingId === tariff.id ||
                                deletingId === tariff.id ||
                                ['CPU_VCPU', 'RAM_GB', 'DISK_GB'].includes(
                                  tariff.code,
                                )
                              }
                              title={
                                ['CPU_VCPU', 'RAM_GB', 'DISK_GB'].includes(
                                  tariff.code,
                                )
                                  ? 'Tarifa estructural del motor de valorización: no se puede eliminar'
                                  : 'Eliminar tarifa'
                              }
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
                            >
                              <Trash2 size={16} />
                              {deletingId === tariff.id ? 'Eliminando' : 'Eliminar'}
                            </button>
                          </div>
                        ) : (
                          <div />
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ),
        )}
      </section>
      )}

      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteTariff();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tariff-title"
            className="ui-table-shell ui-panel w-full max-w-md overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                    Eliminar tarifa
                  </p>
                  <h3
                    id="delete-tariff-title"
                    className="mt-1 text-lg font-bold text-slate-900"
                  >
                    {deleteCandidate.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeDeleteTariff}
                  disabled={deletingId !== null}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Cerrar confirmación"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                Esta acción eliminará permanentemente la tarifa de la configuración. El evento quedará registrado en auditoría.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <span>Tipo</span>
                  <strong className="text-right text-slate-800">
                    {deleteCandidate.category.replaceAll('_', ' ')}
                  </strong>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span>Valor</span>
                  <strong className="text-right text-slate-800">
                    {valueLabel(deleteCandidate)}
                  </strong>
                </div>
                <div className="mt-2 flex justify-between gap-4">
                  <span>Estado</span>
                  <strong className="text-right text-slate-800">
                    {deleteCandidate.active ? 'Activa' : 'Inactiva'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteTariff}
                disabled={deletingId !== null}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void confirmDeleteTariff()}
                disabled={deletingId !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 size={16} />
                {deletingId !== null ? 'Eliminando...' : 'Eliminar tarifa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
