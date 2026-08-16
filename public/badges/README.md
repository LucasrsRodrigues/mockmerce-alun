# Badges — descritivo para criar as imagens

Este é o catálogo completo das conquistas. **Crie uma imagem por badge e salve nesta pasta**
(`aluno-admin-web/public/badges/`) usando **o nome de arquivo = a `key`** da badge. Assim,
depois é trivial o app usar a imagem (`/badges/<key>.png`) no lugar do emoji.

## Especificação da imagem

- **Formato:** PNG com fundo transparente (ou SVG). Preferência por SVG se for arte vetorial.
- **Tamanho:** quadrado, **256×256 px** (o app renderiza em ~96 px; 256 dá folga p/ retina).
- **Área segura:** deixe ~8% de margem; o medalhão é circular.
- **Tema:** precisa ficar legível sobre card **claro e escuro** — evite branco puro no fundo do desenho.
- **Nome do arquivo:** exatamente a `key` (ex.: `ind-trabalhador-2.png`).

## Cores por tier (anel/moldura sugerida)

| Tier | Cor | Hex |
|---|---|---|
| BRONZE | bronze | `#C27A3E` |
| SILVER | prata | `#9AA6B2` |
| GOLD | ouro | `#D9AE36` |
| PLATINUM | platina (ciano) | `#5FB6C9` |

---

## Badges individuais (por aluno / RM) — aparecem no Perfil

> `current/target` é o progresso; a badge é concedida quando `current >= target`.
> A avaliação é por evidência: requisições bem-sucedidas do RM, XP individual e missões creditadas a ele.

### Marco de entrada

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-primeiros-passos` | Primeiros Passos | BRONZE | 🌱 | 1ª requisição bem-sucedida à API | Broto/semente nascendo |

### Família Trabalhador — volume de requisições bem-sucedidas do RM

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-trabalhador-1` | Trabalhador | BRONZE | 🛠️ | 25 requisições | Martelo/chave de boca |
| `ind-trabalhador-2` | Trabalhador de Prata | SILVER | 🛠️ | 100 requisições | Idem, moldura prata |
| `ind-trabalhador-3` | Trabalhador de Ouro | GOLD | 🛠️ | 500 requisições | Idem, moldura ouro |

### Família Explorador — endpoints distintos usados

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-explorador-1` | Explorador | BRONZE | 🧭 | 5 endpoints diferentes | Bússola |
| `ind-explorador-2` | Explorador de Prata | SILVER | 🧭 | 15 endpoints diferentes | Bússola, moldura prata |
| `ind-explorador-3` | Explorador de Ouro | GOLD | 🧭 | 30 endpoints diferentes | Bússola, moldura ouro |

### Família Pontuador — XP individual do RM

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-pontuador-1` | Pontuador | BRONZE | ⭐ | 50 XP | Estrela |
| `ind-pontuador-2` | Pontuador de Prata | SILVER | ⭐ | 150 XP | Estrela, moldura prata |
| `ind-pontuador-3` | Pontuador de Ouro | PLATINUM | ⭐ | 400 XP | Estrela, moldura platina |

### Marcos de comportamento

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-vendedor` | Vendedor | SILVER | 💰 | 1 checkout com sucesso (`POST /orders/checkout`) | Saco de dinheiro / etiqueta de preço |
| `ind-integrador` | Integrador | GOLD | 🔌 | Registrou um webhook (`POST /webhooks`) | Plugue/conector |

### Família Missionário — missões creditadas ao RM

| key (arquivo) | Nome | Tier | Emoji ref. | Critério | Ideia visual |
|---|---|---|---|---|---|
| `ind-missionario-1` | Missionário | SILVER | 🎯 | Concluiu 3 missões | Alvo com dardo |
| `ind-missionario-2` | Missionário de Ouro | GOLD | 🎯 | Concluiu 6 missões | Alvo, moldura ouro |

---

## Badges de grupo (conquista do time) — sistema antigo, ainda existe

> Concedidas ao GRUPO quando uma missão com `badgeKey` é cumprida.

| key (arquivo) | Nome | Emoji ref. | Como é concedida |
|---|---|---|---|
| `primeiros-passos` | Primeiros Passos | 🌱 | Missão "Cadastrar um produto" |
| `primeira-venda` | Primeira Venda | 💰 | Missão "Compra ponta a ponta" |
| `integrador` | Integrador | 🔌 | Missão "Receber um webhook" |
| `lojista-completo` | Lojista Completo | 🏆 | ⚠️ hoje **não é concedida** por nada (badge órfã) |

---

## Como o app passa a usar as imagens (follow-up rápido)

Hoje o medalhão desenha o **emoji** no centro (`BadgeMedal.tsx`). Para trocar por imagem, o
caminho mais simples é: quando existir `/badges/<key>.png`, o componente usa `<image>` no
lugar do `<text>`. Posso fazer essa troca quando as imagens estiverem aqui — só avisar.

> Fonte da verdade dos critérios/keys: `Backend/src/modules/teaching/badges.ts`.
