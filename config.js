var environment = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging'
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production'
    }
}

var env = process.env.NODE_ENV || 'staging';
console.log(process.env.NODE_ENV)

var currentEnv = environment[env]
module.exports = currentEnv