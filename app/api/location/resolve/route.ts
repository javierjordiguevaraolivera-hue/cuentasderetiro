import { lookupUsPostalCode } from "../../../lib/us-location";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const zipCode =
    typeof body === "object" &&
    body !== null &&
    "zipCode" in body &&
    typeof body.zipCode === "string"
      ? body.zipCode.trim()
      : "";

  const location = await lookupUsPostalCode(zipCode);

  if (!location) {
    return Response.json(
      { error: "ZIP code not found in the United States." },
      { status: 422 },
    );
  }

  return Response.json(location);
}
