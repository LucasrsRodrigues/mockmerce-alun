# Loja FIAP · Admin (web)

Painel estilo Shopify onde os alunos **gerenciam a loja** (produtos, estoque, pedidos,
config) — o catálogo cadastrado aqui alimenta a API que o **app mobile** (foco da entrega)
consome. Vite + React + TypeScript + Tailwind + shadcn/ui.

## Rodar

```bash
# 1. Suba o backend (na pasta raiz do projeto)
cd .. && npm run dev        # http://localhost:3333

# 2. Suba o admin
cd admin-web
npm install
npm run dev                 # http://localhost:5173
```

O Vite faz proxy de `/api` → `http://localhost:3333` (ver `vite.config.ts`), então não há
CORS nem URL exposta.

## Login

- **Login = RM**, e no **primeiro acesso a senha também é o RM**. O sistema **força a troca**
  de senha logo após o 1º login.
- A lista de RMs vem do backend (por ora, do seed / `POST /admin/groups` do professor).
  Alunos demo: `RM550003` (ainda em 1º acesso).

## Como autentica

Após o login, o admin recebe um **token de sessão do aluno** (JWT) que o backend aceita no
lugar da `X-API-Key` — ele deriva o grupo e o RM automaticamente. Assim a chave da API nunca
fica no browser e toda ação já é **rastreada por RM** (alimenta a correção automática).

## Seções

- **Dashboard** — KPIs + progresso de missões + participação por RM.
- **Produtos** — cadastro de produtos simples e variáveis (cor/tamanho), com preço/estoque.
- **Estoque** — entrada e ajuste de saldo por variante.
- **Pedidos** — timeline, transição de status, reembolso, comentários internos, NF-e.
- **Ensino** — missões, XP, badges, ranking e "enviar para correção".
- **Configurações** — idioma/moeda/fuso e webhooks (com signing secret).
# -mockmerce-alun
