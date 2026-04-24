# Runbook Operacional — Quiz triLift CBCD 2026

## Timeline-chave

| Data | Ação | Responsável |
|---|---|---|
| 23/abr | Dev setup + schema Supabase + LGPD revisado | Dev + Marketing |
| 24–26/abr | Desenvolvimento do quiz e admin | Dev |
| 27/abr | QA completo + deploy Vercel staging | Dev + QA |
| 28/abr | **Feature freeze** + deploy prod + QR impresso | Dev |
| 29/abr | **Dry-run** completo no escritório + tablets configurados | Todos |
| 30/abr | **Evento abre** · Goiânia | Operadora no stand |
| 01–02/mai | Monitoramento 3×/dia | Marketing |
| 03/mai 17h | **Sorteio ao vivo** no stand | Marketing + Operadora |
| 03/mai 18h | Disparo WhatsApp (fast-follow) | Marketing |

---

## 1. Configuração do Tablet Samsung (kiosk mode)

Objetivo: o tablet aberto no stand deve exibir **somente o quiz**, sem
permitir que visitantes saiam para outras apps. Auto-reset após conclusão.

### Passo a passo

1. **Instalar Fully Kiosk Browser** (Play Store, versão free serve).
2. Abrir o app e configurar:
   - **Start URL:** `https://<projeto>.vercel.app/?src=kiosk`
   - **Kiosk Mode → Enable Kiosk Mode:** ON
   - **Kiosk Mode → Lock Single App:** ON
   - **Gestures & Actions → Restore on Boot:** ON
   - **Gestures & Actions → Reload on Screen Off:** ON
   - **Motion Detection → Reload on idle:** 60s (auto-reset extra)
3. Configurações do **Android**:
   - **Settings → Display → Screen Timeout:** Never (ou máximo)
   - **Settings → Display → Stay awake (Developer Options):** ON
   - **Settings → Sound → Mute** (stand barulhento)
   - **Wi-Fi:** conectar à rede do evento + salvar senha
   - **Modo avião:** ativar se estiver usando só Wi-Fi do evento
4. **Cabo de força:** prender com abraçadeira para não cair.
5. **2º tablet backup:** mesma configuração, pronto para trocar em caso
   de travamento.

### Sair do kiosk mode (PIN)

Fully Kiosk pergunta PIN para sair. **Defina um PIN forte e guarde em local
seguro com a operadora.** (Sugestão: 6 dígitos, não óbvio)

---

## 2. QR Code para acesso via celular

