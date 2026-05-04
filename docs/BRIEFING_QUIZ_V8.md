# Briefing técnico: Quiz V8 + Apps Script V8

**Status atual:** quiz funcional em `rk/index.html` linhas 851 a 1585. Apps Script v6 rodando.
**Objetivo:** integrar 11 melhorias de qualificação + score recalibrado + mensagens hiper-personalizadas.
**Arquivos a tocar:** `rk/index.html` (substituição cirúrgica) e `apps_script_v8.js` (novo, já criado, substitui v6 no Google Apps Script).
**Diretriz:** preservar tudo que funciona (UTM tracking, validação de telefone, identidade visual). Adicionar campos novos sem quebrar antigos.

---

## Visão geral das 11 melhorias

| # | Melhoria | Complexidade | Local |
|---|---|---|---|
| 1 | Captura early-bird do telefone na P3 | Média | Reordenar perguntas + nova tela |
| 2 | Tela de obrigada personalizada por score (4 versões) | Baixa | Função `buildResult` |
| 3 | Pergunta condicional para blefaroplastia | Baixa | Estrutura `QUESTIONS` + `renderQ` |
| 4 | localStorage para recuperação de abandono | Baixa | `startQuiz` + `nextQ` |
| 5 | Validação de telefone em tempo real (já existe, ampliar) | Já existe | Manter, adicionar feedback visual |
| 7 | Smart defaults via UTM | Baixa | Início do `startQuiz` |
| 8 | Foto da Rebeca em cada tela | Baixa | HTML de cada `.sc` |
| 9 | Pergunta de preferência de contato | Baixa | Adicionar no `s-cap` |
| 10 | Anti-spam minimalista (honeypot + rate limit) | Baixa | Form + sessionStorage |
| 11 | Tracking de evento por pergunta no Pixel | Baixa | `nextQ` |
| 12 | Reinforcement pós-captura | Baixa | Entre `submitCap` e `buildResult` |

(Melhoria 6 propositadamente fora: o "envie pelo meu WhatsApp" já é consentimento explícito mais limpo.)

---

## Quiz revisado: estrutura final das perguntas

**Quiz atual tem 5 perguntas** (área, tempo, bloqueio, perfil, localização). **Vai ter 7 perguntas + captura**:

1. **Área de interesse** (mantém igual)
2. **Procedimento específico** (NOVA - substitui o "perfil corporal" antigo da posição 4, que vai virar "contexto")
3. **Captura early-bird (NOVA)**: nome + telefone + "como prefere ser contatada?". Aqui antes do quiz continuar. Microcopy: "Para a Dra. Rebeca te enviar uma orientação personalizada baseada nas suas próximas respostas".
4. **Quando você quer fazer?** (NOVA - urgência temporal)
5. **Você já investiu em estética antes?** (NOVA)
6. **Contexto pessoal** (substitui o "perfil corporal", agora é polimórfica por área)
7. **Bloqueio** (mantém, com pequeno ajuste)
8. **Localização** (mantém igual)

Após P8: pular direto para `s-res` (tela de resultado, sem mais captura porque já capturou na P3).

O "tempo pesquisando" antigo SAI das perguntas (ele será inferido ou opcional). A urgência (quando quer fazer) substitui ele.

---

## Patch detalhado para `rk/index.html`

### MUDANÇA 1: Substituir a constante `QUESTIONS` (linhas 1312 a 1343)

