const express = require('express');
const router = express.Router();
const passport = require('passport');
const CheckAuth = require('../auth');
const fetch = require('node-fetch')

router.get('/', CheckAuth,function (req, res) {
  res.render("index.ejs", {
    user: req.user
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
.post('/send', CheckAuth, async(req, res) => {
  let msg_final = req.body.msg_send;
  console.log(msg_final);
  if(!msg_final) return res.redirect("/asdasdasd")
  let avatarURL = `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
  const body = JSON.stringify({
    allowed_mentions: {
      parse: []
    },
    content: msg_final,
    username: req.user.username,
    avatar_url: avatarURL
  });

  let URLWH = `https://discord.com/api/v8/webhooks/${process.env.ID_WH}/${process.env.TOKEN_WH}`

  fetch(URLWH, {
    method: 'POST',
    body: body,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  await res.redirect("/")
})

module.exports = router;