const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');
const { processFrontEndMessage } = require("../renderMessage.js");

router.get('/', CheckAuth, async function (req, res) {
  try {
    const user = await req.client.users.fetch(req.user.id);
    const avatarURL = user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 });
    const channel = await req.client.channels.fetch(process.env.ID_CHANNEL).catch(() => { });
    if (!channel) return res.status(500).send("Canal inválido.<br>Por favor corriga ID_CHANNEL con la ID del canal correcta.");
    const pre_messages = await channel.messages.fetch();
    const lastMessage = JSON.stringify({ author: pre_messages.filter(e => Boolean(e.content || e.attachments.first())).first().author.username, id: pre_messages.filter(e => Boolean(e.content || e.attachments.first())).first().id });
    const messages = pre_messages.filter(e => Boolean(e.content || e.attachments.first())).map(processFrontEndMessage.bind(null, req.client)).reverse();
    const key = req.csrfToken();
    someKeys.set(key, req.user.id);
    res.render("index.ejs", {
      user: req.user,
      avatarURL,
      channel,
      messages,
      key,
      lastMessage
    });
  } catch (err) {
    res.status(500).send("Un error ocurrió!<br><br>" + err);
  }
}).get('/login', function (req, res, next) {
  if (req.query.error === "access_denied") return res.status(401).send("Primero debe iniciar sesión en Discord.<br><a href='/'>Click</a> para volver a intentarlo");
  else {
    passport.authenticate("discord", {
      failureMessage: true
    })(req, res, next)
  }
}, function (req, res) {
  res.redirect("/")
}).get('/salir', function (req, res) {
  if (req.user) {
    req.logout()
    res.status(202).send("Sesión cerrada.<br>Gracias por usar MyChat!<br><a href='/'>Click</a> para volver a entrar")
  } else res.redirect("/")
});
module.exports = router;