```javascript
/* ── QUIZ DATA V8 ─────────────────────────────────────────── */
var QUESTIONS=[
  /* P1: Area */
  {id:'area',cat:"Área de interesse",tit:"Qual região você mais deseja transformar?",opts:[
    {t:"Corpo",s:"Barriga, flancos, coxas, braços",v:"corpo"},
    {t:"Seios",s:"Aumento, redução ou remodelação",v:"seios"},
    {t:"Rosto",s:"Pálpebras, nariz, bichectomia, harmonização",v:"rosto"},
    {t:"Múltiplas áreas",s:"Quero transformar mais de uma região",v:"multi"}
  ]},
  /* P2: Procedimento (condicional ao area) - sera renderizada dinamicamente */
  {id:'procedimento',cat:"Procedimento",tit:"Qual procedimento te interessa?",dynamic:true},
  /* CAPTURE - nao e pergunta, e tela especial s-cap (early bird) */
  {id:'capture',skip:true},
  /* P3: Urgencia */
  {id:'urgencia',cat:"Quando você quer fazer",tit:"Em que prazo você gostaria de realizar?",opts:[
    {t:"Próximos 2 a 3 meses",s:"Estou pronta para esse passo agora",v:"imediato"},
    {t:"Em 3 a 6 meses",s:"Quero me organizar com calma",v:"medio"},
    {t:"Ainda este ano",s:"Sem urgência, mas é uma decisão tomada",v:"esteano"},
    {t:"Próximo ano ou depois",s:"Estou planejando com antecedência",v:"proximoano"},
    {t:"Só pesquisando",s:"Quero entender antes de decidir",v:"pesquisando"}
  ]},
  /* P4: Ja investiu */
  {id:'ja_investiu',cat:"Histórico estético",tit:"Você já investiu em estética antes?",opts:[
    {t:"Já fiz cirurgia plástica",s:"Conheço o processo",v:"cirurgia"},
    {t:"Já fiz procedimentos não-cirúrgicos",s:"Botox, preenchimento, harmonização",v:"naocirurgico"},
    {t:"Estou pensando, mas nunca fiz",s:"Será meu primeiro procedimento",v:"pensando"},
    {t:"Nunca foi prioridade pra mim",s:"Estou só conhecendo o universo",v:"nunca"}
  ]},
  /* P5: Contexto - polimorfica por area, sera renderizada dinamicamente */
  {id:'contexto',cat:"Contexto pessoal",tit:"",dynamic:true},
  /* P6: Bloqueio */
  {id:'bloq',cat:"Principal bloqueio",tit:"O que mais te impede de agendar uma avaliação?",opts:[
    {t:"Quero entender se consigo pagar",s:"Preciso saber o valor real",v:"preco"},
    {t:"Ainda preciso de mais informações",s:"Quero entender melhor o procedimento",v:"info"},
    {t:"Tenho um pouco de receio",s:"É uma decisão importante",v:"medo"},
    {t:"Estou pronta para o próximo passo",s:"Só preciso encontrar a especialista certa",v:"pronta"}
  ]},
  /* P7: Localizacao */
  {id:'local',cat:"Localização",tit:"Onde você está?",opts:[
    {t:"Curitiba",s:"Pré-avaliação online ou presencial",v:"cwb"},
    {t:"Região Metropolitana",s:"Araucária, SJP, Colombo, Pinhais...",v:"metro"},
    {t:"Outra cidade do Paraná",s:"Faria a pré-avaliação online",v:"pr"},
    {t:"Outro estado",s:"Faria a pré-avaliação online",v:"outro"}
  ]}
];

/* Procedimentos por area (P2 dinamica) */
var PROC_OPCOES={
  corpo:[
    {t:"Lipoaspiração",s:"Gordura localizada",v:"lipo"},
    {t:"Abdominoplastia",s:"Remoção de pele + reconstrução abdominal",v:"abdomino"},
    {t:"Lipo + Abdomino",s:"Combinação clássica",v:"lipo_abdomino"},
    {t:"Pós-bariátrica",s:"Após perda de peso significativa",v:"posbariatrica"},
    {t:"Não sei ainda",s:"Quero a Dra. me orientar",v:"naosei"}
  ],
  seios:[
    {t:"Prótese de silicone",s:"Aumento e contorno",v:"protese"},
    {t:"Mastopexia",s:"Levantamento sem prótese",v:"mastopexia"},
    {t:"Mastopexia + prótese",s:"Levantamento com volume",v:"mastopexia_protese"},
    {t:"Redução",s:"Diminuição do volume",v:"reducao"},
    {t:"Não sei ainda",s:"Quero a Dra. me orientar",v:"naosei"}
  ],
  rosto:[
    {t:"Blefaroplastia",s:"Cirurgia das pálpebras",v:"blefaro"},
    {t:"Rinoplastia",s:"Cirurgia do nariz",v:"rino"},
    {t:"Bichectomia",s:"Refinamento das bochechas",v:"bichec"},
    {t:"Harmonização facial",s:"Procedimentos não-cirúrgicos integrados",v:"harmonizacao"},
    {t:"Não sei ainda",s:"Quero a Dra. me orientar",v:"naosei"}
  ],
  multi:[
    {t:"Mommy makeover",s:"Mama + abdome (combinação pós-gestação)",v:"mommy"},
    {t:"Lipo + mama",s:"Contorno corporal + mama",v:"lipo_mama"},
    {t:"Face + corpo",s:"Combinação ampla",v:"face_corpo"},
    {t:"Não sei ainda",s:"Quero a Dra. me orientar",v:"naosei"}
  ]
};

/* Contexto polimorfico (P5 dinamica) por area */
var CONTEXTO_OPCOES={
  /* Para mama e corpo: gestacao */
  mae:{
    tit:"Sua história com gestação:",
    opts:[
      {t:"Tenho 1 filho e amamentei",s:"Corpo mudou após gestação e amamentação",v:"mae_amamentou_um"},
      {t:"Tenho mais de um filho e amamentei",s:"Várias gestações e amamentações",v:"mae_amamentou_mais"},
      {t:"Tenho filho mas não amamentei",s:"Gestação sem amamentação",v:"mae_nao_amamentou"},
      {t:"Não tenho filhos",s:"Outras motivações",v:"sem_filhos"},
      {t:"Estou planejando ter",s:"Talvez seja melhor esperar",v:"planejando"}
    ]
  },
  /* Para blefaroplastia especificamente */
  blefaro:{
    tit:"O que mais te incomoda hoje?",
    opts:[
      {t:"Pessoas dizem que pareço cansada",s:"Olhar abatido o tempo todo",v:"cansada"},
      {t:"Tenho dificuldade visual",s:"A pálpebra atrapalha o campo de visão",v:"funcional"},
      {t:"Os dois motivos",s:"Estético e funcional",v:"ambos"}
    ]
  },
  /* Para rosto em geral */
  rosto:{
    tit:"Sua principal motivação:",
    opts:[
      {t:"Estética pura",s:"Quero me sentir melhor com o que vejo",v:"estetica"},
      {t:"Funcional + estético",s:"Tem questão prática junto",v:"ambos"},
      {t:"Após acidente ou trauma",s:"Reconstrutivo",v:"reconstrutivo"}
    ]
  }
};
```

