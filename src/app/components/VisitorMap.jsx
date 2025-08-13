'use client';

import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const VisitorMap = ({ data = [] }) => {
  const [tooltipContent, setTooltipContent] = useState('');

  const dataMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(data)) {
        data.forEach(item => {
            // The API now sends 'name' (e.g., "United Kingdom") instead of 'id'
            if (item.name) {
                map.set(item.name, Number(item.value) || 0);
            }
        });
    }
    return map;
  }, [data]);

  const colorScale = scaleQuantile()
    .domain(dataMap.size > 0 ? Array.from(dataMap.values()) : [0])
    .range([
      "#ffedea", "#ffcec5", "#ffad9f", "#ff8a75", "#ff5533",
      "#e2492d", "#be3d26", "#9a311f", "#782618"
    ]);

  return (
    <div className="w-full h-full relative" data-tip="">
      <ComposableMap 
        projectionConfig={{ scale: 180 }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup center={[0, 20]}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                // --- THE FIX: Match using the full country name from properties.NAME ---
                const countryName = geo.properties.NAME;
                const views = dataMap.get(countryName) || 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${countryName} — ${views.toLocaleString()} ${views === 1 ? 'view' : 'views'}`);
                    }}
                    onMouseLeave={() => {
                      setTooltipContent('');
                    }}
                    style={{
                      default: {
                        fill: views > 0 ? colorScale(views) : '#F5F4F6',
                        outline: 'none'
                      },
                      hover: { fill: '#E42', outline: 'none' },
                      pressed: { fill: '#E42', outline: 'none' }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltipContent && <div className="absolute top-0 left-0 bg-black text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-y-full shadow-lg">{tooltipContent}</div>}
    </div>
  );
};

export default VisitorMap;
