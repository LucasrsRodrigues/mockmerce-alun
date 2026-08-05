// Cliente da API do backend. Usa o proxy /api (ver vite.config) e o token de aluno.

const TOKEN_KEY = 'lojafiap.token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 401 && !path.startsWith('/store/auth/login')) {
    setToken(null);
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as any).error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText);
  }
  return json as T;
}

const qs = (params: Record<string, unknown>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
  return s ? `?${s}` : '';
};

export const api = {
  auth: {
    login: (rm: string, password: string) => request<{ token: string; student: Student; mustChangePassword: boolean }>('POST', '/store/auth/login', { rm, password }),
    me: () => request<Student>('GET', '/store/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) => request<{ ok: boolean }>('POST', '/store/auth/change-password', { currentPassword, newPassword }),
    // Aluno sem loja cria a sua: retorna um TOKEN novo (já com o grupo) + a API key (1x).
    createStore: (name: string) => request<{ token: string; groupId: string; name: string; apiKey: string }>('POST', '/store/groups', { name }),
  },
  products: {
    list: (p: Record<string, unknown> = {}) => request<Paginated<ProductSummary>>('GET', `/products${qs(p)}`),
    get: (id: string) => request<Product>('GET', `/products/${id}`),
    create: (data: unknown) => request<Product>('POST', '/products', data),
    update: (id: string, data: unknown) => request<Product>('PUT', `/products/${id}`, data),
    updateVariant: (variantId: string, data: { price?: number; minStock?: number; active?: boolean }) => request<ProductVariant>('PATCH', `/variants/${variantId}`, data),
    remove: (id: string) => request<void>('DELETE', `/products/${id}`),
    addImage: (id: string, data: { url: string; variantId?: string }) => request('POST', `/products/${id}/images`, data),
  },
  categories: { list: () => request<NamedRef[]>('GET', '/categories'), create: (name: string) => request('POST', '/categories', { name }) },
  brands: { list: () => request<NamedRef[]>('GET', '/brands'), create: (name: string) => request('POST', '/brands', { name }) },
  collections: { list: () => request<NamedRef[]>('GET', '/collections'), create: (name: string) => request('POST', '/collections', { name }) },
  inventory: {
    stock: (variantId: string) => request<StockView>('GET', `/variants/${variantId}/stock`),
    receive: (variantId: string, quantity: number, reason?: string) => request<StockView>('POST', `/variants/${variantId}/stock/receive`, { quantity, reason }),
    adjust: (variantId: string, onHand: number, reason?: string) => request<StockView>('POST', `/variants/${variantId}/stock/adjust`, { onHand, reason }),
    movements: (variantId: string) => request<{ data: Movement[] }>('GET', `/variants/${variantId}/stock/movements`),
  },
  orders: {
    list: (p: Record<string, unknown> = {}) => request<Paginated<StoreOrderRow>>('GET', `/store/orders${qs(p)}`),
    get: (id: string) => request<StoreOrder>('GET', `/store/orders/${id}`),
    transition: (id: string, to: string) => request('POST', `/store/orders/${id}/transition`, { to }),
    refund: (id: string) => request('POST', `/store/orders/${id}/refund`),
    addComment: (id: string, body: string) => request('POST', `/store/orders/${id}/comments`, { body }),
    invoice: (id: string) => request<{ number: number; xml: string }>('GET', `/orders/${id}/invoice`),
  },
  webhooks: {
    list: () => request<WebhookEndpoint[]>('GET', '/webhooks'),
    create: (data: { url: string; events?: string[]; description?: string }) => request<WebhookEndpoint & { signingSecret: string }>('POST', '/webhooks', data),
    remove: (id: string) => request<void>('DELETE', `/webhooks/${id}`),
    ping: (id: string) => request('POST', `/webhooks/${id}/ping`),
    events: () => request<{ events: string[] }>('GET', '/webhooks/events'),
    deliveries: () => request<{ data: any[] }>('GET', '/webhooks/deliveries'),
  },
  settings: {
    get: () => request<StoreSettings>('GET', '/store/settings'),
    update: (data: Partial<StoreSettings>) => request<StoreSettings>('PUT', '/store/settings', data),
  },
  members: {
    list: () => request<Member[]>('GET', '/store/members'),
    add: (rm: string, name: string) => request<{ rm: string; name: string }>('POST', '/store/members', { rm, name }),
    remove: (rm: string) => request<{ rm: string; removed: boolean }>('DELETE', `/store/members/${encodeURIComponent(rm)}`),
  },
  apiKeys: {
    list: () => request<ApiKeyRow[]>('GET', '/store/api-keys'),
    create: (name: string) => request<{ id: string; name: string; prefix: string; apiKey: string }>('POST', '/store/api-keys', { name }),
    revoke: (id: string) => request<{ id: string; revoked: boolean }>('DELETE', `/store/api-keys/${id}`),
  },
  teaching: {
    dashboard: () => request<TeachingDashboard>('GET', '/teaching/dashboard'),
    ranking: () => request<RankingRow[]>('GET', '/teaching/ranking'),
    submit: () => request<{ grade: number; missoesCumpridas: number }>('POST', '/teaching/submit'),
  },
  reports: { sales: () => request<any>('GET', '/reports/sales') },
};

// ---- Tipos ----
// groupId/group são null enquanto o aluno ainda não criou/entrou numa loja.
export interface Student { rm: string; name: string; groupId: string | null; group: string | null; mustChangePassword: boolean }
export interface Paginated<T> { data: T[]; page: number; pageSize: number; total: number }
export interface NamedRef { id: string; name: string; slug?: string }
export interface ProductVariant { id: string; sku: string; price: number; stock: number; minStock: number; isDefault: boolean; active: boolean; label: string | null; options: { option: string; value: string }[] }
export interface ProductSummary { id: string; name: string; type: 'SIMPLE' | 'VARIABLE'; state: string; brand: string | null; priceFrom: number; priceTo: number; stock: number; image: string | null; variantsCount: number }
export interface Product { id: string; name: string; slug: string; type: string; state: string; description: string; category: NamedRef | null; brand: NamedRef | null; tags: string[]; collections: NamedRef[]; variants: ProductVariant[]; images: { id: string; url: string }[] }
export interface StockView { variantId: string; sku: string; minStock: number; onHand: number; reserved: number; available: number; warehouses: { warehouse: string; onHand: number; reserved: number; available: number }[] }
export interface Movement { type: string; quantity: number; warehouse: string; reason: string | null; createdAt: string }
export interface StoreOrderRow { id: string; status: string; total: number; customer: { name: string; email: string }; createdAt: string }
export interface StoreOrder { id: string; status: string; total: number; customer: { id: string; name: string; email: string }; items: { productName: string; variantName: string | null; sku: string; quantity: number; unitPrice: number }[]; payment: { status: string; method: string } | null; timeline: { from: string | null; to: string; actor: string; rm: string | null; note: string | null; at: string }[]; internalComments: { rm: string | null; body: string; at: string }[] }
export interface WebhookEndpoint { id: string; url: string; description: string | null; events: string[]; active: boolean }
export interface ApiKeyRow { id: string; name: string; prefix: string; revoked: boolean; createdByRm: string | null; lastUsedAt: string | null; createdAt: string }
export interface StoreSettings {
  locale: string; currency: string; timezone: string;
  storeName: string | null; storeDescription: string | null; logoUrl: string | null;
  supportEmail: string | null; whatsapp: string | null; instagram: string | null;
  primaryColor: string | null; address: string | null; cnpj: string | null;
}
export interface Member { rm: string; name: string; jaAcessou: boolean; isYou: boolean; addedAt: string }
export interface TeachingDashboard {
  xp: number; nota: number;
  badges: { key: string; name: string; icon: string }[];
  xpPorAluno: { rm: string; nome: string; xp: number }[];
  missoes: { cumpridas: number; total: number; lista: { key: string; title: string; description: string; phase: string; points: number; cumprida: boolean; porRm: string | null }[] };
  proximosPassos: string[];
}
export interface RankingRow { posicao: number; grupo: string; xp: number }