### MUDANÇA 2: Função `renderQ` precisa lidar com perguntas dinâmicas

Substituir função `renderQ` (linhas 1388 a 1410) por:

```javascript
function renderQ(i){
  var q=QUESTIONS[i];
  if(q.skip){nextQ();return;} /* pula tela de captura early-bird, e gerenciada separadamente */

  /* Resolver perguntas dinamicas */
  if(q.dynamic && q.id==='procedimento'){
    var area=ans[0]||'corpo';
    q=Object.assign({},q,{opts:PROC_OPCOES[area]||PROC_OPCOES.corpo});
    q.tit="Qual procedimento te interessa?";
  }
  if(q.dynamic && q.id==='contexto'){
    var area=ans[0]||'corpo';
    var proc=ans[1]||'';
    var ctxKey;
    if(proc==='blefaro') ctxKey='blefaro';
    else if(area==='rosto' && proc!=='blefaro') ctxKey='rosto';
    else ctxKey='mae'; /* mama, corpo, multi */
    var ctxConfig=CONTEXTO_OPCOES[ctxKey];
    q=Object.assign({},q,{opts:ctxConfig.opts,tit:ctxConfig.tit});
  }

  var pct=Math.round(((i+1)/QUESTIONS.length)*100);
  document.getElementById('qcat').textContent=q.cat;
  document.getElementById('qtit').textContent=q.tit;
  document.getElementById('plbl').textContent='Pergunta '+(i+1)+' de '+QUESTIONS.length;
  document.getElementById('ppct').textContent=pct+'%';
  document.getElementById('pfill').style.width=pct+'%';

  var c=document.getElementById('qopts');c.innerHTML='';
  q.opts.forEach(function(o){
    var d=document.createElement('div');
    d.className='opt'+(ans[i]===o.v?' sel':'');
    d.innerHTML='<div class="opt-body"><div class="opt-txt">'+o.t+'</div><div class="opt-sub">'+o.s+'</div></div><div class="opt-radio"></div>';
    d.onclick=function(){
      c.querySelectorAll('.opt').forEach(function(x){x.classList.remove('sel');});
      d.classList.add('sel');ans[i]=o.v;
      document.getElementById('bnx').disabled=false;
      /* Salva progresso (Melhoria 4) */
      saveProgress();
      /* Tracking por pergunta no Pixel (Melhoria 11) */
      if(typeof fbq!=='undefined')fbq('trackCustom','QuizQuestion',{question:q.id,answer:o.v,position:i+1});
    };
    c.appendChild(d);
  });
  document.getElementById('bnx').disabled=(ans[i]===undefined);
  document.getElementById('bbk').style.visibility=(i===0)?'hidden':'visible';
}
```