- **URL:** `https://<projeto>.vercel.app/?src=qr`
- **Gerar QR:** usar [qrcode-monkey.com](https://qrcode-monkey.com/)
  ou similar — resolução mínima **500×500 px**.
- **Impressão:** plotagem em placa navy (Graphite Night) com QR
  centralizado, wordmark Contourline abaixo. Cta simples:
  **"Participe pelo seu celular"**.
- **Testar o QR impresso antes** do dia 30/abr com 3 celulares diferentes.

---

## 3. Checklist pré-evento (29/abr)

### Supabase
- [ ] RLS ativo em todas as tabelas (ver `supabase/migrations/*`)
- [ ] Seed das 3 perguntas confirmado (`select * from public.quiz_questions where is_active;`)
- [ ] Admin(s) criado(s) em `auth.users` e registrado(s) em `admin_users`
- [ ] Backup manual (Database → Backups → On-demand)
- [ ] Teste: enviar 5 leads de teste com `is_test=true` e validar no dashboard

### Aplicação
- [ ] Deploy Vercel produção verificado
- [ ] `RAFFLE_ADMIN_PIN` configurado em env vars (Vercel)
- [ ] URLs testadas em tablet real + celular iPhone + celular Android
- [ ] LGPD dialog abre corretamente em tablet e mobile
- [ ] Fluxo end-to-end completo (5 telas → submit → dashboard)

### Operação
- [ ] 2 tablets configurados em kiosk mode
- [ ] QR code impresso e testado
- [ ] Operadora treinada (pode acessar /admin, fazer sorteio)
- [ ] PIN do Fully Kiosk e do sorteio documentados (local seguro)
- [ ] Cabo de força, extensão, toalha pra limpar tela

---

## 4. Monitoramento durante o evento (30/abr–02/mai)

- **3× ao dia** (manhã / meio-dia / noite) checar:
  - Dashboard `/admin`: leads caindo normalmente?
  - Taxa de conclusão > 70%? Se < 50%, investigar (UX ou técnico)
- **Canal interno** (ex: WhatsApp "triLift-ops"):
  - Qualquer erro reportado, Dev responde em até 2h
- **Backup diário:**
  - Export CSV do `v_rd_export` todo dia 23h (via Supabase Studio)

---

## 5. Sorteio ao vivo (03/mai às 17h)

### Antes (até 16h)
1. Conferir total de elegíveis em `/admin/sorteio`
2. Anotar o **número da Loteria Federal do dia 03/05/2026** (publicado
   geralmente às 19h dos dias de sorteio). Como o evento é às 17h,
   alternativa: usar a **última cotação do dia anterior** ou o
   **número da extração anterior da Loteria Federal** — o importante é
   ser um número **público, auditável e imprevisível**.
3. Confirmar com o time qual seed será usada.

### No momento do sorteio
1. Acessar `/admin/sorteio` em tela grande (TV do stand ou projetor)
2. Preencher:
   - Seed pública (ex: `06543 · Loteria Federal 03/05/2026`)
   - PIN administrativo
   - Observação (opcional)
3. Clicar **"Executar sorteio"** — há uma animação de suspense curta e
   depois a revelação do nome
4. **Fotografar a tela** (nome + seed + hash) — prova do processo
5. Chamar o(a) ganhador(a) ao stand

### Caso o ganhador(a) não esteja presente
O sorteio já é auditável e público. Recomenda-se:
- Manter o resultado (não re-sortear arbitrariamente)
- Entrar em contato por telefone/WhatsApp (o dado está no cadastro)
- Se necessário re-sortear, executar NOVO sorteio com seed diferente e
  registrar justificativa em "Observação"

---

## 6. Pós-sorteio (03/mai 17h–18h)

1. Disparo WhatsApp para todos os leads (fast-follow)
   - Mensagem padrão: convite para grupo da comunidade Contourline +
     menção ao ganhador do sorteio
2. Export CSV dos leads para RD Station (se integração automática não
   estiver pronta): Supabase Studio → SQL → `select * from v_rd_export;`
   → exportar CSV → importar manualmente no RD Station

---

## 7. Contingências

| Cenário | Ação |
|---|---|
| Wi-Fi do stand cai | O quiz depende de internet para submit. Enquanto não volta, a operadora anota nome + telefone em papel para cadastro posterior. |
| Tablet principal trava | Trocar para o tablet backup (mesma URL, mesmo kiosk mode). |
| Tablet quebra / roubo | Usar QR code + tablet pessoal do time como fallback. |
| Página do quiz com erro 500 | Abrir log no Vercel dashboard; se urgente, acionar Dev. |
| Lead reporta "não recebi o sorteio" | Checar `/admin` se lead consta; se sim, explicar que é sorteio único; se não, investigar. |
| Dashboard lento | Recarregar manualmente — dados vêm direto do Supabase via view. |
| Sorteio com seed questionada | Auditoria pública — qualquer pessoa pode recalcular `sha256(seed + ids_elegíveis_ordenados)` e confirmar o índice do vencedor. |

---

## 8. Contatos durante o evento

> **Preencher antes do dia 30/abr:**

| Papel | Nome | Telefone | Backup |
|---|---|---|---|
| Operadora 1 (stand) | _____ | _____ | _____ |
| Operadora 2 (stand) | _____ | _____ | _____ |
| Marketing (dono do produto) | marketing@contourline.com.br | _____ | _____ |
| Dev (emergência técnica) | _____ | _____ | _____ |
