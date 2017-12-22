var express = require('express');
var cheerio = require('cheerio');
var superagent = require('superagent');
var fs = require('fs');
var request = require('request');
var mkdirp = require('mkdirp');

var app = express();
var downDirName = "down/";
var errorLog = [];

app.get('/', function(req, res, next) {
  var pageUrl = req.query.url ? req.query.url : 'https://www.baidu.com/';
  superagent.get(pageUrl)
    .end(function(err, sres) {
      if (err) { 
        errorLog.push({
          "name":"请求错误",
          "data":err
        });
        return next(err);
      };

      var $ = cheerio.load(sres.text);
      var itemLinks = [];

      $('.entry-title a[rel="bookmark"]').each(function(index, ele) {

        var link = $(ele).attr('href');
        itemLinks.push(link);
      })
      pagesLoad(itemLinks);
      res.send('downloading');
    })
})

var pagesLoad = function(pageLinks) {
  var deep = pageLinks.length;
  var step = 0;
  downPage(step, pageLinks);
}
var downImage = function(step, arr, dir, pagestep, pagearr) {
  if (step == arr.length) {
    return;
  } else {
    step++;
    if(!arr[step]){
    	console.log(arr[step]);
    }
    request.head(arr[step], function(err, res, body) {
      if (err) {
        downPage(pagestep, pagearr);
        errorLog.push({
          "name":"下载图片错误",
          "data":err,
          "pageNo":pagestep,
          "imgNo":step
        });
        return err;
      }
      
      var options = {
        url: arr[step],
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36'
        }
      }
      request(options).on('end', function() {
        console.log('image '+ step +' downloaded');
      }).on('error', function() {
        console.log('error');
      }).pipe(fs.createWriteStream(dir + '/' + step + '.jpg'));
      downImage(step, arr, dir, pagestep, pagearr);
    })
  }
}
var downPage = function(pagestep, pagearr) {
	if (pagestep == pagearr.length) {
		console.log("All image are downloaded");
    saveLog(errorLog);
    return;
  }
  superagent.get(pagearr[pagestep])
    .end(function(err, sres) {
      if (err) { 
        errorLog.push({
          "name":"获取页面内容错误",
          "data":err,
          "pageNo":pagestep
        });
        return err;
      }
      pagestep++;
      var img_items = [];
      var img_links = [];
      var $ = cheerio.load(sres.text);
      var dir = './' + downDirName + $('.entry-header>.entry-title').text();
      mkdirp(dir, function(err) {
        if (err) {
          console.log(err);
        }
      })
      var $ = cheerio.load(sres.text);
      if ($('a[rel="flickrGal0"]').length) {
        img_items = $('a[rel="flickrGal0"]')
      } else {
        img_items = $('a.photoswipe');
      }
      for (let i = 0; i < img_items.length; i++) {
        img_links.push($(img_items[i]).attr('href'));
      }
      if(img_links.length){
				downImage(0, img_links, dir, pagestep, pagearr);
      }else{
      	downPage(pagestep, pagearr);
      }
      console.log("now is "+pagestep, " at "+pagearr.length);
    })
}

var saveLog = function(logData){
  fs.createWriteStream('log-data.json',logData)
  .on('finish',function(){
    console.log('导出日志完成');
  })
}

app.listen(3000, function() {
  console.log('app is listening at port 3000');
});