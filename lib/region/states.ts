/**
 * Canonical Indian states + union territories — feat-region-capture.
 *
 * 36 entries: 28 states + 8 union territories (post-2020 map: J&K and Ladakh
 * split, Dadra & Nagar Haveli merged with Daman & Diu). This list is THE
 * canonical state vocabulary: the correction API zod-validates against it,
 * the geoip resolver maps into it, and aggregates key state dims on it.
 *
 * STATE_BY_ISO_CODE maps ISO 3166-2:IN subdivision codes (what geoip-lite /
 * MaxMind GeoLite2 returns in `region`) to full names. ISO renamed several
 * codes over the years (CT→CG, OR→OD, TG→TS, UT→UK; DN+DD merged into DH),
 * so both old and new codes are mapped — dataset vintage must not matter.
 */

export const INDIAN_STATES = [
  // 28 states
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // 8 union territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const STATE_BY_ISO_CODE: Record<string, IndianState> = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CT: "Chhattisgarh", // pre-2023 ISO code
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha", // pre-2023 ISO code
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TG: "Telangana", // pre-2023 ISO code
  TS: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UT: "Uttarakhand", // pre-2023 ISO code
  UK: "Uttarakhand",
  WB: "West Bengal",
  AN: "Andaman and Nicobar Islands",
  CH: "Chandigarh",
  DN: "Dadra and Nagar Haveli and Daman and Diu", // pre-merge code (DNH)
  DD: "Dadra and Nagar Haveli and Daman and Diu", // pre-merge code (Daman & Diu)
  DH: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  JK: "Jammu and Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry",
};

/** ISO 3166-2:IN subdivision code → canonical full state name (null if unknown). */
export function stateFromIsoCode(code: string | null | undefined): IndianState | null {
  if (!code) return null;
  return STATE_BY_ISO_CODE[code.trim().toUpperCase()] ?? null;
}

export function isIndianState(value: unknown): value is IndianState {
  return (
    typeof value === "string" && (INDIAN_STATES as readonly string[]).includes(value)
  );
}
