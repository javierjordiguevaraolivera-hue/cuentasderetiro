export function buildApplicationNumber(seed?: string | null) {
  const value = String(seed || "").trim();

  if (!value) return "IUL-3520";

  const hash = Array.from(value).reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) % 9000,
    0,
  );

  return `IUL-${String(1000 + hash).padStart(4, "0")}`;
}
