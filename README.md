# koteski.com.br — Site da Dra. Rebeca Koteski

Site institucional e máquina de captação de leads para consultório de cirurgia plástica em Curitiba, PR.

---

## Estrutura do projeto

```
/
├── index.html          # Landing page principal
├── sitemap.xml         # Sitemap para Google Search Console
├── img/
│   ├── rebeca.jpg      # Foto da Dra. Rebeca (seção Sobre)
│   ├── hero.jpg        # Imagem de fundo do hero
│   ├── lipo.jpg        # Card Lipoaspiração
│   ├── mama.jpg        # Card Mamoplastia
│   ├── rino.jpg        # Card Rinoplastia
│   ├── abdomino.jpg    # Card Abdominoplastia
│   └── og-image.jpg    # Imagem para compartilhamento WhatsApp/redes
└── blog/
    └── [264 páginas SEO geradas automaticamente]
```

---

## Funcionalidades

### Landing page (`index.html`)
- Hero com parallax e animação palavra por palavra
- Contador de procedimentos dinâmico — aumenta +1 a cada 3 dias automaticamente a partir de 108 (base: 27/03/2026)
- Quiz de qualificação de 5 perguntas com resultado personalizado
- Captura de nome e telefone antes de mostrar estimativa de preço
- Âncora de preço alta + opção de parcelamento para leads sensíveis a preço
- Integração com Google Sheets via Apps Script (webhook configurável)
- Meta Pixel integrado com 5 eventos: PageView, ViewContent, InitiateCheckout, Lead, Contact
- CTAs diretos para WhatsApp com mensagem pré-preenchida por perfil
- Bottom bar fixa no mobile com botão de avaliação + WhatsApp
- Open Graph configurada para compartilhamento no WhatsApp

### SEO programático (`/blog/`)
264 páginas geradas automaticamente cobrindo:
- Procedimento + cidade (85 páginas) — ex: `lipoaspiracao-em-londrina`
- Procedimento + bairro de Curitiba (90 páginas) — ex: `rinoplastia-no-batel`
- Perguntas e dúvidas (80 páginas) — ex: `quanto-custa-lipoaspiracao`
- Comparações (9 páginas) — ex: `silicone-redondo-ou-anatomico`

Cada página tem: title tag único, meta description, Schema.org (MedicalWebPage / FAQPage), breadcrumb, FAQ estruturado, links internos cruzados e CTA para o quiz.

---

## Configuração

### Para ativar a coleta de leads no Google Sheets

1. Abra a planilha: [Leads — Quiz RK](https://docs.google.com/spreadsheets/d/1b_MnP9SchjCaeM4B-JBkcIqAMnoJrnFURswh8C2xcwk)
2. Menu **Extensões → Apps Script**
3. Cole o conteúdo do arquivo `apps_script.js` (disponível separadamente)
4. Publique como Web App com acesso **Qualquer pessoa**
5. Copie a URL gerada e cole no `index.html`:
```js
var SHEETS_URL = 'https://script.google.com/macros/s/SEU_ID/exec';
```

### Para ativar o Meta Pixel

No `index.html`, substitua `PIXEL_ID_AQUI` pelo ID real:
```js
var PIXEL_ID = '1234567890123456';
```

---

## Deploy

Hospedado na **Vercel**, conectado a este repositório via GitHub.  
Domínio: **koteski.com.br** (DNS configurado via Cloudflare)

Qualquer push na branch `main` republica automaticamente.

---

## Identidade visual

| Elemento | Valor |
|----------|-------|
| Cor primária | `#6B1A2A` (vinho) |
| Cor secundária | `#A0834A` (dourado) |
| Fundo | `#FEFCFB` (creme) |
| Fonte display | Cormorant Garamond |
| Fonte corpo | DM Sans |

---

## Médica responsável

**Dra. Rebeca Koteski**  
CRM PR 40326 · RQE 34726  
[@rkoteski.cirurgiaplastica](https://instagram.com/rkoteski.cirurgiaplastica)  
WhatsApp: (41) 98400-1601
