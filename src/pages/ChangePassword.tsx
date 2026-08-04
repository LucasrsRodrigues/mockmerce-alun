import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChangePassword() {
  const { student, refresh } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) return toast.error('As senhas não coincidem.');
    if (next.length < 6) return toast.error('A nova senha precisa de 6+ caracteres.');
    setLoading(true);
    try {
      await api.auth.changePassword(current, next);
      await refresh();
      toast.success('Senha atualizada!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao trocar a senha');
    } finally {
      setLoading(false);
    }
  }

  const first = student?.mustChangePassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <CardTitle className="text-center">{first ? 'Defina sua senha' : 'Trocar senha'}</CardTitle>
          <CardDescription className="text-center">
            {first ? 'Por segurança, no primeiro acesso você precisa criar uma senha nova.' : 'Escolha uma nova senha.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cur">Senha atual {first && <span className="text-muted-foreground font-normal">(é o seu RM)</span>}</Label>
              <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">Nova senha</Label>
              <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conf">Confirmar nova senha</Label>
              <Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />} Salvar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
