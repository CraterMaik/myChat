const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');

router.get('/', CheckAuth, async function (req, res) {
  let avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
  let channel = await req.client.channels.fetch(process.env.ID_CHANNEL)
  if (!channel) return res.status(500).send("Canal inválido.<br>Por favor corriga ID_CHANNEL con la ID del canal correcta.");
  let pre_messages = await channel.messages.fetch();
  let messages = pre_messages.map(message => {
    return {
      username: message.author ? message.author.username : "Deleted User",
      content: message.content,
      avatar: message.author.displayAvatarURL({ format: "png", dynamic: true }),
      highRoleColor: (message.member && message.member.roles.highest) ? message.member.roles.highest.hexColor : "#FFF"
    }
  }).reverse();
  res.render("index.ejs", {
    user: req.user,
    avatarURL: avatarURL,
    channel: channel,
    messages
  });
})
  .get('/login', function (req, res, next) {
    if (req.query.error === "access_denied") return res.status(403).send("Primero debe iniciar sesión en Discord.<br><a href='/'>Click</a> para volver a intentarlo");
    else {
      passport.authenticate("discord", {
        failureMessage: true
      })(req, res, next)
    }
  }, function (req, res) { res.redirect("/") })
  .get('/salir', function (req, res) {
    if (req.user) {
      req.logout()
      res.status(202).send("Sesión cerrada.<br>Gracias por usar MyChat!<br><a href='/'>Click</a> para volver a entrar")
    } else res.redirect("/")
  })

module.exports = router;