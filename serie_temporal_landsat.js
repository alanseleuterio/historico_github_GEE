// RGB time series charting module: https://github.com/jdbcode/ee-rgb-timeseries
var rgbTs = require('users/jstnbraaten/modules:rgb-timeseries/serie_temporal_rgb.js'); 
  
  // Landsat collection builder module: https://jdbcode.github.io/EE-LCB/
  var lcb = require('users/jstnbraaten/modules:ee-lcb.js');  
  
  
  // #################################
  // ### ACESSA PARAMETROS VIA URL ###
  // #################################
  
  var initRun = 'false';
  var runUrl = ui.url.get('run', initRun);
  ui.url.set('run', runUrl);
  
  var initLon = -122.91966;
  var lonUrl = ui.url.get('lon', initLon);
  ui.url.set('lon', lonUrl);
  
  var initLat = 44.24135;
  var latUrl = ui.url.get('lat', initLat);
  ui.url.set('lat', latUrl);
  
  var initFrom = '06-10';
  var fromUrl = ui.url.get('from', initFrom);
  ui.url.set('from', fromUrl);
  
  var initTo = '09-20';
  var toUrl = ui.url.get('to', initTo);
  ui.url.set('to', toUrl);
  
  var initIndex = 'NBR';
  var indexUrl = ui.url.get('index', initIndex);
  ui.url.set('index', indexUrl);
  
  var initRgb = 'SWIR1/NIR/GREEN';
  var rgbUrl = ui.url.get('rgb', initRgb);
  ui.url.set('rgb', rgbUrl);
  
  var initChipWidth = 2;
  var chipWidthUrl = ui.url.get('chipwidth', initChipWidth);
  ui.url.set('chipwidth', chipWidthUrl);
  
  
  
  // ###############################
  // ### DEFINE UI DOS ELEMENTOS ###
  // ###############################
  
  // Style.
  var CONTROL_PANEL_WIDTH = '270px';
  var CONTROL_PANEL_WIDTH_HIDE = '141px';
  var textFont = {fontSize: '12px'};
  var headerFont = {
    fontSize: '13px', fontWeight: 'bold', margin: '4px 8px 0px 8px'};
  var sectionFont = {
    fontSize: '16px', color: '#808080', margin: '16px 8px 0px 8px'};
  var infoFont = {fontSize: '11px', color: '#505050'};
  
  // Painel de controle.
  var controlPanel = ui.Panel({
    style: {position: 'top-left', width: CONTROL_PANEL_WIDTH_HIDE,
      maxHeight: '90%'
    }});
  
  // Painel de informações.
  var infoElements = ui.Panel(
    {style: {shown: false, margin: '0px -8px 0px -8px'}});
  
  // Elemento do painel.
  var controlElements = ui.Panel(
    {style: {shown: false, margin: '0px -8px 0px -8px'}});
  
  // Painel de instruções.
  var instr = ui.Label('Click na localização de preferência',
    {fontSize: '15px', color: '#303030', margin: '0px 0px 6px 0px'});
  
  // Botão de mostrar/ocultar painel de informações.
  var infoButton = ui.Button(
    {label: 'Sobre', style: {margin: '0px 4px 0px 0px'}});
  
  // Botão de mostrar/ocultar painel de informações.
  var controlButton = ui.Button(
    {label: 'Opções', style: {margin: '0px 0px 0px 0px'}});
  
  // Painel de botões de informações/controle.
  var buttonPanel = ui.Panel(
    [infoButton, controlButton],
    ui.Panel.Layout.Flow('horizontal'),
    {stretch: 'horizontal', margin: '0px 0px 0px 0px'});
  
  // Rótulo de opções.
  var optionsLabel = ui.Label('Opções', sectionFont);
  optionsLabel.style().set('margin', '16px 8px 2px 8px');
  
  // Information label.
  var infoLabel = ui.Label('Sobre', sectionFont);
  
  // Information text. 
  var aboutLabel = ui.Label(
    'Este aplicativo realiza a plotagem de um gráfico de série temporal de acordo com amostra de imagem do satélite Landsat.' +
    ' As imagens são composições anuais médias ' +
    'gerado para uma determinada janela de tempo (1994 - 2022), para auxilio na identificação de histórico (FSC como principal). ' +
    'As cores dos pontos são definidas pela atribuição RGB das bandas selecionadas pelo "click" ' +
    'a intensidade é baseada no valor médio de pixel ponderado por área dentro de 45 m.' +
    'Círculo de raio ao redor do ponto clicado no mapa.',
    infoFont);
  
  var appCodeLink = ui.Label({
    value: 'Repositório base',
    style: {fontSize: '11px', color: '#505050', margin: '-4px 8px 0px 8px'}, 
    targetUrl: 'https://github.com/jdbcode/ee-rgb-timeseries/blob/main/landsat-timeseries-explorer.js'
  });
  
  // Data do painel.
  var dateSectionLabel = ui.Label(
    'Intervalo anual (Mês-dia)', headerFont);
  var startDayLabel = ui.Label('From:', textFont);
  var startDayBox = ui.Textbox({value: ui.url.get('from'), style: textFont});
  startDayBox.style().set('stretch', 'horizontal');
  
  var endDayLabel = ui.Label('To:', textFont);
  var endDayBox = ui.Textbox({value: ui.url.get('to'), style: textFont});
  endDayBox.style().set('stretch', 'horizontal');
  
  var datePanel = ui.Panel([
      dateSectionLabel,
      ui.Panel([startDayLabel, startDayBox, endDayLabel, endDayBox],
        ui.Panel.Layout.Flow('horizontal'), {stretch: 'horizontal'})
    ], null, {margin: '0px'});
  
  // Seleção do índice do eixo Y.
  var indexLabel = ui.Label('Y-axis index (bands are LC08)', headerFont);
  var indexList = ['NBR', 'NDVI', 'TCB', 'TCG', 'TCW',
                   'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];
  var indexSelect = ui.Select(
    {items: indexList, value: ui.url.get('index'), style: {stretch: 'horizontal'}});
  var indexPanel = ui.Panel(
    [indexLabel, indexSelect], null, {stretch: 'horizontal'});
  
  // Seleção de bandas RGB.
  var rgbLabel = ui.Label({value: 'RGB visualization', style: headerFont});
  var rgbList = ['SWIR1/NIR/GREEN', 'RED/GREEN/BLUE', 'NIR/RED/GREEN',
                 'TCB/TCG/TCW', 'NIR/SWIR1/RED'];
  var rgbSelect = ui.Select({
    items: rgbList, placeholder: ui.url.get('rgb'),
    value: ui.url.get('rgb'), style: {stretch: 'horizontal'}
  });
  var rgbPanel = ui.Panel([rgbLabel, rgbSelect], null, {stretch: 'horizontal'});
  
  // Buffer de região.
  var regionWidthLabel = ui.Label(
    {value: 'Image chip width (km)', style: headerFont});
  var regionWidthSlider = ui.Slider({
    min: 1, max: 10 , value: parseInt(ui.url.get('chipwidth')),
    step: 1, style: {stretch: 'horizontal'}
  });
  var regionWidthPanel = ui.Panel(
    [regionWidthLabel, regionWidthSlider], null, {stretch: 'horizontal'});
  
  // Uma mensagem para aguardar o carregamento dos chips de imagem.
  var waitMsgImgPanel = ui.Label({
    value: '⚙️' + ' Processando',
    style: {
      stretch: 'horizontal',
      textAlign: 'center',
      backgroundColor: '#d3d3d3'
    }
  });
  
  // Painel para segurar o gráfico.
  var chartPanel = ui.Panel({style: {height: '25%'}});
  
  // Suporte para cartões de imagem.
  var imgCardPanel = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal', true),
    style: {width: '897px', backgroundColor: '#d3d3d3'}
  });
  
  // Widget de mapa.
  var map = ui.Map();
  
  // Painel de mapa/carta
  var mapChartSplitPanel = ui.Panel(ui.SplitPanel({
    firstPanel: map,
    secondPanel: chartPanel,
    orientation: 'vertical',
    wipe: false,
  }));
  
  // Mapa/carta e painel de cartão de imagem
  var splitPanel = ui.SplitPanel(mapChartSplitPanel, imgCardPanel);
  
  // Botão de submissão das alterações
  var submitButton = ui.Button(
    {label: 'Submeter alteração', style: {stretch: 'horizontal', shown: false}});
  
  
  
  // ###########################################
  // ### DEFINIR CONSTANTES DE INICIALIZAÇÃO ###
  // ###########################################
  
  // Defina a cor do círculo para mostrar no mapa e nas imagens onde clicar.
  var AOI_COLOR = 'ffffff';  //'b300b3';
  
  // Definir parâmetros vis.
  var VIS_PARAMS = {
    bands: ['B6', 'B5', 'B3'],
    min: [0, 0, 0],
    max: [4000, 4000, 4000]
  };
  
  var RGB_PARAMS = {
    'SWIR1/NIR/GREEN': {
      bands: ['B6', 'B5', 'B3'],
      min: [100, 151 , 50],
      max: [4500, 4951, 2500],
      gamma: [1, 1, 1]
    },
    'RED/GREEN/BLUE': {
      bands: ['B4', 'B3', 'B2'],
      min: [0, 50, 50],
      max: [2500, 2500, 2500],
      gamma: [1.2, 1.2, 1.2]
    },
    'NIR/RED/GREEN': {
      bands: ['B5', 'B4', 'B3'],
      min: [151, 0, 50],
      max: [4951, 2500, 2500],
      gamma: [1, 1, 1]
    },
    'TCB/TCG/TCW': {
      bands: ['TCB', 'TCG', 'TCW'],
      min: [604, -49, -2245],
      max: [5592, 3147, 843],
      gamma: [1, 1, 1]
    },
    'NIR/SWIR1/RED': {
      bands: ['B5', 'B6', 'B3'],
      min: [151, 100, 50],
      max: [4951, 4500, 2500],
      gamma: [1, 1, 1]
    }
  };
  
  var COORDS = null;
  var CLICKED = false;
  
  // Defina a redução da região e os parâmetros do gráfico.
  var OPTIONAL_PARAMS = {
    reducer: ee.Reducer.mean(),
    scale: 30,
    crs: 'EPSG:4326',
    chartParams: {
      pointSize: 14,
      legend: {position: 'none'},
      hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
      vAxis: {
        title: indexSelect.getValue(),
        titleTextStyle: {italic: false, bold: true}
      },
      explorer: {}
    }
  };
  
  // Define os parâmetros ee-lcb iniciais: o intervalo de datas é para o verão do CONUS.
  var LCB_PROPS = {
    startYear: 1994,
    endYear: new Date().getFullYear(), 
    startDate: startDayBox.getValue(),
    endDate: endDayBox.getValue(),
    sensors: ['LT05', 'LE07', 'LC08'],
    cfmask: ['cloud', 'shadow'],
    printProps: false
  };
  lcb.setProps(LCB_PROPS);
  
  
  
  // ######################
  // ### DEFINE FUNÇÕES ###
  // ######################
  
  /**
   * Plano anual de coleta Landsat ee-lcb.
   */
  function imgColPlan(year){
    var col = lcb.sr.gather(year)
      .map(lcb.sr.maskCFmask)
      .map(lcb.sr.addBandNBR)
      .map(lcb.sr.addBandNDVI)
      .map(lcb.sr.addBandTC);
    return lcb.sr.mosaicMedian(col);
  }
  
  /**
   * Limpar os cartões de imagem do painel do cartão de imagem.
   */
  function clearImgs() {
    imgCardPanel.clear();
  }
  
  /**
   * Exibir os cartões de imagem no painel do cartão.
   */
  function displayBrowseImg(col, aoiBox, aoiCircle) {
    clearImgs();
    waitMsgImgPanel.style().set('shown', true);
    imgCardPanel.add(waitMsgImgPanel);
  
    var visParams = RGB_PARAMS[rgbSelect.getValue()];
    
    var dates = col.aggregate_array('composite_year');
    
    dates.evaluate(function(dates) {
      waitMsgImgPanel.style().set('shown', false);
      dates.forEach(function(date) {
        var img = col.filter(ee.Filter.eq('composite_year', date)).first();
        
        var aoiImg = ee.Image().byte()
          .paint(ee.FeatureCollection(ee.Feature(aoiCircle)), 1, 2)
          .visualize({palette: AOI_COLOR});
        
        var thumbnail = ui.Thumbnail({
          image: img.visualize(visParams).blend(aoiImg),
          params: {
            region: aoiBox,
            dimensions: '200',
            crs: 'EPSG:3857',
            format: 'PNG'
          }
        });
        
        var imgCard = ui.Panel([
          ui.Label(date,
            {margin: '4px 4px -6px 8px', fontSize: '13px', fontWeight: 'bold'}),
          thumbnail
        ], null, {margin: '4px 0px 0px 4px' , width: 'px'});
        
        imgCardPanel.add(imgCard);
      });
    });
  }
  
  /**
   * Gerar gráfico e adiciona cartões de imagem ao painel de imagem.
   */
  function renderGraphics(coords) {
    // Obter os parâmetros vis combinados RGB selecionados.
    var visParams = RGB_PARAMS[rgbSelect.getValue()];
    
    // Obtem o ponto clicado e armazene-o em buffer.
    var point = ee.Geometry.Point(coords);
    var aoiCircle = point.buffer(45);
    var aoiBox = point.buffer(regionWidthSlider.getValue()*1000/2);
    
    // Limpa o ponto anterior do mapa.
    map.layers().forEach(function(el) {
      map.layers().remove(el);
    });
  
    // Adiciona novo ponto ao Mapa.
    map.addLayer(aoiCircle, {color: AOI_COLOR});
    map.centerObject(aoiCircle, 14);
    
    // Cria uma coleção anual de séries temporais.
    LCB_PROPS['aoi'] = aoiBox;
    LCB_PROPS['startDate'] = startDayBox.getValue();
    LCB_PROPS['endDate'] = endDayBox.getValue();
    lcb.props = lcb.setProps(LCB_PROPS);
    
    // Define o intervalo de anos de coleta anual como ee.List.
    var years = ee.List.sequence(lcb.props.startYear, lcb.props.endYear);
    var col = ee.ImageCollection.fromImages(years.map(imgColPlan));
  
    // Exibe a série temporal do chip de imagem.
    displayBrowseImg(col, aoiBox, aoiCircle);
  
    OPTIONAL_PARAMS['chartParams']['vAxis']['title'] = indexSelect.getValue();
  
    // Renderiza o gráfico de série temporal.
    rgbTs.rgbTimeSeriesChart(col, aoiCircle, indexSelect.getValue(), visParams,
      chartPanel, OPTIONAL_PARAMS);
  }
  
  /**
   * Lida com cliques no mapa.
   */
  function handleMapClick(coords) {
    CLICKED = true;
    COORDS = [coords.lon, coords.lat];
    ui.url.set('run', 'true');
    ui.url.set('lon', COORDS[0]);
    ui.url.set('lat', COORDS[1]);
    renderGraphics(COORDS);
  }
  
  /**
   * Lida com o clique do botão enviar.
   */
  function handleSubmitClick() {
    renderGraphics(COORDS);
    submitButton.style().set('shown', false);
  }
  
  /**
   * Define os parâmetros de URL.
   */
  function setParams() {
    ui.url.set('from', startDayBox.getValue());
    ui.url.set('to', endDayBox.getValue());
    ui.url.set('index', indexSelect.getValue());
    ui.url.set('rgb', rgbSelect.getValue());
    ui.url.set('chipwidth', regionWidthSlider.getValue());
  }   
    
  /**
   * Mostrar/ocultar o botão enviar.
   */
  function showSubmitButton() {
    if(CLICKED) {
      submitButton.style().set('shown', true);
    }
  }
  
  /**
   * Lida com alterações de opções.
   */
  function optionChange() {
    showSubmitButton();
    setParams();
  }
  
  /**
   * Mostrar/ocultar o painel de controle.
   */
  var controlShow = false;
  function controlButtonHandler() {
    if(controlShow) {
      controlShow = false;
      controlElements.style().set('shown', false);
      controlButton.setLabel('Options ❯');
    } else {
      controlShow = true;
      controlElements.style().set('shown', true);
      controlButton.setLabel('Options ❮');
    }
    
    if(infoShow | controlShow) {
      controlPanel.style().set('width', CONTROL_PANEL_WIDTH);
    } else {
      controlPanel.style().set('width', CONTROL_PANEL_WIDTH_HIDE);
    }
  }
  
  /**
   * Mostrar/ocultar o painel de controle.
   */
  var infoShow = false;
  function infoButtonHandler() {
    if(infoShow) {
      infoShow = false;
      infoElements.style().set('shown', false);
      infoButton.setLabel('About ❯');
    } else {
      infoShow = true;
      infoElements.style().set('shown', true);
      infoButton.setLabel('About ❮');
    }
    
    if(infoShow | controlShow) {
      controlPanel.style().set('width', CONTROL_PANEL_WIDTH);
    } else {
      controlPanel.style().set('width', CONTROL_PANEL_WIDTH_HIDE);
    }
  }
  
  
  
  // #############################
  // ### SETUP UI DE ELEMENTOS ###
  // #############################
  
  infoElements.add(infoLabel);
  infoElements.add(aboutLabel);
  infoElements.add(appCodeLink);
  
  controlElements.add(optionsLabel);
  controlElements.add(datePanel);
  controlElements.add(indexPanel);
  controlElements.add(rgbPanel);
  controlElements.add(regionWidthPanel);
  controlElements.add(submitButton);
  
  controlPanel.add(instr);
  controlPanel.add(buttonPanel);
  controlPanel.add(infoElements);
  controlPanel.add(controlElements);
  
  map.add(controlPanel);
  
  infoButton.onClick(infoButtonHandler);
  controlButton.onClick(controlButtonHandler);
  startDayBox.onChange(optionChange);
  endDayBox.onChange(optionChange);
  rgbSelect.onChange(optionChange);
  indexSelect.onChange(optionChange);
  regionWidthSlider.onChange(optionChange);
  submitButton.onClick(handleSubmitClick);
  map.onClick(handleMapClick);
  
  map.style().set('cursor', 'crosshair');
  map.setOptions('SATELLITE');
  map.setControlVisibility(
    {layerList: false, fullscreenControl: false, zoomControl: false});
  //map.centerObject(ee.Geometry.Point([-122.91966, 44.24135]), 14);
  
  ui.root.clear();
  ui.root.add(splitPanel);
  
  
  if(ui.url.get('run')) {
    CLICKED = true;
    COORDS = [ui.url.get('lon'), ui.url.get('lat')];
    renderGraphics(COORDS);
  }