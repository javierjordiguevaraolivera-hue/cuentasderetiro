"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PopUp1 from "../components/pop-up1";
import { buildApplicationNumber } from "../lib/application-number";
import retirementLogo from "../public/media/logo-cuentas-de-retiro.png";

const retirementGoals = [
  {
    id: "protect-savings",
    label: "Proteger a mi familia si no estoy",
    value: "Seguro de vida",
    amount: 31000,
  },
  {
    id: "grow-money",
    label: "Ahorrar mi dinero con intereses",
    value: "Ahorrar e invertir",
    amount: 29000,
  },
  {
    id: "retirement-income",
    label: "Planificar mi retiro",
    value: "Planificación de retiro",
    amount: 32253,
  },
  {
    id: "not-sure",
    label: "No estoy seguro aún",
    value: "No estoy seguro aún",
    amount: 27894,
  },
] as const;

const ageRanges = [
  {
    id: "25-34",
    label: "25 a 34 años",
    amount: 392000,
  },
  {
    id: "35-44",
    label: "35 a 44 años",
    amount: 204000,
  },
  {
    id: "45-54",
    label: "45 a 54 años",
    amount: 117000,
  },
  {
    id: "55-65",
    label: "55 a 65 años",
    amount: 69000,
  },
  {
    id: "65-plus",
    label: "65+",
    amount: 27000,
  },
] as const;

