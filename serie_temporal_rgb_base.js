// Módulos de importação.
var rgbTs = require(
    'users/jstnbraaten/modules:rgb-timeseries/serie_temporal_rgb.js'); 
  var lcb = require('users/jstnbraaten/modules:ee-lcb.js'); 
  
  // Responsável pelos cliques no mapa: gera gráfico e adiciona ao painel.
  function renderChart(coords) {
    // Obtem o ponto clicado e armazene-o em buffer.
    coords = ee.Dictionary(coords);
    var aoi = ee.Geometry.Point([coords.get('lon'), coords.get('lat')])
      .buffer(45);
    
    // Limpa o ponto anterior do Mapa.
    Map.layers().forEach(function(el) {
      Map.layers().remove(el);
    });
  
    // Adiciona novo ponto ao Mapa.
    Map.addLayer(aoi, {color: '#b300b3'});
    
    // Coleção de séries temporais anuais construídas.
    lcbProps['aoi'] = aoi;
    lcb.props = lcb.setProps(lcbProps);
    
    // Define o intervalo de anos de coleta anual definido como ee.List.
    var years = ee.List.sequence(lcb.props.startYear, lcb.props.endYear);
    var col = ee.ImageCollection.fromImages(years.map(plan));
    
    // Renderize o gráfico de série temporal.
    rgbTs.rgbTimeSeriesChart(
      col, aoi, Y_AXIS_BAND, VIS_PARAMS, chartPanel, OPTIONAL_PARAMS);
  }
  
  // Define os parâmetros ee-lcb iniciais: o intervalo de datas é para o verão do CONUS.
  var lcbProps = {
    startYear: 1994,
    endYear: 2020,
    startDate: '06-20',
    endDate: '09-10',
    sensors: ['LT05', 'LE07', 'LC08'],
    cfmask: ['cloud', 'shadow'],
    printProps: false
  }
  lcb.setProps(lcbProps);
  
  // Define um plano de coleta anual.
  var plan = function(year){
    var col = lcb.sr.gather(year)
      .map(lcb.sr.maskCFmask)
      .map(lcb.sr.addBandNBR);
    return lcb.sr.mosaicMean(col);
  };
  
  // Define constantes: use NBR para o eixo y, SWIR1, NIR, Green para RGB.
  var Y_AXIS_BAND = 'NBR';
  
  var VIS_PARAMS = {
    bands: ['B6', 'B5', 'B3'],
    min: [0, 0, 0],
    max: [4000, 4000, 4000]
  };
  
  // Define a redução da região e os parâmetros do gráfico.
  var OPTIONAL_PARAMS = {
    reducer: ee.Reducer.mean(),
    scale: 30,
    crs: 'EPSG:5070',  // Good for CONUS
    chartParams: {
      pointSize: 14,
      legend: {position: 'none'},
      hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
      vAxis: {title: Y_AXIS_BAND, titleTextStyle: {italic: false, bold: true}},
      explorer: {}
    }
  };
  
  // Define o painel para conter o(s) gráfico(s).
  var chartPanel = ui.Panel();
  
  // Adiciona o painel ao console.
  print(chartPanel);
  
  // Adiciona instruções ao mapa.
  var instrMsg = ui.Label('Escolha seu ponto de interesse e "click" para plotagem do gráfico 📈', {position: 'top-center'});
  Map.add(instrMsg);
  
  // TODO: adicione um link para o repositório do GitHub no canto inferior direito
  
  // Adicione o manipulador de cliques ao Mapa.
  Map.onClick(renderChart);
  
  // Defina o cursor como mira.
  Map.style().set('cursor', 'crosshair');
  
  // Faça a imagem satélite (google) de camada base.
  Map.setOptions('SATELLITE');
  
  // Ajusta visualização do mapa.
  Map.centerObject(ee.Geometry.Point([-122.91966, 44.24135]), 14);