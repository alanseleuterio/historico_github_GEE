exports.version = '0.1.2';

/**
 * Converte o inteiro do componente RGB em string hexadecimal.
 * 
 * @param {Number} c Um inteiro entre 0 e 255 que representa a cor do ponto escolhido.
 * @returns {String}
 * @ignore
 */
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

/**
 * Converte o conjunto inteiro RGB em string hexadecimal.
 * 
 * @param {Array} rgb RGB Array of three integers with range [0, 255] that respectively represent red, green, and blue intensity.
 * @returns {String}
 * @ignore
 */
function rgbToHex(rgb) {
  return "#" +
  componentToHex(rgb[0]) +
  componentToHex(rgb[1]) +
  componentToHex(rgb[2]);
}

/**
 * Dimensiona o número de entrada para um intervalo de 8 bits.
 * 
 * @param {Number} val Um valor para fixar entre um determinado intervalo e escala para representação de 8 bits.
 * @param {Number} min O valor mínimo ao qual limitar o número de entrada.
 * @param {Number} max O valor máximo ao qual limitar o número de entrada.
 * @returns {Number}
 * @ignore
 */
function scaleToByte(val, min, max) {
  val = ee.Number(val).clamp(min, max);
  return ee.Number.expression({
    expression: 'round((val - min) / (max - min) * 255)',
    vars: {
      val: val,
      min: min,
      max: max
    } 
  });
}

/**
 * Plota um gráfico em um ui.Panel ou no Code Editor Console para uma série temporal de imagem multibanda. 
 * As observações são representadas como círculos cuja cor é a representação RGB esticada de três bandas selecionadas.
 * 
 * @param {ee.ImageCollection} col Uma coleção de imagens que representa uma série temporal de imagens multibanda. 
 * Cada imagem deve ter uma propriedade 'system:time_start' formatada como milissegundos desde 1994-01-01T00:00:00Z (UTC).
 * 
 * @param {ee.Geometry} aoi A região sobre a qual reduzir os dados da imagem.
 * 
 * @param {String} yAxisBand Parâmetros de visualização que atribuem bandas para vermelho, verde e azul e o intervalo para esticar a intensidade da cor.
 * 
 * @param {Object} visParams Visualization parameters that assign bands to
 *     red, green, and blue and the range to stretch color intensity over.
 * 
 * @param {Array} visParams.bands Uma matriz de três nomes de banda para atribuir respectivamente a vermelho, verde e azul para visualização RGB.
 * 
 * @param {Array} visParams.min Uma matriz de três valores específicos de banda que definem o valor mínimo para limitar o intervalo de estiramento de cor. 
 * Organize os valores na mesma ordem dos nomes de bandas visParams.bands. Use unidades dos dados de imagem de entrada.
 * 
 * @param {Array} visParams.max Uma matriz de três valores específicos de banda que definem o valor máximo para fixar o intervalo de estiramento de cor. 
 * Organize os valores na mesma ordem dos nomes de bandas visParams.bands. Use unidades dos dados de imagem de entrada.
 * 
 * @param {ui.Panel|String} plotHere Um ui.Panel para adicionar o gráfico ou 'console' para imprimir o gráfico no console do Code Editor.
 * 
 * @param {Object} [optionalParams] Opcional. Um conjunto de parâmetros opcionais a serem definidos para controlar a redução da região e definir o gráfico.
 * 
 * @param {ee.Reducer} [optionalParams.reducer] Opcional. A região sobre a qual reduzir os dados. Se não especificado, ee.Reducer.first é usado.
 * 
 * @param {String} [optionalParams.crs] Opcional. A projeção a ser trabalhada. Se não for especificada, a projeção da primeira imagem será usada.
 * 
 * @param {Number} [optionalParams.scale] Opcional. Uma escala nominal em metros da projeção a ser trabalhada. 
 * Se não for especificada, é usada a escala nominal da primeira imagem.
 * 
 * @param {Object} [optionalParams.chartParams] Opcional. Parâmetros ui.Chart aceitos por ui.Chart.setOptions. 
 * Consulte https://developers.google.com/earth-engine/guides/charts_style para obter mais detalhes.
 */
function rgbTimeSeriesChart(
  col, aoi, yAxisBand, visParams, plotHere, optionalParams) {
  // Desde o uso de avaliar, indica que as coisas estão funcionando.
  var message = '⚙️ Em processamento';
  if(plotHere != 'console') {
    plotHere.clear();
    plotHere.add(ui.Label(message));
  } else {
    print(message);
  }
  
  // Defina os parâmetros de filtro padrão.
  var proj = col.first().projection();
  var _params = {
    reducer: ee.Reducer.first(),
    crs: proj.crs(),
    scale: proj.nominalScale(),
    chartParams: {
      pointSize: 10,
      legend: {position: 'none'},
      hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
      vAxis: {title: yAxisBand, titleTextStyle: {italic: false, bold: true}},
      interpolateNulls: true,
    },
    chartStyle: {
      height: null
    }
  };

  // Substitua os parâmetros padrões pelos parâmetros fornecidos.
  if (optionalParams) {
    for (var param in optionalParams) {
      _params[param] = optionalParams[param] || _params[param];
    }
  }
  
  // Realiza a redução.
  var fc = col.map(function(img) {
    var reduction = img.reduceRegion({
      reducer: _params.reducer,
      geometry: aoi,
      scale: _params.scale,
      crs: _params.crs,
      bestEffort: true,
      maxPixels: 1e13,
    });

    return ee.Feature(null, reduction).set({
      'system:time_start': img.get('system:time_start'),
      label: ee.String(yAxisBand+' ').cat(img.date().format('YYYY-MM-dd'))
    });
  })
  .filter(ee.Filter.notNull(col.first().bandNames()));
  
  // Adiciona cor RGB de 3 bandas como uma propriedade de recurso.
  var fcRgb = fc.map(function(ft) {
    var rgb = ee.List([
      scaleToByte(ft.get(visParams.bands[0]), visParams.min[0], visParams.max[0]),
      scaleToByte(ft.get(visParams.bands[1]), visParams.min[1], visParams.max[1]),
      scaleToByte(ft.get(visParams.bands[2]), visParams.min[2], visParams.max[2])
    ]);
    return ft.set({rgb: rgb, 'system:time_start': ft.get('system:time_start')});
  });

  // Filtra as observações sem dados.
  fcRgb = fcRgb.filter(ee.Filter.notNull(fcRgb.first().propertyNames()))
    .sort('system:time_start');
  
  // Filtra as observações sem dados.
  var rgbColors = fcRgb.aggregate_array('rgb');
  
  // Faz um gráfico.
  rgbColors.evaluate(function(rgbColors) {
    var rgbList = [];
    for(var i=0; i<rgbColors.length; i++) {
      rgbList.push(rgbToHex(rgbColors[i]));
    }

    _params.chartParams['colors'] = rgbList;
    
    var chart = ui.Chart.feature.groups(
      fcRgb, 'system:time_start', yAxisBand, 'label')
      .setChartType('ScatterChart')
      .setOptions(_params.chartParams);
      chart.style().set(_params.chartStyle);
    
    if(plotHere != 'console'){
      plotHere.clear();
      plotHere.add(chart);
    } else {
      print(chart);
    }
  });
}
exports.rgbTimeSeriesChart = rgbTimeSeriesChart;

// Pontos de exemplo
var geometry1 = ee.Geometry.Point([-122.167503, 44.516868]).buffer(45);  // Colheita florestal
var geometry2 = ee.Geometry.Point([-122.201595, 44.511052]).buffer(45);  // Banco de fluxo legal