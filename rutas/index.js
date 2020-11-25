const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');


router.get('/', CheckAuth,function (req, res) {
  let avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
  res.render("index.ejs", {
    user: req.user,
    avatarURL: avatarURL
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