import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all live vehicles from the website API
    const apiUrl = 'https://koosandmike.co.za/wp-json/vehica/v1/cars?per_page=300';
    const response = await fetch(apiUrl);
    const data = await response.json();
    const liveCars = data.results || [];

    const getAttr = (car, name) => {
      const attr = car.attributes?.find(a => a.name === name);
      if (!attr) return null;
      if (attr.type === 'taxonomy') return attr.displayValue?.[0]?.name || null;
      if (attr.type === 'price') return Object.values(attr.value || {})[0] || null;
      if (attr.type === 'number') return attr.value || null;
      if (attr.type === 'gallery') return attr.images || [];
      return attr.value || null;
    };

    // Build map of live car slugs → data
    const liveMap = {};
    for (const car of liveCars) {
      const images = getAttr(car, 'Gallery');
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0].url : null;
      const year = getAttr(car, 'Year');
      const make = getAttr(car, 'Make');
      const mileage = getAttr(car, 'Mileage');
      const price = getAttr(car, 'Price');

      let model = car.name || '';
      if (make && model.toUpperCase().startsWith(make.toUpperCase())) {
        model = model.substring(make.length).trim();
      }

      liveMap[car.slug] = {
        title: `${year || ''} | ${make || ''} | ${model} | ${mileage ? Number(mileage).toLocaleString() + ' km' : ''}`.trim(),
        make: make || '',
        model: model,
        year: year ? Number(year) : null,
        mileage: mileage ? Number(mileage) : null,
        price: price ? Number(price) : null,
        status: 'Available',
        images: firstImage ? [firstImage] : [],
        uploaded_to_website: true,
        finance_available: true,
        website_slug: car.slug,
      };
    }

    // Get all vehicles currently in the database
    const dbVehicles = await base44.asServiceRole.entities.Vehicle.list('', 500);

    let removed = 0;
    let added = 0;
    let skipped = 0;

    // Remove vehicles no longer on the website (only those with uploaded_to_website=true)
    const dbSlugs = new Set();
    for (const dbV of dbVehicles) {
      if (dbV.website_slug) {
        dbSlugs.add(dbV.website_slug);
        if (!liveMap[dbV.website_slug]) {
          // No longer on website — mark as Sold
          await base44.asServiceRole.entities.Vehicle.update(dbV.id, { status: 'Sold' });
          removed++;
        }
      }
    }

    // Add new vehicles not yet in db
    for (const [slug, vehicleData] of Object.entries(liveMap)) {
      if (!dbSlugs.has(slug)) {
        await base44.asServiceRole.entities.Vehicle.create(vehicleData);
        added++;
      } else {
        skipped++;
      }
    }

    return Response.json({ success: true, live: liveCars.length, added, removed, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});