function buildSlotValues(start: number, end: number, stepCount: number) {
  const weights = Array.from({ length: stepCount }, (_, index) => {
    const step = index + 1;
    return 1 + Math.sin(step * 1.73) * 0.24 + Math.sin(step * 0.61) * 0.11;
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  let accumulatedWeight = 0;

  return [
    start,
    ...weights.map((weight, index) => {
      if (index === weights.length - 1) return end;

      accumulatedWeight += weight;
      return Math.round(
        start + (end - start) * (accumulatedWeight / totalWeight),
      );
    }),
  ];
}

const initialSlotValues = buildSlotValues(10000, 65000, 60);
const funnelId = "iul-v4";
const zipCodeAmount = 5389;
const nameAmount = 7894;
const deviceStorageKey = "better-life-device-id";
const deviceCookieName = "bf_iul_device_id";
const deviceCookieDurationDays = 15;
const submissionStorageKey = "bf_n1_submission_id";
const everflowScriptId = "everflow-sdk";
const everflowScriptSrc = "https://www.jk8gcxs.com/scripts/main.js";
const everflowTransactionStorageKey = "bf_n1_everflow_transaction_id";
const trustedFormScriptId = "trustedform-certify-sdk";
const trustedFormFieldName =
  process.env.NEXT_PUBLIC_TRUSTEDFORM_FIELD || "xxTrustedFormCertUrl";
const validUsPhonePattern = /^[2-9]\d{2}[2-9]\d{6}$/;
const emailLocalPattern = /^[A-Z0-9](?:[A-Z0-9._+%-]*[A-Z0-9])?$/i;
const emailDomainLabelPattern = /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i;
type RuntimeConfig = {
  payPerCallStatus: string;
  payPerCallStartTime: string;
  payPerCallEndTime: string;
  payPerCallPhoneNumber: string;
  ringbaCampaignId: string;
};

type EverflowSdk = {
  click?: (payload: Record<string, string>) => unknown;
  urlParameter?: (name: string) => string;
  getTransactionId?: () => string;
  transaction_id?: string;
  transactionId?: string;
};

declare global {
  interface Window {
    EF?: EverflowSdk;
    __bfN1EverflowClickPromise?: Promise<string>;
  }
}
const defaultRuntimeConfig: RuntimeConfig = {
  payPerCallStatus: "OFF",
  payPerCallStartTime: "",
  payPerCallEndTime: "",
  payPerCallPhoneNumber: "",
  ringbaCampaignId: "",
};
const usRegionCodes = new Set([
  "AK",
  "AL",
  "AR",
  "AS",
  "AZ",
  "CA",
  "CO",
  "CT",
  "DC",
  "DE",
  "FL",
  "GA",
  "GU",
  "HI",
  "IA",
  "ID",
  "IL",
  "IN",
  "KS",
  "KY",
  "LA",
  "MA",
  "MD",
  "ME",
  "MI",
  "MN",
  "MO",
  "MP",
  "MS",
  "MT",
  "NC",
  "ND",
  "NE",
  "NH",
  "NJ",
  "NM",
  "NV",
  "NY",
  "OH",
  "OK",
  "OR",
  "PA",
  "PR",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UM",
  "UT",
  "VA",
  "VI",
  "VT",
  "WA",
  "WI",
  "WV",
  "WY",
]);

function getNewYorkMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 60 + minute;
}

function parseRuntimeTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;

  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isWithinTimeWindow(current: number, start: number, end: number) {
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function isPayPerCallWindowOpen(config: RuntimeConfig) {
  if (config.payPerCallStatus !== "ON") return false;

  const start = parseRuntimeTime(config.payPerCallStartTime);
  const end = parseRuntimeTime(config.payPerCallEndTime);
  const current = getNewYorkMinutes();

  if (start == null || end == null || current == null) return false;

  return isWithinTimeWindow(current, start, end);
}

function formatUsPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isVisiblyFakeUsPhone(value: string) {
  const areaCode = value.slice(0, 3);
  const exchange = value.slice(3, 6);

  return (
    areaCode === "555" ||
    exchange === "555" ||
    areaCode.endsWith("11") ||
    exchange.endsWith("11") ||
    /^(\d)\1{9}$/.test(value) ||
    /^(\d{2})\1{4}$/.test(value) ||
    /^(\d{5})\1$/.test(value) ||
    ["0123456789", "1234567890", "9876543210"].includes(value) ||
    value.split("").filter((digit) => digit === "0").length >= 7
  );
}

function isValidUsPhone(value: string) {
  return validUsPhonePattern.test(value) && !isVisiblyFakeUsPhone(value);
}

function isValidEmailAddress(value: string) {
  const email = value.trim();
  const atIndex = email.indexOf("@");

  if (
    !email ||
    atIndex <= 0 ||
    atIndex !== email.lastIndexOf("@") ||
    email.length > 254
  ) {
    return false;
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1).toLowerCase();
  const domainLabels = domain.split(".");
  const topLevelDomain = domainLabels.at(-1) || "";

  return (
    localPart.length <= 64 &&
    emailLocalPattern.test(localPart) &&
    !localPart.includes("..") &&
    domainLabels.length >= 2 &&
    domainLabels.every(
      (label) => label.length <= 63 && emailDomainLabelPattern.test(label),
    ) &&
    /^[a-z]{2,24}$/.test(topLevelDomain)
  );
}

type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

function ValidationIndicator({ status }: { status: ValidationStatus }) {
  if (status === "idle") return null;

  if (status === "validating") {
    return (
      <span aria-label="Validando" className="field-validation-indicator">
        <svg
          aria-hidden="true"
          className="validation-spinner"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            opacity="0.24"
            r="8"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M20 12a8 8 0 0 0-8-8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </span>
    );
  }

  if (status === "invalid") {
    return (
      <span aria-label="Dato inválido" className="field-validation-indicator invalid">
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" />
        </svg>
      </span>
    );
  }

  return (
    <span aria-label="Dato protegido" className="field-validation-indicator valid">
      <svg
        aria-hidden="true"
        className="validation-lock"
        fill="currentColor"
        viewBox="0 0 14 18"
      >
        <path d="M7 0a5 5 0 0 0-5 5v3H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V5a5 5 0 0 0-5-5Zm3 8H4V5a3 3 0 0 1 6 0v3Z" />
      </svg>
    </span>
  );
}

function setDeviceCookie(deviceId: string) {
  if (typeof document === "undefined" || !deviceId) return;

  const maxAge = deviceCookieDurationDays * 24 * 60 * 60;
  document.cookie = `${deviceCookieName}=${encodeURIComponent(
    deviceId,
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(deviceStorageKey);
  if (existing) {
    setDeviceCookie(existing);
    return existing;
  }

  const newId = `bm_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  window.localStorage.setItem(deviceStorageKey, newId);
  setDeviceCookie(newId);
  return newId;
}

function getTrustedFormCertUrl() {
  if (typeof document === "undefined") return "";

  const field = document.getElementsByName(
    trustedFormFieldName,
  )[0] as HTMLInputElement | undefined;
  return field?.value?.trim() || "";
}

function getAdAccountName() {
  if (typeof window === "undefined") return "";

  return (
    new URLSearchParams(window.location.search)
      .get("adaccount_name")
      ?.trim() || ""
  );
}

function getSearchParam(name: string) {
  if (typeof window === "undefined") return "";

  const searchParams = new URLSearchParams(window.location.search);
  const entry = [...searchParams.entries()].find(
    ([key]) => key.toLowerCase() === name.toLowerCase(),
  );

  return entry?.[1]?.trim() || "";
}

function getEverflowUrlParameter(name: string) {
  if (typeof window === "undefined") return "";

  return (
    window.EF?.urlParameter?.(name)?.trim() ||
    getSearchParam(name)
  );
}

function extractEverflowTransactionId(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return (
    extractEverflowTransactionId(record.transaction_id) ||
    extractEverflowTransactionId(record.transactionId) ||
    extractEverflowTransactionId(record._ef_transaction_id)
  );
}

function readEverflowTransactionIdFromSdk() {
  if (typeof window === "undefined") return "";

  return (
    window.EF?.getTransactionId?.()?.trim() ||
    window.EF?.transaction_id?.trim() ||
    window.EF?.transactionId?.trim() ||
    ""
  );
}

function getStoredEverflowTransactionId() {
  if (typeof window === "undefined") return "";

  return (
    window.sessionStorage.getItem(everflowTransactionStorageKey)?.trim() ||
    readEverflowTransactionIdFromSdk()
  );
}

function storeEverflowTransactionId(transactionId: string) {
  if (typeof window === "undefined" || !transactionId) return;

  window.sessionStorage.setItem(
    everflowTransactionStorageKey,
    transactionId,
  );
}

function loadEverflowSdk() {
  if (typeof document === "undefined") return Promise.resolve();
  if (window.EF) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      everflowScriptId,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = everflowScriptId;
    script.type = "text/javascript";
    script.async = true;
    script.src = everflowScriptSrc;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
}

async function startEverflowClick() {
  if (typeof window === "undefined") return "";
  if (window.__bfN1EverflowClickPromise) {
    return window.__bfN1EverflowClickPromise;
  }

  window.__bfN1EverflowClickPromise = (async () => {
    await loadEverflowSdk();

    const ef = window.EF;
    const clickResult = ef?.click?.({
      offer_id: getEverflowUrlParameter("oid"),
      affiliate_id: getEverflowUrlParameter("affid"),
      source_id: getEverflowUrlParameter("source_id"),
      sub1: getEverflowUrlParameter("sub1"),
      sub2: getEverflowUrlParameter("sub2"),
      sub3: getEverflowUrlParameter("sub3"),
      sub4: getEverflowUrlParameter("sub4"),
      sub5: getEverflowUrlParameter("sub5"),
      uid: getEverflowUrlParameter("uid"),
      transaction_id: getEverflowUrlParameter("_ef_transaction_id"),
    });
    const transactionId =
      extractEverflowTransactionId(await Promise.resolve(clickResult)) ||
      readEverflowTransactionIdFromSdk() ||
      getStoredEverflowTransactionId();

    if (transactionId) storeEverflowTransactionId(transactionId);
    return transactionId;
  })().catch((error) => {
    console.error("Everflow click tracking failed", error);
    return getStoredEverflowTransactionId();
  });

  return window.__bfN1EverflowClickPromise;
}

async function getEverflowTransactionId() {
  const existingTransactionId = getStoredEverflowTransactionId();
  if (existingTransactionId) return existingTransactionId;

  return startEverflowClick();
}

function getOrCreateSubmissionId() {
  if (typeof window === "undefined") return "";

  const existing = window.sessionStorage.getItem(submissionStorageKey);
  if (existing) return existing;

  const submissionId = window.crypto.randomUUID();
  window.sessionStorage.setItem(submissionStorageKey, submissionId);
  return submissionId;
}

function getSlotDigits(value: number) {
  return value.toString().padStart(6, " ").split("");
}

function getSlotReels(values: number[]) {
  return Array.from({ length: 6 }, (_, digitIndex) =>
    values.map((value) => getSlotDigits(value)[digitIndex]),
  );
}

type FunnelStepOneProps = {
  initialLocation: {
    country: string | null;
    state: string | null;
    stateName: string | null;
    city: string | null;
    postalCode: string | null;
  };
  phoneHref: string;
  popupPreviewEnabled?: boolean;
  sub1: string;
  sub2: string;
};

export default function FunnelStepOneN1({
  initialLocation,
  phoneHref,
  popupPreviewEnabled = false,
  sub1,
  sub2,
}: FunnelStepOneProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [insurance_goal, setInsuranceGoal] = useState<string | null>(null);
  const [age_group, setAgeGroup] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [zipSubmitted, setZipSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [submittedLeadId, setSubmittedLeadId] = useState("");
  const [submittedContinueUrl, setSubmittedContinueUrl] = useState(
    "/thanks/call2",
  );
  const [phoneValidationStatus, setPhoneValidationStatus] =
    useState<ValidationStatus>("idle");
  const [emailValidationStatus, setEmailValidationStatus] =
    useState<ValidationStatus>("idle");
  const [runtimeConfig, setRuntimeConfig] =
    useState<RuntimeConfig>(defaultRuntimeConfig);
  const [everflowTransactionId, setEverflowTransactionId] = useState(sub2);
  const [isPopupOpen, setIsPopupOpen] = useState(popupPreviewEnabled);
  const [currentAmount, setCurrentAmount] = useState(65000);
  const [odometerValues, setOdometerValues] = useState(initialSlotValues);
  const [odometerRun, setOdometerRun] = useState(0);
  const detectedCountry = initialLocation.country?.toUpperCase() ?? null;
  const detectedState = initialLocation.state?.toUpperCase() ?? null;
  const detectedPostalCode = initialLocation.postalCode?.trim() ?? null;
  const [resolvedState, setResolvedState] = useState(detectedState);
  const [resolvedStateName, setResolvedStateName] = useState(
    initialLocation.stateName,
  );
  const [resolvedZipCode, setResolvedZipCode] = useState(detectedPostalCode);
  const [resolvedCity, setResolvedCity] = useState(initialLocation.city);
  const submitInFlightRef = useRef(false);
  const submittedLeadIdRef = useRef("");
  const runtimeConfigRef = useRef<RuntimeConfig>(defaultRuntimeConfig);
  const hasDetectedUsLocation =
    detectedCountry === "US" &&
    usRegionCodes.has(detectedState ?? "") &&
    /^\d{5}$/.test(detectedPostalCode ?? "");
  const visibleStepCount = hasDetectedUsLocation ? 4 : 5;
  const visibleCurrentStep =
    hasDetectedUsLocation && currentStep > 3 ? currentStep - 1 : currentStep;
  const contactValidationMessage =
    phoneValidationStatus === "invalid"
      ? "Número inválido. Ingresa uno real."
      : emailValidationStatus === "invalid"
        ? "Email inválido. Corrígelo, por favor."
        : contactError;

  useEffect(() => {
    getOrCreateDeviceId();

    if (document.getElementById(trustedFormScriptId)) return;

    const trustedFormScript = document.createElement("script");
    trustedFormScript.id = trustedFormScriptId;
    trustedFormScript.type = "text/javascript";
    trustedFormScript.async = true;
    trustedFormScript.src = `${
      window.location.protocol
    }//api.trustedform.com/trustedform.js?field=${encodeURIComponent(
      trustedFormFieldName,
    )}&use_tagged_consent=true&l=${Date.now()}${Math.random()}`;

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(trustedFormScript, firstScript);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeEverflow() {
      const transactionId = await startEverflowClick();
      if (cancelled || !transactionId) return;

      setEverflowTransactionId(transactionId);
    }

    void initializeEverflow();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeConfig() {
      try {
        const response = await fetch("/api/runtime-config", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const config = (await response.json()) as Partial<RuntimeConfig>;
        const nextConfig = {
          ...defaultRuntimeConfig,
          ...Object.fromEntries(
            Object.entries(config).filter(
              ([, value]) => typeof value === "string" && value.trim(),
            ),
          ),
        } as RuntimeConfig;
        if (cancelled) return;

        runtimeConfigRef.current = nextConfig;
        setRuntimeConfig(nextConfig);
      } catch {
        // Keep the safe lead-flow defaults if runtime config is unavailable.
      }
    }

    void loadRuntimeConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phoneNumber.length < 10) return;

    const timeoutId = window.setTimeout(() => {
      setPhoneValidationStatus(
        isValidUsPhone(phoneNumber) ? "valid" : "invalid",
      );
    }, 950);

    return () => window.clearTimeout(timeoutId);
  }, [phoneNumber]);

  useEffect(() => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    const timeoutId = window.setTimeout(() => {
      setEmailValidationStatus(
        isValidEmailAddress(cleanEmail) ? "valid" : "invalid",
      );
    }, 950);

    return () => window.clearTimeout(timeoutId);
  }, [email]);

  function selectGoal(goal: (typeof retirementGoals)[number]) {
    const nextAmount = currentAmount + goal.amount;
    const stepCount = Math.max(1, Math.round(goal.amount / 1000));

    setInsuranceGoal(goal.value);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("insurance_goal", goal.value);
    sessionStorage.setItem("insurance_goal_value", String(goal.amount));
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 1,
          funnel_id: funnelId,
          insurance_goal: goal.value,
          insurance_goal_value: goal.amount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(2);
  }

  function selectAge(ageRange: (typeof ageRanges)[number]) {
    if (age_group) return;

    if (ageRange.id === "65-plus") {
      router.push("/rechazo");
      return;
    }

    const locationAmount = hasDetectedUsLocation ? zipCodeAmount : 0;
    const addedAmount = ageRange.amount + locationAmount;
    const nextAmount = currentAmount + addedAmount;
    const stepCount = Math.max(1, Math.round(addedAmount / 1000));

    setAgeGroup(ageRange.id);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("age_group", ageRange.id);
    sessionStorage.setItem("age_group_value", String(ageRange.amount));
    if (detectedCountry) {
      sessionStorage.setItem("geo_country", detectedCountry);
    }
    if (detectedState) {
      sessionStorage.setItem("geo_state", detectedState);
    }
    if (initialLocation.city) {
      sessionStorage.setItem("geo_city", initialLocation.city);
    }
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 2,
          funnel_id: funnelId,
          age_group: ageRange.id,
          age_group_value: ageRange.amount,
          projectedAmount: nextAmount,
        },
      }),
    );

    if (hasDetectedUsLocation && detectedPostalCode) {
      setZipCode(detectedPostalCode);
      setResolvedZipCode(detectedPostalCode);
      setResolvedState(detectedState);
      setZipSubmitted(true);
      sessionStorage.setItem("zip_code", detectedPostalCode);
      sessionStorage.setItem("zip_code_source", "vercel");
      sessionStorage.setItem("zip_code_value", String(zipCodeAmount));
      window.dispatchEvent(
        new CustomEvent("funnel:step-complete", {
          detail: {
            step: 3,
            zipCode: detectedPostalCode,
            zipCodeValue: zipCodeAmount,
            zipCodeSource: "vercel",
            country: detectedCountry,
            state: detectedState,
            city: initialLocation.city,
            projectedAmount: nextAmount,
          },
        }),
      );
      setCurrentStep(4);
      return;
    }

    setCurrentStep(3);
  }

  async function submitZipCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (zipSubmitted) return;

    const formData = new FormData(event.currentTarget);
    const submittedZip = String(formData.get("zipCode") ?? "")
      .replace(/\D/g, "")
      .slice(0, 5);
    const numericZip = Number(submittedZip);
    const isValidUsZip =
      /^\d{5}$/.test(submittedZip) &&
      numericZip >= 501 &&
      numericZip <= 99950;

    if (!isValidUsZip) {
      setZipError("Ingresa un ZIP code válido de 5 dígitos.");
      return;
    }

    let locationResponse: Response;

    try {
      locationResponse = await fetch("/api/location/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zipCode: submittedZip }),
      });
    } catch {
      setZipError("No pudimos validar el ZIP code. Intenta nuevamente.");
      return;
    }

    if (!locationResponse.ok) {
      setZipError("Ingresa un ZIP code válido de Estados Unidos.");
      return;
    }

    const location = (await locationResponse.json()) as {
      zipCode: string;
      state: string;
      stateName: string;
      city: string;
      locationText: string;
    };
    const nextAmount = currentAmount + zipCodeAmount;
    const stepCount = Math.max(1, Math.round(zipCodeAmount / 1000));

    setZipCode(location.zipCode);
    setResolvedZipCode(location.zipCode);
    setResolvedState(location.state);
    setResolvedStateName(location.stateName);
    setResolvedCity(location.city);
    setZipSubmitted(true);
    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("zip_code", location.zipCode);
    sessionStorage.setItem("zip_code_source", "user");
    sessionStorage.setItem("zip_code_value", String(zipCodeAmount));
    sessionStorage.setItem("geo_country", "US");
    sessionStorage.setItem("geo_state", location.state);
    sessionStorage.setItem("geo_city", location.city);
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 3,
          zipCode: location.zipCode,
          state: location.state,
          city: location.city,
          locationText: location.locationText,
          zipCodeValue: zipCodeAmount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(4);
  }

  function updateName(
    field: "firstName" | "lastName",
    value: string,
  ) {
    const cleanValue = value
      .replace(/[^\p{L}' -]/gu, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, 40);

    if (field === "firstName") {
      setFirstName(cleanValue);
    } else {
      setLastName(cleanValue);
    }

    setNameError("");
    setNameSubmitted(false);
  }

  function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nameSubmitted) return;

    const validNamePattern = /^[\p{L}][\p{L}' -]+$/u;
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (
      !validNamePattern.test(cleanFirstName) ||
      !validNamePattern.test(cleanLastName)
    ) {
      setNameError("Ingresa un nombre y apellido válidos.");
      return;
    }

    setFirstName(cleanFirstName);
    setLastName(cleanLastName);
    setNameSubmitted(true);
    const nextAmount = currentAmount + nameAmount;
    const stepCount = Math.max(1, Math.round(nameAmount / 1000));

    setOdometerValues(buildSlotValues(currentAmount, nextAmount, stepCount));
    setCurrentAmount(nextAmount);
    setOdometerRun((run) => run + 1);
    sessionStorage.setItem("first_name", cleanFirstName);
    sessionStorage.setItem("last_name", cleanLastName);
    sessionStorage.setItem("name_value", String(nameAmount));
    window.dispatchEvent(
      new CustomEvent("funnel:step-complete", {
        detail: {
          step: 4,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          nameValue: nameAmount,
          projectedAmount: nextAmount,
        },
      }),
    );
    setCurrentStep(5);
  }

  function updatePhoneNumber(value: string) {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("1")) {
      digits = digits.slice(1);
    }

    const nextPhoneNumber = digits.slice(0, 10);
    setPhoneNumber(nextPhoneNumber);
    setPhoneValidationStatus(
      nextPhoneNumber.length === 10 ? "validating" : "idle",
    );
    setContactError("");
    setContactSubmitted(false);
  }

  function updateEmail(value: string) {
    const nextEmail = value.trimStart().slice(0, 254);
    setEmail(nextEmail);
    setEmailValidationStatus(nextEmail.trim() ? "validating" : "idle");
    setContactError("");
    setContactSubmitted(false);
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitInFlightRef.current) return;
    if (submittedLeadIdRef.current || submittedLeadId) {
      if (isPayPerCallWindowOpen(runtimeConfigRef.current)) {
        setIsPopupOpen(true);
      }
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isValidUsPhone(phoneNumber)) {
      setPhoneValidationStatus("invalid");
      setContactError("Ingresa un número de teléfono válido de Estados Unidos.");
      return;
    }

    if (!isValidEmailAddress(cleanEmail)) {
      setEmailValidationStatus("invalid");
      setContactError("Ingresa un email válido.");
      return;
    }

    if (
      !insurance_goal ||
      !age_group ||
      !resolvedState ||
      !resolvedZipCode
    ) {
      setContactError("No pudimos completar tu ubicación. Intenta nuevamente.");
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmittingLead(true);
    setContactError("");

    try {
      let city = resolvedCity?.trim() || "";
      let finalState = resolvedState;
      let finalStateName = resolvedStateName?.trim() || "";
      let finalZipCode = resolvedZipCode;
      let locationText =
        city && finalStateName
          ? `${city}, ${finalStateName}`
          : finalStateName || finalState || finalZipCode;

      if (!locationText) {
        const locationResponse = await fetch("/api/location/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zipCode: resolvedZipCode }),
        });

        if (locationResponse.ok) {
          const location = (await locationResponse.json()) as {
            city?: string;
            state?: string;
            stateName?: string;
            zipCode?: string;
            locationText?: string;
          };
          city = location.city?.trim() || city;
          finalState = location.state || finalState;
          finalStateName = location.stateName || finalStateName;
          finalZipCode = location.zipCode || finalZipCode;
          locationText =
            location.locationText ||
            (city && finalStateName
              ? `${city}, ${finalStateName}`
              : finalStateName || finalState || finalZipCode);
          setResolvedCity(city || null);
          setResolvedState(finalState);
          setResolvedStateName(finalStateName);
          setResolvedZipCode(finalZipCode);
        }
      }

      locationText = locationText || finalState || finalZipCode;

      const deviceId = getOrCreateDeviceId();
      const trustedFormCertUrl = getTrustedFormCertUrl();
      const submissionId = getOrCreateSubmissionId();
      const activeRuntimeConfig = runtimeConfigRef.current;
      const shouldUsePayPerCall =
        isPayPerCallWindowOpen(activeRuntimeConfig);
      const salePath: "call" | "lead" = shouldUsePayPerCall
        ? "call"
        : "lead";
      const nextEverflowTransactionId =
        (await getEverflowTransactionId()) || everflowTransactionId;
      if (nextEverflowTransactionId) {
        setEverflowTransactionId(nextEverflowTransactionId);
      }
      const leadSub2 = nextEverflowTransactionId;
      const response = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "/n1",
          answers: {
            ageGroup: age_group,
            insuranceGoal: insurance_goal,
            sub1,
            sub2: leadSub2,
            state: finalState,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber,
            email: cleanEmail,
            locationText,
            zipCode: finalZipCode,
          },
          meta: {
            deviceId,
            trustedFormCertUrl,
            salePath,
            adaccountName: getAdAccountName(),
            leadUrl: window.location.href,
            submissionId,
          },
        }),
      });

      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
        leadId?: string;
      } | null;

      if (!response.ok || !responseBody?.leadId) {
        throw new Error(
          responseBody?.error || "No pudimos guardar tu información.",
        );
      }

      const leadId = responseBody.leadId;
      submittedLeadIdRef.current = leadId;
      setSubmittedLeadId(leadId);
      setEmail(cleanEmail);
      setContactSubmitted(true);
      sessionStorage.setItem("sale_path", salePath);
      sessionStorage.setItem(
        "lead_status",
        salePath === "call" ? "pending_call" : "ready_for_sell",
      );
      sessionStorage.setItem("lead_id", leadId);
      sessionStorage.setItem("phone_number", phoneNumber);
      sessionStorage.setItem("email", cleanEmail);
      window.dispatchEvent(
        new CustomEvent("funnel:step-complete", {
          detail: {
            step: 5,
            funnel_id: funnelId,
            sub1,
            sub2: leadSub2,
            everflow_transaction_id: nextEverflowTransactionId,
            insurance_goal,
            age_group,
            state: finalState,
            zip_code: finalZipCode,
            location_text: locationText,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            email: cleanEmail,
            device_id: deviceId,
            trustedform_cert_url: trustedFormCertUrl,
            lead_id: leadId,
            salePath,
            lead_status:
              salePath === "call" ? "pending_call" : "ready_for_sell",
            pay_per_call_phone_number:
              activeRuntimeConfig.payPerCallPhoneNumber,
            ringba_campaign_id: activeRuntimeConfig.ringbaCampaignId,
            country: "US",
            city,
            zipCodeSource: hasDetectedUsLocation ? "vercel" : "user",
            projectedAmount: currentAmount,
          },
        }),
      );

      const nextParams = new URLSearchParams(window.location.search);
      nextParams.set("funnel_id", funnelId);
      nextParams.set("lead_id", leadId);
      nextParams.set("first_name", firstName.trim());
      nextParams.set("insurance_goal", insurance_goal);
      nextParams.set("age_group", age_group);
      nextParams.set("application_number", buildApplicationNumber(leadId));
      if (activeRuntimeConfig.payPerCallPhoneNumber) {
        nextParams.set(
          "ppc_phone",
          activeRuntimeConfig.payPerCallPhoneNumber,
        );
      }
      if (activeRuntimeConfig.ringbaCampaignId) {
        nextParams.set(
          "ringba_campaign_id",
          activeRuntimeConfig.ringbaCampaignId,
        );
      }
      const nextSearch = nextParams.toString()
        ? `?${nextParams.toString()}`
        : "";

      if (shouldUsePayPerCall) {
        setSubmittedContinueUrl(`/thanks/call2${nextSearch}`);
        setIsPopupOpen(true);
        return;
      }

      window.location.assign(`/thanks/lead${nextSearch}`);
    } catch (error) {
      setContactError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar tu información. Intenta nuevamente.",
      );
    } finally {
      submitInFlightRef.current = false;
      setIsSubmittingLead(false);
    }
  }

  const slotReels = getSlotReels(odometerValues);
  const odometerSteps = odometerValues.length - 1;
  const odometerStyle = {
    "--odometer-distance": `${odometerSteps * -30}px`,
    animationTimingFunction: `steps(${odometerSteps}, jump-start)`,
  } as CSSProperties;

  return (
    <main className="funnel-page">
      <PopUp1
        applicationNumber={buildApplicationNumber(submittedLeadId)}
        continueUrl={submittedContinueUrl}
        firstName={firstName}
        goal={insurance_goal || ""}
        leadId={submittedLeadId}
        open={isPopupOpen}
        phoneNumber={
          runtimeConfig.payPerCallPhoneNumber ||
          phoneHref.replace(/^tel:/, "")
        }
        ringbaCampaignId={runtimeConfig.ringbaCampaignId}
        ringbaTags={{
          funnel_id: funnelId,
          lead_id: submittedLeadId,
          iul_v4_age_group: age_group || "",
          iul_v4_insurance_goal: insurance_goal || "",
          sub1,
          sub2: everflowTransactionId,
          everflow_transaction_id: everflowTransactionId,
          ...(popupPreviewEnabled ? { preview: "1" } : {}),
        }}
      />

      <header className="funnel-header">
        <div className="funnel-bar-inner">
          <Link
            className="funnel-logo"
            href="/n1"
            aria-label="Cuentas de Retiro"
          >
            <Image
              alt=""
              className="funnel-logo-image"
              priority
              src={retirementLogo}
            />
          </Link>
        </div>
      </header>

      <div className="funnel-shell">
        <section className="funnel-content">
          <div className="hero-lockup">
            <div className="hero-copy-block">
              <p className="hero-kicker">Planifica con más claridad</p>
              <h1>
                Cuidamos de ti
                <span> y tu familia</span>
              </h1>
            </div>
          </div>

          <div className="prompt-banner">
            <span className="prompt-copy">
              <span>Potencial Pago Cash Value</span>
              <strong>Sujeto a evaluación final</strong>
            </span>
            <span className="price-odometer" aria-hidden="true">
              <span className="currency">$</span>
              <span className="odometer-digits">
                {slotReels.map((reel, index) => (
                  <span
                    className="odometer-group"
                    key={`${odometerRun}-${index}`}
                  >
                    <span className="odometer-column">
                      <span className="odometer-reel" style={odometerStyle}>
                        {reel.map((reelDigit, reelIndex) => (
                          <span key={reelIndex}>{reelDigit}</span>
                        ))}
                      </span>
                    </span>
                    {index === 2 ? (
                      <span className="odometer-separator">,</span>
                    ) : null}
                  </span>
                ))}
              </span>
            </span>
          </div>

          <section
            className={`question-card step-${currentStep}-card`}
            aria-labelledby={`step-${currentStep}-title`}
          >
            <div className="question-heading">
              <p>
                Paso {visibleCurrentStep} de {visibleStepCount}
              </p>
            </div>

            <div className="question-stage">
              <div
                className={`question-step-content${
                  currentStep > 1 && currentStep !== 3
                    ? " entering-from-right"
                    : ""
                }`}
                key={currentStep}
              >
                {currentStep === 1 ? (
                  <>
                    <h2 id="step-1-title">
                      ¿Cuál es tu principal objetivo para el retiro?
                    </h2>
                    <div className="answer-list">
                      {retirementGoals.map((goal) => (
                        <button
                          className={
                            insurance_goal === goal.value ? "selected" : ""
                          }
                          key={goal.id}
                          onClick={() => selectGoal(goal)}
                          type="button"
                        >
                          <span>{goal.label}</span>
                          <span aria-hidden="true">›</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <h2 id="step-2-title">¿Cuál es tu rango de edad?</h2>
                    <div className="answer-list age-answer-list">
                      {ageRanges.map((ageRange) => (
                        <button
                          className={
                            age_group === ageRange.id ? "selected" : ""
                          }
                          key={ageRange.id}
                          onClick={() => selectAge(ageRange)}
                          type="button"
                        >
                          <span>{ageRange.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <h2 id="step-3-title">¿Cuál es tu ZIP code?</h2>
                    <form className="zip-form" onSubmit={submitZipCode}>
                      <label className="sr-only" htmlFor="zip-code">
                        ZIP code de Estados Unidos
                      </label>
                      <input
                        aria-describedby={zipError ? "zip-error" : undefined}
                        aria-invalid={Boolean(zipError)}
                        autoComplete="postal-code"
                        defaultValue={zipCode}
                        id="zip-code"
                        inputMode="numeric"
                        maxLength={5}
                        name="zipCode"
                        onInput={(event) => {
                          const input = event.currentTarget;
                          input.value = input.value
                            .replace(/\D/g, "")
                            .slice(0, 5);

                          if (zipError) setZipError("");
                          if (zipSubmitted) setZipSubmitted(false);
                        }}
                        pattern="[0-9]{5}"
                        placeholder="Ej. 33101"
                        type="text"
                      />
                      <button type="submit">Continuar</button>
                      <p
                        className={zipError ? "zip-feedback error" : "zip-feedback"}
                        id="zip-error"
                        role={zipError ? "alert" : undefined}
                      >
                        {zipError ||
                          (zipSubmitted ? "ZIP code guardado correctamente." : "")}
                      </p>
                    </form>
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <h2 id="step-4-title">¿Cuál es tu nombre?</h2>
                    <form className="name-form" onSubmit={submitName}>
                      <label className="sr-only" htmlFor="first-name">
                        Nombre
                      </label>
                      <input
                        aria-describedby={
                          nameError ? "name-error" : undefined
                        }
                        aria-invalid={Boolean(nameError)}
                        autoComplete="given-name"
                        id="first-name"
                        maxLength={40}
                        onChange={(event) =>
                          updateName("firstName", event.target.value)
                        }
                        placeholder="Nombre"
                        type="text"
                        value={firstName}
                      />
                      <label className="sr-only" htmlFor="last-name">
                        Apellido
                      </label>
                      <input
                        aria-describedby={
                          nameError ? "name-error" : undefined
                        }
                        aria-invalid={Boolean(nameError)}
                        autoComplete="family-name"
                        id="last-name"
                        maxLength={40}
                        onChange={(event) =>
                          updateName("lastName", event.target.value)
                        }
                        placeholder="Apellido"
                        type="text"
                        value={lastName}
                      />
                      <button type="submit">Continuar</button>
                      <p
                        className={
                          nameError ? "form-feedback error" : "form-feedback"
                        }
                        id="name-error"
                        role={nameError ? "alert" : undefined}
                      >
                        {nameError ||
                          (nameSubmitted
                            ? "Nombre guardado correctamente."
                            : "")}
                      </p>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 id="step-5-title">¿Cómo podemos contactarte?</h2>
                    <form
                      className="contact-form"
                      data-tf-element-role="offer"
                      onSubmit={submitContact}
                    >
                      <input type="hidden" name={trustedFormFieldName} />
                      <label className="sr-only" htmlFor="phone-number">
                        Número de teléfono de Estados Unidos
                      </label>
                      <div
                        className={`phone-input-wrap validation-${phoneValidationStatus}${
                          phoneValidationStatus === "invalid" ? " invalid" : ""
                        }`}
                      >
                        <span aria-hidden="true" className="phone-country-code">
                          +1
                        </span>
                        <input
                          aria-describedby={
                            contactError ? "contact-error" : undefined
                          }
                          aria-invalid={phoneValidationStatus === "invalid"}
                          autoComplete="tel-national"
                          id="phone-number"
                          inputMode="tel"
                          maxLength={14}
                          onBlur={() => {
                            if (
                              phoneNumber.length > 0 &&
                              phoneNumber.length < 10
                            ) {
                              setPhoneValidationStatus("invalid");
                            }
                          }}
                          onChange={(event) =>
                            updatePhoneNumber(event.target.value)
                          }
                          placeholder="(202) 555-0147"
                          type="tel"
                          value={formatUsPhoneNumber(phoneNumber)}
                        />
                        <ValidationIndicator status={phoneValidationStatus} />
                      </div>
                      <label className="sr-only" htmlFor="email">
                        Email
                      </label>
                      <div
                        className={`email-input-wrap validation-${emailValidationStatus}${
                          emailValidationStatus === "invalid" ? " invalid" : ""
                        }`}
                      >
                        <input
                          aria-describedby={
                            contactError ? "contact-error" : undefined
                          }
                          aria-invalid={emailValidationStatus === "invalid"}
                          autoComplete="email"
                          id="email"
                          maxLength={254}
                          onChange={(event) => updateEmail(event.target.value)}
                          placeholder="nombre@dominio.com"
                          type="email"
                          value={email}
                        />
                        <ValidationIndicator status={emailValidationStatus} />
                      </div>
                      <button
                        data-tf-element-role="submit"
                        disabled={isSubmittingLead || contactSubmitted}
                        type="submit"
                      >
                        {isSubmittingLead ? "Guardando..." : "Continuar"}
                      </button>
                      <p
                        className={
                          contactValidationMessage
                            ? "form-feedback error"
                            : "form-feedback"
                        }
                        id="contact-error"
                        role={contactValidationMessage ? "alert" : undefined}
                      >
                        {contactValidationMessage ||
                          (contactSubmitted
                            ? "Información guardada correctamente."
                            : "")}
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>

            <div
              className="progress-dots"
              aria-label={`Paso ${visibleCurrentStep} de ${visibleStepCount}`}
            >
              {Array.from({ length: visibleStepCount }, (_, index) => (
                <span
                  className={index === visibleCurrentStep - 1 ? "active" : ""}
                  key={index}
                />
              ))}
            </div>
          </section>

          {currentStep === 5 ? (
            <p
              className="tcpa-consent tcpa-consent-outside"
              data-tf-element-role="consent-language"
            >
              Al hacer clic en <strong>“Continuar”</strong>, doy mi
              consentimiento expreso por escrito y mi firma electrónica para
              que <strong>Sunnel LLC</strong> (better-life), sus socios de
              mercadeo, aseguradoras licenciadas y quienes actúen en su nombre
              me contacten al teléfono y correo proporcionados, incluso si
              figuran en una lista “No Llamar”, para ofrecer seguros de vida,
              IUL, gastos finales y productos financieros relacionados. Las
              comunicaciones pueden utilizar marcación automática, marcadores
              predictivos, voz pregrabada o artificial, IA y SMS automatizados.
              Pueden aplicar tarifas de mensajes y datos. Este consentimiento
              no es condición de compra y puede revocarse en cualquier momento.
              He leído y acepto la{" "}
              <Link href="/privacidad">Política de Privacidad</Link> y los{" "}
              <Link href="/terminos">Términos de Uso</Link>.
            </p>
          ) : (
            <>
              <aside className="trust-panel">
                <h2>Más que solo un seguro aislado</h2>
                <ul>
                  <li>Protege a tu familia con hasta $350,000</li>
                  <li>Asegura tu casa con Mortgage Protection</li>
                  <li>Haz crecer tus ahorros para tu jubilación</li>
                  <li>Disfruta de tu seguro en vida con tu familia</li>
                </ul>
              </aside>

              <p className="funnel-disclaimer">
                CuentasDeRetiro.com ofrece información educativa general y
                resultados simulados a tasas fijas en escenarios optimistas
                para ilustrar el potencial de crecimiento con un seguro de tipo
                IUL. No somos una agencia gubernamental, institución financiera,
                fiduciario ni asesor de inversiones. Para tener costos y
                beneficios reales es necesario consultar con un agente
                licenciado y autorizado por el estado.
              </p>
            </>
          )}
        </section>

      </div>

    </main>
  );
}
