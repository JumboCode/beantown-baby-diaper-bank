# Babies Helped Estimate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estimate the number of unique babies helped per year from diaper distribution data and display it as a standalone floating card on the hotmap, below the existing "Total Diapers" card.

**Architecture:** A pure estimation function in `src/lib/estimateBabies.ts` computes unique babies from monthly distribution totals using a 90/10 continuing/new model. The existing `/api/total-diapers` endpoint is extended to run this computation server-side and return `babiesHelped` alongside `totalDiapers`. A new `BabiesHelped` component renders the stat as a floating card on the map.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma + Supabase PostgreSQL, React, Mantine UI, `@tabler/icons-react`. No test framework is configured in this project — skip test steps.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/estimateBabies.ts` | **Create** | Pure estimation function — converts monthly diaper/child totals to unique babies estimate |
| `src/app/api/total-diapers/route.ts` | **Modify** | Add monthly Distribution query + call estimateBabiesHelped; return `babiesHelped` |
| `src/components/map/BabiesHelped.tsx` | **Create** | Floating card UI component — mirrors diapers card styling |
| `src/components/map/Map.tsx` | **Modify** | Accept `babiesHelped` prop; render BabiesHelped card; adjust city popup position |
| `src/app/page.tsx` | **Modify** | Read `babiesHelped` from API response; thread it through to `<LeafletMap>` |

---

## Task 1: Estimation utility

**Files:**
- Create: `src/lib/estimateBabies.ts`

### Background

The estimation model:
- 200 diapers/month = supply for 1 baby for 1 month
- Each month: `babies_this_month = numberChildren (if reported) OR numberDiapers / 200`
- Month 1 (earliest): all babies are new → `new = babies_m1`
- Months 2–N: 10% are new → `new = babies_mN × 0.10`
- `total_unique = Σ new_babies_across_months`
- **Fallback** (no Distribution rows for the year): `total = (yearlyDiapers / 12 / 200) × (1 + 11 × 0.10)`

- [ ] **Step 1: Create `src/lib/estimateBabies.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/estimateBabies.ts
git commit -m "feat: add babies helped estimation utility"
```

---

## Task 2: Extend `/api/total-diapers` to return `babiesHelped`

**Files:**
- Modify: `src/app/api/total-diapers/route.ts`

### Background

The existing endpoint queries `YearlyData` for cumulative and yearly totals. We add a third parallel query: `Distribution` grouped by `month` for the selected year, summing `numberDiapers` and `numberChildren`. Then call `estimateBabiesHelped`. The result is cached under the existing `"cities"` tag.

The current `getTotalDiapers` function signature is:
```typescript
async function getTotalDiapers(year: string | null)
```
It already returns `{ totalDiapers, yearlyTotalDiapers }` when `year` is provided. We extend it to also return `{ babiesHelped }`.

- [ ] **Step 1: Replace `src/app/api/total-diapers/route.ts` with the extended version**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";
import { estimateBabiesHelped, MonthlyDistributionTotal } from "@/lib/estimateBabies";

async function getTotalDiapers(year: string | null) {
  "use cache";
  cacheTag("cities");
  cacheLife("max");

  if (year) {
    const [cumulativeResults, yearlyResults, monthlyDistributions] = await Promise.all([
      prisma.yearlyData.aggregate({
        where: { year: { lte: year } },
        _sum: { numDiapers: true },
      }),
      prisma.yearlyData.aggregate({
        where: { year },
        _sum: { numDiapers: true },
      }),
      prisma.distribution.groupBy({
        by: ["month"],
        where: { year },
        _sum: {
          numberDiapers: true,
          numberChildren: true,
        },
      }),
    ]);

    const totalDiapers =
      cumulativeResults._sum.numDiapers == null ? 0 : Number(cumulativeResults._sum.numDiapers);
    const yearlyTotalDiapers =
      yearlyResults._sum.numDiapers == null ? 0 : Number(yearlyResults._sum.numDiapers);

    const monthlyTotals: MonthlyDistributionTotal[] = monthlyDistributions
      .filter((m) => m.month != null)
      .map((m) => ({
        month: m.month as string,
        diapers: Number(m._sum.numberDiapers ?? 0),
        children: m._sum.numberChildren != null ? Number(m._sum.numberChildren) : null,
      }));

    const babiesHelped = estimateBabiesHelped(monthlyTotals, yearlyTotalDiapers);

    return { totalDiapers, yearlyTotalDiapers, babiesHelped };
  }

  const results = await prisma.yearlyData.aggregate({
    _sum: { numDiapers: true },
  });

  const totalDiapers = results._sum.numDiapers == null ? 0 : Number(results._sum.numDiapers);

  return { totalDiapers };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const data = await getTotalDiapers(year);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load yearly data from the database.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the build passes**

```bash
npm run build
```

Expected: no TypeScript errors. If you get a type error on `prisma.distribution.groupBy`, it means the Prisma client needs to be regenerated:
```bash
npm run prisma:generate
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/total-diapers/route.ts
git commit -m "feat: return babiesHelped from total-diapers API"
```

---

## Task 3: Create `BabiesHelped` card component

**Files:**
- Create: `src/components/map/BabiesHelped.tsx`

### Background

This component mirrors the styling of the existing diapers card in `Map.tsx` (dark blue `#1B3668` background, white text, `pointerEvents: "none"` so it doesn't block map interactions). It uses:
- `useCountUp` from `./useCountUp` for the animated number
- `useMediaQuery` from `@mantine/hooks` for responsive sizing
- `IconBabyCarriage` from `@tabler/icons-react` for the icon (if this icon doesn't exist in your version of the package, substitute `IconUsers`)
- Mantine `Box`, `Group`, `Stack`, `Text`, `Skeleton`

The number is prefixed with `~` to signal it's an estimate. A hover tooltip was considered but omitted because the card uses `pointerEvents: "none"` (so it doesn't block map drag/click) — hover events don't fire on it. The `~` prefix and "estimated" sub-label on mobile are sufficient.

