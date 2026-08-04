import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Send, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Teaching() {
  const { data, loading, reload } = useAsync(() => api.teaching.dashboard(), []);
  const ranking = useAsync(() => api.teaching.ranking(), []);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const r = await api.teaching.submit();
      toast.success(`Enviado! Nota ${r.grade} · ${r.missoesCumpridas} missões.`);
      reload();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(false); }
  }

  return (
    <div>
      <PageHeader
        title="Ensino"
        description="Missões avaliadas automaticamente por evidência — conforme você usa a API."
        action={<Button onClick={submit} disabled={submitting}><Send className="size-4" /> Enviar para correção</Button>}
      />

      {loading && <Skeleton className="h-40 w-full" />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Nota</div><div className="text-3xl font-bold text-primary">{data.nota}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">XP total</div><div className="text-3xl font-bold">{data.xp}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Missões</div><div className="text-3xl font-bold">{data.missoes.cumpridas}<span className="text-lg text-muted-foreground">/{data.missoes.total}</span></div></CardContent></Card>
          </div>

          {data.badges.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {data.badges.map((b) => <Badge key={b.key} variant="success" className="text-sm py-1">{b.icon} {b.name}</Badge>)}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader><CardTitle className="text-base">Missões</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.missoes.lista.map((m) => (
                  <div key={m.key} className="flex items-start gap-3 rounded-lg border p-3">
                    {m.cumprida ? <CheckCircle2 className="mt-0.5 size-5 text-primary shrink-0" /> : <Circle className="mt-0.5 size-5 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="font-medium">{m.title}</span><Badge variant="muted">{m.points} XP</Badge><Badge variant="outline">{m.phase}</Badge></div>
                      <div className="text-sm text-muted-foreground">{m.description}</div>
                      {m.cumprida && m.porRm && <div className="mt-1 text-xs text-primary">Concluída por {m.porRm}</div>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="size-4 text-amber-500" /> Ranking</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ranking.loading && <Skeleton className="h-24 w-full" />}
                {ranking.data?.map((r) => (
                  <div key={r.posicao} className="flex items-center justify-between text-sm">
                    <span><span className="text-muted-foreground mr-2">#{r.posicao}</span>{r.grupo}</span>
                    <Badge variant="secondary">{r.xp} XP</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
