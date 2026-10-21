import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Fetch all vehicles from the Vehica API
    const apiUrl = 'https://koosandmike.co.za/wp-json/vehica/v1/cars?per_page=300';
    const response = await fetch(apiUrl);
    const data = await response.json();
    const cars = data.results || [];

    const getAttr = (car, name) => {
      const attr = car.attributes?.find(a => a.name === name);
      if (!attr) return null;
      if (attr.type === 'taxonomy') return attr.displayValue?.[0]?.name || null;
      if (attr.type === 'price') return Object.values(attr.value || {})[0] || null;
      if (attr.type === 'number') return attr.value || null;
      if (attr.type === 'gallery') return attr.images || [];
      return attr.value || null;
    };

    const vehicles = cars.map(car => {
      const images = getAttr(car, 'Gallery');
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0].url : null;
      const fullTitle = car.name || '';
      const year = getAttr(car, 'Year');
      const make = getAttr(car, 'Make');
      const mileage = getAttr(car, 'Mileage');
      const price = getAttr(car, 'Price');
      const transmission = getAttr(car, 'Transmission');

      // Extract model from title (remove make prefix)
      let model = fullTitle;
      if (make && fullTitle.toUpperCase().startsWith(make.toUpperCase())) {
        model = fullTitle.substring(make.length).trim();
      }

      return {
        title: `${year || ''} | ${make || ''} | ${model} | ${mileage ? mileage.toLocaleString() + ' km' : ''}`.trim(),
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
    });

    // Clear existing vehicles and bulk insert
    const existing = await base44.asServiceRole.entities.Vehicle.list('', 500);
    for (const v of existing) {
      await base44.asServiceRole.entities.Vehicle.delete(v.id);
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < vehicles.length; i += 50) {
      const batch = vehicles.slice(i, i + 50);
      await base44.asServiceRole.entities.Vehicle.bulkCreate(batch);
      inserted += batch.length;
    }

    return Response.json({ success: true, total: cars.length, inserted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});