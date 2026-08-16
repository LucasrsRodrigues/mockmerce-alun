import { useId, useState } from 'react';
import type { BadgeTier } from '@/lib/api';

// Paleta por tier — define a cor do medalhão. Locked usa cinza.
const TIERS: Record<BadgeTier, { ring: string; from: string; to: string; label: string }> = {
  BRONZE: { ring: '#C27A3E', from: '#E8A56B', to: '#9A5626', label: 'Bronze' },
  SILVER: { ring: '#9AA6B2', from: '#DCE3EA', to: '#8391A0', label: 'Prata' },
  GOLD: { ring: '#D9AE36', from: '#F4D77C', to: '#B4820A', label: 'Ouro' },
  PLATINUM: { ring: '#5FB6C9', from: '#C6ECF3', to: '#3C8DA0', label: 'Platina' },
};

const R = 44; // raio do anel de progresso
const CIRC = 2 * Math.PI * R;

export function BadgeMedal({
  icon,
  tier,
  earned,
  progress,
  size = 96,
  badgeKey,
}: {
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  progress: { current: number; target: number };
  size?: number;
  /// Se houver uma imagem em /badges/<badgeKey>.png, ela é usada no centro;
  /// senão (ou se falhar ao carregar) cai no emoji `icon`.
  badgeKey?: string;
}) {
  const uid = useId();
  const [imgFailed, setImgFailed] = useState(false);
  const useImage = Boolean(badgeKey) && !imgFailed;
  const glyphStyle = { filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.55 } as const;
  const t = TIERS[tier];
  const pct = progress.target > 0 ? Math.min(1, progress.current / progress.target) : 0;
  const gradId = `medal-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={earned ? 'Conquistada' : 'Bloqueada'}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? t.from : '#D4D8DE'} />
          <stop offset="100%" stopColor={earned ? t.to : '#9AA1AA'} />
        </linearGradient>
      </defs>

      {/* Trilho do anel de progresso */}
      <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="5" />
      {/* Anel de progresso (cheio quando conquistada) */}
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        stroke={earned ? t.ring : t.ring}
        strokeOpacity={earned ? 1 : 0.55}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(earned ? 1 : pct) * CIRC} ${CIRC}`}
        transform="rotate(-90 50 50)"
      />

      {/* Corpo da medalha */}
      <circle cx="50" cy="50" r="34" fill={`url(#${gradId})`} stroke={earned ? t.ring : '#8A919B'} strokeWidth="2" />
      <circle cx="50" cy="50" r="27" fill="#ffffff" fillOpacity={earned ? 0.16 : 0.1} />

      {/* Centro: imagem /badges/<key>.png se existir; senão, o emoji. */}
      {useImage ? (
        <image
          href={`/badges/${badgeKey}.png`}
          x="26"
          y="26"
          width="48"
          height="48"
          preserveAspectRatio="xMidYMid meet"
          style={glyphStyle}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="30" style={glyphStyle}>
          {icon}
        </text>
      )}

      {/* Cadeado quando bloqueada */}
      {!earned && (
        <g transform="translate(64 64)">
          <circle r="12" fill="#374151" />
          <rect x="-5" y="-1.5" width="10" height="8" rx="1.5" fill="#F3F4F6" />
          <path d="M-3 -1.5 v-2.2 a3 3 0 0 1 6 0 v2.2" fill="none" stroke="#F3F4F6" strokeWidth="1.6" />
        </g>
      )}
    </svg>
  );
}