- [ ] **Step 1: Create `src/components/map/BabiesHelped.tsx`**

```tsx
"use client";
import { Box, Group, Stack, Text, Skeleton } from "@mantine/core";
import { IconBabyCarriage } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { useCountUp } from "./useCountUp";

interface BabiesHelpedProps {
  babiesHelped?: number;
  year?: string;
}

export default function BabiesHelped({ babiesHelped, year }: BabiesHelpedProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const animatedCount = useCountUp(babiesHelped, 1400);

  return (
    <Box
      style={{
        background: "#1B3668",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(27, 54, 104, 0.4)",
        padding: isMobile ? "8px 12px" : "10px 18px",
        minWidth: isMobile ? 0 : 240,
        pointerEvents: "none",
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap={isMobile ? 8 : 12}>
        <Stack gap={isMobile ? 1 : 2}>
          <Text
            fz={isMobile ? "9px" : "10px"}
            fw={700}
            c="rgba(255,255,255,0.55)"
            tt="uppercase"
            lts="0.1em"
          >
            {isMobile ? "Babies Helped" : `Babies Helped${year ? ` in ${year}` : ""}`}
          </Text>
          {babiesHelped != null ? (
            <Text fz={isMobile ? "22px" : "28px"} fw={900} c="white" lh={1}>
              ~{animatedCount.toLocaleString()}
            </Text>
          ) : (
            <Skeleton
              height={isMobile ? 28 : 36}
              width={120}
              radius="sm"
              style={{ marginTop: 2 }}
            />
          )}
          {isMobile && (
            <Text fz="8px" fw={600} c="rgba(255,255,255,0.5)" tt="uppercase" lts="0.05em">
              estimated
            </Text>
          )}
        </Stack>
        {!isMobile && (
          <IconBabyCarriage
            size={36}
            color="rgba(255,255,255,0.5)"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
        )}
      </Group>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/BabiesHelped.tsx
git commit -m "feat: add BabiesHelped map card component"
```

---

## Task 4: Wire up Map.tsx and page.tsx

**Files:**
- Modify: `src/components/map/Map.tsx`
- Modify: `src/app/page.tsx`

### Background