### MUDANÇA 3: Função `nextQ` deve abrir tela de captura early-bird na P3

Substituir `nextQ` (linhas 1412 a 1416) por:

```javascript
function nextQ(){
  if(QUESTIONS[idx].skip){idx++;renderQ(idx);return;}
  if(ans[idx]===undefined && !QUESTIONS[idx].skip)return;
  /* Se acabou de responder P2 (procedimento), abrir tela de captura early-bird */
  if(idx===1 && !uData.tel){
    show('s-cap-early');
    return;
  }
  if(idx<QUESTIONS.length-1){
    idx++;
    /* Pula a tela de captura quando voltamos pelo flow normal (ja foi feita na P3) */
    while(idx<QUESTIONS.length && QUESTIONS[idx].skip){idx++;}
    if(idx<QUESTIONS.length){renderQ(idx);saveProgress();}
    else{
      if(typeof fbq!=='undefined')fbq('track','InitiateCheckout');
      startLoad();
    }
  }else{
    if(typeof fbq!=='undefined')fbq('track','InitiateCheckout');
    startLoad();
  }
}
```

### MUDANÇA 4: Adicionar nova tela `s-cap-early` no HTML do quiz (perto da `s-cap` atual)

Adicionar depois da tag `<div class="sc" id="s-cap">...</div>` (perto da linha 868), uma nova:

```html
<div class="sc" id="s-cap-early">
  <div class="cap-hd">
    <div class="cap-eyebrow">Falta pouco</div>
    <h2 class="cap-tit">Pra <em>continuar</em>, pode me dizer seu nome?</h2>
    <p class="cap-sub">Vou usar pra Dra. Rebeca te enviar uma orientação personalizada com base no que você responder a seguir.</p>
  </div>
  <div class="cap-form">
    <input type="text" id="fnome-early" placeholder="Seu nome completo" autocomplete="name">
    <div class="err-msg" id="enome-early"></div>
    <input type="tel" id="ftel-early" placeholder="WhatsApp com DDD" autocomplete="tel" inputmode="numeric">
    <div class="err-msg" id="etel-early"></div>
    <!-- Honeypot anti-spam (Melhoria 10) - escondido para humanos -->
    <input type="text" id="hp-field" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;width:0;height:0">
    <div class="contato-pref">
      <div class="cap-eyebrow" style="margin-bottom:8px">Como prefere ser contatada?</div>
      <div class="contato-opts">
        <label><input type="radio" name="contato" value="whatsapp" checked> WhatsApp</label>
        <label><input type="radio" name="contato" value="ligacao"> Ligação</label>
        <label><input type="radio" name="contato" value="ambos"> Os dois</label>
      </div>
    </div>
    <button class="btn btn-p" id="btn-early" onclick="submitEarly()">Continuar pré-avaliação →</button>
  </div>
</div>
```

CSS extra (cole no `<style>` da página):

```css
.contato-pref{margin:18px 0}
.contato-opts{display:flex;gap:14px;flex-wrap:wrap}
.contato-opts label{display:flex;align-items:center;gap:6px;font-size:14px;color:#5A4040;cursor:pointer;padding:8px 14px;border:1px solid #E0D0CC;border-radius:50px;transition:all .2s}
.contato-opts label:has(input:checked){background:#6B1A2A;color:#fff;border-color:#6B1A2A}
.contato-opts input{accent-color:#6B1A2A}
```

### MUDANÇA 5: Funções novas para early-bird, validações já existentes (apenas adicionar `submitEarly`)

