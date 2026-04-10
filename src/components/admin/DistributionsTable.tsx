"use client";

import { useMemo, useState, useEffect } from "react";
import { Button, Input, Text } from "@mantine/core";
import { Distribution } from "@/lib/types";
import { CollapsibleDropdown } from "./Dropdown";

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

interface EditInfo {
  name: string;
  year: string;
  month: string;
  numDiapers: number;
  partnerId: number;
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
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Central diaper count map keyed by `${partnerId}-${month}-${year}`.
  // Seeded from the MonthlyData fetch (same source as edits); updated on submit.
  const [diapersMap, setDiapersMap] = useState<Record<string, number>>({});

  // Optimistic overrides for yearly partner totals, keyed by `${partnerId}-${year}`.
  const [yearlyDiapersMap, setYearlyDiapersMap] = useState<Record<string, number>>({});

  // Tracks net changes to monthly totals after edits, keyed by `${year}-${month}`.
  const [monthDeltaMap, setMonthDeltaMap] = useState<Record<string, number>>({});

  // Authoritative monthly totals fetched from MonthlyData table on mount.
  // Keyed by `${year}-${month}`. Falls back to date.total (from Distributions)
  // if the fetch hasn't resolved yet or a month has no MonthlyData records.
  const [monthlyBaseTotals, setMonthlyBaseTotals] = useState<Record<string, number>>({});
  const [distributionOverrides, setDistributionOverrides] = useState<Record<string, Distribution>>(
    {},
  );
  const [distributionRefreshKey, setDistributionRefreshKey] = useState(0);

  const loadMonthlyTotals = () => {
    fetch("/api/monthly-data")
      .then((r) => r.json())
      .then((data: MonthlyDataResponseRow[]) => {
        const totalsMap: Record<string, number> = {};
        const partnerMap: Record<string, number> = {};
        data.forEach((row) => {
          if (!row.month || !row.year) return;
          const monthKey = `${row.year}-${row.month}`;
          const partnerKey = `${row.partnerId}-${row.month}-${row.year}`;
          const diapers = row.numberDiapers ? parseInt(row.numberDiapers, 10) : 0;
          totalsMap[monthKey] = (totalsMap[monthKey] ?? 0) + diapers;
          partnerMap[partnerKey] = (partnerMap[partnerKey] ?? 0) + diapers;
        });
        setMonthlyBaseTotals(totalsMap);
        setDiapersMap(partnerMap);
        setMonthDeltaMap({});
      })
      .catch((err) => console.error("Failed to load monthly totals:", err));
  };

  useEffect(() => {
    loadMonthlyTotals();
  }, [distributionData]);

