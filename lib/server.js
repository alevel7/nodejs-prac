var http = require('http');
var https = require('https')
var url = require('url');
var fs = require('fs');
var config = require('./config');
var stringDecoder = require('string_decoder').StringDecoder;
var _data = require('./data');
var handlers = require('./handler');
var helpers = require('./helpers');
var path = require('path')

var server = {}

//routers
server.router = {
    sample: handlers.sample,
    notFound: handlers.notFound,
    ping: handlers.ping,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks
}

server.httpsServerOption = {
    key: fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
}

server.httpServer = http.createServer(function(req, res){
  server.unifiedServer(req, res)
});


server.httpsServer = https.createServer(server.httpsServerOption, function (req, res) {
    server.unifiedServer(req, res)
})

server.unifiedServer = function(req, res) {
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
        var chosenHandler = server.router[pathName] ? server.router[pathName] : server.router['notFound'];
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

server.init = function() {
    server.httpServer.listen(config.httpPort, function(){
        console.log(`server listening on port ${config.httpPort}: ${config.envName}`)
    })

    server.httpsServer.listen(config.httpsPort, function(){
        console.log(`server listening on port ${config.httpsPort}: ${config.envName}`)
    })
}





module.exports = server;