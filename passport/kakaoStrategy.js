require('dotenv').config()
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../schemas/usersSchema');


module.exports = () => {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_ID,
        callbackURL: process.env.KAKAO_CALL_BACK_URL,
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
