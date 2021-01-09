const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');

router.get('/', CheckAuth, function (req, res) {
  let avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
  let channel = req.client.channels.resolve(process.env.ID_CHANNEL)

  res.render("index.ejs", {
    user: req.user,
    avatarURL: avatarURL,
    channel: channel
  })

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