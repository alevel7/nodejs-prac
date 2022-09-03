var crypto = require('crypto');

var helpers = {};
var config = require('./../config')

helpers.hash = function(password) {
    var hash = crypto.createHmac('sha256', config.hashingSecret)
    .update(password).digest('hex');
    return hash;
}

helpers.parseJsonToObject = function(string) {
    try {
        var obj = JSON.parse(string);
        return obj;
    } catch (error) {
        return {}
    }
}

module.exports = helpers;