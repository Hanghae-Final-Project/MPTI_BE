require('dotenv').config()
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../schemas/usersSchema');


module.exports = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_ID,
        callbackURL: 'http://3.35.170.203/api/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        console.log('kakao profile', profile, accessToken);
        try {
          const exUser = await User.findOne({
            where: { snsId: profile.id, provider: 'kakao' },
          });
          if (exUser) {
            done(null, exUser);
          } else {
            const newUser = await User.create({
              name: profile.displayName,
              snsId: profile.id,
              provider: 'kakao',
            });
            console.log('이메일')
            done(null, newUser);
          }
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};
