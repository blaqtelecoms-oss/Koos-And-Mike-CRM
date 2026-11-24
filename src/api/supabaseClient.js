import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Entity name -> Supabase table
const TABLES = {
  Lead: 'leads',
  Vehicle: 'vehicles',
  Consultant: 'consultants',
  Advert: 'adverts',
  CarRequest: 'car_requests',
  TradeIn: 'trade_ins',
  DailyTask: 'daily_tasks',
  LeadFollowUp: 'lead_follow_ups',
  SocialPost: 'social_posts',
  PushSubscription: 'push_subscriptions',
  User: 'profiles',
};

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Base44-style sort string: "-created_date" (desc), "created_date" (asc), "" (none)
const withOrder = (query, sort) => {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  return query.order(desc ? sort.slice(1) : sort, { ascending: !desc });
};

const hasSession = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

const entity = (table) => ({
  async list(sort, limit = 100, skip = 0) {
    const rows = unwrap(await withOrder(supabase.from(table).select('*'), sort).range(skip, skip + limit - 1));
    return rows || [];
  },
  // Fetches every row, paging past Supabase's 1000-row response cap
  async listAll(sort) {
    const pageSize = 1000;
    let rows = [];
    for (let skip = 0; ; skip += pageSize) {
      const page = unwrap(await withOrder(supabase.from(table).select('*'), sort).range(skip, skip + pageSize - 1));
      rows = rows.concat(page || []);
      if (!page || page.length < pageSize) break;
    }
    return rows;
  },
  async count(query = {}) {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined) continue;
      q = q.eq(key, value);
    }
    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  },
  async filter(query = {}, sort, limit = 100, skip = 0) {
    let q = supabase.from(table).select('*');
    for (const [key, value] of Object.entries(query || {})) {
      if (value === undefined) continue;
      q = q.eq(key, value);
    }
    const rows = unwrap(await withOrder(q, sort).range(skip, skip + limit - 1));
    return rows || [];
  },
  async get(id) {
    const rows = unwrap(await supabase.from(table).select('*').eq('id', id).limit(1));
    if (!rows || rows.length === 0) throw new Error(`${table} record not found`);
    return rows[0];
  },
  async create(data) {
    if (await hasSession()) {
      return unwrap(await supabase.from(table).insert(data).select().single());
    }
    // Anonymous visitors (public forms) can insert but cannot read the row back
    const res = await supabase.from(table).insert(data);
    if (res.error) throw res.error;
    return { ...data };
  },
  async bulkCreate(rows) {
    if (await hasSession()) {
      return unwrap(await supabase.from(table).insert(rows).select());
    }
    const res = await supabase.from(table).insert(rows);
    if (res.error) throw res.error;
    return rows;
  },
  async update(id, data) {
    return unwrap(await supabase.from(table).update(data).eq('id', id).select().single());
  },
  async delete(id) {
    unwrap(await supabase.from(table).delete().eq('id', id));
    return { id };
  },
  subscribe(callback) {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) =>
        callback({ type: payload.eventType, data: payload.new || payload.old })
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
});

const entities = Object.fromEntries(Object.keys(TABLES).map((name) => [name, entity(TABLES[name])]));

const profileToUser = async (authUser) => {
  if (!authUser) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  return {
    id: authUser.id,
    email: authUser.email,
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
    role: profile?.role || 'user',
    created_date: profile?.created_date || authUser.created_at,
  };
};

const auth = {
  async me() {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      throw Object.assign(new Error('Authentication required'), { status: 401 });
    }
    return profileToUser(data.user);
  },
  async isAuthenticated() {
    return hasSession();
  },
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async logout(target) {
    await supabase.auth.signOut();
    if (typeof target === 'string' && target) window.location.href = target;
  },
  redirectToLogin(target) {
    const path = target && target !== '/' ? `/Login?redirect=${encodeURIComponent(target)}` : '/Login';
    window.location.href = path;
  },
  profileToUser,
};

const functions = {
  async invoke(name, body) {
    const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} });
    if (error) {
      let message = error.message || `Function ${name} failed`;
      try {
        const payload = await error.context?.json?.();
        if (payload?.error) message = payload.error;
      } catch {
        // response body was not JSON — keep the transport message
      }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);
    return { data };
  },
};

const BUCKETS = { vehicles: 'vehicle-images', adverts: 'advert-images', tradeIns: 'trade-in-images' };

const integrations = {
  Core: {
    async UploadFile({ file, bucket = BUCKETS.vehicles }) {
      const extension = (file.name?.split('.').pop() || 'bin').toLowerCase();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
    async SendEmail({ to, subject, body }) {
      const { data } = await functions.invoke('sendEmail', { to, subject, html: body });
      return data;
    },
  },
};

export const api = { entities, auth, functions, integrations };
export { BUCKETS };
