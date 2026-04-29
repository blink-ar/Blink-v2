const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lng: number, precision = 4): string {
  let even = true;
  let hashValue = 0;
  let bits = 0;
  let result = '';
  const latRange = [-90, 90];
  const lngRange = [-180, 180];

  while (result.length < precision) {
    if (even) {
      const mid = (lngRange[0] + lngRange[1]) / 2;
      if (lng > mid) { hashValue = (hashValue << 1) | 1; lngRange[0] = mid; }
      else            { hashValue <<= 1;                  lngRange[1] = mid; }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat > mid) { hashValue = (hashValue << 1) | 1; latRange[0] = mid; }
      else           { hashValue <<= 1;                  latRange[1] = mid; }
    }
    even = !even;
    if (++bits === 5) {
      result += BASE32[hashValue];
      bits = 0;
      hashValue = 0;
    }
  }

  return result;
}
