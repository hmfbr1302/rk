---
name: Projeto Rebeca Koteski (RK)
description: Site cirurgia plastica Curitiba — flywheel completo, quiz, CRM, blog SEO, identidade visual
type: project
---

## Visao Geral

Site da Dra. Rebeca Koteski, cirurgia plastica em Curitiba.
- **Dominio**: koteski.com.br
- **Repo**: github.com/hmfbr1302/rk (branch main = Vercel deploy)
- **Hosting**: Vercel (auto-deploy de main)
- **Diretorio local**: C:\Users\hugom\OneDrive\Area de Trabalho\Projeto Rebeca\rk
- **Stack**: HTML/CSS/JS puro (single page + blog statico)

## Pessoas

- **Dra. Rebeca Koteski** — cirurgia plastica, CRM PR 40326, RQE 34726
- **Raquel** — usa o WhatsApp Business (41) 98400-1601 para atendimento de pacientes
- **Hugo** — dev, gerencia o projeto e marketing digital
- **Instagram**: @rkoteski.cirurgiaplastica (forte, principal canal de aquisicao)

## Flywheel (modelo de geracao de cirurgias)

```
Instagram (forte) → Link bio /quiz → Pre-avaliacao (quiz 5 perguntas)
→ Lead na planilha (score 0-100) → Email alerta instantaneo com link WA
→ Raquel responde via WhatsApp → Consulta (R$170 online ou presencial)
→ Cirurgia → Paciente feliz → Conteudo Instagram → Loop
```

