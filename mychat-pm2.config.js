//Ejemplo para poner MyChat como servicio via PM2 (todos los SO donde corra Node.js)
//pm2 start ./index.js
module.exports = {
    apps: [
        {
            name: 'mychat',
            script: './index.js',
            watch: false,
            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
