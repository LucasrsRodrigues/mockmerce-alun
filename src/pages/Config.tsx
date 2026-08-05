import { useState } from 'react';
import { toast } from 'sonner';
import { Webhook, Trash2, Send, Plus, KeyRound, Copy, Loader2 } from 'lucide-react';
import { api, type ApiKeyRow } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Config() {
  return (
    <div>
      <PageHeader title="Configurações" description="Chaves de API e webhooks (para integrar o app do grupo)." />
      <div className="space-y-6">
        <ApiKeyCard />
        <WebhooksCard />
      </div>
    </div>
  );
}

function ApiKeyCard() {
  const { data, loading, reload } = useAsync(() => api.apiKeys.list(), []);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; apiKey: string } | null>(null);

  async function create() {
    const n = name.trim();
    if (!n) return toast.error('Dê um nome para a chave (ex.: App iOS).');
    setCreating(true);
    try {
      const res = await api.apiKeys.create(n);
      setNewKey({ name: res.name, apiKey: res.apiKey });
      setName('');
      toast.success('Chave criada. Copie e guarde agora!');
      reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao criar chave');
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string, keyName: string) {
    if (!confirm(`Revogar a chave "${keyName}"? Qualquer app usando ela deixará de autenticar imediatamente.`)) return;
    try {
      await api.apiKeys.revoke(id);
      toast.success('Chave revogada.');
      reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao revogar');
    }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); toast.success('Chave copiada!'); }
    catch { toast.error('Não foi possível copiar.'); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><KeyRound className="size-4" /> Chaves de API</CardTitle>
        <CardDescription>Crie uma chave por app e use no header <code className="rounded bg-muted px-1 py-0.5 text-xs">X-API-Key</code> para autenticar na API. A chave completa só aparece uma vez.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Nome da chave (ex.: App iOS)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
          <Button onClick={create} disabled={creating}>{creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Criar chave</Button>
        </div>

        {newKey && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="mb-1 text-xs font-medium text-primary">Chave "{newKey.name}" criada (mostrada só uma vez — copie agora):</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all text-sm">{newKey.apiKey}</code>
              <Button size="icon" variant="ghost" onClick={() => copy(newKey.apiKey)} title="Copiar"><Copy className="size-4" /></Button>
            </div>
          </div>
        )}

        {loading && <Skeleton className="h-16 w-full" />}
        <div className="space-y-2">
          {data?.map((k) => <ApiKeyRowItem key={k.id} k={k} onRevoke={() => revoke(k.id, k.name)} />)}
          {!loading && data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma chave ainda. Crie a primeira para o seu app.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiKeyRowItem({ k, onRevoke }: { k: ApiKeyRow; onRevoke: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{k.name}</span>
          {k.isPrimary && <Badge variant="muted">principal</Badge>}
          {k.revoked && <Badge variant="muted">revogada</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <code>{k.prefix}{'•'.repeat(18)}</code>
          <span>{k.lastUsedAt ? `último uso ${new Date(k.lastUsedAt).toLocaleDateString('pt-BR')}` : 'nunca usada'}</span>
          {k.createdByRm && <span>por {k.createdByRm}</span>}
        </div>
      </div>
      {!k.revoked && !k.isPrimary && <Button size="icon" variant="ghost" onClick={onRevoke} title="Revogar"><Trash2 className="size-4" /></Button>}
    </div>
  );
}

function WebhooksCard() {
  const { data, loading, reload } = useAsync(() => api.webhooks.list(), []);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState<string | null>(null);

  async function create() {
    if (!url.trim()) return;
    try {
      const wh = await api.webhooks.create({ url, events: ['*'] });
      setSecret(wh.signingSecret);
      setUrl('');
      toast.success('Webhook criado. Guarde o secret!');
      reload();
    } catch (e: any) { toast.error(e.message); }
  }
  async function ping(id: string) { try { await api.webhooks.ping(id); toast.success('Ping enviado.'); } catch (e: any) { toast.error(e.message); } }
  async function remove(id: string) { try { await api.webhooks.remove(id); toast.success('Removido.'); reload(); } catch (e: any) { toast.error(e.message); } }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Webhook className="size-4" /> Webhooks</CardTitle><CardDescription>Receba eventos (order.paid, etc.) no seu app/servidor.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="https://seu-app.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={create}><Plus className="size-4" /></Button>
        </div>
        {secret && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <div className="font-medium text-primary mb-1">Signing secret (mostrado só uma vez):</div>
            <code className="break-all">{secret}</code>
          </div>
        )}
        {loading && <Skeleton className="h-16 w-full" />}
        <div className="space-y-2">
          {data?.map((w) => (
            <div key={w.id} className="flex items-center gap-2 rounded-lg border p-2">
              <div className="flex-1 min-w-0"><div className="truncate text-sm">{w.url}</div><div className="text-xs text-muted-foreground">{w.events.join(', ')}</div></div>
              <Badge variant={w.active ? 'success' : 'muted'}>{w.active ? 'ativo' : 'inativo'}</Badge>
              <Button size="icon" variant="ghost" onClick={() => ping(w.id)} title="Ping"><Send className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(w.id)} title="Remover"><Trash2 className="size-4" /></Button>
            </div>
          ))}
          {!loading && data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum webhook ainda.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
