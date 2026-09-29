import type { StyleSpecification } from '@maplibre/maplibre-react-native';

/**
 * OpenFreeMap vector styles for SauraRoute Driver Navigation.
 * 
 * OpenFreeMap provides free, open-source vector map tiles powered by OpenStreetMap.
 * Completely keyless, no query parameters, no sign-up, and no request limits.
 * 
 * - Liberty (Full color, clear road hierarchy, buildings, POIs, labels):
 *   https://tiles.openfreemap.org/styles/liberty
 * - Positron (Clean, muted light basemap):
 *   https://tiles.openfreemap.org/styles/positron
 */
export const OPENFREEMAP_LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const OPENFREEMAP_POSITRON_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/**
 * Standard OpenStreetMap real-world raster tile basemap style (offline/resilient fallback).
 */
export const OSM_STANDARD_STYLE: StyleSpecification = {
  version: 8,
  name: 'OpenStreetMap Standard',
  sources: {
    'osm-standard-source': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      minzoom: 0,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-standard-layer',
      type: 'raster',
      source: 'osm-standard-source',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Resolves the active map style:
 * 1. Checks EXPO_PUBLIC_MAP_STYLE_URL if custom vector provider URL is explicitly provided.
 * 2. Defaults to OpenFreeMap Liberty vector style URL:
 *    https://tiles.openfreemap.org/styles/liberty
 *    Keyless, free, full-color vector tiles with sharp roads, labels, and POIs.
 */
export function getActiveMapStyle(): StyleSpecification | string {
  const envStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  if (envStyleUrl && envStyleUrl.trim().length > 0) {
    return envStyleUrl.trim();
  }

  return OPENFREEMAP_LIBERTY_STYLE_URL;
}
