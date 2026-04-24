# Contourline · triLift Quiz — CBCD 2026

Aplicação de quiz para ativação do stand Contourline no CBCD
(30/abr–03/mai/2026, Centro de Convenções de Goiânia).

Captura leads médicos em 5 telas (cadastro + LGPD → 3 perguntas sobre
triLift® → tela de agradecimento), persiste no Supabase, e oferece painel
admin com dashboard em tempo real e sorteio auditável.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first tokens em `globals.css`)
- Radix UI primitives (componentes em `src/components/ui/*`)
- Supabase (Auth + Postgres + RLS + Realtime)
- Zod + React Hook Form
- Deploy: Vercel

## Estrutura

```
src/
  app/
    page.tsx                     # Quiz público (5 telas)
    admin/
      login/                     # Login com email+senha
      page.tsx                   # Dashboard (KPIs + leads realtime)
      sorteio/                   # Tela de sorteio auditável
    api/
      submit/                    # Recebe envio do quiz
      admin/
        stats/                   # Refresh do dashboard
        raffle/                  # Executa sorteio via RPC
  components/
    ui/                          # Button, Input, Radio, Checkbox, Select...
    brand/                       # ContourlineMark
    quiz/                        # QuizShell, StepLead, StepQuestion, StepThanks, LgpdDialog
  lib/
    quiz/                        # Context/state, schemas zod, perguntas, tipos
    supabase/                    # Clients (browser + server + service)
    utils.ts                     # cn() helper
  middleware.ts                  # Protege /admin

supabase/
  migrations/
    00000000000001_initial_schema.sql   # DDL + RLS + sorteio auditável + seed

docs/
  lgpd.md                        # Termo de consentimento (revisar com jurídico)
  runbook.md                     # Procedimento operacional do evento
```

## Setup local

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

Valores obrigatórios:

- `NEXT_PUBLIC_SUPABASE_URL` — Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — Settings → API (⚠️ nunca expor no frontend)
- `RAFFLE_ADMIN_PIN` — PIN escolhido pelo time para executar sorteios

### 3. Aplicar schema no Supabase

No projeto Supabase, **SQL Editor**:

1. Cole e execute `supabase/migrations/00000000000001_initial_schema.sql`
2. Crie o(s) usuário(s) admin em **Authentication → Users → Add user**
   (email + senha)
3. No SQL Editor, insira o(s) admin(s) em `admin_users`:

```sql
insert into public.admin_users (user_id, full_name, role)
select id, 'Nome da Operadora', 'admin'
from auth.users
where email = 'email-da-operadora@contourline.com.br';
```

### 4. Rodar dev server

```bash
npm run dev
```

- Quiz: http://localhost:3000
- Dashboard: http://localhost:3000/admin
- Sorteio: http://localhost:3000/admin/sorteio

## Deploy (Vercel)

1. Importe o repositório em vercel.com/new
2. Configure as variáveis de ambiente (iguais ao `.env.local`)
3. Deploy

URLs públicas:
- Tablet kiosk: `https://<projeto>.vercel.app/?src=kiosk`
- QR code móvel: `https://<projeto>.vercel.app/?src=qr`

O parâmetro `?src=` permite diferenciar a origem no banco (útil para
análise pós-evento) e ativa auto-reset no modo kiosk.

## Operação no evento

Veja `docs/runbook.md` para:
- Setup do tablet Samsung com Fully Kiosk Browser
- Checklist pré-evento (dia 29/abr)
- Monitoramento durante os 4 dias
- Execução do sorteio no dia 03/mai
- Backup e contingências

## LGPD

O texto do termo de consentimento está em `docs/lgpd.md`. **Revisar com
jurídico** antes do dia 29/abr. Qualquer mudança textual deve incrementar a
versão (constante `CONSENT_VERSION` em `src/app/api/submit/route.ts`).

## Fast-follow (pós-MVP)

Duas integrações foram descopadas do MUST para entregar o quiz no prazo —
ficam como fast-follow antes do dia 03/mai (sorteio):

1. **RD Station** — webhook `/api/integrations/rd` para espelhar leads
2. **WhatsApp (Z-API)** — cron para disparar convite da comunidade no dia 03/mai

Os hooks para essas integrações já estão preparados em `integration_logs`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build de produção |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