```javascript
function submitEarly(){
  /* Honeypot - se preenchido, e bot */
  if(document.getElementById('hp-field').value!==''){return;}
  /* Rate limit (Melhoria 10) - 3 tentativas/hora */
  var attempts=parseInt(sessionStorage.getItem('quiz_attempts')||'0');
  if(attempts>=3){
    document.getElementById('etel-early').textContent='Muitas tentativas. Aguarde alguns minutos.';
    document.getElementById('etel-early').classList.add('on');
    return;
  }
  sessionStorage.setItem('quiz_attempts',attempts+1);

  var nome=document.getElementById('fnome-early').value.trim();
  var tel=document.getElementById('ftel-early').value.trim();
  var pref=document.querySelector('input[name="contato"]:checked');
  var ok=true;
  ['enome-early','etel-early'].forEach(function(id){document.getElementById(id).classList.remove('on');});
  ['fnome-early','ftel-early'].forEach(function(id){document.getElementById(id).classList.remove('err');});
  var vn=validNome(nome);
  if(!vn.ok){document.getElementById('enome-early').textContent=vn.msg;document.getElementById('enome-early').classList.add('on');document.getElementById('fnome-early').classList.add('err');ok=false;}
  var vt=validTel(tel);
  if(!vt.ok){document.getElementById('etel-early').textContent=vt.msg;document.getElementById('etel-early').classList.add('on');document.getElementById('ftel-early').classList.add('err');ok=false;}
  if(!ok)return;

  uData={nome:nome,tel:tel.replace(/\D/g,''),contato_pref:pref?pref.value:'whatsapp'};
  saveProgress();
  if(typeof fbq!=='undefined')fbq('track','Lead',{content_name:'quiz_early_capture'});
  /* Avança para P3 (urgencia) */
  idx=3;
  show('s-quiz');
  renderQ(idx);
}

function saveProgress(){
  try{
    var snap={ans:ans,uData:uData,idx:idx,ts:Date.now()};
    localStorage.setItem('quiz_progress',JSON.stringify(snap));
  }catch(e){}
}

function loadProgress(){
  try{
    var raw=localStorage.getItem('quiz_progress');
    if(!raw)return null;
    var snap=JSON.parse(raw);
    /* So restaura se for menos de 7 dias */
    if(Date.now()-snap.ts>7*24*60*60*1000){
      localStorage.removeItem('quiz_progress');
      return null;
    }
    return snap;
  }catch(e){return null;}
}

function clearProgress(){try{localStorage.removeItem('quiz_progress');}catch(e){}}

/* Mascara de telefone tambem no campo early */
document.getElementById('ftel-early').addEventListener('input',function(){
  var d=this.value.replace(/\D/g,''),f='';
  if(d.length>0)f='('+d.substring(0,2);
  if(d.length>2)f+=') '+d.substring(2,7);
  if(d.length>7)f+='-'+d.substring(7,11);
  this.value=f;
});
```

### MUDANÇA 6: `startQuiz` - smart defaults via UTM + recuperação de progresso

Substituir `startQuiz` (linhas 1380 a 1386):

```javascript
function startQuiz(){
  if(typeof fbq!=='undefined')fbq('track','ViewContent',{content_name:'quiz_start'});
  if(typeof gtag!=='undefined')gtag('event','begin_checkout',{items:[{item_name:'quiz_start'}]});

  /* Recuperacao de abandono (Melhoria 4) */
  var saved=loadProgress();
  if(saved && saved.uData && saved.uData.tel && saved.idx>=3){
    /* Ja preencheu captura, retoma de onde parou */
    if(confirm('Detectei que você começou esta pré-avaliação antes. Quer continuar de onde parou?')){
      ans=saved.ans;uData=saved.uData;idx=saved.idx;
      show('s-quiz');renderQ(idx);
      return;
    }else{
      clearProgress();
    }
  }

  idx=0;ans=[];uData={nome:'',tel:''};

  /* Smart defaults via UTM (Melhoria 7) */
  /* Ex: utm_content=blefaroplastia abre quiz com Rosto+Blefaro pre-selecionado */
  var utmContent=(UTM.content||'').toLowerCase();
  var precos={
    'blefaroplastia':['rosto','blefaro'],'blefaro':['rosto','blefaro'],
    'rinoplastia':['rosto','rino'],'bichectomia':['rosto','bichec'],
    'mamoplastia':['seios','protese'],'mama':['seios','protese'],
    'mastopexia':['seios','mastopexia'],'protese':['seios','protese'],
    'abdominoplastia':['corpo','abdomino'],'abdomino':['corpo','abdomino'],
    'lipo':['corpo','lipo'],'lipoaspiracao':['corpo','lipo'],
    'mommy':['multi','mommy'],'posbariatrica':['corpo','posbariatrica']
  };
  if(precos[utmContent]){ans[0]=precos[utmContent][0];ans[1]=precos[utmContent][1];idx=2;/* pula direto pra captura early */}
  else if(preSelectedArea){ans[0]=preSelectedArea;idx=1;}

  show('s-quiz');renderQ(idx);
}
```

