var environment = {
    staging: {
        httpPort: 3000,
        httpsPort: 3001,
        envName: 'staging',
        hashingSecret: '87482ji'
    },
    production: {
        httpPort: 5000,
        httpsPort: 5001,
        envName: 'production',
        hashingSecret: '89kj2389'
    }
}

var env = process.env.NODE_ENV || 'staging';

var currentEnv = environment[env]
module.exports = currentEnv