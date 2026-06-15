import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextSearchParams = new URLSearchParams();

  for (const [name, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => nextSearchParams.append(name, entry));
    } else if (value !== undefined) {
      nextSearchParams.set(name, value);
    }
  }

  const query = nextSearchParams.toString();
  redirect(query ? `/iul-v4?${query}` : "/iul-v4");
}