### MUDANÇA 7: `calcScore` recalibrado para v8

Substituir `calcScore` (linhas 1472 a 1478):

```javascript
function calcScoreV8(){
  var s=0;
  var area=ans[0],proc=ans[1],urg=ans[3],invest=ans[4],ctx=ans[5],bloq=ans[6],local=ans[7];

  s+=({pronta:25,medo:15,info:10,preco:5}[bloq]||0);
  s+=({imediato:30,medio:22,esteano:12,proximoano:5,pesquisando:0}[urg]||0);
  s+=({cirurgia:20,naocirurgico:15,pensando:5,nunca:0}[invest]||0);

  /* Cruzamento procedimento + contexto */
  var procL=(proc||'').toLowerCase();
  if((area==='seios') && (ctx==='mae_amamentou_um'||ctx==='mae_amamentou_mais'))s+=15;
  else if((area==='corpo') && (ctx==='mae_amamentou_um'||ctx==='mae_amamentou_mais'||ctx==='mae_nao_amamentou'))s+=12;
  else if(proc==='blefaro' && (ctx==='funcional'||ctx==='ambos'))s+=15;
  else if(proc==='blefaro' && ctx==='cansada')s+=10;
  else if(ctx)s+=5;

  if(proc && proc!=='naosei')s+=5;
  s+=({cwb:5,metro:5,pr:4,outro:3}[local]||0);
  if(proc==='blefaro')s+=5;
  if(bloq==='preco')s-=15;

  return Math.max(0,Math.min(100,s));
}
```

E **renomear todas as chamadas** de `calcScore()` por `calcScoreV8()` no resto do código.

### MUDANÇA 8: `buildResult` com tela de obrigada personalizada por score (Melhoria 2 e 12)

Bloco grande, começa na linha 1480. Aqui, manter quase tudo igual (já é bom), só adicionar no início:

```javascript
function buildResult(){
  var area=ans[0]||'corpo',local=ans[7],proc=ans[1],score=calcScoreV8();
  var fn=uData.nome?uData.nome.split(' ')[0]:'';

  /* Reinforcement pos-captura (Melhoria 12) - mostra mensagem de comprometimento por 1.5s */
  document.getElementById('s-res').innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-family:Georgia,serif;font-size:32px;color:#4A0F1C;margin-bottom:14px">Ótimo, '+fn+'!</div><div style="font-size:15px;color:#5A4040">A Dra. Rebeca vai entrar em contato com você. Estou montando seu diagnóstico personalizado...</div></div>';
  show('s-res');
  setTimeout(function(){buildResultFinal();},1500);
}

function buildResultFinal(){
  var area=ans[0]||'corpo',local=ans[7],proc=ans[1],score=calcScoreV8();
  /* ...resto da funcao buildResult original adaptada para os indices novos... */
  /* IMPORTANTE: ans agora tem indices: [0]area, [1]procedimento, [2]captura(skip), [3]urgencia, [4]ja_investiu, [5]contexto, [6]bloqueio, [7]localizacao */
  /* Ajustar todas as referencias a ans[X] no resto da funcao */
  /* PROCS map ainda existe e funciona, mas agora tem que ser PROC_INFO mais granular ou pegar o procedimento exato */

  /* Limpa progresso (foi concluido) */
  clearProgress();
  /* CTA muda por score */
  var ctaPersonalizado='';
  if(score>=85){
    ctaPersonalizado='<div class="cta-urgent"><div class="cta-eyebrow">A Dra. Rebeca tem horários abertos esta semana</div><a href="https://wa.me/'+WA+'?text='+msgP+'" class="btn btn-p btn-urgent">Ver horários disponíveis →</a></div>';
  } else if(score>=65){
    ctaPersonalizado='<a href="https://wa.me/'+WA+'?text='+msgP+'" class="btn btn-p">Agendar pré-avaliação online →</a>';
  } else if(score>=40){
    ctaPersonalizado='<a href="https://wa.me/'+WA+'?text='+msgP+'" class="btn btn-p btn-soft">Conversar sem compromisso →</a><div class="leitura-extra"><a href="/blog/" target="_blank">Ler artigos sobre '+proc+' enquanto pensa</a></div>';
  } else {
    ctaPersonalizado='<a href="/blog/" class="btn btn-soft">Receber material sobre '+proc+'</a>';
  }
  /* ...inserir ctaPersonalizado no HTML do s-res no lugar do CTA atual... */
}
```

