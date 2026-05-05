var EMAIL_ALERTA = 'hugo.medeiros@hotmail.com,rebecakoteski@gmail.com';
var WA_NUMBER = '5541984001601';

var MAP_LOCAL = {cwb:'Curitiba',metro:'Regiao Metropolitana',pr:'Interior do Parana',outro:'Outro estado'};
var MAP_BLOQ = {preco:'Preco',info:'Precisa de informacao',medo:'Receio',pronta:'Pronta para agendar'};
var MAP_URGENCIA = {imediato:'2-3 meses',medio:'3-6 meses',esteano:'Este ano',proximoano:'Proximo ano',pesquisando:'Pesquisando'};
var MAP_AREA = {corpo:'Corpo',seios:'Seios',rosto:'Rosto',multi:'Multiplas areas'};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Leads');
    if (!sheet) sheet = ss.insertSheet('Leads');

    var score = calcScore(data);
    var momento = classificarMomento(score);
    var telRaw = (data.tel || '').replace(/\D/g, '');
    var telFmt = telRaw.length === 11 ? '(' + telRaw.substr(0, 2) + ') ' + telRaw.substr(2, 5) + '-' + telRaw.substr(7) : telRaw;
    var proc = (data.procedimento || '').replace(/&nbsp;/g, ' ');
    var procKey = data.procedimento_key || '';
    var nome = data.nome || '';
    var primeiro = nome.split(' ')[0] || 'Nova paciente';

    var telCliente = (data.tel_wa || data.tel || telRaw).replace(/\D/g, '');
    if (telCliente.length === 11) telCliente = '55' + telCliente;
    var waMsg = 'Oi ' + primeiro + '! Aqui e a equipe da Dra. Rebeca Koteski. Vi que voce fez a pre-avaliacao no site com interesse em ' + proc + '. A Dra. Rebeca adoraria te atender! Tenho horarios disponiveis essa semana - qual seria melhor para voce?';
    var waLink = 'https://wa.me/' + telCliente + '?text=' + encodeURIComponent(waMsg);

    var HEADERS = ['Data', 'Nome', 'Telefone', 'Tel limpo', 'Procedimento', 'Procedimento chave', 'Area', 'Cidade', 'Bloqueio', 'Urgencia', 'Contato preferido', 'Score (0-100)', 'Momento de compra', 'Status', 'Observacoes', 'Link WhatsApp', 'Sensivel a preco', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Data consulta', 'Operada?', 'Data cirurgia'];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#4A0F1C').setFontColor('#fff').setFontWeight('bold');
      sheet.setFrozenRows(1);
      var statusList = ['Novo lead', 'Contatado', 'Consulta agendada', 'Consulta realizada', 'Proposta feita', 'Cirurgia fechada', 'Nao respondeu', 'Nao tem perfil', 'Reagendar'];
      var rule = SpreadsheetApp.newDataValidation().requireValueInList(statusList).build();
      sheet.getRange('N2:N100').setDataValidation(rule);
    }

    sheet.appendRow([
      new Date(),
      nome,
      telFmt,
      telRaw,
      proc,
      procKey,
      MAP_AREA[data.area] || data.area || '',
      MAP_LOCAL[data.local] || data.local || '',
      MAP_BLOQ[data.bloq] || data.bloq || '',
      MAP_URGENCIA[data.urgencia] || data.urgencia || '',
      data.contato_pref || 'whatsapp',
      score,
      momento,
      'Novo lead',
      '',
      waLink,
      data.sensivel_preco ? 'Sim' : 'Nao',
      data.utm_source || '',
      data.utm_medium || '',
      data.utm_campaign || '',
      '',
      '',
      ''
    ]);

    var ultima = sheet.getLastRow();
    var cor = score >= 80 ? '#d4edda' : score >= 60 ? '#fff3cd' : score >= 40 ? '#cce5ff' : '#f8f9fa';
    sheet.getRange(ultima, 1, 1, HEADERS.length).setBackground(cor);

    try {
      var labelScore = score >= 80 ? 'PRONTA AGORA' : score >= 60 ? 'ALTA INTENCAO' : score >= 40 ? 'CONSIDERANDO' : 'PESQUISANDO';
      var urgencia = score >= 60;
      var cidade = MAP_LOCAL[data.local] || data.local || '-';
      var area = MAP_AREA[data.area] || data.area || '-';
      var bloqueio = MAP_BLOQ[data.bloq] || data.bloq || '-';
      var prazo = MAP_URGENCIA[data.urgencia] || data.urgencia || '-';
      var agora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
      var scoreWidth = Math.max(score, 5);

      var html = '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif"><tr><td align="center" style="padding:20px 10px;background:#f5f0ee"><table width="500" cellpadding="0" cellspacing="0" border="0" style="max-width:500px;width:100%">'

        + '<tr><td style="background:#4A0F1C;padding:30px 24px;text-align:center;border-radius:12px 12px 0 0">'
        + '<table width="48" height="48" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px"><tr><td style="width:48px;height:48px;border-radius:24px;background:#6B1A2A;border:1px solid #8B2A3C;color:#ffffff;font-family:Georgia,serif;font-size:17px;font-weight:bold;text-align:center;line-height:48px">RK</td></tr></table>'
        + '<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B08B80;margin-bottom:8px">Nova pre-avaliacao</div>'
        + '<div style="font-family:Georgia,serif;font-size:28px;color:#ffffff;margin-bottom:10px">' + primeiro + '</div>'
        + '<table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="background:#6B1A2A;border:1px solid #8B2A3C;padding:5px 16px;border-radius:20px;font-size:13px;color:#CDA99E">Score ' + score + ' &middot; ' + labelScore + '</td></tr></table>'
        + '</td></tr>'

        + '<tr><td style="background:#F8F2F0;padding:22px 24px;text-align:center;border-bottom:1px solid #E0D0CC">'
        + '<div style="font-size:13px;color:' + (urgencia ? '#6B1A2A;font-weight:bold' : '#5A4040') + ';margin-bottom:14px">' + (urgencia ? 'Responda AGORA - leads quentes convertem em menos de 5 min!' : 'Responda em ate 1 hora para melhor conversao.') + '</div>'
        + '<table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="background:#25D366;padding:15px 40px;border-radius:30px"><a href="' + waLink + '" style="color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;display:block">Responder no WhatsApp</a></td></tr></table>'
        + '</td></tr>'

        + '<tr><td style="background:#ffffff;padding:24px">'
        + '<div style="font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#B08B80;margin-bottom:16px">Dados da paciente</div>'
        + '<table width="100%" cellpadding="0" cellspacing="0" border="0">'
        + lnEmail('Nome', nome)
        + lnEmail('Telefone', telFmt)
        + lnEmail('Procedimento', proc)
        + lnEmail('Area', area)
        + lnEmail('Cidade', cidade)
        + lnEmail('Prazo', prazo)
        + lnEmail('Bloqueio', bloqueio)
        + lnEmail('Contato', data.contato_pref || 'whatsapp')
        + '<tr><td style="padding:10px 0;border-bottom:1px solid #F0E8E4;color:#9A8080;font-size:12px;width:140px;vertical-align:top">Sensivel a preco</td><td style="padding:10px 0;border-bottom:1px solid #F0E8E4;font-size:15px;' + (data.sensivel_preco ? 'font-weight:bold;color:#6B1A2A' : 'color:#1A1010') + '">' + (data.sensivel_preco ? 'Sim - fale sobre parcelamento' : 'Nao') + '</td></tr>'
        + '</table>'
        + '</td></tr>'

        + '<tr><td style="background:#ffffff;padding:0 24px 20px">'
        + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#F0E8E4;border-radius:4px;height:8px"><table width="' + scoreWidth + '%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#6B1A2A;border-radius:4px;height:8px"></td></tr></table></td></tr></table>'
        + '<div style="font-size:11px;color:#9A8080;margin-top:6px;text-align:right">' + score + '/100</div>'
        + '</td></tr>'

        + '<tr><td style="background:#4A0F1C;padding:20px 24px;text-align:center;border-radius:0 0 12px 12px">'
        + '<table cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="border:1px solid #8B2A3C;padding:11px 30px;border-radius:30px"><a href="' + waLink + '" style="color:#CDA99E;font-size:14px;text-decoration:none">Abrir WhatsApp</a></td></tr></table>'
        + '<div style="font-size:11px;color:#5A4040;margin-top:14px">Dra. Rebeca Koteski &middot; CRM PR 40326 &middot; ' + agora + '</div>'
        + '</td></tr>'

        + '</table></td></tr></table>';

      var MAP_KEY_CLEAN = {lipo:'Lipoaspiracao',mama:'Mamoplastia',blefaro:'Blefaroplastia',abdomino:'Abdominoplastia'};
      var procClean = MAP_KEY_CLEAN[procKey] || 'Cirurgia Plastica';
      var assunto = (score >= 80 ? 'URGENTE ' : score >= 60 ? 'QUENTE ' : '') + primeiro + ' quer ' + procClean + ' (Score ' + score + ')';

      MailApp.sendEmail({
        to: EMAIL_ALERTA,
        subject: assunto,
        htmlBody: html,
        body: 'Novo lead: ' + nome + ' | ' + telFmt + ' | ' + proc + ' | Score ' + score + '\nWhatsApp: ' + waLink
      });
    } catch (em) {}

    return ContentService.createTextOutput(JSON.stringify({ok: true, score: score, momento: momento})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, err: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function lnEmail(label, valor) {
  return '<tr><td style="padding:10px 0;border-bottom:1px solid #F0E8E4;color:#9A8080;font-size:12px;width:140px;vertical-align:top">' + label + '</td><td style="padding:10px 0;border-bottom:1px solid #F0E8E4;font-size:15px;color:#1A1010">' + valor + '</td></tr>';
}

function calcScore(data) {
  var s = 0;
  s += ({pronta: 30, medo: 18, info: 12, preco: 5}[data.bloq] || 0);
  s += ({imediato: 35, medio: 25, esteano: 15, proximoano: 5, pesquisando: 0}[data.urgencia] || 0);
  var proc = data.procedimento_key || '';
  if (proc && proc !== 'naosei') s += 10;
  s += ({cwb: 10, metro: 8, pr: 5, outro: 3}[data.local] || 0);
  if (proc === 'blefaro') s += 5;
  if (data.bloq === 'preco') s -= 10;
  return Math.max(0, Math.min(100, s));
}

function classificarMomento(score) {
  if (score >= 80) return 'Pronta agora';
  if (score >= 60) return 'Alta intencao';
  if (score >= 40) return 'Considerando';
  if (score >= 20) return 'Pesquisando';
  return 'Topo de funil';
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('CRM Koteski').addItem('Inicializar abas', 'inicializarAbas').addSeparator().addItem('Marcar operada', 'marcarOperada').build();
}

function inicializarAbas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leads = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  if (leads.getLastRow() === 0) {
    var HEADERS = ['Data', 'Nome', 'Telefone', 'Tel limpo', 'Procedimento', 'Procedimento chave', 'Area', 'Cidade', 'Bloqueio', 'Urgencia', 'Contato preferido', 'Score (0-100)', 'Momento de compra', 'Status', 'Observacoes', 'Link WhatsApp', 'Sensivel a preco', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Data consulta', 'Operada?', 'Data cirurgia'];
    leads.appendRow(HEADERS);
    leads.getRange(1, 1, 1, HEADERS.length).setBackground('#4A0F1C').setFontColor('#fff').setFontWeight('bold');
    leads.setFrozenRows(1);
    var statusList = ['Novo lead', 'Contatado', 'Consulta agendada', 'Consulta realizada', 'Proposta feita', 'Cirurgia fechada', 'Nao respondeu', 'Nao tem perfil', 'Reagendar'];
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(statusList).build();
    leads.getRange('N2:N100').setDataValidation(rule);
  }
  SpreadsheetApp.getUi().alert('CRM Koteski v9 inicializado!');
}

function marcarOperada() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var linha = sheet.getActiveRange().getRow();
  if (linha < 2) { SpreadsheetApp.getUi().alert('Selecione uma linha de lead primeiro.'); return; }
  sheet.getRange(linha, 14).setValue('Cirurgia fechada');
  sheet.getRange(linha, 22).setValue('Sim');
  sheet.getRange(linha, 23).setValue(new Date());
  sheet.getRange(linha, 1, 1, 23).setBackground('#d4edda');
  SpreadsheetApp.getUi().alert('Marcada como operada!');
}

function doGet() {
  return ContentService.createTextOutput('CRM Koteski v9');
}
