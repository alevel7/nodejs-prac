

var path = require('path');
var fs = require('fs')
var _data = require('./data')
var https = require('https')
var http = require('http')
var url = require('url')
var helpers = require('helpers')

var workers = {}

workers.gatherAllChecks = function () {
    _data.list('checks', function(err, checks){
        if (!err && checks && checks.length > 0) {
            checks.forEach(function(check) {
                
            });
        } else {
            console.error('could not find any checks to ather')
        }
    })
}


workers.loop = function(){
    setInterval(() => {
        workers.gatherAllChecks()
    }, 1000 * 60);
}

workers.init = function() {
    workers.gatherAllChecks()
    workers.loop()
}


module.exports = workers