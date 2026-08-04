# mockmerce-alun · Painel do aluno (web)

Painel estilo **Shopify** onde os alunos **gerenciam a loja** (produtos, estoque, pedidos,
configuração) do projeto **MockMerce**. O catálogo cadastrado aqui alimenta a API que o
**app mobile do grupo** (foco da entrega) consome.

> Vite · React · TypeScript · Tailwind · shadcn/ui

### 🧩 Projeto MockMerce — 3 repositórios

| Repo | O que é |
|---|---|
| **mockmerce-back** | A API que todos os grupos consomem |
| **mockmerce-alun** (este) | Painel web para os alunos gerenciarem a loja |
| **mockmerce-doc** | Hub de documentação/tutoriais (Docusaurus) |

---

## Rodar

Este painel consome o backend (`mockmerce-back`), então suba os dois:

```bash
# 1. Backend (no repositório mockmerce-back)
npm run dev                 # http://localhost:3333

# 2. Este painel
npm install
npm run dev                 # http://localhost:5173
```

O Vite faz proxy de `/api` → `http://localhost:3333` (ver `vite.config.ts`), então não há
CORS nem URL do backend exposta no browser.

## Login

- **Login = RM**, e no **primeiro acesso a senha também é o RM**. O sistema **força a troca**
  de senha logo após o 1º login.
- A lista de RMs vem do backend (do seed / `POST /admin/groups` do professor). Depois, os
  próprios alunos podem adicionar colegas por RM na tela **Loja → Membros do grupo**.
- Aluno demo do seed: `RM550003`.

## Como autentica

Após o login, o painel recebe um **token de sessão do aluno** (JWT) que o backend aceita no
lugar da `X-API-Key` — ele deriva o grupo e o RM automaticamente. Assim a chave da API nunca
fica no browser e **toda ação já é rastreada por RM** (alimenta a correção automática).

## Seções

- **Dashboard** — KPIs + progresso de missões + participação por RM.
- **Produtos** — cadastro **e edição** de produtos simples e variáveis (cor/tamanho), com
  preço/estoque, busca e **paginação**.
- **Estoque** — entrada e ajuste de saldo por variante (com paginação).
- **Pedidos** — timeline, transição de status, reembolso, comentários internos, NF-e
  (com paginação).
- **Loja** — **configuração da loja** (nome, logo, contato, cor do tema, dados fiscais,
  regional) e **membros do grupo** (linkar colegas por RM).
- **Ensino** — missões, XP, badges, ranking e "enviar para correção".
- **Configurações** — **chaves de API** (criar/revogar chaves nomeadas, estilo Shopify) e
  **webhooks** (com signing secret).

## Estrutura

```
src/
  pages/          # Dashboard, Products, Inventory, Orders, Store, Teaching, Config, Login…
  components/     # ProductFormDialog, Pagination, PageHeader, layout/, ui/ (shadcn)
  lib/            # api.ts (cliente da API), auth.tsx, hooks.ts, utils.ts
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o painel com hot-reload (Vite) |
| `npm run build` | Type-check + build de produção |
| `npm run preview` | Servir o build localmente |
| `npm run lint` | Lint (oxlint) |
