# Babies Helped Estimate — Design Spec

**Date:** 2026-04-22
**Status:** Approved

## Overview

Estimate the number of unique babies helped by diapers distributed each year and display it as a standalone card on the hotmap, directly below the existing "Total Diapers" card.

---

## Estimation Algorithm

### Inputs
- Monthly `Distribution` records for the selected year, grouped by `month`, summed across all cities: `totalDiapers` and `totalChildren` per month.
- Where `totalChildren` is non-null and > 0 for a month, use it as the actual reported baby count.
- Where `totalChildren` is null/0, estimate: `babies_this_month = diapers_this_month / 200` (200 diapers = 1 baby/month supply).

### 90/10 Continuing/New Model
For each month with data, ordered chronologically:
- **Month 1** (earliest month with distributions): all babies are new → `new = babies_m1`
- **Months 2–N:** `new = babies_mN × 0.10` (10% new each subsequent month)
- **Total unique babies for the year:** `total = new_m1 + Σ(new_m2 … new_mN)`

### Yearly-Only Fallback
When no `Distribution` rows exist for the year (i.e., only `YearlyData` is available), use `yearlyDiapers / 12` as a uniform monthly estimate and apply the 12-month formula:

```
total = (yearlyDiapers / 12 / 200) × (1 + 11 × 0.10)
      = yearlyDiapers × 0.000875
```

Result is always `Math.round()`ed to a whole number.

---

## API Changes

**Endpoint:** `GET /api/total-diapers?year=X`

**Change:** Extend the existing `getTotalDiapers` server function to also compute and return `babiesHelped`.

**New response shape (when `year` param provided):**
```json
{
  "totalDiapers": 45321,
  "yearlyTotalDiapers": 12400,
  "babiesHelped": 227
}
```

- `babiesHelped` is omitted when `year` param is absent (all-time view) since the estimate requires per-year monthly data.
- One additional Prisma query: `Distribution` grouped by `month` for the given year, summing `numberDiapers` and `numberChildren`.
- Cached under the existing `"cities"` cache tag — invalidates automatically when distributions are updated.

---

## UI

### New Component: `BabiesHelped`

**File:** `src/components/map/BabiesHelped.tsx`

**Props:**
```typescript
interface BabiesHelpedProps {
  babiesHelped?: number;
  year?: string;
}
```

**Appearance:** Matches the existing diapers card — dark blue `#1B3668` background, white text, same border-radius and shadow. Uses a baby/person icon (Tabler icons).

**Layout position (desktop):** `position: absolute`, `top: 110`, `right: 16`, `zIndex: 1000` — directly below the diapers card.

**Layout position (mobile):** Compact inline treatment. Hidden when city popup is open (same rule as the map legend).

**Number display:** Prefixed with `~` to signal an estimate (e.g., `~227`). Animated with the existing `useCountUp` hook.

**Label:** `"Babies Helped in {year}"` / `"Babies Helped"`.

**Tooltip on hover:** *"Estimated unique babies served, assuming 200 diapers/month per child and 10% new children each month."*

**Loading state:** Skeleton placeholder matching the diapers card's loading pattern.

### Map.tsx Changes

- Accept `babiesHelped?: number` in `MapProps`.
- Render `<BabiesHelped>` card below the diapers card, conditionally hidden on mobile when city popup is open.

### page.tsx Changes

- Read `babiesHelped` from the `/api/total-diapers` response.
- Pass `babiesHelped` down to `<LeafletMap>`.

---

## Out of Scope

- Per-city babies estimate in the city popup (can be a follow-on).
- Displaying babies in the hover tooltip.
- All-time cumulative babies helped.
