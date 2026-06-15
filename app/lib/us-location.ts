import "server-only";

type ZippopotamResponse = {
  "post code"?: string;
  places?: Array<{
    "state abbreviation"?: string;
  }>;
};

export type UsPostalLocation = {
  zipCode: string;
  state: string;
};

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
    const state = data.places?.[0]?.["state abbreviation"]?.toUpperCase();
    const resolvedZip = data["post code"];

    if (!state || !/^[A-Z]{2}$/.test(state) || !resolvedZip) return null;

    return {
      zipCode: resolvedZip,
      state,
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

  return location?.state === normalizedState ? location : null;
}
