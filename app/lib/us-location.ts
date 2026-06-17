import "server-only";

type ZippopotamResponse = {
  "post code"?: string;
  places?: Array<{
    "place name"?: string;
    state?: string;
    "state abbreviation"?: string;
  }>;
};

export type UsPostalLocation = {
  zipCode: string;
  state: string;
  stateName: string;
  city: string;
  locationText: string;
};

const stateNamesByCode: Record<string, string> = {
  AK: "Alaska",
  AL: "Alabama",
  AR: "Arkansas",
  AS: "American Samoa",
  AZ: "Arizona",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DC: "District of Columbia",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  GU: "Guam",
  HI: "Hawaii",
  IA: "Iowa",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  MA: "Massachusetts",
  MD: "Maryland",
  ME: "Maine",
  MI: "Michigan",
  MN: "Minnesota",
  MO: "Missouri",
  MP: "Northern Mariana Islands",
  MS: "Mississippi",
  MT: "Montana",
  NC: "North Carolina",
  ND: "North Dakota",
  NE: "Nebraska",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NV: "Nevada",
  NY: "New York",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UM: "U.S. Minor Outlying Islands",
  UT: "Utah",
  VA: "Virginia",
  VI: "U.S. Virgin Islands",
  VT: "Vermont",
  WA: "Washington",
  WI: "Wisconsin",
  WV: "West Virginia",
  WY: "Wyoming",
};

export function getUsStateName(state: string | null | undefined) {
  return state ? stateNamesByCode[state.toUpperCase()] || "" : "";
}

const representativeZipByState: Record<string, string> = {
  AK: "99501",
  AL: "35203",
  AR: "72201",
  AS: "96799",
  AZ: "85004",
  CA: "90001",
  CO: "80202",
  CT: "06103",
  DC: "20001",
  DE: "19801",
  FL: "33101",
  GA: "30303",
  GU: "96910",
  HI: "96813",
  IA: "50309",
  ID: "83702",
  IL: "60601",
  IN: "46204",
  KS: "67202",
  KY: "40202",
  LA: "70112",
  MA: "02108",
  MD: "21201",
  ME: "04101",
  MI: "48226",
  MN: "55401",
  MO: "63101",
  MP: "96950",
  MS: "39201",
  MT: "59101",
  NC: "27601",
  ND: "58102",
  NE: "68102",
  NH: "03101",
  NJ: "07102",
  NM: "87102",
  NV: "89101",
  NY: "10001",
  OH: "43215",
  OK: "73102",
  OR: "97205",
  PA: "19102",
  PR: "00901",
  RI: "02903",
  SC: "29201",
  SD: "57104",
  TN: "37219",
  TX: "75201",
  UM: "96898",
  UT: "84111",
  VA: "23219",
  VI: "00802",
  VT: "05401",
  WA: "98101",
  WI: "53202",
  WV: "25301",
  WY: "82001",
};

export async function lookupUsPostalCode(
  zipCode: string,
): Promise<UsPostalLocation | null> {
  if (!/^\d{5}$/.test(zipCode)) return null;

  try {
    const response = await fetch(
      `https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as ZippopotamResponse;
    const place = data.places?.[0];
    const state = place?.["state abbreviation"]?.toUpperCase();
    const stateName = place?.state?.trim() || getUsStateName(state);
    const city = place?.["place name"]?.trim();
    const resolvedZip = data["post code"];

    if (!state || !/^[A-Z]{2}$/.test(state) || !stateName || !resolvedZip) {
      return null;
    }

    return {
      zipCode: resolvedZip,
      state,
      stateName,
      city: city || "",
      locationText: city ? `${city}, ${stateName}` : stateName,
    };
  } catch {
    return null;
  }
}

export async function lookupRepresentativeZipForState(
  state: string,
): Promise<UsPostalLocation | null> {
  const normalizedState = state.toUpperCase();
  const representativeZip = representativeZipByState[normalizedState];

  if (!representativeZip) return null;

  const location = await lookupUsPostalCode(representativeZip);
  const stateName = getUsStateName(normalizedState);

  if (location?.state === normalizedState) return location;
  if (!stateName) return null;

  return {
    zipCode: representativeZip,
    state: normalizedState,
    stateName,
    city: "",
    locationText: stateName,
  };
}
