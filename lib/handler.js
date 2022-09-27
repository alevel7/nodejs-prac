var _data = require('./data');
var helpers = require('./helpers')
var config = require('./config');
var handlers = {};

handlers.sample = function (data, callback) {

    callback(406, { name: 'callback' })
};

handlers.notFound = function (data, callback) {
    callback(404)
}

handlers.ping = function (data, callback) {
    callback(200)
}

handlers.users = function (data, callback) {
    // console.log(data)
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._users[data.method](data, callback)
    } else {
        callback(405);
    }
}

// handlers for users actions
handlers._users = {};
handlers._users.post = function (data, callback) {

    var firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.length > 0 ?
        data.payload.firstName.trim() : false;
    var lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.length > 0 ?
        data.payload.lastName.trim() : false;
    var phone = typeof data.payload.phone === 'string' && data.payload.phone.length === 11 ?
        data.payload.phone.trim() : false;
    var firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.length > 0 ?
        data.payload.firstName.trim() : false;
    var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    var tosAgreement = data.payload.tosAgreement === true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, function (err, data) {
            if (err) {
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    var userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }

                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err)
                            callback(500, { 'Error': 'Could not create new user' })
                        }
                    })
                } else {
                    callback(500, { Error: err })
                }


            } else {
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
}
handlers._users.get = function (data, callback) {
    if (data.queryObject.phone) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers.tokens.verifyToken(token, phone, function(tokenIsValid){
            if(tokenIsValid) {

                _data.read('users', data.queryObject.phone, function (err, data) {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200, { data })
                    } else {
                        callback(404, { 'Error': `user with phone not found` })
                    }
                })
                
            } else {
                callback(403, {Error: 'Missing required token in header or token is invalid'})
            }
        })
    } else {
        callback(400, { 'Error': 'phone number must be specified' });
    }
}
handlers._users.put = function (data, callback) {
    if (!data.payload.phone) {
        callback(400, { Error: 'Phone number is required' })
    } else {
        /**
         * if a field(s) will be updated, phone number is compulsory
         * while other fields are optional
         */
        var acceptableFields = [
            'firstName',
            'lastName',
            'phone',
            'tosAgreement'
        ];
        var errorKeys = Object.keys(data.payload).filter(key => !acceptableFields.includes(key));
        if (errorKeys.length > 0) {
            callback(400, { Error: 'keys not allowed', errorKeys })
        } else {
            _data.read('users', data.payload.phone, function (err, prvData) {
                if (!err && prvData) {
                    var newUserData = { ...prvData, ...data.payload }
                    _data.update('users', newUserData.phone, newUserData, function (err) {
                        if (err) {
                            callback(500, { Error: 'Unable to update user' });
                            return;
                        } else {
                            delete newUserData.password;
                            callback(200, { 'data': newUserData })
                            return;
                        }
                    })
                } else {
                    callback(400, { 'Error': `user does not exists` })
                }
            })
        }

    }
}
handlers._users.delete = function (data, callback) {
    if (data.queryObject.phone) {
        _data.read('users', data.queryObject.phone, function (err, data) {
            if (!err && data) {
                _data.delete('users', data.phone, function (err) {
                    if (err) {
                        callback(500, { Error: 'could not delete specified user' })
                    } else {
                        callback(204)
                    }
                })
            } else {
                callback(404, { 'Error': `user with phone not found` })
            }
        })
    } else {
        callback(400, { 'Error': 'phone number must be specified' });
    }
}

// token handlers
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(405);
    }
}

