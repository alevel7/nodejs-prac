var environment = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging',
        hashingSecret: '87482ji',
        maxChecks: 5
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production',
        hashingSecret: '89kj2389',
        maxChecks: 5
    }
}

var env = process.env.NODE_ENV || 'staging';

var currentEnv = environment[env]
module.exports = currentEnv