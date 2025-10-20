# Map Feature Onboarding Guide

## 1. What You’re Looking At

Our map UI is built with **React Leaflet**, a React wrapper around the Leaflet.js mapping library. Everything lives in the `src/components/map` folder, and the map is rendered on the page at `src/app/map/page.tsx:1`. This guide walks you through how the pieces fit together, what data flows through the map, and where to read more about the tools in use.

---

## 2. File Tour

- `src/components/map/LeafletMap.tsx:1`  
  Top-level React component that renders the Leaflet map. It wires together the base map tiles, our region overlay, and optional left/right control panels.

- `src/components/map/useLeafletMap.ts:1`  
  Tiny hook that returns the default map options (center, zoom, min/max zoom, scroll-wheel behavior, and basic sizing styles).

- `src/components/map/useBaseTileLayer.ts:1`  
  Returns the settings for the background tiles—right now that’s OpenStreetMap. Swap URLs or attribution here to change the basemap everywhere.

- `src/components/map/useRegionsLayer.ts:1`  
  The brains of the region overlay. It controls GeoJSON styling, hover/click events, and the color logic for choropleth shading.

- `src/app/map/page.tsx:1`  
  Demo page showing how the map hooks into application state: filtering regions, handling hover/click, and keeping the UI in sync with panels and dialogs.

---

## 3. How Rendering Works

1. **LeafletMap sets up the map**  
   `LeafletMap` lazily imports `MapContainer`, `TileLayer`, and `GeoJSON` with `dynamic()` so they only load in the browser (Leaflet needs `window`). If this doesn't make sense, that's ok. It is just a weird Next.js thing that we have to do to use the Leaflet library.

2. **Map configuration stays in a hook**  
   `useLeafletMap` returns a memoized object containing center/zoom/etc. Passing that into `<MapContainer>` keeps initialization consistent and easy to tweak.

3. **Base tiles are defined once**  
   `useBaseTileLayer` returns the URL template and attribution. The component spreads these onto `<TileLayer>` so Leaflet does the heavy lifting.

4. **Region overlay is data-driven**  
   `useRegionsLayer` supplies the GeoJSON data, the style function, and event handlers to `<GeoJSON>`. Hover and click callbacks bubble up to the parent component.

5. **Controls live in overlay slots**  
   `LeafletMap` accepts optional `leftControls` and `rightControls` elements. These are rendered in absolutely positioned containers above the map, so you can inject any React UI (checkboxes, stats, legends) without touching Leaflet. If you to experiment with overlay controls, try modifying these `leftControls` and `rightControls`.

---

## 4. Interactions Explained

- **Clicking a region**  
  `onRegionClick` runs when a user clicks a polygon. We guard against missing IDs before firing the callback.

- **Hovering**  
  `onRegionHover` is called with the region ID on hover and with no arguments on mouse leave. That lets the parent component show hover tips or clear them easily.

- **Highlighting**  
  When `highlightedRegionId` is set, the style function bolds the border and bumps the fill opacity so the selected region stands out. This works for hover or for external selections (e.g., clicking a list).

- **Choropleth coloring**  
  `choroplethData` maps region IDs to numeric values (like diapers delivered). `choroplethBuckets` defines thresholds and colors. `useRegionsLayer` picks a color per region based on those buckets and falls back to a default green when no data exists.

- **Overlay controls**  
  The map page example (`src/app/map/page.tsx:1`) shows how hover/click state feeds into Mantine components on the left and right panels, including filters, status badges, and modal dialogs.

---

## 5. React Concepts Without the Jargon

- **Custom hooks (`useSomething`)**  
  Just functions that bundle logic and return values. There’s nothing magical—`useLeafletMap`, `useBaseTileLayer`, and `useRegionsLayer` simply produce objects you spread onto components.

- **`useMemo`**  
  Think “remember this object until what it depends on changes.” We use it so React Leaflet doesn’t think the config changed every render.

- **`useCallback`**  
  Same idea for functions. React Leaflet only re-binds layer events if the handler function reference changes, so memoizing the handlers avoids unnecessary updates.

- **Dynamic imports (`dynamic(() => import(...))`)**  
  Next.js helper that loads a component only in the browser. Leaflet accesses `window` and `document`, so importing it dynamically avoids crashes during server-side rendering. (feel free to ignore this)

---

## 6. Common Customizations

- **Change the map focus**  
  Update the defaults in `useLeafletMap` or pass different props into `LeafletMap` if you later expose these settings to users.

- **Swap map tiles**  
  Adjust the URL/attribution in `useBaseTileLayer`. Many providers (Mapbox, MapTiler, Stadia) offer drop-in templates—just make sure the attribution string matches usage guidelines.

- **Adjust region styling**  
  Tweak the `style` function in `useRegionsLayer` for different border colors, dash patterns, or opacity changes on hover.

- **Add tooltips or popups**  
  Inside `onEachFeature`, you can call `layer.bindTooltip(...)` or `layer.bindPopup(...)` with dynamic content. Remember to keep it lightweight so you don’t attach large components to every polygon.

- **Respond to map movements**  
  If you need to react to panning/zooming outside the GeoJSON layer, create a small child component that calls `const map = useMap()` from React Leaflet and registers listeners with `useMapEvent("moveend", handler)`.

---

## 7. Troubleshooting Cheat Sheet

- **Map doesn’t render in Next.js**  
  Make sure you are using the dynamically imported `MapContainer` as shown in `LeafletMap.tsx`.

- **Events not firing**  
  Confirm that your GeoJSON data includes `properties.id`. Without it, the callbacks short-circuit to avoid bad state updates.

- **Colors look wrong**  
  Double-check that `choroplethBuckets` cover the full range of your data and that min/max values don’t overlap ambiguously.

- **Performance feels sluggish**  
  Ensure you aren’t creating new objects/functions on every render. Stick with the provided hooks or memoize your own configurations.

---

## 8. Learn More

- Check out the resources section of our Notion page
- React Leaflet docs (components, hooks, examples): https://react-leaflet.js.org/docs/start-introduction
- Leaflet GeoJSON guide (event names, styling options): https://leafletjs.com/examples/geojson/
- Next.js dynamic import reference: https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading
- Accessible color ramps (ColorBrewer): http://colorbrewer2.org/
- Leaflet map styling cookbook (community tips): https://leaflet-extras.github.io/leaflet-providers/preview/
