import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Store, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [rm, setRm] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const mustChange = await login(rm.trim(), password);
      toast.success('Bem-vindo(a)!');
      navigate(mustChange ? '/trocar-senha' : '/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado da marca */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Store className="size-6" /> Loja FIAP · Admin
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Gerencie sua loja.<br />Alimente o app.</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Cadastre produtos, controle estoque e acompanhe pedidos. Tudo o que você configura aqui
            serve a API que o seu app mobile consome.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">2TDSPG · Backend E-commerce da Turma</p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-semibold text-lg text-primary">
            <Store className="size-6" /> Loja FIAP
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">Use seu RM. No primeiro acesso, a senha é o próprio RM.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rm">RM</Label>
            <Input id="rm" placeholder="RM550001" value={rm} onChange={(e) => setRm(e.target.value)} autoFocus required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
