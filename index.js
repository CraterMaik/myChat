const express = require('express');
const app = express();
const passport = require('passport');
const { Strategy } = require('passport-discord');
require('dotenv').config()

const bodyparser = require('body-parser');
const session = require('express-session');

const path = require('path');
const fs = require('fs');

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
    return done(null, profile);

  })
}))

app
.use(bodyparser.json())
.use(bodyparser.urlencoded({
  extended: true
}))
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
.use("/", require('./rutas/index'))
.use("/perfil", require('./rutas/perfil'))

.get('*', function(req, res) {
  res.send('Error 404!')
})


app.listen('3030', function () {
  console.log('Listo, en el puerto 3030');
})

process.on("unhandledRejection", (r) => {
  console.dir(r);
});

