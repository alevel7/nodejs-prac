var _data = require('./data');
var helpers = require('./helpers')
var handlers = {};

handlers.sample = function(data, callback) {

    callback(406, {name:'callback'})
};

handlers.notFound = function (data, callback) {
    callback(404)
}

handlers.ping = function (data, callback) {
    callback(200)
}

handlers.users = function(data, callback) {
    // console.log(data)
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.includes(data.method)) {
        handlers._users[data.method](data, callback)
    }else{
        callback(405);
    }
}

// handlers for users actions
handlers._users = {};
handlers._users.post = function(data, callback) {
    
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
        _data.read('users', phone, function(err, data) {
            if (!err) {
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    var userObject = {
                        firstName,
                        lastName,
                        phone,
                        hashedPassword,
                        tosAgreement
                    }
    
                    _data.create('users', phone, userObject, function(err){
                        if(!err) {
                            callback(200)
                        }else{
                            console.log(err)
                            callback(500, {'Error':'Could not create new user'})
                        }
                    })
                }else{
                    callback(500, {Error: err})
                }

               
            }else {
                callback(400, {'Error':'A user with that phone number already exists'});
            }
        })
    }else {
        callback(400, {'Error': 'Missing required field'})
    }
}
handlers._users.get = function(data, callback) {
    if (data.queryObject.phone) {
        _data.read('users', data.queryObject.phone, function(err, data){
            if (!err && data){
                delete data.hashedPassword;
                callback(200, {data})
            }else{
                callback(404, {'Error':`user with phone not found`})
            }
        })
    }else{
        callback(400, {'Error':'phone number must be specified'});
    }
}
handlers._users.put = function(data, callback) {
    if (!data.payload.phone) {
        callback(400, {Error: 'Phone number is required'})
    }else {
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
        var errorKeys = Object.keys(data.payload).filter( key => !acceptableFields.includes(key));
        if (errorKeys.length > 0) {
            callback(400, {Error: 'keys not allowed', errorKeys})
        } else {
            _data.read('users', data.payload.phone, function(err, prvData){
                if (!err && prvData){
                    var newUserData = {...prvData, ...data.payload}
                    _data.update('users',newUserData.phone, newUserData, function(err){
                        if(err){
                            callback(500, {Error: 'Unable to update user'});
                            return;
                        }else {
                            delete newUserData.password;
                            callback(200, {'data':newUserData})
                            return;
                        }
                    })
                }else{
                    callback(400, {'Error':`user does not exists`})
                }
            })
        }

    }
}
handlers._users.delete = function(data, callback) {
    if (data.queryObject.phone) {
        _data.read('users', data.queryObject.phone, function(err, data){
            if (!err && data){
               _data.delete('users', data.phone, function(err) {
                if(err) {
                    callback(500, {Error: 'could not delete specified user'})
                }else{
                    callback(204)
                }
               })
            }else{
                callback(404, {'Error':`user with phone not found`})
            }
        })
    }else{
        callback(400, {'Error':'phone number must be specified'});
    }
}

module.exports = handlers;