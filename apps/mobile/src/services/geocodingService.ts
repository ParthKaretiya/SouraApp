export interface GeocodingResult {
  id: string;
  name: string;
  subtitle: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeocodingOptions {
  biasCoords?: [number, number]; // [longitude, latitude]
  limit?: number;
  signal?: AbortSignal;
}

const PHOTON_BASE_URL = 'https://photon.komoot.io/api';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

const QUERY_ALIASES: Record<string, string> = {
  ahmbad: 'Ahmedabad',
  ahmd: 'Ahmedabad',
  amdavad: 'Ahmedabad',
  ahmedbad: 'Ahmedabad',
  ahmedabad: 'Ahmedabad',
  ahm: 'Ahmedabad',
  kota: 'Kota',
  ghy: 'Guwahati',
  shl: 'Shillong',
  del: 'Delhi',
  mum: 'Mumbai',
  blr: 'Bengaluru',
  hyd: 'Hyderabad',
  ccu: 'Kolkata',
  pnq: 'Pune',
  jpr: 'Jaipur',
  udp: 'Udaipur',
};

/**
 * Searches for real geographic locations and addresses using OpenStreetMap geocoding services.
 * Primary: Photon by Komoot (fast autocomplete API).
 * Secondary: Nominatim (official OpenStreetMap search API fallback).
 * Configurable override via EXPO_PUBLIC_GEOCODING_API_URL.
 */
export async function searchLocations(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const effectiveQuery = QUERY_ALIASES[trimmed.toLowerCase()] || trimmed;
  const limit = options.limit || 6;
  const customUrl = process.env.EXPO_PUBLIC_GEOCODING_API_URL;

  // 1. If custom geocoding URL is provided, query it
  if (customUrl && customUrl.trim().length > 0) {
    try {
      const u = new URL(customUrl.trim());
      u.searchParams.set('q', effectiveQuery);
      u.searchParams.set('limit', String(limit));
      const res = await fetch(u.toString(), {
        signal: options.signal,
        headers: { 'User-Agent': 'SauraRoute-Driver/1.0' },
      });
      if (res.ok) {
        const data = await res.json();
        return parsePhotonResults(data);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      // Fall through to standard providers
    }
  }

  // 2. Primary: Photon by Komoot
  try {
    let url = `${PHOTON_BASE_URL}?q=${encodeURIComponent(effectiveQuery)}&limit=${limit}`;
    if (options.biasCoords) {
      url += `&lon=${options.biasCoords[0]}&lat=${options.biasCoords[1]}`;
    }

    const res = await fetch(url, {
      signal: options.signal,
      headers: {
        'User-Agent': 'SauraRoute-Driver/1.0 (contact: support@sauraroute.com)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const results = parsePhotonResults(data);
      if (results.length > 0) {
        return results;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    // Log and attempt fallback
    if (__DEV__) {
      console.warn('[Geocoding] Photon query failed, falling back to Nominatim:', err.message);
    }
  }

  // 3. Fallback: Nominatim OpenStreetMap
  try {
    const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(effectiveQuery)}&format=json&limit=${limit}&addressdetails=1`;
    const res = await fetch(url, {
      signal: options.signal,
      headers: {
        'User-Agent': 'SauraRoute-Driver/1.0 (contact: support@sauraroute.com)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return parseNominatimResults(data);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    throw new Error(`Geocoding search failed: ${err.message}`);
  }

  return [];
}

function parsePhotonResults(data: any): GeocodingResult[] {
  if (!data?.features || !Array.isArray(data.features)) return [];

  return data.features
    .filter((f: any) => {
      const coords = f?.geometry?.coordinates;
      return (
        Array.isArray(coords) &&
        coords.length >= 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number' &&
        Number.isFinite(coords[0]) &&
        Number.isFinite(coords[1])
      );
    })
    .map((f: any, idx: number): GeocodingResult => {
      const p = f.properties || {};
      const name = p.name || p.street || 'Location';

      const subtitleParts: string[] = [];
      if (p.street && p.street !== name) subtitleParts.push(p.street);
      if (p.city && p.city !== name) subtitleParts.push(p.city);
      else if (p.district) subtitleParts.push(p.district);
      if (p.state) subtitleParts.push(p.state);
      if (p.country) subtitleParts.push(p.country);

      const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') : 'OpenStreetMap location';

      return {
        id: `photon-${p.osm_id || idx}-${Date.now()}`,
        name,
        subtitle,
        coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
      };
    });
}

function parseNominatimResults(data: any): GeocodingResult[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter((item: any) => {
      const lon = parseFloat(item.lon);
      const lat = parseFloat(item.lat);
      return Number.isFinite(lon) && Number.isFinite(lat);
    })
    .map((item: any, idx: number): GeocodingResult => {
      const lon = parseFloat(item.lon);
      const lat = parseFloat(item.lat);
      const displayName = item.display_name || '';
      const parts = displayName.split(',').map((s: string) => s.trim());
      const name = parts[0] || item.name || 'Location';
      const subtitle = parts.slice(1, 4).join(', ') || 'OpenStreetMap location';

      return {
        id: `nominatim-${item.osm_id || item.place_id || idx}-${Date.now()}`,
        name,
        subtitle,
        coordinates: [lon, lat],
      };
    });
}
