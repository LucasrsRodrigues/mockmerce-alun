import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, type NamedRef } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OptionInput { name: string; valuesText: string }
interface VariantRow { id?: string; combo: Record<string, string>; sku: string; price: string; stock: string }

function cartesian(opts: { name: string; values: string[] }[]): Record<string, string>[] {
  if (!opts.length || opts.some((o) => o.values.length === 0)) return [];
  return opts.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((c) => opt.values.map((v) => ({ ...c, [opt.name]: v }))),
    [{}],
  );
}

export function ProductFormDialog({ open, onOpenChange, onSaved, editingId }: { open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void; editingId?: string | null }) {
  const isEdit = !!editingId;
  const [type, setType] = useState<'SIMPLE' | 'VARIABLE'>('SIMPLE');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState('PUBLISHED');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categories, setCategories] = useState<NamedRef[]>([]);
  const [brands, setBrands] = useState<NamedRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // SIMPLE
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [simpleVariantId, setSimpleVariantId] = useState<string | null>(null);
  // VARIABLE
  const [options, setOptions] = useState<OptionInput[]>([{ name: 'Cor', valuesText: '' }]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  // Preços originais (por variantId) para só enviar o que mudou na edição.
  const [origPrices, setOrigPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    api.categories.list().then(setCategories).catch(() => {});
    api.brands.list().then(setBrands).catch(() => {});
  }, [open]);

  // Carrega o produto ao abrir em modo edição.
  useEffect(() => {
    if (!open || !editingId) return;
    setLoadingProduct(true);
    api.products.get(editingId).then((p) => {
      setType(p.type === 'VARIABLE' ? 'VARIABLE' : 'SIMPLE');
      setName(p.name);
      setDescription(p.description ?? '');
      setState(p.state);
      setCategoryId(p.category?.id ?? '');
      setBrandId(p.brand?.id ?? '');
      const prices: Record<string, string> = {};
      if (p.type === 'VARIABLE') {
        const optionNames = Array.from(new Set(p.variants.flatMap((v) => v.options.map((o) => o.option))));
        setOptions(optionNames.map((n) => ({
          name: n,
          valuesText: Array.from(new Set(p.variants.flatMap((v) => v.options.filter((o) => o.option === n).map((o) => o.value)))).join(', '),
        })));
        setVariants(p.variants.map((v) => {
          prices[v.id] = String(v.price);
          return { id: v.id, combo: Object.fromEntries(v.options.map((o) => [o.option, o.value])), sku: v.sku, price: String(v.price), stock: String(v.stock) };
        }));
      } else {
        const v = p.variants.find((x) => x.isDefault) ?? p.variants[0];
        if (v) { setSimpleVariantId(v.id); setSku(v.sku); setPrice(String(v.price)); setStock(String(v.stock)); prices[v.id] = String(v.price); }
      }
      setOrigPrices(prices);
    }).catch((e) => {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao carregar produto');
      onOpenChange(false);
    }).finally(() => setLoadingProduct(false));
  }, [open, editingId]);

  const parsedOptions = useMemo(
    () => options.map((o) => ({ name: o.name.trim(), values: o.valuesText.split(',').map((v) => v.trim()).filter(Boolean) })).filter((o) => o.name),
    [options],
  );

  // Regenera as variantes quando as opções mudam (só na CRIAÇÃO; na edição a estrutura é fixa).
  useEffect(() => {
    if (isEdit || type !== 'VARIABLE') return;
    const combos = cartesian(parsedOptions);
    setVariants((prev) => combos.map((combo) => {
      const key = JSON.stringify(combo);
      const existing = prev.find((v) => JSON.stringify(v.combo) === key);
      return existing ?? { combo, sku: '', price: '', stock: '0' };
    }));
  }, [isEdit, type, parsedOptions]);

  function reset() {
    setType('SIMPLE'); setName(''); setDescription(''); setState('PUBLISHED'); setCategoryId(''); setBrandId('');
    setSku(''); setPrice(''); setStock('0'); setSimpleVariantId(null);
    setOptions([{ name: 'Cor', valuesText: '' }]); setVariants([]); setOrigPrices({});
  }

  async function submitCreate() {
    const base: any = { name, description, state, categoryId: categoryId || undefined, brandId: brandId || undefined };
    if (type === 'SIMPLE') {
      if (!sku.trim() || !price) throw new ApiError(400, 'BAD', 'SKU e preço são obrigatórios.');
      await api.products.create({ ...base, type: 'SIMPLE', sku, price: Number(price), stock: Number(stock) });
    } else {
      if (parsedOptions.length === 0 || variants.length === 0) throw new ApiError(400, 'BAD', 'Defina opções e variantes.');
      if (variants.some((v) => !v.sku.trim() || !v.price)) throw new ApiError(400, 'BAD', 'Preencha SKU e preço de todas as variantes.');
      await api.products.create({
        ...base, type: 'VARIABLE',
        options: parsedOptions.map((o) => ({ name: o.name, values: o.values })),
        variants: variants.map((v) => ({ sku: v.sku, price: Number(v.price), stock: Number(v.stock), options: v.combo })),
      });
    }
    toast.success('Produto criado!');
  }

  async function submitEdit() {
    // 1) Dados base do produto (categoria/marca podem ser removidas → null).
    await api.products.update(editingId!, {
      name, description, state,
      categoryId: categoryId || null,
      brandId: brandId || null,
    });
    // 2) Preços alterados (estoque e SKU são gerenciados em outros lugares).
    const rows: { id?: string; price: string }[] = type === 'SIMPLE'
      ? [{ id: simpleVariantId ?? undefined, price }]
      : variants;
    for (const r of rows) {
      if (!r.id || !r.price) continue;
      if (r.price !== origPrices[r.id]) await api.products.updateVariant(r.id, { price: Number(r.price) });
    }
    toast.success('Produto atualizado!');
  }

  async function submit() {
    if (!name.trim()) return toast.error('Informe o nome.');
    setLoading(true);
    try {
      if (isEdit) await submitEdit(); else await submitCreate();
      reset();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</DialogTitle></DialogHeader>

        {loadingProduct ? (
          <div className="grid place-items-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
        <>
        <Tabs value={type} onValueChange={(v) => { if (!isEdit) setType(v as any); }}>
          <TabsList className="w-full">
            <TabsTrigger value="SIMPLE" className="flex-1" disabled={isEdit && type !== 'SIMPLE'}>Simples</TabsTrigger>
            <TabsTrigger value="VARIABLE" className="flex-1" disabled={isEdit && type !== 'VARIABLE'}>Variável (cor/tamanho)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Camiseta Gamer" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <NativeSelect value={categoryId} onChange={setCategoryId} options={categories} placeholder="Sem categoria" />
          </div>
          <div className="space-y-2">
            <Label>Marca</Label>
            <NativeSelect value={brandId} onChange={setBrandId} options={brands} placeholder="Sem marca" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <select value={state} onChange={(e) => setState(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Rascunho</option>
              <option value="HIDDEN">Oculto</option>
            </select>
          </div>
        </div>

        {type === 'SIMPLE' ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="FONE-001" disabled={isEdit} /></div>
            <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div className="space-y-2"><Label>Estoque{isEdit ? '' : ' inicial'}</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} disabled={isEdit} /></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Opções (valores separados por vírgula)</Label>
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="w-32" value={o.name} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Cor" disabled={isEdit} />
                  <Input className="flex-1" value={o.valuesText} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, valuesText: e.target.value } : x))} placeholder="Preto, Branco" disabled={isEdit} />
                  {!isEdit && options.length > 1 && <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>}
                </div>
              ))}
              {!isEdit && options.length < 3 && <Button variant="outline" size="sm" onClick={() => setOptions([...options, { name: '', valuesText: '' }])}><Plus className="size-3.5" /> Opção</Button>}
            </div>

            {variants.length > 0 && (
              <div className="space-y-2">
                <Label>Variantes ({variants.length})</Label>
                <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                  {variants.map((v, i) => (
                    <div key={v.id ?? i} className="flex items-center gap-2 p-2">
                      <span className="w-32 shrink-0 text-sm font-medium">{Object.values(v.combo).join(' / ')}</span>
                      <Input className="h-8" placeholder="SKU" value={v.sku} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} disabled={isEdit} />
                      <Input className="h-8 w-24" type="number" step="0.01" placeholder="Preço" value={v.price} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                      <Input className="h-8 w-20" type="number" placeholder="Estoque" value={v.stock} onChange={(e) => setVariants(variants.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))} disabled={isEdit} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isEdit && (
          <p className="text-xs text-muted-foreground">SKU e estoque não são editados aqui — ajuste o estoque na página Estoque.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading && <Loader2 className="animate-spin" />} {isEdit ? 'Salvar alterações' : 'Criar produto'}</Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NativeSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: NamedRef[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
  );
}
