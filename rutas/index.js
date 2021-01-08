const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');

router.get('/', CheckAuth,function (req, res) {
  let avatarURL = req.user.avatar ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${req.user.discriminator % 5}.png`;
  let channel = req.client.channels.resolve(process.env.ID_CHANNEL)

  res.render("index.ejs", {
    user: req.user,
    avatarURL: avatarURL,
    channel: channel
  })

})
.get('/login', passport.authenticate("discord", {
      failureRedirect: "/"
}), function (req, res) {
  res.redirect("/");

})
.get('/salir', async function(req, res) {
  await req.logout();
  await res.redirect("/");
  
})

module.exports = router;