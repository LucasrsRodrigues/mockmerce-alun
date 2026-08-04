import { useState } from 'react';
import { toast } from 'sonner';
import { Boxes, PackagePlus, Pencil } from 'lucide-react';
import { api, type Product } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PAGE_SIZE = 20;

export default function Inventory() {
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.products.list({ page, pageSize: PAGE_SIZE }), [page]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Estoque" description="Entradas, ajustes e saldo por variante." />
      <Card>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Produto</TableHead><TableHead>Variantes</TableHead><TableHead>Disponível</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)}
            {data?.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.variantsCount}</Badge></TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelected(p.id)}><Boxes className="size-3.5" /> Gerenciar</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} disabled={loading} />
      </Card>
      {selected && <StockDialog productId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function StockDialog({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data, loading, setData } = useAsync<Product>(() => api.products.get(productId), [productId]);

  async function act(variantId: string, kind: 'receive' | 'adjust', value: number) {
    try {
      if (kind === 'receive') await api.inventory.receive(variantId, value, 'entrada manual');
      else await api.inventory.adjust(variantId, value, 'ajuste manual');
      toast.success(kind === 'receive' ? 'Entrada registrada.' : 'Estoque ajustado.');
      setData(await api.products.get(productId));
    } catch (e: any) {
      toast.error(e.message ?? 'Falha');
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{loading ? 'Carregando...' : `Estoque · ${data?.name}`}</DialogTitle></DialogHeader>
        {loading && <Skeleton className="h-32 w-full" />}
        <div className="space-y-3">
          {data?.variants.map((v) => <VariantStockRow key={v.id} label={v.label ? `${v.label} · ${v.sku}` : v.sku} available={v.stock} onReceive={(q) => act(v.id, 'receive', q)} onAdjust={(q) => act(v.id, 'adjust', q)} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantStockRow({ label, available, onReceive, onAdjust }: { label: string; available: number; onReceive: (q: number) => void; onAdjust: (q: number) => void }) {
  const [qty, setQty] = useState('');
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">Disponível: {available}</div>
      </div>
      <Input className="h-8 w-20" type="number" placeholder="Qtd" value={qty} onChange={(e) => setQty(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => { if (qty) onReceive(Number(qty)); setQty(''); }} title="Entrada (+)"><PackagePlus className="size-3.5" /></Button>
      <Button size="sm" variant="outline" onClick={() => { if (qty !== '') onAdjust(Number(qty)); setQty(''); }} title="Ajustar (define o total)"><Pencil className="size-3.5" /></Button>
    </div>
  );
}
