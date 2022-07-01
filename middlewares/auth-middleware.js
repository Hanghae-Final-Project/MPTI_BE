const jwt = require('jsonwebtoken');
const User = require('../schemas/usersSchema');
require('dotenv').config();

module.exports = (req, res, next) => {
  console.log(req.headers);
  const { authorization } = req.headers;

  const [tokenType, tokenValue] = (authorization || '').split(' ');
  console.log(authorization);
  if (!tokenValue || tokenType !== 'Bearer') {
    return res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.',
    });
  }

  try {
    const { userId } = jwt.verify(tokenValue, process.env.JWT_SECRET_KEY);
    console.log(userId);
    User.findById(userId)
      .exec()
      .then((user) => {
        res.locals.user = user;
        next();
        if (!user) {
          res.status(400).send({
            errorMessage: '회원가입이 필요합니다',
          });
        }
      });
  } catch (err) {
    res.status(401).send({
      errorMessage: '로그인 후 이용 가능합니다.',
    });
  }
};
