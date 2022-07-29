const express = require('express');
const { User } = require('../schemas/usersSchema')
const axios = require('axios')
const passport = require('passport');
const KAKAO_OAUTH_TOKEN_API_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_GRANT_TYPE = 'authorization_code'
const KAKAO_CLIENT_id = process.env.KAKAO_ID
const KAKAO_REDIRECT_URL = 'https://mptiserver.link/api/kakao/callback'

const router = express.Router();

router.post('/', (req, res, next) => {
  const data = req.query.data;
  console.log(data)
  res.send(data)
});

//소셜 로그인 카카오 구현
// router.get('/', passport.authenticate('kakao'));

// router.get(
//   '/callback',
//   passport.authenticate('kakao', {
//     failureRedirect: '/',
//   }),
//   (req, res) => {
//     res.redirect('/');
//   },
// );



module.exports = router;