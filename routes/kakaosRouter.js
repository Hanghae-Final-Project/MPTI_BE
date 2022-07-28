const express = require('express');
const passport = require('passport');

const router = express.Router();


//소셜 로그인 카카오 구현
router.get('/', passport.authenticate('kakao'));

router.get(
  '/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/',
  }),
  (req, res) => {
    res.redirect('/');
    res.header('Access-Control-Allow-Origin', '*')
  }
);

module.exports = router;