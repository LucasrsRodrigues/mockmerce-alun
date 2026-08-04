import { Link } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, Trophy, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { money } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const products = useAsync(() => api.products.list({ pageSize: 1 }), []);
  const orders = useAsync(() => api.orders.list({ pageSize: 1 }), []);
  const sales = useAsync(() => api.reports.sales(), []);
  const teaching = useAsync(() => api.teaching.dashboard(), []);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da sua loja." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Package} label="Produtos" value={products.data?.total} loading={products.loading} />
        <Kpi icon={ShoppingCart} label="Pedidos" value={orders.data?.total} loading={orders.loading} />
        <Kpi icon={DollarSign} label="Receita (pagos)" value={sales.data ? money(sales.data.summary.revenue) : undefined} loading={sales.loading} />
        <Kpi icon={Trophy} label="Nota (ensino)" value={teaching.data ? `${teaching.data.nota} · ${teaching.data.xp} XP` : undefined} loading={teaching.loading} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Progresso das missões</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/ensino">Ver tudo <ArrowRight className="size-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {teaching.loading && <Skeleton className="h-24 w-full" />}
            {teaching.data && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{teaching.data.missoes.cumpridas}/{teaching.data.missoes.total}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(teaching.data.missoes.cumpridas / teaching.data.missoes.total) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {teaching.data.badges.map((b) => <Badge key={b.key} variant="success">{b.icon} {b.name}</Badge>)}
                  {teaching.data.badges.length === 0 && <span className="text-sm text-muted-foreground">Nenhum badge ainda.</span>}
                </div>
                {teaching.data.proximosPassos[0] && (
                  <p className="text-sm text-muted-foreground">Próximo: {teaching.data.proximosPassos[0]}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Participação por aluno (RM)</CardTitle></CardHeader>
          <CardContent>
            {teaching.loading && <Skeleton className="h-24 w-full" />}
            {teaching.data && (
              <div className="space-y-2">
                {teaching.data.xpPorAluno.map((a) => (
                  <div key={a.rm} className="flex items-center justify-between text-sm">
                    <span>{a.nome} <span className="text-muted-foreground">· {a.rm}</span></span>
                    <Badge variant="secondary">{a.xp} XP</Badge>
                  </div>
                ))}
                {teaching.data.xpPorAluno.length === 0 && <p className="text-sm text-muted-foreground">Sem atividade registrada ainda.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, loading }: { icon: any; label: string; value?: string | number; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {loading ? <Skeleton className="mt-1 h-6 w-16" /> : <div className="text-xl font-semibold">{value ?? '—'}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