  const submitEdit = async (info: EditInfo | undefined, newValue: string) => {
    if (!info) return;

    setIsSaving(true);
    const payload = {
      partnerId: info.partnerId,
      month: info.month,
      year: info.year,
      numDiapers: parseInt(newValue, 10),
    };

    console.log("Submitting edit with payload:", payload);

    try {
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

      console.log("Result:", result);

      const key = `${info.partnerId}-${info.month}-${info.year}`;
      const parsed = result.data.numberDiapers ? parseInt(result.data.numberDiapers, 10) : 0;
      const oldVal = diapersMap[key] ?? 0;
      const delta = parsed - oldVal;
      const monthKey = `${info.year}-${info.month}`;
      setDiapersMap((prev) => ({ ...prev, [key]: parsed }));
      setMonthDeltaMap((prev) => ({ ...prev, [monthKey]: (prev[monthKey] ?? 0) + delta }));
      if (!result.distributions) {
        setError("No distributions found for this month and year");
        return;
      }

      if (result.distributions) {
        setDistributionOverrides((prev) => ({
          ...prev,
          ...Object.fromEntries(result.distributions?.map((dist) => [dist.id, dist]) ?? []),
        }));
      }
      setDistributionRefreshKey((prev) => prev + 1);
      loadMonthlyTotals();
      await onDataUpdated?.();
      setEditingKey(null);
      setInputValue("");
    } catch (err) {
      console.error("Error submitting edit:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const submitYearlyEdit = async (partnerId: number, year: string, newValue: string) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/distributions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId, year, numDiapers: parseInt(newValue, 10) }),
      });
      const result = (await response.json()) as {
        error?: string;
        totalDiapers?: number;
        distributions?: Distribution[];
      };

      if (!response.ok) throw new Error(result.error ?? "Failed to update yearly data");

      const mapKey = `${partnerId}-${year}`;
      setYearlyDiapersMap((prev) => ({ ...prev, [mapKey]: parseInt(newValue, 10) }));

      if (result.distributions) {
        setDistributionOverrides((prev) => ({
          ...prev,
          ...Object.fromEntries(result.distributions?.map((dist) => [dist.id, dist]) ?? []),
        }));
      }
      setDistributionRefreshKey((prev) => prev + 1);
      await onDataUpdated?.();
      setEditingKey(null);
      setInputValue("");
    } catch (err) {
      console.error("Error submitting yearly edit:", err);
    } finally {
      setIsSaving(false);
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
        return sum + (monthlyBaseTotals[key] ?? monthGroup.total) + (monthDeltaMap[key] ?? 0);
      }, 0);

      const yearlyOnlyTotal = yearGroup.yearlyDistributions.reduce((sum, dist) => {
        const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;
        return sum + diapers;
      }, 0);

      totals[yearGroup.year] = monthlyTotal + yearlyOnlyTotal;
    });

    return totals;
  }, [yearGroups, monthlyBaseTotals, monthDeltaMap]);

  if (error) return <Text c="red">Error: {error}</Text>;

  return (
    <div className="space-y-2">
      {yearGroups.map((yearGroup) => (
        <CollapsibleDropdown
          key={yearGroup.year}
          title={
            <span className="flex items-center gap-3">
              <span>{yearGroup.year}</span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#053766]">
                {(displayedYearTotals[yearGroup.year] ?? yearGroup.totalDiapers).toLocaleString()}{" "}
                diapers
              </span>
            </span>
          }
          titleClassName="text-[28px] font-bold"
          endpoint={`/api/distributions?year=${yearGroup.year}`}
          refreshKey={`${yearGroup.year}-${distributionRefreshKey}`}
          render={() => (
            <div className="space-y-2">
              {/* CHANGE: if year has monthly data, render Year -> Month -> Partner -> City */}
              {yearGroup.hasMonthlyData ? (
                yearGroup.months.map((date) => (
                  <CollapsibleDropdown<Distribution[]>
                    key={`${date.year}-${date.month}`}
                    title={
                      <span className="flex items-center gap-3">
                        <span>{`${date.month} ${date.year}`}</span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#053766]">
                          {(
                            (monthlyBaseTotals[`${date.year}-${date.month}`] ?? date.total) +
                            (monthDeltaMap[`${date.year}-${date.month}`] ?? 0)
                          ).toLocaleString()}{" "}
                          diapers
                        </span>
                      </span>
                    }
                    titleClassName="text-[22px] font-bold"
                    endpoint={`/api/monthly-data?month=${date.month}&year=${date.year}`}
                    refreshKey={`${date.year}-${date.month}-${distributionRefreshKey}`}
                    render={(monthData) => {
                      const rowsForMonth = monthData
                        .filter((dist) => dist.month === date.month && dist.year === date.year)
                        .sort((a, b) =>
                          (a.partner?.name ?? "").localeCompare(b.partner?.name ?? ""),
                        );

                      const partnerGroups = rowsForMonth.reduce<
                        Record<
                          string,
                          { partnerName: string; totalDiapers: number; partnerId: number }
                        >
                      >((acc, dist) => {
                        const partnerName = dist.partner?.name?.trim() || "Unknown Partner";
                        const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;

                        if (!acc[partnerName]) {
                          acc[partnerName] = {
                            partnerName,
                            totalDiapers: 0,
                            partnerId: parseInt(dist.partnerId ?? "0", 10) || 0,
                          };
                        }

                        acc[partnerName].totalDiapers += diapers;
                        return acc;
                      }, {});

                      const partnerEntries = Object.values(partnerGroups).sort((a, b) =>
                        a.partnerName.localeCompare(b.partnerName),
                      );

                      return (
                        <div className="space-y-2">
                          {partnerEntries.map((partner) => {
                            const mapKey = `${partner.partnerId}-${date.month}-${date.year}`;
                            const currentEditKey = `${partner.partnerId}-${date.month}-${date.year}`;
                            const isEditing = editingKey === currentEditKey;
                            const displayDiapers = diapersMap[mapKey] ?? partner.totalDiapers;

                            const editInfo: EditInfo = {
                              name: partner.partnerName,
                              month: date.month,
                              numDiapers: displayDiapers,
                              year: date.year,
                              partnerId: partner.partnerId,
                            };

                            return (
                              <CollapsibleDropdown<Distribution[]>
                                key={`${date.year}-${date.month}-${partner.partnerName}`}
                                title={partner.partnerName}
                                right={
                                  <div className="flex items-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <Input
                                          value={inputValue}
                                          onChange={(e) => setInputValue(e.currentTarget.value)}
                                          className="w-32"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              void submitEdit(editInfo, inputValue);
                                            }

                                            if (e.key === "Escape") {
                                              setEditingKey(null);
                                              setInputValue("");
                                            }
                                          }}
                                        />
                                        <Button
                                          size="xs"
                                          onClick={() => void submitEdit(editInfo, inputValue)}
                                          loading={isSaving}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="default"
                                          onClick={() => {
                                            setEditingKey(null);
                                            setInputValue("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-sm font-medium text-[#053766]">
                                          {displayDiapers.toLocaleString()} diapers
                                        </span>
                                        <Button
                                          variant="default"
                                          onClick={() => {
                                            setEditingKey(currentEditKey);
                                            setInputValue(String(displayDiapers));
                                          }}
                                        >
                                          Edit
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                }
                                endpoint={`/api/distributions?month=${date.month}&year=${date.year}`}
                                refreshKey={`${date.year}-${date.month}-${partner.partnerId}-${distributionRefreshKey}`}
                                render={(data) => {
                                  const rowsForPartner = data
                                    .map((dist) => distributionOverrides[dist.id] ?? dist)
                                    .filter(
                                      (dist) =>
                                        dist.month === date.month &&
                                        dist.year === date.year &&
                                        (dist.partner?.name?.trim() || "Unknown Partner") ===
                                          partner.partnerName,
                                    )
                                    .sort((a, b) =>
                                      (a.city?.name ?? "").localeCompare(b.city?.name ?? ""),
                                    );

                                  if (rowsForPartner.length === 0) {
                                    return (
                                      <div className="text-sm text-gray-600">
                                        No distributions found.
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#053766]">
                                        <div>City</div>
                                        <div>Diapers</div>
                                      </div>
                                      {rowsForPartner.map((dist) => (
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
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                ))
              ) : (
                // CHANGE: yearly-only path for 2013–2024
                // Structure: Year -> Partner -> City
                <div className="space-y-2">
                  {Object.values(
                    yearGroup.yearlyDistributions.reduce<
                      Record<
                        string,
                        { partnerName: string; totalDiapers: number; partnerId: number }
                      >
                    >((acc, dist) => {
                      const partnerName = dist.partner?.name?.trim() || "Unknown Partner";
                      const diapers = dist.numberDiapers ? parseInt(dist.numberDiapers, 10) : 0;

                      if (!acc[partnerName]) {
                        acc[partnerName] = {
                          partnerName,
                          totalDiapers: 0,
                          partnerId: parseInt(dist.partnerId ?? "0", 10) || 0,
                        };
                      }

                      acc[partnerName].totalDiapers += diapers;
                      return acc;
                    }, {}),
                  )
                    .sort((a, b) => a.partnerName.localeCompare(b.partnerName))
                    .map((partner) => {
                      const yearlyMapKey = `${partner.partnerId}-${yearGroup.year}`;
                      const yearlyEditKey = `yearly-${partner.partnerId}-${yearGroup.year}`;
                      const isYearlyEditing = editingKey === yearlyEditKey;
                      const displayYearlyDiapers =
                        yearlyDiapersMap[yearlyMapKey] ?? partner.totalDiapers;

                      return (
                        <CollapsibleDropdown<Distribution[]>
                          key={`${yearGroup.year}-${partner.partnerName}`}
                          title={partner.partnerName}
                          right={
                            <div className="flex items-center gap-2">
                              {isYearlyEditing ? (
                                <>
                                  <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.currentTarget.value)}
                                    className="w-32"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        void submitYearlyEdit(
                                          partner.partnerId,
                                          yearGroup.year,
                                          inputValue,
                                        );
                                      }
                                      if (e.key === "Escape") {
                                        setEditingKey(null);
                                        setInputValue("");
                                      }
                                    }}
                                  />
                                  <Button
                                    size="xs"
                                    loading={isSaving}
                                    onClick={() =>
                                      void submitYearlyEdit(
                                        partner.partnerId,
                                        yearGroup.year,
                                        inputValue,
                                      )
                                    }
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="default"
                                    onClick={() => {
                                      setEditingKey(null);
                                      setInputValue("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm font-medium text-[#053766]">
                                    {displayYearlyDiapers.toLocaleString()} diapers
                                  </span>
                                  <Button
                                    variant="default"
                                    onClick={() => {
                                      setEditingKey(yearlyEditKey);
                                      setInputValue(String(displayYearlyDiapers));
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </>
                              )}
                            </div>
                          }
                          endpoint={`/api/distributions?year=${yearGroup.year}`}
                          refreshKey={`${yearGroup.year}-${partner.partnerId}-${distributionRefreshKey}`}
                          render={(data) => {
                            const rowsForPartner = data
                              .map((dist) => distributionOverrides[dist.id] ?? dist)
                              .filter(
                                (dist) =>
                                  dist.year === yearGroup.year &&
                                  !dist.month &&
                                  (dist.partner?.name?.trim() || "Unknown Partner") ===
                                    partner.partnerName,
                              )
                              .sort((a, b) =>
                                (a.city?.name ?? "").localeCompare(b.city?.name ?? ""),
                              );

                            if (rowsForPartner.length === 0) {
                              return (
                                <div className="text-sm text-gray-600">No distributions found.</div>
                              );
                            }

                            return (
                              <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#053766]">
                                  <div>City</div>
                                  <div>Diapers</div>
                                </div>
                                {rowsForPartner.map((dist) => (
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
                          }}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          )}
        />
      ))}
    </div>
  );
}
