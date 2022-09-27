
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers')


var lib = {}
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function (dir, file, data, callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            var stringData = JSON.stringify(data)
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err){
                    if(!err) {
                        callback(false)
                    } else {
                        callback('Error closing file')
                    }
                }else{
                    callback('Error writing to file')
                }
            })
        }else {
            callback('Could not open file, it may already exists')
        }
    })
}

lib.read = function(dir, file, callback) {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function(err, data){
        if(!err){
            var parsedData = helpers.parseJsonToObject(data)
            callback(false, parsedData)
        }else {
             callback(err, data)
        }
       
    })
}

lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor){
        if(!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
        }

        fs.ftruncate(fileDescriptor, function(err){
            if (!err){
                fs.writeFile(fileDescriptor, stringData, function(err){
                    if(!err) {
                        fs.close(fileDescriptor, function (err) {
                            if (!err){
                                callback(false)
                            }else {
                                callback('Error closing file')
                            }
                        })
                    }else {
                        callback('Error writing to existing file')
                    }
                })
            }else {
                callback('Error truncating file')
            }
        })
    })
}

lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err){
        if (!err) {
            callback(false)
        }else{
            callback('Error deleting file')
        }
    })
}

lib.list = function(dir, callback) {
    fs.readdir(lib.baseDir + dir + '/', function(err, data) {
        console.log(data)
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName){
                trimmedFileNames.push(fileName.replace('.json', ''))
            })
            callback(false, trimmedFileNames)
        }else {
            callback(err, data)
        }
    })
}

module.exports = lib