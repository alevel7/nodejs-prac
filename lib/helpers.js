var crypto = require('crypto');

var helpers = {};
var config = require('./config')

helpers.hash = function (password) {
    var hash = crypto.createHmac('sha256', config.hashingSecret)
        .update(password).digest('hex');
    return hash;
}

helpers.parseJsonToObject = function (string) {
    try {
        var obj = JSON.parse(string);
        return obj;
    } catch (error) {
        return {}
    }
}

helpers.createRandomstring = function (stringLength) {
    strlength = typeof stringLength == 'number' && stringLength > 0 ? stringLength : false;
    if (strlength) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var result = ' ';
        const charactersLength = characters.length;
        for (var i = 0; i < stringLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    } else {
        return false
    }
}

module.exports = helpers;