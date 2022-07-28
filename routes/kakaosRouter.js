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
  }
);
exports.handler = async (event) => {
  const response = {
      statusCode: 200,
      headers: {
          "Access-Control-Allow-Origin": 'http://localhost:3000',
      },
      body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};

module.exports = router;