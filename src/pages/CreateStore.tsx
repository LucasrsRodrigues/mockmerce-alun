import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Store, Loader2, Copy, KeyRound, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, ApiError, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Aluno logado que ainda não tem loja cria a sua aqui. Ao criar, recebe um token novo
 * (já com o grupo) e a API key — mostrada UMA vez. Depois entra no painel da loja.
 */
export default function CreateStore() {
  const { student, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ apiKey: string; name: string } | null>(null);

  // Guardas: espelham o gate do Protected para acesso direto à URL.
  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (!student) return <Navigate to="/login" replace />;
  if (student.mustChangePassword) return <Navigate to="/trocar-senha" replace />;
  if (student.groupId) return <Navigate to="/" replace />; // já tem loja

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.auth.createStore(name.trim());
      setToken(res.token); // token novo já com o grupo
      setCreated({ apiKey: res.apiKey, name: res.name });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao criar a loja');
    } finally {
      setSaving(false);
    }
  }

  async function enter() {
    await refresh(); // /me agora retorna o grupo
    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="size-5" />
          </div>
          <CardTitle className="text-center">{created ? 'Loja criada! 🎉' : 'Crie a sua loja'}</CardTitle>
          <CardDescription className="text-center">
            {created
              ? 'Guarde a API key abaixo — ela é mostrada uma única vez.'
              : `Olá, ${student.name?.split(' ')[0] || 'aluno'}. Dê um nome à sua loja para começar. Depois você adiciona os colegas por RM nas configurações.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {created ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>API key da loja</Label>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                  <code className="flex-1 break-all text-sm">{created.apiKey}</code>
                  <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(created.apiKey); toast.success('Copiada'); }}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use no header <code>X-API-Key</code> para o app consumir a API. Não será mostrada de novo.</p>
              </div>
              <Button className="w-full" onClick={enter}>Entrar na loja <ArrowRight /></Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sname">Nome da loja</Label>
                <Input id="sname" placeholder="Minha Loja de Games" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !name.trim()}>
                {saving && <Loader2 className="animate-spin" />} Criar loja
              </Button>
              <button type="button" onClick={logout} className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <LogOut className="size-3" /> Sair
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
