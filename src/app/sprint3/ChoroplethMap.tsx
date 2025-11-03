import React, { useState, useMemo } from "react";
import * as d3 from "d3";
import type * as GeoJSON from "geojson";
import { colors } from "./mockData";
import { Popover } from "@mantine/core";

type ChoroplethProps = {
  width: number;
  height: number;
  geojson: GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    GeoJSON.GeoJsonProperties
  >;
  data: Record<string, number>;
  geoPropertyKey?: string;
};

type PopOverData = {
  townName: string;
  numDiapers: number;
};

type PopOverCoordinates = {
  x: number;
  y: number;
};

export default function ChoroplethMap({
  width,
  height,
  geojson,
  data,
}: ChoroplethProps) {
  const [hoveredData, setHoveredData] = useState<PopOverData | null>(null);
  const [popOverPosition, setPopOverPosition] =
    useState<PopOverCoordinates | null>(null);

  /*
   *  projection takes in geographic coordinates (longitude, latitude) &
   *  returns the corresponding (x, y) coordinates on a 2D plane.
   *  we use useMemo() to cache the result of this computation - in case the component
   *  is placed under an ancestor that re-renders on a frequent basis.
   */
  const projection = useMemo(() => {
    return d3
      .geoMercator()
      .center([-71.06, 42.36])
      .scale(70000)
      .translate([width / 2, height / 2]);
  }, [width, height]);

  /*
   *  geoPath takes in geographic coordinates (longitude, latitude) & converts
   *  them into a SVG path string assigned to the 'd' attribute. It's a set of
   *  instructions that tells the browser how to render the shape of this SVG
   *  element (e.g. circle / polygon / etc.)
   */
  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  /*
   *  converts num of diapers to a relevant color
   *  the more diapers there are, the darker the color rendered will be.
   */
  const colorScale = useMemo(() => {
    return d3.scaleQuantize<string>().domain([0, 300]).range(colors);
  }, []);

  if (!geojson || !geojson.features || !pathGenerator) {
    return (
      <svg
        width={width}
        height={height}>
        <text>Loading or Error...</text>
      </svg>
    );
  }

  /*
   *  sub-component: loops through the geoJSON features array containing shape
   *  info for each of the 5 cities.
   *  returns a set of SVG paths(shapes) filled with appropriate colors that
   *  will be rendered by the browser.
   */
  const allSvgPaths = geojson["features"].map((feature) => {
    const townName = feature["properties"]?.TOWN;
    const numDiapers = data[townName] || 0;
    const color = colorScale(numDiapers);

    let pathData = pathGenerator(feature.geometry) || undefined;
    /*
     *  we need to do some trimming here, because for some unknown reason, d3's
     *  path generator concatenates a large, irrelevant rectangle to the final
     *  svg path, which makes the rendered result buggy.
     */
    if (pathData && pathData.includes("ZM")) {
      pathData = pathData.split("ZM")[0] + "Z";
    }

    const handleMouseEnter = (event: React.MouseEvent<SVGPathElement>) => {
      setHoveredData({ townName, numDiapers });
      setPopOverPosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
      setHoveredData(null);
      setPopOverPosition(null);
    };

    return (
      <path
        key={townName}
        d={pathData}
        fill={color}
        stroke="lightGrey"
        strokeWidth={1}
        fillOpacity={1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "pointer" }}
      />
    );
  });

  return (
    <div>
      <svg
        width={width}
        height={height}>
        {allSvgPaths}
      </svg>

      <Popover
        opened={!hoveredData && !popOverPosition}
        shadow="md"
        position="right">
        <Popover.Target>
          <div
            style={{
              position: "absolute",
              left: popOverPosition ? `${popOverPosition.x - 30}px` : 0,
              top: popOverPosition ? `${popOverPosition.y + 100}px` : 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}></div>
        </Popover.Target>
        <Popover.Dropdown>
          {hoveredData && (
            <div>
              <strong>{hoveredData.townName}</strong>
              <br />
              Number of Diapers Available: {hoveredData.numDiapers}
            </div>
          )}
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}