### MUDANÇA 9: `submitCap` agora é só fallback (legado)

A função `submitCap` (linhas 1446 a 1463) atualmente captura no fim do quiz. No v8, a captura é early-bird. `submitCap` pode ser removida OU mantida como fallback caso o usuário pule a captura early. Recomendação: mantenha mas só será chamada se `uData.tel` estiver vazio quando chegar na linha de submissão.

### MUDANÇA 10: Foto da Rebeca em cada tela (Melhoria 8)

Adicionar no início de cada `<div class="sc" id="s-quiz">`, `<div class="sc" id="s-cap-early">`, `<div class="sc" id="s-cap">` um header pequeno com avatar:

```html
<div class="sc-medic">
  <img src="/img/rebeca-avatar-mini.jpg" alt="Dra. Rebeca Koteski" class="sc-avatar">
  <div>
    <div class="sc-name">Dra. Rebeca Koteski</div>
    <div class="sc-crm">CRM PR 40326 · Cirurgia Plástica</div>
  </div>
</div>
```

CSS:

```css
.sc-medic{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid #F0E8E4;margin-bottom:18px}
.sc-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #B08B80}
.sc-name{font-family:Georgia,serif;font-size:14px;color:#4A0F1C;font-weight:bold}
.sc-crm{font-size:11px;color:#9A8080;letter-spacing:.5px}
```

Você precisa criar/exportar `rebeca-avatar-mini.jpg` (200x200, recortada, .avif/.jpg) na pasta `rk/img/`.

### MUDANÇA 11: Payload do `fetch` para Apps Script (envia campos novos)

Na linha 1522 a 1547, atualizar o `payload`:

```javascript
var payload=JSON.stringify({
  nome:uData.nome,
  tel:uData.tel,
  tel_wa:'55'+uData.tel,
  area:ans[0],
  procedimento:ans[1],
  urgencia:ans[3],
  ja_investiu:ans[4],
  contexto:ans[5],
  bloq:ans[6],
  local:ans[7],
  contato_pref:uData.contato_pref||'whatsapp',
  perfil:prof.nome,
  ancora:proc.ancora.replace(/&nbsp;/g,' '),
  faixa:proc.faixa||'',
  score:score,
  sensivel_preco:ans[6]==='preco',
  utm_source:UTM.source,
  utm_medium:UTM.medium,
  utm_campaign:UTM.campaign,
  utm_content:UTM.content,
  referrer:document.referrer||'(direto)',
  pagina:window.location.href,
  dispositivo:/Mobi|Android/i.test(navigator.userAgent)?'Mobile':'Desktop',
  ts:new Date().toISOString()
});
```

---

## Apps Script V8 (já criado, em `apps_script_v8.js`)

Substitui o v6 atual no Google Apps Script. Já tem:
- Score recalibrado com cruzamentos
- Mensagem hiper-personalizada por combinação tier+procedimento+contexto
- Estrutura nova do Sheets com 4 colunas extras (Urgência, Já investiu, Contexto, Contato preferido)
- Migração não-destrutiva: se a aba Leads já existe do v6, adiciona colunas novas sem perder dados
- Email visual para Raquel mantido (faixa colorida, botão verde gigante, emojis no assunto)

Como deployar:
1. Abrir https://script.google.com → projeto da Rebeca
2. Substituir conteúdo do arquivo principal pelo conteúdo de `apps_script_v8.js`
3. Save → Deploy → Manage deployments → Edit no deployment ativo → Version: New version → Deploy
4. URL pública continua a mesma. Mudança ativa em segundos.

---

## Estrutura nova do Sheets

