"use client";

import { PartnerSite } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type LeafletModule = typeof import("leaflet");

let cachedLeaflet: LeafletModule | null = null;

async function loadLeaflet(): Promise<LeafletModule> {
  if (cachedLeaflet) return cachedLeaflet;
  const LModule = await import("leaflet");
  const leaflet = (LModule.default ?? LModule) as LeafletModule;
  cachedLeaflet = leaflet;
  return leaflet;
}

export function usePartnerIcon(site: PartnerSite) {
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (typeof window === "undefined") return;
    loadLeaflet().then((module) => {
      if (!cancelled) {
        setLeaflet(module);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    if (!leaflet) return null;

    const markup = renderToStaticMarkup(
      <div className="partner-marker-icon">
        <img
          src="partnerLogo.svg"
          alt={site.name}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );

    return leaflet.divIcon({
      className: "partner-marker",
      iconSize: [80, 80], // tweak to taste
      html: markup,
    });
  }, [leaflet, site]);
}
