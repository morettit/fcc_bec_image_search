require('date-util');

var url = require('url');
var express = require('express');
var search = require('bing.search');
var cbuffer = require("circular-buffer");

require('dotenv').config();
var bing = new search(process.env.BING_API_KEY);

var app = express();
var buffer = new cbuffer(10);

app.set('views', __dirname + '/html');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/',function(req,res) {
	res.render('default.html');
});

app.get('/api/images/:string',function(req,res) {
    var param = req.params.string;
    var search = {
                    term: param ,
                    when: new Date().format("yyyy/mm/dd HH:MM:ss.l Z") 
                 };
    buffer.enq(search);
    var query = null;
    if (url.parse(req.url).query != null && url.parse(req.url).query.length-1 > 0)
        query = url.parse(req.url).query.substr(0,url.parse(req.url).query.length-1);
    console.log(process.env.BING_API_KEY + " " + param + " " + query + " " + search);
    if (query != null && query.split('=')[0] === 'offset') {
        bing.images(param,{ top : parseInt(query.split('=')[1]) }, function(err,result) {
            if (err) console.error(err);
            var r = normalize(result);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(r));
            res.end();
        });
    }
    else {
        bing.images(param,{ top : 10 }, function(err,result) {
            if (err) console.error(err);
            var r = normalize(result);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(r));
            res.end();
        });
    }
});

app.get('/api/latest/images/', function(req,res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(buffer.toarray()));
    res.end();
});

var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});

var normalize = function(images) {
   for(var i = 0; i < images.length; i++) {
        delete images[i].id;
        delete images[i].displayUrl;
        delete images[i].width;
        delete images[i].height;
        delete images[i].size;
        delete images[i].type;
        delete images[i].thumbnail;
        images[i].snippet = images[i].title;
        delete images[i].title;
    }
    return images;
}