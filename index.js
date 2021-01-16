require('dotenv').config()

const express = require('express')
const app = express()
const passport = require('passport')
const { Strategy } = require('passport-discord')

const server = require('http').createServer(app)
const io = require('socket.io')(server)

const session = require('express-session')

const path = require('path')
const Discord = require('discord.js')
const client = new Discord.Client({ allowedMentions: { parse: [] } })

const fetch = require('node-fetch')
const emoji = require('node-emoji')
const { toHTML } = require('discord-markdown')

let URLWH = `https://discord.com/api/v8/webhooks/${process.env.ID_WH}/${process.env.TOKEN_WH}`

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((obj, done) => {
  done(null, obj)
})

let scopes = ['identify']

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: `${process.env.URL}/login`,
  scope: scopes
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    return done(null, profile)
  })
}))

app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .engine("html", require('ejs').renderFile)
  .use(express.static(path.join(__dirname, "/public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .use(session({
    secret: 'name',
    resave: false,
    saveUninitialized: false
  }))
  .use(passport.initialize())
  .use(passport.session())
  .use(function (req, res, next) {
    req.client = client
    next()
  })
  .use("/", require('./rutas/index'))

  .get('*', function (req, res) { res.status(404).sendFile(__dirname + '/views/404.html') })
  .use('*', function (req, res) { res.status(405).sendFile(__dirname + '/views/405.html') })

function validInvs(txt) {
  const regex = /((http|https)?:\/\/)?(www\.)?((discord|invite|dis)\.(gg|io|li|me|gd)|(discordapp|discord)\.com\/invite)\/[aA-zZ|0-9]{2,25}/gim
  const invs = txt.match(regex)

  return (invs ? true : false)
}

function extractContent(html) {
  if (html.replace(/<[^>]+>/g, '').trim()) {
    return true
  } else {
    return false
  }
}

client.on('ready', () => {
  console.log('Bot ready!');
})

io.on('connection', socket => {
  socket.on('add message', function (data) {
    if (validInvs(data.content)) {
      data.content = `**${data.username}** invalid link.`
    }
    const channel = client.channels.resolve(process.env.ID_CHANNEL)
    const member = channel ? channel.guild.member(data.id) : null
    const body = JSON.stringify({
      allowed_mentions: {
        parse: []
      },
      content: data.content,
      username: member ? member.displayName : data.username,
      avatar_url: data.avatarURL
    })

    fetch(URLWH, {
      method: 'POST',
      body: body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    socket.broadcast.emit('add message', {
      id: data.id,
      content: data.content,
      username: data.username,
      avatarURL: data.avatarURL,
      userColor: member ? member.displayHexColor : 'white'
    })
  })

  socket.on('join', async function (userId) {
    let user = await client.users.fetch(userId)
    let bodyWH = JSON.stringify({
      allowed_mentions: {
        parse: []
      },
      content: `**Join:** ${user.username}#${user.discriminator} (${user.id})`,
      username: 'MyChat',
      avatar_url: 'https://i.imgur.com/TVaNWMn.png'
    })

    fetch(URLWH, {
      method: 'POST',
      body: bodyWH,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    socket.userId = userId
    client.channels.resolve(process.env.ID_CHANNEL_LOG).send({
      embed: {
        title: `Join: ${user.username}#${user.discriminator} (${user.id})`,
        color: 0x8db600
      }
    })

  })

  socket.on('disconnect', async function () {
    let user = await client.users.fetch(socket.userId).catch(() => {});
    if(!user) return;
    let bodyWH = JSON.stringify({
      allowed_mentions: {
        parse: []
      },
      content: `**Leave:** ${user.username}#${user.discriminator} (${user.id})`,
      username: 'MyChat',
      avatar_url: 'https://i.imgur.com/TVaNWMn.png'
    })

    fetch(URLWH, {
      method: 'POST',
      body: bodyWH,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    client.channels.resolve(process.env.ID_CHANNEL_LOG)
      .send({
        embed: {
          title: `Leave: ${user.username}#${user.discriminator} (${user.id})`,
          color: 0xe52b50
        }
      })
  })
})

client.on('message', async message => {
  if (message.channel.id !== process.env.ID_CHANNEL) return
  if (message.author.bot) return

  let dataMDiscord = toHTML(message.content, {
    discordCallback: {
      user: node => {
        return '@' + message.guild.members.resolve(node.id).displayName
      },
      channel: node => {
        return '#' + message.guild.channels.resolve(node.id).name
      },
      role: node => {

        return '@' + message.guild.roles.resolve(node.id).name
      }
    },
    escapeHTML: true
  })

  let emojiFind = emoji.replace(dataMDiscord, (emoji) => `<i class="twa twa-3x twa-${emoji.key}"></i>`)
  if (extractContent(emojiFind)) {
    emojiFind = emoji.replace(dataMDiscord, (emoji) => `<i class="twa twa-1x twa-${emoji.key}"></i>`)
  }

  let dataMSG = {
    content: emojiFind,
    author: message.member.displayName,
    avatarURL: message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
    id: message.author.id,
    date: message.createdAt.toLocaleDateString('es-ES'),
    colorName: message.member.displayHexColor,
    attachmentURL: message.attachments.first() && message.attachments.first().height !== null ? message.attachments.first().attachment : null
  }

  io.emit('new message', dataMSG)
})

const port = process.env.PORT || 3000

server.listen(port, function () {
  //login leerá desde DISCORD_TOKEN
  client.login()
  console.log(`Ready, port ${port}`)
})

process.on("unhandledRejection", (r) => {
  console.dir(r)
})

process.on("uncaughtException", (e) => {
  // Siempre se debe cerrar cuando hay una excepción sin capturar
  // https://nodejs.org/dist/latest-v12.x/docs/api/process.html#process_warning_using_uncaughtexception_correctly
  console.dir(e)
  client.destroy()
  process.exit(1)
})
