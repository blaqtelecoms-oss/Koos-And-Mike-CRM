import { db, json, requireUser, serve } from "../_shared/supabase.ts";

const API_URL = "https://koosandmike.co.za/wp-json/vehica/v1/cars?per_page=300";

const getAttr = (car: any, name: string): any => {
  const attr = car.attributes?.find((a: any) => a.name === name);
  if (!attr) return null;
  if (attr.type === "taxonomy") return attr.displayValue?.[0]?.name ?? null;
  if (attr.type === "price") return Object.values(attr.value ?? {})[0] ?? null;
  if (attr.type === "number") return attr.value ?? null;
  if (attr.type === "gallery") return attr.images ?? [];
  return attr.value ?? null;
};

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (user?.role !== "admin") return json({ error: "Admin only" }, 403);

    const response = await fetch(API_URL);
    const data = await response.json();
    const cars: any[] = data.results || [];

    const vehicles = cars.map((car) => {
      const images = getAttr(car, "Gallery");
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0].url : null;
      const fullTitle = car.name || "";
      const year = getAttr(car, "Year");
      const make = getAttr(car, "Make");
      const mileage = getAttr(car, "Mileage");
      const price = getAttr(car, "Price");

      let model = fullTitle;
      if (make && fullTitle.toUpperCase().startsWith(String(make).toUpperCase())) {
        model = fullTitle.substring(String(make).length).trim();
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
    });

    const client = db();
    const { error: deleteError } = await client.from("vehicles").delete().not("id", "is", null);
    if (deleteError) throw deleteError;

    let inserted = 0;
    for (let i = 0; i < vehicles.length; i += 50) {
      const batch = vehicles.slice(i, i + 50);
      const { error } = await client.from("vehicles").insert(batch);
      if (error) throw error;
      inserted += batch.length;
    }

    return json({ success: true, total: cars.length, inserted });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
