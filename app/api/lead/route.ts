import { geolocation, ipAddress, waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { buildApplicationNumber } from "@/lib/application-number";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LeadPayload = {
  page?: string;
  answers?: Record<string, unknown>;
  meta?: {
    deviceId?: string;
    trustedFormCertUrl?: string;
    salePath?: "lead" | "call";
    adaccountName?: string;
    leadUrl?: string;
    submissionId?: string;
  };
};

type PhoneValidationResult = {
  isValid: boolean;
  normalized: string;
  flags: string[];
  reason?: string;
};

type TrustedFormClaimResult = {
  status: "claimed" | "skipped" | "failed";
  response?: unknown;
  error?: string;
};

const PHONE_WINDOW_MS = 6 * 60 * 60 * 1000;
const VELOCITY_WINDOW_MS = 30 * 60 * 1000;
const CLEANUP_EVERY_SUBMISSIONS = 100;
const MAX_TRACKED_KEYS_PER_STORE = 50000;
const deviceCookieName = "bf_iul_device_id";
const phoneAttempts = new Map<string, number[]>();
const ipAttempts = new Map<string, number[]>();
const deviceAttempts = new Map<string, number[]>();
let submissionsSinceCleanup = 0;

const stateAbbreviations: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

function normalizeString(value: unknown) {
  return String(value || "").trim();
}

function getRequestCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function pruneAndCount(
  store: Map<string, number[]>,
  key: string,
  windowMs: number,
  now: number,
) {
  const recent = (store.get(key) || []).filter(
    (timestamp) => now - timestamp <= windowMs,
  );
  recent.push(now);
  store.set(key, recent);
  return recent.length;
}

function pruneStore(
  store: Map<string, number[]>,
  windowMs: number,
  now: number,
) {
  for (const [key, timestamps] of store) {
    const recent = timestamps.filter(
      (timestamp) => now - timestamp <= windowMs,
    );
    if (recent.length) store.set(key, recent);
    else store.delete(key);
  }

  if (store.size <= MAX_TRACKED_KEYS_PER_STORE) return;

  const oldestFirst = [...store.entries()]
    .map(([key, timestamps]) => ({ key, latest: Math.max(...timestamps) }))
    .sort((a, b) => a.latest - b.latest);

  for (
    let index = 0;
    index < store.size - MAX_TRACKED_KEYS_PER_STORE;
    index += 1
  ) {
    store.delete(oldestFirst[index].key);
  }
}

function maybePruneAttemptStores(now: number) {
  submissionsSinceCleanup += 1;
  if (submissionsSinceCleanup < CLEANUP_EVERY_SUBMISSIONS) return;

  submissionsSinceCleanup = 0;
  pruneStore(phoneAttempts, PHONE_WINDOW_MS, now);
  pruneStore(ipAttempts, VELOCITY_WINDOW_MS, now);
  pruneStore(deviceAttempts, VELOCITY_WINDOW_MS, now);
}

function normalizeUsPhone(value: unknown) {
  const digits = normalizeString(value).replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

function normalizeState(value: unknown) {
  const state = normalizeString(value);
  if (/^[A-Za-z]{2}$/.test(state)) return state.toUpperCase();
  return stateAbbreviations[state] || "";
}

function normalizeZipCode(value: unknown) {
  return normalizeString(value).replace(/\D/g, "").slice(0, 5);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getFunnelId(page?: string) {
  return normalizeString(page).replace(/^\/+/, "") || "home";
}

function getLeadLanguage() {
  const value = process.env.NEXT_PUBLIC_LEAD_LANGUAGE?.trim().toLowerCase();
  return value === "en" || value === "es" ? value : null;
}

function getLeadSource() {
  const value = process.env.NEXT_PUBLIC_LEAD_SOURCE?.trim().toLowerCase();
  return value === "network" || value === "internal" ? value : null;
}

function getLeadDomain() {
  return process.env.NEXT_PUBLIC_LEAD_DOMAIN?.trim().toLowerCase() || null;
}

function isSequential(digits: string) {
  return (
    digits === "0123456789" ||
    digits === "1234567890" ||
    digits === "9876543210"
  );
}

function isRepeatingPattern(digits: string) {
  return (
    /^(\d)\1{9}$/.test(digits) ||
    /^(\d{2})\1{4}$/.test(digits) ||
    /^(\d{5})\1$/.test(digits)
  );
}

function validateUsPhone(value: unknown): PhoneValidationResult {
  const normalized = normalizeUsPhone(value);
  const flags: string[] = [];

  if (normalized.length !== 10) {
    return {
      isValid: false,
      normalized,
      flags: ["invalid_length"],
      reason: "Ingresa un numero valido de EE.UU. con 10 digitos.",
    };
  }

  const areaCode = normalized.slice(0, 3);
  const exchange = normalized.slice(3, 6);

  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      flags: ["invalid_nanp"],
      reason: "Ingresa un numero movil o residencial valido de EE.UU.",
    };
  }

  if (areaCode.endsWith("11") || exchange.endsWith("11")) {
    flags.push("service_code_pattern");
  }
  if (areaCode === "555" || exchange === "555") flags.push("fictional_555");
  if (isSequential(normalized)) flags.push("sequential_digits");
  if (isRepeatingPattern(normalized)) flags.push("repeating_digits");
  if (normalized.split("").filter((digit) => digit === "0").length >= 7) {
    flags.push("too_many_zeros");
  }
  if (/^12345|23456|34567|45678|56789|67890$/.test(normalized.slice(4))) {
    flags.push("synthetic_tail");
  }

  return { isValid: true, normalized, flags };
}

function isTrustedFormCertUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && url.hostname === "cert.trustedform.com"
    );
  } catch {
    return false;
  }
}

