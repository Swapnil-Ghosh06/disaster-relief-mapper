// ─────────────────────────────────────────────────────────────────────────────
// Map Styles Configuration
// ─────────────────────────────────────────────────────────────────────────────
export const MAP_STYLES = [
  {
    id: 'satellite-3d',
    label: '🛰️ 3D Photorealistic Satellite (Inspo)',
    style: {
      version: 8,
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar, Earthstar Geographics',
        },
        'terrain-dem': {
          type: 'raster-dem',
          tiles: [
            'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          encoding: 'terrarium',
          maxzoom: 15,
        },
      },
      layers: [
        {
          id: 'satellite-tiles-layer',
          type: 'raster',
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
      terrain: {
        source: 'terrain-dem',
        exaggeration: 1.8,
      },
      sky: {
        'sky-color': '#0f172a',
        'sky-horizon-blend': 0.4,
        'horizon-color': '#38bdf8',
        'horizon-fog-blend': 0.6,
        'fog-color': '#090d16',
        'fog-ground-blend': 0.6,
      },
    },
  },
  {
    id: 'satellite-hybrid',
    label: '🗺️ 3D Hybrid (Satellite + Roads)',
    style: {
      version: 8,
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar',
        },
        'labels-tiles': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'terrain-dem': {
          type: 'raster-dem',
          tiles: [
            'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          encoding: 'terrarium',
          maxzoom: 15,
        },
      },
      layers: [
        {
          id: 'satellite-tiles-layer',
          type: 'raster',
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 20,
        },
        {
          id: 'labels-tiles-layer',
          type: 'raster',
          source: 'labels-tiles',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
      terrain: {
        source: 'terrain-dem',
        exaggeration: 1.8,
      },
    },
  },
  {
    id: 'liberty',
    label: '🏙️ OpenFreeMap Vector 3D',
    style: 'https://tiles.openfreemap.org/styles/liberty',
  },
  {
    id: 'dark',
    label: '🌙 Carto Dark Matter (Night HUD)',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  {
    id: 'osm',
    label: '🗺️ OpenStreetMap Standard',
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
];
