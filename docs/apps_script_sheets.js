/**
 * Google Apps Script — Cole na planilha "Leads Quiz RK"
 *
 * SETUP:
 * 1. Crie uma planilha no Google Sheets
 * 2. Renomeie a primeira aba para "Leads"
 * 3. Na linha 1, coloque os headers:
 *    Data | Nome | Telefone | Área | Tempo | Bloqueio | Perfil | Local | Perfil Quiz | Procedimento | Âncora | Score | Sensível Preço | UTM Source | UTM Medium | UTM Campaign
 * 4. Menu Extensões → Apps Script
 * 5. Cole este código inteiro
 * 6. Clique em Implantar → Nova implantação → Tipo: App da Web
 * 7. Executar como: Eu mesmo | Acesso: Qualquer pessoa
 * 8. Copie a URL e cole no index.html (var SHEETS_URL = 'URL_AQUI')
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }

    var data = JSON.parse(e.postData.contents);

    var row = [
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      data.nome || '',
      data.tel || '',
      data.area || '',
      data.tempo || '',
      data.bloq || '',
      data.perf || '',
      data.local || '',
      data.perfil || '',
      data.procedimento || '',
      data.ancora || '',
      data.score || '',
      data.sensivel_preco ? 'Sim' : 'Não',
      data.utm_source || '(direto)',
      data.utm_medium || '',
      data.utm_campaign || '',
    ];

    sheet.appendRow(row);

    // Notificação por email (opcional — descomente se quiser)
    // MailApp.sendEmail({
    //   to: 'rebeca@koteski.com.br',
    //   subject: '🔔 Novo lead: ' + data.nome,
    //   body: 'Nome: ' + data.nome + '\nTel: ' + data.tel + '\nProcedimento: ' + data.procedimento + '\nScore: ' + data.score
    // });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Necessário para CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}
