require('dotenv').config();

const express = require('express');
const app = express();
const passport = require('passport');
const { Strategy } = require('passport-discord');

const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csrf');
const tokens = new csrf();
global.someKeys = new Map();

const path = require('path');
const { Client, GatewayIntentBits, WebhookClient } = require('discord.js');

// Initialize Discord client with required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    allowedMentions: { parse: [] }
});

const { processFrontEndMessage, validInvs, parseDate, isValidEmoji } = require('./renderMessage.js');

// Updated webhook initialization
const webhook = new WebhookClient({
    id: process.env.ID_WH,
    token: process.env.TOKEN_WH
});

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

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(express.json())
    .use(express.urlencoded({ extended: true }))
    .engine('html', require('ejs').renderFile)
    .use(express.static(path.join(__dirname, '/public')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    // Security enhancements
    .use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "code.jquery.com", "cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "cdn.discordapp.com", "i.imgur.com", "*.discordapp.net"],
                connectSrc: ["'self'", "ws://localhost:*", "wss://*"]
            }
        }
    }))
    .use(
        session({
            secret: process.env.SESSION_SECRET || 'mychat_secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        })
    )
    .use((req, res, next) => {
        if (!req.session.csrfSecret) {
            req.session.csrfSecret = tokens.secretSync();
        }
        req.csrfToken = function() {
            return tokens.create(req.session.csrfSecret);
        };
        next();
    })
    .use(passport.initialize())
    .use(passport.session())
    .use(apiLimiter) // Apply rate limiting to all routes
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
        try {
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
            
            // Permitir símbolos :o :) etc
            let content = pre_content;
            const emojiPattern = /:([\w+-]+):/g;
            content = content.replace(emojiPattern, (match) => {
                return isValidEmoji(match) ? match : match.replace(':', '&#58;');
            });
            
            if (validInvs(content)) {
                content = `**${user.username}** enlace inválido.`;
            }
            
            const webhookMessage = await webhook.send({
                content: content,
                username: (member ? member.displayName : user.username).replace(
                    /clyde/gi,
                    'Clide'
                ),
                avatarURL: user.displayAvatarURL({ format: 'png' }),
                wait: true
            });

            const messageData = {
                content: content,
                author: member ? member.displayName : user.username,
                avatarURL: user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
                id: user.id,
                messageID: webhookMessage.id,
                date: parseDate(new Date()),
                colorName: member ? member.displayHexColor : '#FFFFFF',
                attachmentURL: null
            };
            
            // Emitir nuevo mensaje al socket
            socket.emit('new message', messageData);
            
            // Emitirlo para todos
            socket.broadcast.emit('new message', messageData);
            
            socket.emit('cooldown', null, channel.rateLimitPerUser);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    socket.on('join', async function (key) {
        if (!someKeys.has(key)) return;
        try {
            const channel = await client.channels.fetch(process.env.ID_CHANNEL_LOG);
            const user = await client.users.fetch(someKeys.get(key).userID);
            
            await webhook.send({
                content: `**Inicio:** ${user.username} (${user.id})`,
                username: 'MyChat v2',
                avatarURL: 'https://i.imgur.com/TVaNWMn.png',
            });

            socket.userId = someKeys.get(key).userID;
            socket.key = key;
            
            await channel.send({
                embeds: [{
                    title: `Inicio: ${user.username} (${user.id})`,
                    color: 0x8db600,
                }]
            });
        } catch (error) {
            console.error('Error processing join:', error);
        }
    });

    socket.on('disconnect', async function () {
        try {
            const user = await client.users.fetch(socket.userId).catch(() => {});
            if (!user) return;
            
            const channel = await client.channels.fetch(process.env.ID_CHANNEL_LOG);
            
            await webhook.send({
                content: `**Desconectado:** ${user.username} (${user.id})`,
                username: 'MyChat v2',
                avatarURL: 'https://i.imgur.com/TVaNWMn.png',
            });

            await channel.send({
                embeds: [{
                    title: `Desconectado: ${user.username} (${user.id})`,
                    color: 0xe52b50,
                }]
            });
        } catch (error) {
            console.error('Error processing disconnect:', error);
        }
    });
});

client.on('messageCreate', async (message) => {
    if (!message.content && !message.attachments.size) return;
    if (message.channel.id !== process.env.ID_CHANNEL) return;
    const dataMSG = processFrontEndMessage(client, message);
    io.emit('new message', dataMSG);
});

client.on('typingStart', async (typing) => {
    if (typing.channel.id !== process.env.ID_CHANNEL) return;
    if (typing.user.bot) return;

    io.emit('typingStart', {
        user: {
            id: typing.user.id,
            username: typing.user.username,
        },
    });
});

const port = process.env.PORT || 3000;

server.listen(port, function () {
    client.login(process.env.DISCORD_TOKEN).then(() => {
        console.log('Bot logged in successfully');
    }).catch(error => {
        console.error('Failed to login:', error);
    });
    console.log(`Server running on port ${port}`);
});

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});