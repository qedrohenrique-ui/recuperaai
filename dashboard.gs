function criarDashboardRecuperaAI() {
  const planilha = SpreadsheetApp.openByUrl('COLE_AQUI_O_LINK_DA_PLANILHA');
  const painel = planilha.getSheetByName('Dashboard');
  if (!painel || !planilha.getSheetByName('Pedidos')) {
    throw new Error('A planilha precisa ter as abas Dashboard e Pedidos.');
  }

  const cor = {
    azulEscuro: '#0F172A',
    azul: '#2563EB',
    verde: '#16A34A',
    amarelo: '#F59E0B',
    vermelho: '#DC2626',
    fundo: '#F8FAFC',
    branco: '#FFFFFF',
    borda: '#E2E8F0',
    textoSecundario: '#475569',
  };
  const borda = SpreadsheetApp.BorderStyle;

  // Área visual do painel. As fórmulas em A1:B6 continuam sendo a fonte dos cartões.
  painel.setHiddenGridlines(true);
  painel.setTabColor(cor.azul);
  painel.setColumnWidth(3, 20);
  painel.setColumnWidth(13, 20);
  for (let coluna = 4; coluna <= 12; coluna++) {
    painel.setColumnWidth(coluna, coluna % 2 === 0 ? 148 : 12);
  }
  painel.setRowHeights(1, 7, 24);
  painel.setRowHeight(1, 42);
  painel.setRowHeight(3, 16);
  painel.setRowHeight(5, 47);
  painel.setRowHeight(7, 17);
  painel.setRowHeights(8, 15, 21);
  painel.setRowHeight(23, 28);
  painel.getRange('D1:L23')
    .setBackground(cor.fundo)
    .setFontFamily('Arial')
    .setFontColor(cor.azulEscuro)
    .setVerticalAlignment('middle');

  painel.getRange('D1:L2').setBackground(cor.azulEscuro);
  painel.getRange('D1:L1').merge()
    .setValue('RecuperaAI | Dashboard de Operações')
    .setFontColor(cor.branco).setFontSize(20).setFontWeight('bold');
  painel.getRange('D2:L2').merge()
    .setValue('Monitoramento de pedidos e recuperação de vendas')
    .setFontColor('#CBD5E1').setFontSize(11).setFontWeight('normal');

  const cartoes = [
    ['D', 'Total de pedidos', 2, 'Pedidos registrados', cor.azul, '#,##0'],
    ['F', 'Pedidos pendentes', 3, 'Pagamento pendente', cor.amarelo, '#,##0'],
    ['H', 'Tentativas registradas', 4, 'Tentativas simuladas', cor.azul, '#,##0'],
    ['J', 'Vendas recuperadas', 5, 'Recuperações simuladas', cor.verde, '#,##0'],
    ['L', 'Receita recuperada', 6, 'Valor recuperado simulado', cor.verde, '"R$" #,##0.00'],
  ];
  for (const [coluna, titulo, linhaFonte, legenda, destaque, formato] of cartoes) {
    painel.getRange(coluna + '4:' + coluna + '6')
      .setBackground(cor.branco).setHorizontalAlignment('center')
      .setBorder(true, true, true, true, false, false, cor.borda, borda.SOLID);
    painel.getRange(coluna + '4')
      .setValue(titulo).setFontSize(10).setFontWeight('bold')
      .setBorder(true, null, null, null, null, null, destaque, borda.SOLID_THICK);
    painel.getRange(coluna + '5')
      .setFormula('=$B$' + linhaFonte).setNumberFormat(formato)
      .setFontSize(25).setFontWeight('bold');
    painel.getRange(coluna + '6')
      .setValue(legenda).setFontSize(9).setFontColor(cor.textoSecundario);
  }

  painel.getRange('D23:L23').merge()
    .setValue('Dados fictícios. As tentativas de recuperação representam envios simulados.')
    .setFontSize(10).setFontColor(cor.textoSecundario);

  // O intervalo aberto em Pedidos acompanha novas linhas.
  painel.getRange('N3:O6').setValues([
    ['Status', 'Pedidos'],
    ['PENDENTE', '=SUMPRODUCT(--(Pedidos!$F$2:$F=N4))'],
    ['PAGO', '=SUMPRODUCT(--(Pedidos!$F$2:$F=N5))'],
    ['CANCELADO', '=SUMPRODUCT(--(Pedidos!$F$2:$F=N6))'],
  ]);
  painel.getRange('N9:Q10').setValues([
    ['Métrica', 'Pendentes', 'Tentativas simuladas', 'Vendas recuperadas'],
    ['Quantidade', '=$B$3', '=$B$4', '=$B$5'],
  ]);

  const graficos = painel.getCharts();
  function montarGrafico(intervalo, tipo, titulo, coluna, deslocamento, opcoes) {
    const existente = graficos.find((grafico) => {
      const fontes = grafico.getRanges();
      return fontes.length === 1 &&
        fontes[0].getSheet().getSheetId() === painel.getSheetId() &&
        fontes[0].getA1Notation() === intervalo;
    });
    const editor = existente ? existente.modify().clearRanges() : painel.newChart();
    editor.setChartType(tipo)
      .addRange(painel.getRange(intervalo))
      .setNumHeaders(1)
      .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
      .setPosition(8, coluna, deslocamento, 0)
      .setOption('title', titulo)
      .setOption('titleTextStyle', { color: cor.azulEscuro, fontSize: 13, bold: true })
      .setOption('backgroundColor', cor.branco)
      .setOption('legend', { position: 'bottom', textStyle: { color: cor.textoSecundario, fontSize: 10 } })
      .setOption('width', 386)
      .setOption('height', 294);
    for (const [nome, valor] of Object.entries(opcoes)) {
      editor.setOption(nome, valor);
    }
    const grafico = editor.build();
    if (existente) painel.updateChart(grafico);
    else painel.insertChart(grafico);
  }

  montarGrafico('N3:O6', Charts.ChartType.PIE, 'Distribuição de pedidos por status', 4, 0, {
    pieHole: 0.55,
    colors: [cor.amarelo, cor.verde, cor.vermelho],
    pieSliceText: 'value',
  });
  montarGrafico('N9:Q10', Charts.ChartType.COLUMN, 'Acompanhamento da recuperação', 8, 76, {
    colors: [cor.amarelo, cor.azul, cor.verde],
    hAxis: { textPosition: 'none' },
    vAxis: { viewWindow: { min: 0 }, format: '0', gridlines: { color: cor.borda } },
  });
  painel.hideColumns(14, 4);

  SpreadsheetApp.flush();
}
