function Stock () {
  this.symbol;
  this.fullName;
  this.name;
  this.exchange;
  this.striplines;
  this.ceiling;
  this.floor;
}

Stock.prototype.lookup = function(query, callback){
  var that = this;
  $.ajax({
    url: "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/jsonp?input=" + query,
    dataType: "jsonp",
    jsonp: "jsoncallback"
  }).done(function(data){
    if (data.length === 0) {
      that.symbol = 'Ticker Not Found';
      callback.call(that);
    } else {
      console.log(data);
      that.symbol = data[0].Symbol;
      that.fullName = data[0].Name;
      that.name = cleanName(data[0].Name);
      that.exchange = data[0].Exchange;
      callback.call(that);
    }
  }).fail(function(data){
    console.log('this outputs a proper fail');
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
    if (data.Elements.length > 0) {
      that.symbol = data.Elements[0].Symbol;
      that.data = that.parseData(data.Dates, data.Elements[0].DataSeries.close.values);
      that.data = that.data.slice(0,cutoff);
      that.topFive(data.Elements[0].DataSeries.close.values.slice(0,cutoff));
      that.data = that.plotDataPoints(that.data);
      that.max = that.getMax(data.Elements[0].DataSeries.close.values.slice(0,cutoff));
      that.min = that.getMin(data.Elements[0].DataSeries.close.values.slice(0,cutoff));

      callback.call(that.data);
    } else {
      displayNoChart();
    }
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

StockData.prototype.topFive = function(prices) {
  percent_change_arr = [];
  for (var i = 1; i < prices.length; i++) {
    percent_change_arr.push(((prices[i] - prices[i - 1]) / prices[i - 1]) * 100)
  }
  var sorted_arr = percent_change_arr.sort(function(a,b){return a - b});
  console.log(sorted_arr);
  this.floor = sorted_arr[2]
  this.ceiling = sorted_arr[sorted_arr.length - 3]
  console.log(this.floor);
  console.log(this.ceiling);
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
  striplinesArr = [];
  for (var i = 0; i < data.length; i++) {
    var indexLabelFontColor;
    var percentChange = 0;
    var indexLabel;
    var markerType;
    if (i !== 0) {
      todayPrice = data[i][3];
      yesterdayPrice = data[i - 1][3];
      var percentChange = (((todayPrice - yesterdayPrice) / yesterdayPrice) * 100);
      console.log(this.floor);
      if (percentChange >= this.ceiling || percentChange <= this.floor) {
        indexLabel = percentChange.toFixed(1) + '%';
        markerType = 'circle'
        striplinesArr.push({value: new Date(data[i][0], (data[i][1] - 1), data[i][2]), label: indexLabel, color: 'gray', showOnTop: true, thickness: 2, lineDashType: 'dash'})
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
    dataPointsArr.push({ x: new Date(data[i][0], (data[i][1] - 1), data[i][2]), y: data[i][3], percentChange: percentChange, markerType: markerType, indexLabelFontColor: indexLabelFontColor, markerSize: 15, markerColor: 'orange',parsedDate: parsedDate});

  }
  this.plotStripLines(striplinesArr);
  return dataPointsArr;
};

StockData.prototype.plotStripLines = function(striplines) {
  this.striplines = striplines;
};
