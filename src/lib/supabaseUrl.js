// Supabase project URL and the public asset base, read from the build
// environment so the project URL is never hardcoded in the repository.
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";

export const SUPABASE_URL = rawUrl.replace(/\/+$/, "");
export const PUBLIC_ASSETS = `${SUPABASE_URL}/storage/v1/object/public/app-assets`;