Coluna | Origem
---|---
A. Data | apps_script (timestamp)
B. Nome | quiz
C. Telefone | quiz (formatado)
D. Tel limpo | quiz (só dígitos)
E. Procedimento | quiz P2
F. Área | quiz P1
G. Cidade | quiz P7
H. Bloqueio | quiz P6
I. Tempo pesquisando | (legado, vazio no v8)
J. **Urgência (NOVA)** | quiz P3
K. **Já investiu (NOVA)** | quiz P4
L. **Contexto (NOVA)** | quiz P5 (polimórfico)
M. **Contato preferido (NOVA)** | early-bird capture
N. Score (0-100) | apps_script calculado
O. Momento de compra | apps_script classificado
P. Status | dropdown (Novo lead, Contatado, etc)
Q. Observações | manual
R. Link WhatsApp Lead | apps_script (wa.me com mensagem pronta)
S. Sensível a preço | quiz inferido
T-V. UTMs | quiz (source, medium, campaign)
W. Data consulta | manual
X. Operada? | manual
Y. Data cirurgia | manual

A migração é AUTOMÁTICA. Se a aba já tem 18 colunas (v6), o v8 detecta e adiciona as 7 novas no fim, sem mexer nas existentes.

---

## Testes obrigatórios após deploy

1. **Quiz sem UTM**: abrir koteski.com.br/quiz, percorrer todas as 7 perguntas + early-bird, verificar que email chega corretamente, Sheets recebe linha completa.

2. **Quiz com UTM**: abrir koteski.com.br/quiz?utm_source=instagram&utm_content=blefaroplastia, verificar que abre direto na P3 (Urgência) com Rosto+Blefaroplastia já marcados.

3. **Telefone inválido**: tentar enviar telefone formato errado, validação deve bloquear.

4. **Honeypot**: tentar enviar via console JS preenchendo o campo `hp-field`. Submissão deve ser bloqueada silenciosamente.

5. **Recuperação de progresso**: começar quiz, fechar aba na P5, abrir de novo. Deve aparecer pop-up "quer continuar de onde parou?".

6. **Email com mensagem personalizada**: testar 4 perfis (score >85, 65-84, 40-64, <40) e verificar que o texto da mensagem dentro do email muda.

7. **Mensagem para blefaroplastia funcional**: marcar Rosto + Blefaro + funcional + alta urgência + pronta. Mensagem do WhatsApp deve mencionar "casos funcionais" e "convênio".

---

## Plano de rollback se algo quebrar

1. Reverter `apps_script_v8.js` para `apps_script_v6.js` no Google Apps Script (cola o código v6 antigo)
2. Reverter as mudanças no `rk/index.html` via `git revert` do commit do v8
3. Sheets fica intacto (migração foi não-destrutiva, colunas novas continuam, dados antigos não foram tocados)

---

## Estimativa de impacto

- Conversão quiz → captura: +25% (early-bird captura nome/tel mesmo se abandonar perguntas restantes)
- Qualidade do score: +50% (cruzamentos + sinais melhores)
- Personalização da mensagem: ganho difícil de medir mas é o que diferencia "robô" de "humano cuidando"
- Tempo de implementação: 4 a 6 horas para outro Claude com Cursor aplicar e testar

---

## Resumo executivo do que fica feito após esse deploy

Quiz com 7 perguntas inteligentes (procedimento específico em vez de área genérica, urgência temporal capturando intenção real, histórico estético como proxy comportamental, contexto polimórfico que adapta para mama/abdomino/blefaroplastia/rosto). Captura de telefone na P3 em vez de no fim, eleva conversão. Score recalibrado de 0-100 com cruzamentos sofisticados, blefaroplastia bonificada, sensibilidade a preço penalizada. Mensagem que sai pronta no WhatsApp se monta combinando tier + procedimento + contexto, virando hiper-personalizada sem ninguém digitar. Tela de obrigada com 4 versões diferentes por score. Smart defaults via UTM aceleram quiz quando lead vem de campanha específica. Anti-spam invisível protege de bots. Recuperação de progresso impede perda de leads que abandonam. Foto da Dra. Rebeca em cada tela aumenta confiança. Email para a Raquel mantém visual puro (faixa colorida, botão verde gigante, emojis no assunto). Hugo monitora via Sheets em tempo real e relatório semanal automatizado (próximo entregável).
