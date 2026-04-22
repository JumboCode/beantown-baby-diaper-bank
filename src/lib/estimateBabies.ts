const MONTH_ORDER = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const DIAPERS_PER_BABY_MONTH = 200;
const NEW_BABY_RATE = 0.1;

export interface MonthlyDistributionTotal {
  month: string;
  diapers: number;
  children: number | null;
}

export function estimateBabiesHelped(
  monthlyTotals: MonthlyDistributionTotal[],
  yearlyDiapers: number,
): number {
  if (monthlyTotals.length === 0) {
    const monthlyEstimate = yearlyDiapers / 12 / DIAPERS_PER_BABY_MONTH;
    return Math.round(monthlyEstimate * (1 + 11 * NEW_BABY_RATE));
  }

  const sorted = [...monthlyTotals].sort(
    (a, b) =>
      MONTH_ORDER.indexOf(a.month as (typeof MONTH_ORDER)[number]) -
      MONTH_ORDER.indexOf(b.month as (typeof MONTH_ORDER)[number]),
  );

  let totalUnique = 0;
  sorted.forEach((m, i) => {
    const babies =
      m.children != null && m.children > 0
        ? m.children
        : m.diapers / DIAPERS_PER_BABY_MONTH;
    totalUnique += i === 0 ? babies : babies * NEW_BABY_RATE;
  });

  return Math.round(totalUnique);
}
