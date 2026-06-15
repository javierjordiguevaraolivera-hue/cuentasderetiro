export type GtmEventPayload = Record<
  string,
  boolean | number | string | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function createEventId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

export function getUtmParams(): GtmEventPayload {
  if (typeof window === "undefined") return {};

  const searchParams = new URLSearchParams(window.location.search);
  const result: GtmEventPayload = {};

  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
  ]) {
    const value = searchParams.get(key);
    if (value) result[key] = value;
  }

  return result;
}

export function pushGtmEvent(
  event: string,
  payload: GtmEventPayload = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}
