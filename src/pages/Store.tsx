import { useState } from 'react';
import { toast } from 'sonner';
import { Save, Store as StoreIcon, Users, UserPlus, Trash2, Loader2, Phone, Palette, FileText } from 'lucide-react';
import { api, type StoreSettings, type Member } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Store() {
  return (
    <div>
      <PageHeader title="Configuração da loja" description="Dados da sua loja e os alunos (RM) que compõem o grupo." />
      <div className="space-y-6">
        <StoreProfileCard />
        <MembersCard />
      </div>
    </div>
  );
}

function StoreProfileCard() {
  const { data, loading } = useAsync(() => api.settings.get(), []);
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [saving, setSaving] = useState(false);

  // Valor exibido = servidor sobrescrito pelo que o usuário digitou.
  const val = (k: keyof StoreSettings): string => {
    if (k in form) return (form[k] ?? '') as string;
    return (data?.[k] ?? '') as string;
  };
  const set = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    try {
      await api.settings.update(form);
      toast.success('Configuração salva.');
      setForm({});
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

  const color = val('primaryColor') || '#4f46e5';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><StoreIcon className="size-4" /> Dados da loja</CardTitle>
        <CardDescription>Usado pelo app mobile do grupo para exibir a marca e contato.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identidade */}
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Nome da loja</Label><Input value={val('storeName')} onChange={set('storeName')} placeholder="Ex.: GamerStore" /></div>
            <div className="space-y-2"><Label>URL do logo</Label><Input value={val('logoUrl')} onChange={set('logoUrl')} placeholder="https://..." /></div>
          </div>
          <div className="space-y-2"><Label>Descrição / slogan</Label><Input value={val('storeDescription')} onChange={set('storeDescription')} placeholder="A sua loja gamer favorita" /></div>
        </section>

        {/* Contato */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Phone className="size-3.5" /> Contato</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>E-mail de suporte</Label><Input type="email" value={val('supportEmail')} onChange={set('supportEmail')} placeholder="suporte@loja.com" /></div>
            <div className="space-y-2"><Label>WhatsApp / telefone</Label><Input value={val('whatsapp')} onChange={set('whatsapp')} placeholder="(11) 90000-0000" /></div>
            <div className="space-y-2"><Label>Instagram</Label><Input value={val('instagram')} onChange={set('instagram')} placeholder="@sualoja" /></div>
          </div>
        </section>

        {/* Tema */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Palette className="size-3.5" /> Tema do app</div>
          <div className="flex items-end gap-3">
            <div className="space-y-2"><Label>Cor principal</Label>
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#4f46e5'} onChange={set('primaryColor')} className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1" />
            </div>
            <div className="w-40 space-y-2"><Label>Hex</Label><Input value={val('primaryColor')} onChange={set('primaryColor')} placeholder="#4f46e5" /></div>
          </div>
        </section>

        {/* Fiscal */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FileText className="size-3.5" /> Dados fiscais</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Endereço</Label><Input value={val('address')} onChange={set('address')} placeholder="Rua Exemplo, 123 - São Paulo/SP" /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={val('cnpj')} onChange={set('cnpj')} placeholder="00.000.000/0001-00" /></div>
          </div>
        </section>

        {/* Regional */}
        <section className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Regional</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Idioma</Label><Input value={val('locale')} onChange={set('locale')} placeholder="pt-BR" /></div>
            <div className="space-y-2"><Label>Moeda</Label><Input value={val('currency')} onChange={set('currency')} placeholder="BRL" /></div>
            <div className="space-y-2"><Label>Fuso horário</Label><Input value={val('timezone')} onChange={set('timezone')} placeholder="America/Sao_Paulo" /></div>
          </div>
        </section>

        <Button onClick={save} disabled={saving || Object.keys(form).length === 0}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configuração
        </Button>
      </CardContent>
    </Card>
  );
}

function MembersCard() {
  const { data, loading, reload } = useAsync(() => api.members.list(), []);
  const [rm, setRm] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!rm.trim() || !name.trim()) return toast.error('Informe RM e nome do aluno.');
    setAdding(true);
    try {
      await api.members.add(rm.trim(), name.trim());
      toast.success('Aluno adicionado ao grupo.');
      setRm(''); setName('');
      reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao adicionar');
    } finally {
      setAdding(false);
    }
  }

  async function remove(memberRm: string, memberName: string) {
    if (!confirm(`Remover ${memberName} (${memberRm}) do grupo?`)) return;
    try {
      await api.members.remove(memberRm);
      toast.success('Aluno removido.');
      reload();
    } catch (e: any) {
      toast.error(e.message ?? 'Falha ao remover');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Users className="size-4" /> Membros do grupo</CardTitle>
        <CardDescription>Linke os colegas pelo RM para compor o grupo — é o que o professor usa na avaliação.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input className="sm:w-40" placeholder="RM (ex.: RM550004)" value={rm} onChange={(e) => setRm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Input className="flex-1" placeholder="Nome do aluno" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button onClick={add} disabled={adding}>{adding ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Adicionar</Button>
        </div>

        {loading && <Skeleton className="h-20 w-full" />}
        <div className="space-y-2">
          {data?.map((m) => (
            <div key={m.rm} className="flex items-center gap-3 rounded-lg border p-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{m.name}</span>
                  {m.isYou && <Badge variant="default">você</Badge>}
                  <Badge variant={m.jaAcessou ? 'success' : 'muted'}>{m.jaAcessou ? 'já acessou' : 'nunca acessou'}</Badge>
                </div>
                <div className="font-mono text-xs text-muted-foreground">{m.rm}</div>
              </div>
              {!m.isYou && <Button size="icon" variant="ghost" onClick={() => remove(m.rm, m.name)} title="Remover"><Trash2 className="size-4" /></Button>}
            </div>
          ))}
          {!loading && data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