### Elos implementados (funcionando)
1. Instagram deep link → quiz auto-start (/quiz, ?ref=ig, #avaliacao)
2. Quiz com 5 perguntas (area, maturidade, bloqueio, perfil corporal, localizacao)
3. Score 0-100 com classificacao (Pronta agora / Alta intencao / Considerando / Pesquisando)
4. Google Sheets CRM 18 colunas com cores por urgencia
5. Email HTML alerta para TODO lead (identidade visual RK, botao WA)
6. UTM tracking (detecta Instagram por referrer automaticamente)
7. Meta Pixel (1297241215586855) + GA4 (G-H8MX64QSNX)
8. 264 blog posts SEO local (5 procedimentos x cidades PR + bairros CWB)
9. FAQ 6 perguntas na homepage
10. Secao Instagram social proof na homepage
11. Validacao anti-fake (nome sem numeros, celular com 9, DDD valido, bloqueia nomes falsos)

### Elos que faltam
1. **WhatsApp automatico** — Cloud API coexistencia com WA Business da Raquel (mesmo numero 41 98400-1601)
2. **Pagina Review Google** (/review) — QR/link pos-cirurgia
3. **Programa de indicacao** (/indica) — paciente indica amiga com tracking
4. **Nutricao de leads frios** — follow-up automatico 7/14/30 dias
5. **Retargeting Meta Ads** — pixel instalado, falta campanha

## Arquitetura Tecnica

### Site (index.html)
- Single page com secoes: Hero → Stats → Sobre → Procedimentos → Quiz → Depoimentos → FAQ → Instagram → Blog → CTA Final
- CSS inline, JS inline, zero dependencias externas
- Mobile-first: 90% do trafego vem de celular (Instagram)
- Fontes: Cormorant Garamond (serif) + DM Sans (sans-serif)
- Cores: --v:#6B1A2A (wine), --gold:#B08B80, --cream:#FEFCFB

### Variaveis globais no JS
- `CONSULTA_ONLINE = 170` — valor da consulta online, usado em 4 lugares automaticamente
- `SHEETS_URL` — webhook do Google Apps Script
- `BASE_COUNT = 208` / `BASE_DATE = 2026-04-28` / `DAYS_PER_PROC = 7` — contador dinamico de procedimentos

### Procedimentos (cards + quiz)
1. Lipoaspiracao (area: corpo)
2. Mamoplastia (area: seios)
3. **Blefaroplastia** (area: rosto) — substituiu rinoplastia, forte da Rebeca
4. Abdominoplastia (area: multi)

### Quiz → Resultado
- 5 perguntas com opcoes pre-definidas
- Score calculado no frontend: tempo(5-25) + bloqueio(10-35) + local(5-20) + perfil(12-20) = max 100
- Resultado mostra: perfil (Candidata Ideal/Pronta para Avaliar/Em Exploracao), procedimento, ancora de preco, faixa, CTA WhatsApp
- Urgencia dinamica: "Agenda de [mes atual] e [proximo mes] com vagas limitadas"
- Scroll automatico pro topo do card ao trocar tela (mobile)

### Google Sheets CRM
- **URL do Apps Script**: https://script.google.com/macros/s/AKfycbyQ7G1SQu9by8r7rRKOW7QYOKyPKrhBr9gIdSNOsV1k7aYlTO61N2ukAv0vwRqrVa9Fkw/exec
- **18 colunas**: Data, Nome, Telefone, Tel limpo, Procedimento, Area, Cidade, Bloqueio, Tempo pesquisando, Score (0-100), Momento de compra, Status, Observacoes, Link WhatsApp, Sensivel a preco, Data consulta, Operada?, Data cirurgia
- **Score colors**: verde (80+), amarelo (60+), azul (40+), cinza (<40)
- **Status dropdown**: Novo lead, Contatado, Consulta agendada, Consulta realizada, Proposta feita, Cirurgia fechada, Nao respondeu, Nao tem perfil, Reagendar
- **Email alerta**: HTML com identidade visual RK, botao WhatsApp, barra de score, dados da paciente — enviado para TODO lead
- **Versao atual**: v6/v7 do Apps Script
- **EMAIL_ALERTA**: hugo.medeiros@hotmail.com (teste), trocar para email da Raquel em producao

### Blog
- 264 posts + 1 index com filtros
- Categorias: lipoaspiracao, mamoplastia, rinoplastia, abdominoplastia, cirurgia plastica geral
- SEO local: cidades PR + bairros Curitiba
- Pilares: como e, quanto custa, recuperacao, riscos, resultados, candidata, parcelamento
- CTA: "Fazer minha pre-avaliacao gratuita →" (atualizado em todos os 264 posts)
- Consulta online: R$170 (atualizado em todos os posts)

### Vercel Config
- Branch de deploy: **main** (NAO master — commits vao pra master, push precisa ser `git push origin master:main`)
- Rewrite: /quiz → /index.html
- Dominio: koteski.com.br

### Imagens
- Formato: .jpg (avif nao funciona em todos os celulares, convertemos pra jpg)
- Card lipo: img/lipo.jpg (foto corporal)
- Card mama: img/mama.jpg
- Card blefaro: img/rino.jpg (nome antigo mantido)
- Card abdomino: img/abdomino.jpg
- Blog thumbs: img/blog/b-*.jpg

## Terminologia Importante

- **Pre-avaliacao** = quiz do site (gratuito, online, 2 minutos)
- **Avaliacao / Consulta** = consulta medica com a Dra. Rebeca (R$170 online, presencial em Curitiba)
- NUNCA confundir os dois termos no site, emails ou mensagens WA
- **Antes/depois**: PROIBIDO no site (CFM pode causar problema criminal)

## WhatsApp
- Numero: (41) 98400-1601 — 100% comercial, so pacientes
- Raquel usa WhatsApp Business app no celular
- Cloud API: possivel com coexistencia (desde 2024 Meta permite app + API no mesmo numero)
- Mensagem padrao do quiz: "Oi [nome]! Aqui e a equipe da Dra. Rebeca Koteski..."

## Git / Deploy
- SEMPRE push pra main E master: `git push origin master:main && git push origin master`
- Email de commit: hugo.medeiros@hotmail.com (Vercel bloqueia outro)
- NUNCA Co-Authored-By nos commits
- Vercel auto-deploy em ~60s apos push pra main
