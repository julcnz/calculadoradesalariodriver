// Estimación de impuestos para contratistas independientes (1099) en EE. UU.
// SOLO sirve para apartar dinero cada trimestre — no es asesoría fiscal.
//
// Modelo (deliberadamente conservador — mejor apartar de más que de menos):
// - Base fiscal = ingresos brutos − deducción por milla. Los gastos
//   registrados NO se restan: la deducción por milla del IRS ya cubre los
//   costos del vehículo (gasolina, mantenimiento, seguro), que son la
//   inmensa mayoría del gasto de un repartidor; restarlos otra vez los
//   contaría doble.
// - Autoempleo (SE): 15.3% sobre el 92.35% de la base (12.4% Social
//   Security + 2.9% Medicare). El tope salarial de SS no se modela: queda
//   muy por encima del ingreso típico de reparto. Regla de los $400: por
//   debajo de esa base ANUAL no hay SE tax (se aplica solo al total anual).
// - Ingreso: tasa efectiva configurable (User.incomeTaxRate) sobre
//   (base − mitad del SE), porque la mitad del SE es deducible.
//
// Trimestres del IRS (NO son trimestres calendario) y sus fechas de pago
// estimado; si la fecha cae en fin de semana pasa al lunes siguiente (los
// feriados federales no se modelan).

export type IrsQuarter = {
  index: 1 | 2 | 3 | 4;
  label: string;
  months: string;
  start: Date; // medianoche UTC (fecha de negocio)
  end: Date;
  dueDate: Date;
};

const SE_TAXABLE_FACTOR = 0.9235;
const SE_TAX_RATE = 0.153;
const SE_ANNUAL_MINIMUM_CENTS = 400 * 100;

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function nextBusinessDay(date: Date): Date {
  const day = date.getUTCDay();
  if (day === 6) return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 2);
  if (day === 0) return utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
  return date;
}

export function irsQuartersForYear(year: number): IrsQuarter[] {
  return [
    {
      index: 1,
      label: "1er trimestre",
      months: "enero – marzo",
      start: utcDate(year, 0, 1),
      end: utcDate(year, 2, 31),
      dueDate: nextBusinessDay(utcDate(year, 3, 15)),
    },
    {
      index: 2,
      label: "2do trimestre",
      months: "abril – mayo",
      start: utcDate(year, 3, 1),
      end: utcDate(year, 4, 31),
      dueDate: nextBusinessDay(utcDate(year, 5, 15)),
    },
    {
      index: 3,
      label: "3er trimestre",
      months: "junio – agosto",
      start: utcDate(year, 5, 1),
      end: utcDate(year, 7, 31),
      dueDate: nextBusinessDay(utcDate(year, 8, 15)),
    },
    {
      index: 4,
      label: "4to trimestre",
      months: "septiembre – diciembre",
      start: utcDate(year, 8, 1),
      end: utcDate(year, 11, 31),
      dueDate: nextBusinessDay(utcDate(year + 1, 0, 15)),
    },
  ];
}

export type TaxEstimate = {
  grossCents: number;
  mileageDeductionCents: number;
  taxableBaseCents: number; // max(0, bruto − deducción)
  seTaxCents: number;
  incomeTaxCents: number;
  totalCents: number;
  /** % del bruto que hay que apartar (null si no hay ingresos). */
  effectivePct: number | null;
};

export function computeTaxEstimate({
  grossCents,
  mileageDeductionCents,
  incomeTaxRatePct,
  applyAnnualMinimum = false,
}: {
  grossCents: number;
  mileageDeductionCents: number;
  incomeTaxRatePct: number;
  applyAnnualMinimum?: boolean;
}): TaxEstimate {
  const taxableBaseCents = Math.max(0, grossCents - mileageDeductionCents);
  const seBaseCents = Math.round(taxableBaseCents * SE_TAXABLE_FACTOR);
  const seTaxCents =
    applyAnnualMinimum && seBaseCents < SE_ANNUAL_MINIMUM_CENTS
      ? 0
      : Math.round(seBaseCents * SE_TAX_RATE);
  const incomeTaxCents = Math.max(
    0,
    Math.round(
      (taxableBaseCents - Math.round(seTaxCents / 2)) * (incomeTaxRatePct / 100)
    )
  );
  const totalCents = seTaxCents + incomeTaxCents;
  return {
    grossCents,
    mileageDeductionCents,
    taxableBaseCents,
    seTaxCents,
    incomeTaxCents,
    totalCents,
    effectivePct:
      grossCents > 0 ? Math.round((totalCents / grossCents) * 100) : null,
  };
}
