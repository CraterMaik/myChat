require('dotenv').config();

const express = require('express');
const app = express();
const passport = require('passport');
const { Strategy } = require('passport-discord');

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const session = require('express-session');
const csurf = require('csurf');
global.someKeys = new Map();

const path = require('path');
const Discord = require('discord.js');
const client = new Discord.Client({ allowedMentions: { parse: [] } });
const { processFrontEndMessage, validInvs } = require('./renderMessage.js');

const webhook = new Discord.WebhookClient(
    process.env.ID_WH,
    process.env.TOKEN_WH,
    { allowedMentions: { parse: [] } }
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const scopes = ['identify'];

passport.use(
    new Strategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: `${process.env.URL}/login`,
            scope: scopes,
        },
        function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                return done(null, profile);
            });
        }
    )
);

app.use(express.json())
    .use(express.urlencoded({ extended: true }))
    .engine('html', require('ejs').renderFile)
    .use(express.static(path.join(__dirname, '/public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .use(
        session({
            secret: 'name',
            resave: false,
            saveUninitialized: false,
        })
    )
    .use(passport.initialize())
    .use(passport.session())
    .use(csurf({ cookie: false }))
    .use(function (req, res, next) {
        req.client = client;
        next();
    })
    .use('/', require('./rutas/index'))

    .get('*', function (req, res) {
        res.status(404).sendFile(__dirname + '/views/404.html');
    })
    .use('*', function (req, res) {
        res.status(405).sendFile(__dirname + '/views/405.html');
    });

client.on('ready', async () => {
    console.log('Bot ready!');
});

io.on('connection', (socket) => {
    socket.on('add message', async function (key, pre_content) {
        if (!someKeys.has(key)) return;
        const channel = await client.channels.fetch(process.env.ID_CHANNEL);
        const user = await client.users.fetch(someKeys.get(key).userID);
        const member = await channel.guild.members
            .fetch(someKeys.get(key).userID)
            .catch(() => {});
        if (someKeys.get(key).send_on && channel.rateLimitPerUser) {
            const time = someKeys.get(key).send_on;
            const dif = Date.now() - time.getTime();
            const seconds = Math.floor(Math.abs(dif / 1000));
            if (channel.rateLimitPerUser > seconds)
                return socket.emit(
                    'cooldown',
                    seconds,
                    channel.rateLimitPerUser
                );
        }
        someKeys.get(key).send_on = new Date();
        let content = pre_content;
        if (validInvs(content)) {
            content = `**${user.username}** invalid link.`;
        }
        webhook
            .send(content, {
                username: (member ? member.displayName : user.username).replace(
                    /clyde/gi,
                    'Clide'
                ),
                avatarURL: user.displayAvatarURL({ format: 'png' }),
            })
            .then(() => {
                socket.emit('cooldown', null, channel.rateLimitPerUser);
            });
    });

    socket.on('join', async function (key) {
        if (!someKeys.has(key)) return;
        const channel = await client.channels.fetch(process.env.ID_CHANNEL_LOG);
        const user = await client.users.fetch(someKeys.get(key).userID);
        webhook.send(
            `**Join:** ${user.username}#${user.discriminator} (${user.id})`,
            {
                username: 'MyChat',
                avatarURL: 'https://i.imgur.com/TVaNWMn.png',
            }
        );

        socket.userId = someKeys.get(key).userID;
        socket.key = key;
        channel.send({
            embed: {
                title: `Join: ${user.username}#${user.discriminator} (${user.id})`,
                color: 0x8db600,
            },
        });
    });

    socket.on('disconnect', async function () {
        const user = await client.users.fetch(socket.userId).catch(() => {});
        if (!user) return;
        const channel = await client.channels.fetch(process.env.ID_CHANNEL_LOG);
        webhook.send(
            `**Leave:** ${user.username}#${user.discriminator} (${user.id})`,
            {
                username: 'MyChat',
                avatarURL: 'https://i.imgur.com/TVaNWMn.png',
            }
        );

        channel.send({
            embed: {
                title: `Leave: ${user.username}#${user.discriminator} (${user.id})`,
                color: 0xe52b50,
            },
        });
    });
});

client.on('message', async (message) => {
    if (!message.content && !message.attachments.first()) return;
    if (message.channel.id !== process.env.ID_CHANNEL) return;
    const dataMSG = processFrontEndMessage(client, message);
    io.emit('new message', dataMSG);
});

client.on('typingStart', async (channel, user) => {
    if (channel.id !== process.env.ID_CHANNEL) return;
    if (user.bot) return;

    io.emit('typingStart', {
        user: {
            id: user.id,
            username: user.username,
        },
    });
});

const port = process.env.PORT || 3000;

server.listen(port, function () {
    //login leerá desde DISCORD_TOKEN
    client.login().then(() => {
        process.env.BLACKLIST = '810963781232361512';
    });
    console.log(`Ready, port ${port}`);
});

process.on('unhandledRejection', (r) => {
    console.dir(r);
});

process.on('uncaughtException', (e) => {
    // Siempre se debe cerrar cuando hay una excepción sin capturar
    // https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
    console.dir(e);
    client.destroy();
    process.exit(1);
});
