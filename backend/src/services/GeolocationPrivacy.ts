/**
 * Geolocation Privacy Service
 * Fuzzes viewer location data to country/state level only.
 * NEVER exposes precise coordinates, city, or street-level data.
 *
 * Risk mitigated: Stalking, doxing, swatting via precise viewer location.
 */

export interface FuzzedLocation {
  country: string;
  region: string;
  label: string;
}

// Map of country codes to display names
const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  BR: 'Brazil',
  IN: 'India',
  MX: 'Mexico',
};

/**
 * Fuzz raw geolocation data down to country + broad region only.
 * Strips all precise coordinates, city names, postal codes, and IP addresses.
 */
export function fuzzLocation(rawGeo: {
  country?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  ip?: string;
}): FuzzedLocation {
  const country = rawGeo.country || 'Unknown';
  const region = rawGeo.region || '';
  const countryName = COUNTRY_NAMES[country] || country;

  const label = region
    ? `Viewer from ${region}, ${countryName}`
    : `Viewer from ${countryName}`;

  // Return ONLY country and broad region — no city, no coords, no IP
  return {
    country,
    region,
    label,
  };
}

/**
 * Sanitize a batch of viewer locations for map display.
 * Only returns aggregate counts per country/region — never individual positions.
 */
export function aggregateViewerLocations(
  viewers: Array<{ country?: string; region?: string; city?: string; lat?: number; lon?: number; ip?: string }>
): Array<{ country: string; region: string; label: string; count: number }> {
  const buckets = new Map<string, { location: FuzzedLocation; count: number }>();

  for (const viewer of viewers) {
    const fuzzed = fuzzLocation(viewer);
    const key = `${fuzzed.country}:${fuzzed.region}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count++;
    } else {
      buckets.set(key, { location: fuzzed, count: 1 });
    }
  }

  return Array.from(buckets.values()).map(({ location, count }) => ({
    ...location,
    count,
  }));
}
