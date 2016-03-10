function Stock () {
  this.symbol;
  this.name;
}

Stock.prototype.lookup = function(query, callback){
  var that = this;
  $.ajax({
    url: "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/jsonp?input=" + query,
    dataType: "jsonp",
    jsonp: "jsoncallback"
  }).done(function(data){
    that.symbol = data[0].Symbol;
    that.name = cleanName(data[0].Name);
    callback.call(that);
  }).fail(function(data){
    console.log('Error: ' + data);
  });
};

var cleanName = function(oldname) {
  wordsToRemove = ['Inc','.com', 'Corp', 'Corporation','Incorporated', 'Co.','US', 'Communications',',','.'];
  wordResult = oldname;
  for (var i = 0; i < wordsToRemove.length; i++) {
    wordResult = wordResult.replace(wordsToRemove[i],'');
  }
  return wordResult;
};





function StockData () {
  this.data = [];
  this.max;
  this.min;
  this.symbol;
}

StockData.prototype.getData = function(symbol, days, cutoff, callback){
  var getInputParams = {
      Normalized: false,
      NumberOfDays: days,
      DataPeriod: "Day",
      Elements: [
          {
              Symbol: symbol,
              Type: "price",
              Params: ["c"] //ohlc, c = close only
          }
      ]
      //,LabelPeriod: 'Week',
      //LabelInterval: 1
  }

  var params = {
      parameters: JSON.stringify( getInputParams )
  }

  var that = this;
  $.ajax({
    data: params,
    url: "http://dev.markitondemand.com/Api/v2/InteractiveChart/jsonp",
    dataType: "jsonp",
    jsonp: "jsoncallback"
  }).done(function(data){
    that.symbol = data.Elements[0].Symbol;
    that.data = that.parseData(data.Dates, data.Elements[0].DataSeries.close.values);
    that.data = that.data.slice(0,cutoff)
    that.data = that.plotDataPoints(that.data);
    that.max = that.getMax(data.Elements[0].DataSeries.close.values.slice(0,cutoff));
    that.min = that.getMin(data.Elements[0].DataSeries.close.values.slice(0,cutoff));
    callback.call(that.data);
  }).fail(function(data){
    console.log('Error: ' + data);
  });
};

StockData.prototype.getMax = function(prices) {
  return Math.max.apply(null, prices);
};

StockData.prototype.getMin = function(prices) {
  return Math.min.apply(null, prices);
};

StockData.prototype.parseData = function(dates, prices) {
  dataArr = [];
  for (var i = 0; i < dates.length; i++) {
    var year = dates[i].slice(0,4);
    var month = dates[i].slice(5,7);
    var day = dates[i].slice(8,10);
    var price = prices[i]
    var data = [year, month, day, price];
    dataArr.push(data);
  }
  return dataArr;
};

StockData.prototype.plotDataPoints = function(data) {
  dataPointsArr = [];
  for (var i = 0; i < data.length; i++) {
    var indexLabelFontColor;
    var percentChange = 0;
    var indexLabel;
    var markerType;
    if (i !== 0) {
      todayPrice = data[i][3];
      yesterdayPrice = data[i - 1][3];
      var percentChange = (((todayPrice - yesterdayPrice) / yesterdayPrice) * 100);
      if (Math.abs(percentChange) > 2) {
        indexLabel = percentChange.toFixed(1) + '%';
        markerType = 'circle'
      } else {
        indexLabel = '';
        markerType = 'none'
      }

      if (todayPrice > yesterdayPrice) {
        indexLabelFontColor = '#093';
      } else {
        indexLabelFontColor = '#d14836';
      }
    }
    var parsedDate = data[i][0] + data[i][1] + data[i][2];
    dataPointsArr.push({ x: new Date(data[i][0], (data[i][1] - 1), data[i][2]), y: data[i][3], indexLabel: indexLabel, percentChange: percentChange, markerType: markerType, indexLabelFontColor: indexLabelFontColor, markerSize: 10, parsedDate: parsedDate});
  }
  return dataPointsArr;
};
