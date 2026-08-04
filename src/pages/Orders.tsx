import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, RotateCcw } from 'lucide-react';
import { api, type StoreOrder } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { money } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusBadge: Record<string, any> = { PENDING: 'warning', PAID: 'success', FULFILLED: 'default', SHIPPED: 'default', DELIVERED: 'success', CANCELLED: 'muted', REFUNDED: 'destructive' };
const NEXT: Record<string, string[]> = { PAID: ['FULFILLED', 'SHIPPED'], FULFILLED: ['SHIPPED'], SHIPPED: ['DELIVERED'] };

const PAGE_SIZE = 20;

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.orders.list({ page, pageSize: PAGE_SIZE }), [page]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Pedidos" description="Acompanhe, avance status e reembolse." />
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Data</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
            {!loading && data?.data.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Nenhum pedido ainda.</TableCell></TableRow>}
            {data?.data.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o.id)}>
                <TableCell className="font-mono text-xs">#{o.id.slice(-6)}</TableCell>
                <TableCell><div className="font-medium">{o.customer.name}</div><div className="text-xs text-muted-foreground">{o.customer.email}</div></TableCell>
                <TableCell><Badge variant={statusBadge[o.status]}>{o.status}</Badge></TableCell>
                <TableCell>{money(o.total)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} disabled={loading} />
      </Card>
      {selected && <OrderDialog id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function OrderDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading, setData } = useAsync<StoreOrder>(() => api.orders.get(id), [id]);
  const [comment, setComment] = useState('');
  const [invoice, setInvoice] = useState<number | null>(null);

  async function refresh() { setData(await api.orders.get(id)); }
  async function transition(to: string) { try { await api.orders.transition(id, to); toast.success(`→ ${to}`); refresh(); } catch (e: any) { toast.error(e.message); } }
  async function refund() { if (!confirm('Reembolsar este pedido? Reverte o estoque.')) return; try { await api.orders.refund(id); toast.success('Reembolsado.'); refresh(); } catch (e: any) { toast.error(e.message); } }
  async function addComment() { if (!comment.trim()) return; try { await api.orders.addComment(id, comment); setComment(''); toast.success('Comentário salvo.'); refresh(); } catch (e: any) { toast.error(e.message); } }
  async function genInvoice() { try { const inv = await api.orders.invoice(id); setInvoice(inv.number); toast.success(`NF-e nº ${inv.number}`); } catch (e: any) { toast.error(e.message); } }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{loading ? 'Carregando...' : <>Pedido #{data?.id.slice(-6)} <Badge variant={statusBadge[data!.status]} className="ml-2 align-middle">{data?.status}</Badge></>}</DialogTitle></DialogHeader>
        {loading && <Skeleton className="h-40 w-full" />}
        {data && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div><div className="font-medium">{data.customer.name}</div><div className="text-muted-foreground">{data.customer.email}</div></div>
              <div className="text-right"><div className="text-lg font-semibold">{money(data.total)}</div>{data.payment && <div className="text-muted-foreground">{data.payment.method} · {data.payment.status}</div>}</div>
            </div>

            <div className="rounded-lg border divide-y">
              {data.items.map((it, i) => (
                <div key={i} className="flex justify-between p-2"><span>{it.productName}{it.variantName && <span className="text-muted-foreground"> ({it.variantName})</span>} × {it.quantity}</span><span>{money(it.unitPrice * it.quantity)}</span></div>
              ))}
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              {(NEXT[data.status] ?? []).map((to) => <Button key={to} size="sm" variant="outline" onClick={() => transition(to)}>→ {to}</Button>)}
              {['PAID', 'FULFILLED', 'SHIPPED'].includes(data.status) && <Button size="sm" variant="outline" onClick={refund}><RotateCcw className="size-3.5" /> Reembolsar</Button>}
              <Button size="sm" variant="outline" onClick={genInvoice}><FileText className="size-3.5" /> NF-e {invoice ? `#${invoice}` : ''}</Button>
            </div>

            {/* Timeline */}
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Linha do tempo</div>
              <div className="space-y-1">
                {data.timeline.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs"><span className="size-1.5 rounded-full bg-primary" /><span className="font-medium">{e.to}</span><span className="text-muted-foreground">{e.actor}{e.rm ? ` · ${e.rm}` : ''} · {new Date(e.at).toLocaleString('pt-BR')}</span></div>
                ))}
              </div>
            </div>

            {/* Comentários internos */}
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Comentários internos (não visíveis ao cliente)</div>
              {data.internalComments.map((c, i) => <div key={i} className="rounded bg-muted/50 p-2 text-xs mb-1">{c.body} <span className="text-muted-foreground">· {c.rm ?? '—'}</span></div>)}
              <div className="flex gap-2 mt-1"><Input className="h-8" placeholder="Adicionar nota..." value={comment} onChange={(e) => setComment(e.target.value)} /><Button size="sm" onClick={addComment}>Salvar</Button></div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
