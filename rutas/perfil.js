const express = require('express');
const router = express.Router();
const CheckAuth = require('../auth');

router.get('/', CheckAuth, async (req, res) => {
 res.send('Hola :D')
  
})

module.exports = router;