handlers._tokens = {};
handlers._tokens.verifyToken = function (id, phone, callback) {
    _data.read('token', id, function(err, tokenData){
        if (!err && tokenData) {
            if (tokenData.phone == phone && tokenData.expires > Date.now) {
                callback(true)
            } 
        }else{
            callback(false)
        }
    })
}
handlers._tokens.post = function (data, callback) {
    var phone = typeof data.payload.phone === 'string' && data.payload.phone.length === 11 ?
        data.payload.phone.trim() : false;
    var password = typeof data.payload.password === "string" && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    if (phone && password) {
        _data.read('users', phone, function(err, userData){
            if (!err && userData){
                var hashedPassword = helpers.hash(password)
                if (hashedPassword == userData.hashedPassword) {
                    var tokenId = helpers.createRandomstring(20);
                    var expires = new Date().getTime() * 1000 * 60 * 60;
                    var tokenObject = {
                        phone,
                        expires,
                        id: tokenId
                    }
                    console.log(tokenObject)
                    _data.create('token', tokenId, tokenObject, function (err) {
                        if (!err){
                            callback(200, tokenObject)
                        }else{
                            callback(500, {'Error':'could not create new token!'})
                        }
                    })
                }else{
                    callback(400, {Error: 'Password is not valid'})
                }
            }else{
                callback(400, {Error: 'could not find the specifid user'})
            }
        })
    }else{
        callback(400, {'Error':'Missing required fields'})
    }
}
handlers._tokens.get = function (data, callback) {
    if (data.queryObject.id) {
        _data.read('token', data.queryObject.id, function (err, userData) {
            console.log(err)
            if (!err && userData) {
                callback(200, userData)
            } else {
                callback(404, { 'Error': `user token invalid` })
            }
        })
    } else {
        callback(400, { 'Error': 'id must be specified' });
    }
}
handlers._tokens.put = function (data, callback) {
    var id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
    var extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false;
    
    if (id && extend) {
        _data.read('token', id, function (err, tokenData) {
            console.log(err, tokenData)
            if (!err && tokenData) {
                if (tokenData.expires > new Date().getTime()) {
                    tokenData.expires = new Date().getTime() + 1000 * 60 * 60;

                    _data.update('token', id, tokenData, function(err){
                        if (!err) {
                            callback(200)
                        }else{
                            callback(500, {error: 'could not update token expiration'})
                        }
                    })
                }else {
                    callback(400, {error: 'token already expired, please log in'})
                }
            } else {
                callback(404, { 'Error': `user token does not exist` })
            }
        })
    }else {
        callback(400, {error: 'Missing required field(s) or fields are invalid'})
    }
}
handlers._tokens.delete = function (data, callback) {
    var id = typeof(data.queryObject.id) == 'string' && data.queryObject.id
    if (id) {
        _data.read('token', id, function(err, data){
            if(!err & data) {
                _data.delete('token', id, function(err) {
                    if (!err){
                        callback(200)
                    }else{
                        callback(500, {Error: 'could not delete the specified token'})
                    }
                })
            }else{
                callback(400, {error: 'could not find specified token'})
            }
        })
    }else{
        callback(400, {error:'missing required field'})
    }
}

// checks service
handlers.checks = function (data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._checks[data.method](data, callback)
    } else {
        callback(405);
    }
}

handlers._checks = {}

// checks post
handlers._checks.post = function(data, callback) {
    var protocol = typeof data.payload.protocol === 'string' && ['https', 'http'].indexOf(data.payload.protocol)  > -1 ? data.payload.protocol : false;
    var url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
    var method = typeof data.payload.method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method)  > -1 ? data.payload.method : false;
    var successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 1? data.payload.successCodes : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        var token = typeof data.headers.token === 'string' ? data.headers.token : false;
        _data.read('tokens', token, function(err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;

                _data.read('users', userPhone, function(err, userData){
                    if(!err && userData) {
                        var userChecks = typeof(userData.checks) =='object' && userData.checks instanceof Array ? userData.checks : [];
                        if (userChecks.length < config.maxChecks) {
                            var checkId = helpers.createRandomstring(20)

                            var checkObj = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes':successCodes,
                                'timeoutSeconds': timeoutSeconds
                            }

                            _data.create('checks', checkId, checkObj, function(err){
                                if(!err) {
                                    userChecks.checks = userChecks;
                                    userChecks.checks.push(checkId);

                                    _data.update('users', userPhone, userData, function (err) {
                                        if (!err) {
                                            callback(200, checkObj)
                                        }
                                    })
                                } else {
                                    callback(500, {error: 'could not create new checks'})
                                }
                            })
                        } else {
                            callback(400, {error: `user already reach maximum checks ${config.maxChecks}`})
                        }
                    } else {
                        callback(403)
                    }
                })
            } else {
                callback(403)
            }
        })
    }else {
        callback(400, {error: 'missing required input or input is invalid'})
    }

}

handlers._checks.get = function (data, callback) {
    if (data.queryObject.id) {
        var id = typeof(data.queryObject.id) == 'string' ? data.queryObject.id : false;

        if (id) {
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            _data.read('checks', id, function(err, checkData){
                if (!err && checkData) {
                    
                    handlers.tokens.verifyToken(token, phone, function(tokenIsValid){
                        if(tokenIsValid) {
            
                            _data.read('users', data.queryObject.phone, function (err, data) {
                                if (!err && data) {
                                    delete data.hashedPassword;
                                    callback(200, { data })
                                } else {
                                    callback(404, { 'Error': `user with phone not found` })
                                }
                            })
                            
                        } else {
                            callback(403, {Error: 'Missing required token in header or token is invalid'})
                        }
                    })
                }else {
                    callback(404)
                }
            })
          
        }else {
            callback(400, {error: 'missing required fields'})
        }
       
    } else {
        callback(400, { 'Error': 'phone number must be specified' });
    }
}


module.exports = handlers;