import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Package, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { money } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ProductFormDialog } from '@/components/ProductFormDialog';

const PAGE_SIZE = 20;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const stateBadge: Record<string, { label: string; variant: any }> = {
  PUBLISHED: { label: 'Publicado', variant: 'success' },
  DRAFT: { label: 'Rascunho', variant: 'warning' },
  HIDDEN: { label: 'Oculto', variant: 'muted' },
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data, loading, reload } = useAsync(() => api.products.list({ search, page, pageSize: PAGE_SIZE }), [search, page]);

  // Se a página atual ficar vazia (ex.: removeu o último item dela), volta uma.
  useEffect(() => {
    if (!loading && data && data.data.length === 0 && page > 1) setPage((p) => p - 1);
  }, [loading, data, page]);

  function onSearch(v: string) { setSearch(v); setPage(1); }
  function openCreate() { setEditingId(null); setDialogOpen(true); }
  function openEdit(id: string) { setEditingId(id); setDialogOpen(true); }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    try {
      await api.products.remove(id);
      toast.success('Produto removido.');
      reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao remover');
    }
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Cadastre e gerencie o catálogo que alimenta o app."
        action={<Button onClick={openCreate}><Plus className="size-4" /> Novo produto</Button>}
      />

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar produtos..." value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
            ))}
            {!loading && data?.data.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 size-8 opacity-40" />Nenhum produto ainda. Crie o primeiro!
              </TableCell></TableRow>
            )}
            {data?.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : <Package className="size-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{p.type === 'VARIABLE' ? `${p.variantsCount} variantes` : 'Simples'}</Badge></TableCell>
                <TableCell><Badge variant={stateBadge[p.state]?.variant}>{stateBadge[p.state]?.label ?? p.state}</Badge></TableCell>
                <TableCell>{p.priceFrom === p.priceTo ? money(p.priceFrom) : `${money(p.priceFrom)} – ${money(p.priceTo)}`}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p.id)} title="Editar"><Pencil className="size-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id, p.name)} title="Remover"><Trash2 className="size-4 text-muted-foreground" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} disabled={loading} />
      </Card>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingId(null); }}
        onSaved={reload}
        editingId={editingId}
      />
    </div>
  );
}
