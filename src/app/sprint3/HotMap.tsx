"use client"
import { useState, useEffect } from 'react';
import { mapData } from './mockData';
import ChoroplethMap from './ChoroplethMap';
import { Select } from '@mantine/core';

type MapDataKey = keyof typeof mapData;

export default function HotMap() {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection>();
  const [datasetKey, setDatasetKey] = useState<MapDataKey>('May 2025');

  const dataForSelectedPeriod = mapData[datasetKey];

  useEffect(() => {
    fetch('/my-5-towns-wgs84-simplified.json')
      .then(response => response.json())
      .then(data => setGeoData(data))
      .catch(error => console.error('Error loading JSON:', error));
  }, []);

  return (
    <div>
      <h2 style={{ fontWeight: 'bold', fontSize: '1.25rem' }}> Greater Boston Diapers Map </h2>
      <Select
        data={['May 2025', 'June 2025']}
        value={datasetKey}
        onChange={(value) => {
          /* 'value' here is of type string | null */
          if (value) {
            /* converts type string | null into type MapDataKey */
            setDatasetKey(value as MapDataKey);
          }
        }}
        style={{ width: '160px' }}
      />
      {
        geoData ?
          <ChoroplethMap 
            width={600}
            height={400}
            geojson={geoData}
            data={dataForSelectedPeriod}
          />
        :
          <>
            <p>Oops! The choropleth map can't be loaded at the moment</p>
          </>
      }
    </div>
  )
}