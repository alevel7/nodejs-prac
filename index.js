var http = require('http');
var https = require('https')
var url = require('url');
var fs = require('fs');
var config = require('./config');
var stringDecoder = require('string_decoder').StringDecoder;
var _data = require('./lib/data');
var handlers = require('./lib/handler');
var helpers = require('./lib/helpers');

// _data.delete('test', 'newFile',  function(err){
//     console.log('this was the error', err)
// })
// _data.update('test', 'newFile', {'fizz':'buzz'}, function(err){
//     console.log('this was the error', err)
// })
// _data.create('test', 'newFile', {'foo':'bar'}, function(err){
//     console.log(err)
// })
// _data.read('test', 'newFile', function(err, data){
//     console.log('this is the err', err, 'and data', data)
// })
// handlers

//routers
var router = {
    sample: handlers.sample,
    notFound: handlers.notFound,
    ping: handlers.ping,
    users: handlers.users
}

var httpsServerOption = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}

var httpServer = http.createServer(function(req, res){
  unifiedServer(req, res)
});

var httpsServer = https.createServer(httpsServerOption, function (req, res) {
    unifiedServer(req, res)
})

function unifiedServer(req, res) {
    var parseUrl = url.parse(req.url, true)
    var pathName = parseUrl.pathname.replace('/', '');
    var queryObject = parseUrl.query;
    var headers = req.headers;
    var decoder = new stringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
        buffer += decoder.write(data)
    })
    req.on('end', function () {
        buffer += decoder.end();
        var chosenHandler = router[pathName] ? router[pathName] : router['notFound'];
        console.log('chosen path :', pathName)
        var data = {
            pathName,
            queryObject,
            method: req.method.toLowerCase(),
            headers,
            payload: helpers.parseJsonToObject(buffer)
        }

        chosenHandler(data, function (statusCode, payload) {
            statusCode = typeof statusCode == 'number' ? statusCode : 200;
            payload = typeof payload == 'object' ? payload : {};
            stringedPayload = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(stringedPayload)
        })
    })
}


httpServer.listen(config.httpPort, function(){
    console.log(`server listening on port ${config.httpPort}: ${config.envName}`)
})

httpsServer.listen(config.httpsPort, function(){
    console.log(`server listening on port ${config.httpsPort}: ${config.envName}`)
})

//'0790150466 access'