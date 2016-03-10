function NYT () {
  this.result;
  this.articles;
}


NYT.prototype.getData = function(query, date, callback){
  var urlQuery = query;
  var urlDate = date;
  var that = this;
  $.ajax({
    url: 'http://api.nytimes.com/svc/search/v2/articlesearch.json?fq=headline:(%22' +
    urlQuery +
    '%22)&facet_field=day_of_week&begin_date=' +
    urlDate +
    '&end_date=' +
    urlDate + '&facet_filter=true&api-key=fe60356a93d52a662d89e8bb3eba132c:0:74645158',
    method: 'get'
  })
  .done(function(data){
    console.log(data.response.docs);
    that.result = data;
    that.articles = that.result.response.docs;
    callback.call(that.result);
  }).fail(function(data){
    console.log('Error: ' + data);
  });
};
