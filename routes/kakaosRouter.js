const express = require('express');
const axios = require('axios')
// const passport = require('passport');
const KAKAO_OAUTH_TOKEN_API_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_GRANT_TYPE = 'authorization_code'
const KAKAO_CLIENT_id = process.env.KAKAO_ID
const KAKAO_REDIRECT_URL = 'https://mptiserver.link/api/kakao/callback'

const router = express.Router();
router.get('', (req, res, next) => {
  const code = req.query.code;
  try{
      axios.post(
          `${KAKAO_OAUTH_TOKEN_API_URL}?grant_type=${KAKAO_GRANT_TYPE}&client_id=${KAKAO_CLIENT_id}&redirect_uri=${KAKAO_REDIRECT_URL}&code=${code}`
          , {
           headers: {
              'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
          }
      }).then((result)=>{
          console.log(result.data['access_token'])
          // 토큰을 활용한 로직을 적어주면된다.

      }).catch(e=> {
          console.log(e)
          res.send(e);
      })
  }catch(e){
      console.log(e)
      res.send(e);
  }
})

// //소셜 로그인 카카오 구현
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