**Map.tsx changes:**
1. Add `babiesHelped?: number` to the `MapProps` interface.
2. Import `BabiesHelped`.
3. Render the `<BabiesHelped>` card as an absolutely positioned overlay directly below the diapers card. On desktop the diapers card occupies approximately `top: 16` to `top: 101` (height ≈ 85px). The babies card goes at `top: 111` with a small gap.
4. The city popup currently sits at `top: 110` — move it down to `top: 186` to clear both cards, and update its `maxHeight` from `"calc(100% - 190px)"` to `"calc(100% - 265px)"` so it doesn't overflow into the timeline footer. Tweak these pixel values if the cards look visually off after rendering.
5. Hide the babies card on mobile when the city popup is open (same rule used for the legend: `!(isMobile && activeCityWithStats)`).

**page.tsx changes:**
1. Add `babiesHelped` state: `const [babiesHelped, setBabiesHelped] = useState<number | undefined>()`.
2. In `handleTimelineChange`, read `babiesHelped` from the `/api/total-diapers` response and call `setBabiesHelped(totalDiapersResponse.babiesHelped ?? undefined)`.
3. Pass `babiesHelped={babiesHelped}` to `<LeafletMap>`.

- [ ] **Step 1: Update `MapProps` and imports in `src/components/map/Map.tsx`**

At the top of the file, add the import for `BabiesHelped`:
```typescript
import BabiesHelped from "./BabiesHelped";
```

Change the `MapProps` interface (currently around line 55):
```typescript
export interface MapProps {
  boundaries: GeoJsonBoundaries;
  cities: CityWithStats[];
  year: string;
  totalDiapersForYear?: number;
  selectedYear?: string;
  babiesHelped?: number;
}
```

Update the function signature to destructure the new prop:
```typescript
export default function Map({
  boundaries,
  cities,
  year,
  totalDiapersForYear,
  selectedYear,
  babiesHelped,
}: MapProps) {
```

- [ ] **Step 2: Add the BabiesHelped card overlay in `Map.tsx`**

After the closing `</Box>` of the "Total Diapers Distributed" card (currently ends around line 370), add:

```tsx
{/* Babies Helped */}
{!(isMobile && activeCityWithStats) && (
  <Box
    style={{
      position: "absolute",
      top: isMobile ? 76 : 111,
      right: 16,
      zIndex: 1000,
      pointerEvents: "none",
    }}
  >
    <BabiesHelped babiesHelped={babiesHelped} year={selectedYear} />
  </Box>
)}
```

- [ ] **Step 3: Adjust city popup position in `Map.tsx`**

Find the city popup desktop styles (currently `top: 110`, `maxHeight: "calc(100% - 190px)"`). Update them:

```typescript
// was: top: 110,
top: 186,
// was: maxHeight: "calc(100% - 190px)",
maxHeight: "calc(100% - 265px)",
```

- [ ] **Step 4: Update `src/app/page.tsx`**

Add `babiesHelped` state (next to the other `useState` declarations, around line 60):
```typescript
const [babiesHelped, setBabiesHelped] = useState<number | undefined>();
```

In `handleTimelineChange`, update the destructure from the `total-diapers` response (currently around line 89):
```typescript
setCumulativeTotalDiapers(totalDiapersResponse.totalDiapers ?? 0);
setBabiesHelped(totalDiapersResponse.babiesHelped ?? undefined);
```

Pass the prop to `<LeafletMap>` (currently around line 114):
```tsx
<LeafletMap
  boundaries={boundaries}
  cities={cities}
  year={timeline.labels[timeline.index] ?? ""}
  totalDiapersForYear={cumulativeTotalDiapers}
  selectedYear={selectedYear}
  babiesHelped={babiesHelped}
/>
```

- [ ] **Step 5: Verify the build passes**

```bash
npm run build
```

Expected: no errors. If you see a type error about `babiesHelped` not existing on `MapProps`, double-check the interface was updated in step 1.

- [ ] **Step 6: Start the dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000`. Move the timeline slider to a year with data. Verify:
- The "Babies Helped in {year}" card appears below the diapers card, same blue style
- The number animates up on year change
- The city popup (when a city is clicked) still appears below the babies card without overlap
- On mobile: both cards visible when no city is selected; both cards hidden when city popup is open

Adjust the `top` values in steps 2 and 3 if any overlap is visible.

- [ ] **Step 7: Commit**

```bash
git add src/components/map/Map.tsx src/app/page.tsx
git commit -m "feat: display babies helped estimate on hotmap"
```
