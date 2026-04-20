"use client";

import { useMemo, useState, useEffect } from "react";

import { Distribution } from "@/lib/types";
import { CollapsibleSection } from "./CollapsibleSection";
import { EditableDistributionRow } from "./EditableDistributionRow";

const pluralizeDiapers = (count: number) =>
  `${count.toLocaleString()} ${count === 1 ? "diaper" : "diapers"}`;

const MONTH_ORDER: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

interface DateTotal {
  month: string;
  year: string;
  total: number;
  distributions: Distribution[];
}

interface MonthlyDataResponseRow {
  partnerId: string;
  month: string;
  year: string;
  numberDiapers: string | null;
}

interface YearGroup {
  year: string;
  hasMonthlyData: boolean;
  months: DateTotal[];
  totalDiapers: number;
  yearlyDistributions: Distribution[];
}

export default function DistributionsTable({
  distributionData,
  onDataUpdated,
}: {
  distributionData: Distribution[];
  onDataUpdated?: () => Promise<void> | void;
}) {
  // Authoritative data from /api/monthly-data
  const [diapersMap, setDiapersMap] = useState<Record<string, number>>({});
  const [monthlyBaseTotals, setMonthlyBaseTotals] = useState<Record<string, number>>({});

  // Optimistic overrides for yearly-only data
  const [yearlyDiapersMap, setYearlyDiapersMap] = useState<Record<string, number>>({});

  const loadMonthlyTotals = () => {
    fetch("/api/monthly-data")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (!Array.isArray(data)) return;
        const totalsMap: Record<string, number> = {};
        const partnerMap: Record<string, number> = {};
        (data as MonthlyDataResponseRow[]).forEach((row) => {
          if (!row.month || !row.year) return;
          const monthKey = `${row.year}-${row.month}`;
          const partnerKey = `${row.partnerId}-${row.month}-${row.year}`;
          const diapers = row.numberDiapers ? parseInt(row.numberDiapers, 10) : 0;
          totalsMap[monthKey] = (totalsMap[monthKey] ?? 0) + diapers;
          partnerMap[partnerKey] = (partnerMap[partnerKey] ?? 0) + diapers;
        });
        setMonthlyBaseTotals(totalsMap);
        setDiapersMap(partnerMap);
      })
      .catch((err) => console.error("Failed to load monthly totals:", err));
  };

  useEffect(() => {
    loadMonthlyTotals();
  }, [distributionData]);

  const submitEdit = async (partnerId: number, year: string, month: string, newValue: number) => {
    const payload = {
      partnerId,
      month,
      year,
      numDiapers: newValue,
    };

    const response = await fetch("/api/monthly-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as {
      error?: string;
      data?: MonthlyDataResponseRow;
      distributions?: Distribution[];
    };

    if (!response.ok || !result.data) {
      throw new Error(result.error ?? "Failed to update monthly data");
    }

    const key = `${partnerId}-${month}-${year}`;
    const parsed = result.data.numberDiapers ? parseInt(result.data.numberDiapers, 10) : 0;

    // Optimistically patch UI state locally instead of causing a hard refresh that collapses all.
    setDiapersMap((prev) => ({ ...prev, [key]: parsed }));

    // Refetch in background to re-sync base totals safely
    loadMonthlyTotals();
    if (onDataUpdated) {
      await onDataUpdated();
    }
  };

  const submitYearlyEdit = async (partnerId: number, year: string, newValue: number) => {
    const response = await fetch("/api/distributions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId, year, numDiapers: newValue }),
    });

    const result = (await response.json()) as {
      error?: string;
      totalDiapers?: number;
      distributions?: Distribution[];
    };

    if (!response.ok) throw new Error(result.error ?? "Failed to update yearly data");

    const mapKey = `${partnerId}-${year}`;
    setYearlyDiapersMap((prev) => ({ ...prev, [mapKey]: newValue }));

    if (onDataUpdated) {
      await onDataUpdated();
    }
  };

  const yearGroups: YearGroup[] = useMemo(() => {
    const grouped = distributionData.reduce<Record<string, YearGroup>>((acc, dist) => {
      if (!dist.year) return acc;

      const year = dist.year;
      const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;

      if (!acc[year]) {
        acc[year] = {
          year,
          hasMonthlyData: false,
          months: [],
          totalDiapers: 0,
          yearlyDistributions: [],
        };
      }

      acc[year].totalDiapers += diapers;

      if (!dist.month) {
        acc[year].yearlyDistributions.push(dist);
        return acc;
      }

      acc[year].hasMonthlyData = true;

      let monthBucket = acc[year].months.find((m) => m.month === dist.month);

      if (!monthBucket) {
        monthBucket = {
          month: dist.month,
          year: dist.year,
          total: 0,
          distributions: [],
        };
        acc[year].months.push(monthBucket);
      }

      monthBucket.total += diapers;
      monthBucket.distributions.push(dist);

      return acc;
    }, {});

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        months: group.months
          .map((monthGroup) => ({
            ...monthGroup,
            distributions: monthGroup.distributions.sort((a, b) => {
              const nameA = a.partner?.name ?? "";
              const nameB = b.partner?.name ?? "";
              return nameA.localeCompare(nameB);
            }),
          }))
          .sort((a, b) => (MONTH_ORDER[a.month] ?? 99) - (MONTH_ORDER[b.month] ?? 99)),
        yearlyDistributions: group.yearlyDistributions.sort((a, b) =>
          (a.partner?.name ?? "").localeCompare(b.partner?.name ?? ""),
        ),
      }))
      .sort((a, b) => Number(b.year) - Number(a.year));
  }, [distributionData]);

  const displayedYearTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    yearGroups.forEach((yearGroup) => {
      const monthlyTotal = yearGroup.months.reduce((sum, monthGroup) => {
        const key = `${monthGroup.year}-${monthGroup.month}`;
        // Using the live monthlyBaseTotals
        return sum + (monthlyBaseTotals[key] ?? monthGroup.total);
      }, 0);

      const yearlyOnlyTotal = yearGroup.yearlyDistributions.reduce((sum, dist) => {
        const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;
        return sum + diapers;
      }, 0);

      totals[yearGroup.year] = monthlyTotal + yearlyOnlyTotal;
    });

    return totals;
  }, [yearGroups, monthlyBaseTotals]);

  // Renders the City->Diapers grid for a specific partner block
  const renderDistributionsTable = (rows: Distribution[]) => {
    if (rows.length === 0) {
      return <div className="text-sm text-gray-600 p-2">No distributions found.</div>;
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
          <div>City</div>
          <div>Diapers</div>
        </div>
        {rows.map((dist) => (
          <div
            key={dist.id}
            className="grid grid-cols-2 gap-4 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-b-0"
          >
            <div>{dist.city?.name ?? "-"}</div>
            <div>{dist.numberDiapers ?? "0"}</div>
          </div>
        ))}
      </div>
    );
  };

  const groupDistributionsByPartner = (distributions: Distribution[]) => {
    const partnerGroups = distributions.reduce<
      Record<
        string,
        { partnerName: string; totalDiapers: number; partnerId: number; rows: Distribution[] }
      >
    >((acc, dist) => {
      const partnerName = dist.partner?.name?.trim() || "Unknown Partner";
      const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;

      if (!acc[partnerName]) {
        acc[partnerName] = {
          partnerName,
          totalDiapers: 0,
          partnerId: parseInt(dist.partnerId ?? "0", 10) || 0,
          rows: [],
        };
      }

      acc[partnerName].totalDiapers += diapers;
      acc[partnerName].rows.push(dist);
      return acc;
    }, {});

    return Object.values(partnerGroups)
      .map((p) => ({
        ...p,
        rows: p.rows.sort((a, b) => (a.city?.name ?? "").localeCompare(b.city?.name ?? "")),
      }))
      .sort((a, b) => a.partnerName.localeCompare(b.partnerName));
  };

  return (
    <div className="space-y-2">
      {yearGroups.map((yearGroup) => (
        <CollapsibleSection
          key={yearGroup.year}
          title={
            <span className="flex items-center gap-3">
              <span>{yearGroup.year}</span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[var(--color-brand)]">
                {pluralizeDiapers(displayedYearTotals[yearGroup.year] ?? yearGroup.totalDiapers)}
              </span>
            </span>
          }
          titleClassName="text-[28px] font-bold"
        >
          <div className="space-y-2">
            {yearGroup.hasMonthlyData ? (
              yearGroup.months.map((date) => (
                <CollapsibleSection
                  key={`${date.year}-${date.month}`}
                  title={
                    <span className="flex items-center gap-3">
                      <span>{`${date.month} ${date.year}`}</span>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[var(--color-brand)]">
                        {(
                          monthlyBaseTotals[`${date.year}-${date.month}`] ?? date.total
                        ).toLocaleString()}{" "}
                        diapers
                      </span>
                    </span>
                  }
                  titleClassName="text-[22px] font-bold"
                >
                  <div className="space-y-2">
                    {groupDistributionsByPartner(date.distributions).map((partner) => {
                      const mapKey = `${partner.partnerId}-${date.month}-${date.year}`;
                      const displayDiapers = diapersMap[mapKey] ?? partner.totalDiapers;

                      return (
                        <EditableDistributionRow
                          key={`${date.year}-${date.month}-${partner.partnerName}`}
                          title={partner.partnerName}
                          displayDiapers={displayDiapers}
                          onSave={(val) =>
                            submitEdit(partner.partnerId, date.year, date.month, val)
                          }
                        >
                          {renderDistributionsTable(partner.rows)}
                        </EditableDistributionRow>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              ))
            ) : (
              // Yearly-only path for 2013–2024
              <div className="space-y-2">
                {groupDistributionsByPartner(yearGroup.yearlyDistributions).map((partner) => {
                  const mapKey = `${partner.partnerId}-${yearGroup.year}`;
                  const displayDiapers = yearlyDiapersMap[mapKey] ?? partner.totalDiapers;

                  return (
                    <EditableDistributionRow
                      key={`${yearGroup.year}-${partner.partnerName}`}
                      title={partner.partnerName}
                      displayDiapers={displayDiapers}
                      onSave={(val) => submitYearlyEdit(partner.partnerId, yearGroup.year, val)}
                    >
                      {renderDistributionsTable(partner.rows)}
                    </EditableDistributionRow>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}
