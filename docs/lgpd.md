# Termo de Consentimento LGPD — Quiz Contourline CBCD 2026

**Versão:** `v1.0-2026-04-23`
**Última revisão:** 23 de abril de 2026

> ⚠️ **Atenção jurídica:** este texto é uma proposta técnica. **Revise com o
> advogado / compliance da Contourline antes do dia 29/abr/2026**. Qualquer
> alteração deve ser acompanhada de incremento na **versão** (usado no campo
> `consent_version` do banco para rastreabilidade).

---

## Texto a exibir na Tela 1 (junto ao checkbox)

> **Autorizo a Contourline Medicina Estética Ltda.** (CNPJ _____) a coletar e
> tratar os dados pessoais fornecidos neste cadastro — **nome, especialidade,
> CRM, telefone e e-mail** — para as seguintes finalidades:
>
> 1. **Participação no sorteio** realizado no estande da Contourline durante
>    o CBCD 2026, a ser apurado no último dia do evento (03/mai/2026);
> 2. **Envio de comunicações profissionais** sobre produtos, tecnologias,
>    treinamentos e conteúdos da Contourline, por **WhatsApp, e-mail e
>    telefone**, inclusive convite para grupo/comunidade de médicos;
> 3. **Gestão de relacionamento comercial** e follow-up por representantes
>    oficiais da Contourline.
>
> Os dados serão armazenados em ambiente controlado (Supabase — AWS), pelo
> prazo máximo de **24 meses após o evento**, salvo renovação de
> consentimento ou obrigação legal diversa. Posso **revogar este
> consentimento a qualquer momento** enviando mensagem para
> `marketing@contourline.com.br` ou `privacidade@contourline.com.br` (se
> aplicável), sem impacto retroativo sobre os tratamentos já realizados.
>
> Declaro ter lido e concordado com a
> [Política de Privacidade da Contourline](https://contourline.com.br/privacidade).

**Checkbox obrigatório:** *Li e concordo com o tratamento dos meus dados
conforme descrito acima e com a Política de Privacidade da Contourline.*

---

## Versão curta (para UI)

```
Autorizo a Contourline a tratar meus dados (nome, CRM, especialidade, e-mail,
telefone) para participação no sorteio, envio de comunicações profissionais
e relacionamento comercial, conforme a Política de Privacidade.
```

---

## Bases legais (LGPD art. 7º / 11)

| Finalidade | Base legal | Justificativa |
|---|---|---|
| Participação no sorteio | Consentimento (art. 7º I) | Ação promocional, não essencial à relação comercial |
| Comunicação marketing | Consentimento (art. 7º I) | Envio ativo de conteúdo depende de opt-in expresso |
| Relacionamento comercial | Legítimo interesse (art. 7º IX) | Lead qualificado em contexto B2B — médico no evento do setor |

---

## Obrigações operacionais

1. **Não pré-marcar** o checkbox — precisa ser ativado pelo lead.
2. **Registrar** versão do termo, IP, User-Agent e timestamp do consent
   (já automatizado pelo trigger `log_consent_change`).
3. **Permitir revogação** — canal de e-mail de contato claro no termo e no
   WhatsApp enviado no pós-evento.
4. **Anonimizar** (não só deletar) dados de quem revogar — função
   `anonymize_lead(uuid)` preserva agregados sem reter PII.
5. **Transparência no sorteio** — seed pública (ex: número da Loteria
   Federal do dia), snapshot da lista de elegíveis e hash auditável são
   gravados na tabela `raffle_draws`.

---

## Ajustes antes de publicar

- [ ] Inserir **CNPJ** correto da Contourline
- [ ] Confirmar URL da **Política de Privacidade** (criar se não existir)
- [ ] Confirmar e-mail de revogação — se houver DPO ou `privacidade@`,
      adicionar e remover o de marketing
- [ ] Revisão jurídica e incremento de versão se houver mudança textual
- [ ] Opcional: adicionar texto específico sobre retenção em caso de
      relação comercial iniciada (fora do escopo de marketing)
