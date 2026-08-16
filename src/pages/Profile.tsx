import { api, type ProfileBadge, type BadgeTier } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { BadgeMedal } from '@/components/BadgeMedal';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const TIER_LABEL: Record<BadgeTier, string> = { BRONZE: 'Bronze', SILVER: 'Prata', GOLD: 'Ouro', PLATINUM: 'Platina' };

// Conquistadas primeiro; entre bloqueadas, as mais próximas de completar antes.
function ordenar(badges: ProfileBadge[]): ProfileBadge[] {
  return [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) return (b.awardedAt ?? '').localeCompare(a.awardedAt ?? '');
    const ra = a.progress.target ? a.progress.current / a.progress.target : 0;
    const rb = b.progress.target ? b.progress.current / b.progress.target : 0;
    return rb - ra;
  });
}

function BadgeCard({ b }: { b: ProfileBadge }) {
  const pct = b.progress.target ? Math.min(100, Math.round((b.progress.current / b.progress.target) * 100)) : 0;
  return (
    <Card className={b.earned ? 'border-primary/30' : 'opacity-90'}>
      <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
        <BadgeMedal icon={b.icon} tier={b.tier} earned={b.earned} progress={b.progress} badgeKey={b.key} />
        <div className="flex items-center gap-2">
          <span className="font-semibold leading-tight">{b.name}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{TIER_LABEL[b.tier]}</span>
        <p className="text-xs text-muted-foreground">{b.description}</p>

        {b.earned ? (
          <div className="mt-1 text-xs font-medium text-primary">
            Conquistada{b.awardedAt ? ` em ${new Date(b.awardedAt).toLocaleDateString('pt-BR')}` : ''}
          </div>
        ) : (
          <div className="mt-1 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {b.progress.current}/{b.progress.target}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { data, loading } = useAsync(() => api.teaching.profile(), []);

  return (
    <div>
      <PageHeader
        title="Perfil"
        description="Suas conquistas individuais (por RM) — evoluem automaticamente conforme você usa a API."
      />

      {loading && <Skeleton className="h-40 w-full" />}
      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Aluno</div><div className="text-lg font-semibold leading-tight">{data.nome}</div><div className="font-mono text-xs text-muted-foreground">{data.rm}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">XP individual</div><div className="text-3xl font-bold">{data.xp}</div></CardContent></Card>
            <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Badges</div><div className="text-3xl font-bold text-primary">{data.conquistadas}<span className="text-lg text-muted-foreground">/{data.total}</span></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ordenar(data.badges).map((b) => <BadgeCard key={b.key} b={b} />)}
          </div>
        </>
      )}
    </div>
  );
}
