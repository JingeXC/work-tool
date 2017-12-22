var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');
var fs = require('fs');
var request = require('request');

var fileDir = "./data.json";
var data = JSON.parse(fs.readFileSync(fileDir));

var app = express();

app.get('/', function(req, res, next) {
  var olds = data.olds;
  getprice(olds,0);
  res.send("working");
})

var getprice = function(arr,step){
  if(step>=arr.length){
    console.log("catch finished");
    writeData();
    return;
  }
  superagent.get(arr[step].url)
    .end(function(err, sres) {
      if (err) { 
        return next(err);
      };
      var $ = cheerio.load(sres.text);
      var CN_price = $('.propertyDetail .priceline').text().replace(/(^\s*)|(\s*$)/g,"");
      var NZ_price = $('.propertyDetail .priceline').siblings('p').text();
      arr[step].clientPrice = CN_price;
      arr[step].salePrice = NZ_price;
      step++;
      console.log(CN_price);
      console.log('共'+ arr.length + " , 第" + step);
      getprice(arr,step);
    })
}

var writeData = function(){
  var dataString = JSON.stringify(data);
  fs.writeFile('newData.json',dataString,function(err){
    if(err) throw err;
    console.log('file saved');
  })
}

app.listen(3000, function() {
  console.log('app is listening at port 3000');
});