async function claimTrustedFormCertificate({
  certUrl,
  email,
  phone,
  leadId,
}: {
  certUrl: string;
  email: string;
  phone: string;
  leadId: string;
}): Promise<TrustedFormClaimResult> {
  const apiKey = process.env.TRUSTEDFORM_API_KEY?.trim();

  if (!certUrl || !isTrustedFormCertUrl(certUrl)) {
    return {
      status: "skipped",
      error: "Missing or invalid TrustedForm certificate URL",
    };
  }
  if (!apiKey || apiKey === "your-trustedform-api-key-here") {
    return {
      status: "skipped",
      error: "TrustedForm API key is not configured",
    };
  }

  const response = await fetch(certUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`API:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/json",
      "api-version": "4.0",
    },
    body: JSON.stringify({
      retain: {
        reference: leadId,
        vendor: process.env.TRUSTEDFORM_VENDOR?.trim() || "Better Life",
      },
      match_lead: { email, phone },
    }),
    cache: "no-store",
  });
  const responseBody = await response
    .json()
    .catch(async () => response.text().catch(() => null));

  if (!response.ok) {
    return {
      status: "failed",
      response: responseBody,
      error: `TrustedForm claim failed with ${response.status}`,
    };
  }

  return { status: "claimed", response: responseBody };
}

async function claimTrustedFormAndUpdateLead({
  supabase,
  metadataTableName,
  leadId,
  certUrl,
  email,
  phone,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
  metadataTableName: string;
  leadId: string;
  certUrl: string;
  email: string;
  phone: string;
}) {
  try {
    const claimResult = await claimTrustedFormCertificate({
      certUrl,
      email,
      phone,
      leadId,
    });
    const { error } = await supabase
      .from(metadataTableName)
      .update({
        trustedform_claim_status: claimResult.status,
        trustedform_claimed_at:
          claimResult.status === "claimed" ? new Date().toISOString() : null,
        trustedform_claim_response: claimResult.response ?? null,
        trustedform_claim_error: claimResult.error ?? null,
      })
      .eq("lead_id", leadId);

    if (error) console.error("TrustedForm claim status update failed", error);
  } catch (error) {
    console.error("TrustedForm claim failed", error);
    await supabase
      .from(metadataTableName)
      .update({
        trustedform_claim_status: "failed",
        trustedform_claim_error:
          error instanceof Error ? error.message : "TrustedForm claim failed",
      })
      .eq("lead_id", leadId);
  }
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = Date.now();
  const body = (await request.json().catch(() => null)) as LeadPayload | null;
  if (!body?.answers) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const submissionId = normalizeString(body.meta?.submissionId);
  if (!isUuid(submissionId)) {
    return NextResponse.json(
      { error: "Missing or invalid submission ID" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured" },
      { status: 500 },
    );
  }

  const geo = geolocation(request);
  const requestIp =
    ipAddress(request) ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const phoneValidation = validateUsPhone(body.answers.phoneNumber);
  const deviceId = normalizeString(
    body.meta?.deviceId || getRequestCookie(request, deviceCookieName),
  );
  const trustedFormCertUrl = normalizeString(body.meta?.trustedFormCertUrl);
  const adaccountName = normalizeString(
    body.meta?.adaccountName ?? body.answers.adaccount_name,
  );
  const leadUrl = normalizeString(body.meta?.leadUrl);
  const userAgent = normalizeString(request.headers.get("user-agent"));

  maybePruneAttemptStores(now);
  const duplicatePhoneCount = phoneValidation.normalized
    ? pruneAndCount(
        phoneAttempts,
        phoneValidation.normalized,
        PHONE_WINDOW_MS,
        now,
      )
    : 0;
  const ipVelocityCount =
    requestIp !== "unknown"
      ? pruneAndCount(ipAttempts, requestIp, VELOCITY_WINDOW_MS, now)
      : 0;
  const deviceVelocityCount = deviceId
    ? pruneAndCount(deviceAttempts, deviceId, VELOCITY_WINDOW_MS, now)
    : 0;
  const cleanedAnswers = Object.fromEntries(
    Object.entries(body.answers).filter(
      ([, value]) => value !== "" && value != null,
    ),
  );
  const riskFlags = [
    ...phoneValidation.flags,
    ...(duplicatePhoneCount >= 3 ? ["duplicate_phone"] : []),
    ...(ipVelocityCount >= 6 ? ["high_velocity_ip"] : []),
    ...(deviceVelocityCount >= 4 ? ["high_velocity_device"] : []),
  ];
  const restAnswers = Object.fromEntries(
    Object.entries(cleanedAnswers).filter(([key]) => key !== "phoneNumber"),
  );
  const phoneNumber =
    phoneValidation.normalized || normalizeString(body.answers.phoneNumber);
  const submittedAt = new Date().toISOString();
  const funnelId = getFunnelId(body.page);
  const state = normalizeState(restAnswers.state);
  const zipCode = normalizeZipCode(restAnswers.zipCode);
  const ageGroup = normalizeString(restAnswers.ageGroup);
  const insuranceGoal = normalizeString(restAnswers.insuranceGoal);
  const firstName = normalizeString(restAnswers.firstName);
  const lastName = normalizeString(restAnswers.lastName);
  const email = normalizeString(restAnswers.email).toLowerCase();
  const locationText = normalizeString(restAnswers.locationText);

  if (
    !phoneValidation.isValid ||
    !ageGroup ||
    !insuranceGoal ||
    !state ||
    !zipCode ||
    !firstName ||
    !lastName ||
    !email ||
    !locationText
  ) {
    return NextResponse.json(
      { error: "La información del lead está incompleta o no es válida." },
      { status: 422 },
    );
  }

  const salePath = body.meta?.salePath === "call" ? "call" : "lead";
  const leadStatus =
    salePath === "call" ? "pending_call" : "ready_for_sell";
  const leadLanguage = getLeadLanguage();
  const leadSource = getLeadSource();
  const leadDomain = getLeadDomain();
  const lead = {
    submittedAt,
    source: "better-life-next",
    pagina: body.page || "home",
    funnelId,
    language: leadLanguage,
    leadSource,
    domain: leadDomain,
    ipAddress: requestIp,
    geolocation: geo,
    trustedFormCertUrl,
    adaccountName,
    leadUrl,
    userAgent,
    user_agent: userAgent,
    submissionId,
    salePath,
    leadStatus,
    ...restAnswers,
    ageGroup,
    insuranceGoal,
    state,
    zipCode,
    firstName,
    lastName,
    email,
    locationText,
    phoneNumber,
    validation: {
      phoneCountry: "US",
      duplicatePhoneCount,
      ipVelocityCount,
      deviceVelocityCount,
      flags: riskFlags,
    },
  };
  const tableName = process.env.SUPABASE_LEADS_TABLE?.trim() || "leads";
  const metadataTableName =
    process.env.SUPABASE_LEAD_METADATA_TABLE?.trim() || "lead_metadata";
  const { data, error } = await supabase
    .from(tableName)
    .insert({
      lead_id: submissionId,
      funnel_id: funnelId,
      age_group: ageGroup,
      insurance_goal: insuranceGoal,
      state,
      zip_code: zipCode,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      email,
      lead_status: leadStatus,
      trustedform_cert_url: trustedFormCertUrl || null,
      language: leadLanguage,
      source: leadSource,
      domain: leadDomain,
    })
    .select("lead_id")
    .single();

  let isDuplicateSubmission = false;

  if (error?.code === "23505") {
    const { data: existingLead } = await supabase
      .from(tableName)
      .select("lead_id")
      .eq("lead_id", submissionId)
      .maybeSingle();
    isDuplicateSubmission = existingLead?.lead_id === submissionId;
  }

  if (error && !isDuplicateSubmission) {
    console.error("Supabase lead insert failed", error);
    return NextResponse.json(
      { error: "No pudimos guardar el lead en Supabase" },
      { status: 502 },
    );
  }

  const leadId = data?.lead_id || submissionId;
  const { error: metadataError } = await supabase
    .from(metadataTableName)
    .upsert(
      {
        lead_id: leadId,
        application_id: buildApplicationNumber(leadId),
        source: lead.source,
        page: lead.pagina,
        submitted_at: submittedAt,
        ip_address: requestIp,
        geolocation: geo,
        device_id: deviceId || null,
        adaccount_name: adaccountName || null,
        lead_url: leadUrl || null,
        validation: lead.validation,
        risk_flags: riskFlags,
        payload: lead,
      },
      {
        onConflict: "lead_id",
      },
    );

  if (metadataError) {
    console.error("Supabase lead metadata insert failed", metadataError);
    return NextResponse.json(
      { error: "No pudimos guardar la metadata del lead en Supabase" },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    saved: true,
    duplicate: isDuplicateSubmission,
    leadId,
  });

  if (!isDuplicateSubmission && trustedFormCertUrl) {
    waitUntil(
      claimTrustedFormAndUpdateLead({
        supabase,
        metadataTableName,
        leadId,
        certUrl: trustedFormCertUrl,
        email: normalizeString(restAnswers.email),
        phone: phoneNumber,
      }),
    );
  }

  return response;
}
