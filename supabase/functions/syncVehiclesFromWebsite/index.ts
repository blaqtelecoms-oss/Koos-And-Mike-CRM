import { db, json, serve } from "../_shared/supabase.ts";

const API_URL = "https://koosandmike.co.za/wp-json/vehica/v1/cars?per_page=300";

type Car = {
  slug: string;
  name?: string;
  attributes?: Array<{ name: string; type: string; value?: unknown; displayValue?: Array<{ name: string }>; images?: Array<{ url: string }> }>;
};

const getAttr = (car: Car, name: string): any => {
  const attr = car.attributes?.find((a) => a.name === name);
  if (!attr) return null;
  if (attr.type === "taxonomy") return attr.displayValue?.[0]?.name ?? null;
  if (attr.type === "price") return Object.values((attr.value as Record<string, unknown>) ?? {})[0] ?? null;
  if (attr.type === "number") return attr.value ?? null;
  if (attr.type === "gallery") return attr.images ?? [];
  return attr.value ?? null;
};

const toVehicle = (car: Car) => {
  const images = getAttr(car, "Gallery");
  const firstImage = Array.isArray(images) && images.length > 0 ? images[0].url : null;
  const year = getAttr(car, "Year");
  const make = getAttr(car, "Make");
  const mileage = getAttr(car, "Mileage");
  const price = getAttr(car, "Price");

  let model = car.name || "";
  if (make && model.toUpperCase().startsWith(String(make).toUpperCase())) {
    model = model.substring(String(make).length).trim();
  }

  return {
    title: `${year || ""} | ${make || ""} | ${model} | ${mileage ? Number(mileage).toLocaleString() + " km" : ""}`.trim(),
    make: make || "",
    model,
    year: year ? Number(year) : null,
    mileage: mileage ? Number(mileage) : null,
    price: price ? Number(price) : null,
    status: "Available",
    images: firstImage ? [firstImage] : [],
    uploaded_to_website: true,
    finance_available: true,
    website_slug: car.slug,
  };
};

serve(async () => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    const liveCars: Car[] = data.results || [];

    const liveMap: Record<string, ReturnType<typeof toVehicle>> = {};
    for (const car of liveCars) liveMap[car.slug] = toVehicle(car);

    const client = db();
    const { data: dbVehicles, error } = await client.from("vehicles").select("id, website_slug").limit(1000);
    if (error) throw error;

    let removed = 0;
    let added = 0;
    let skipped = 0;
    const knownSlugs = new Set<string>();

    for (const dbV of dbVehicles ?? []) {
      if (!dbV.website_slug) continue;
      knownSlugs.add(dbV.website_slug);
      if (!liveMap[dbV.website_slug]) {
        await client.from("vehicles").update({ status: "Sold" }).eq("id", dbV.id);
        removed++;
      }
    }

    for (const [slug, vehicle] of Object.entries(liveMap)) {
      if (!knownSlugs.has(slug)) {
        const { error: insertError } = await client.from("vehicles").insert(vehicle);
        if (insertError) throw insertError;
        added++;
      } else {
        skipped++;
      }
    }

    return json({ success: true, live: liveCars.length, added, removed, skipped });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
