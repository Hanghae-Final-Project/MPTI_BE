require('dotenv').config();
const express = require('express');
const router = express.Router();
// const bcrypt = require("bcrypt");
const crypto = require('crypto');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../schemas/usersSchema');
const authMiddleware = require('../middlewares/auth-middleware');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const passport = require('passport');
const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'seohobucket',
    acl: 'public-read',
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname); // 이름 설정
    },
  }),
});

// <---회원가입 API-->
// // 로그인 배열을 이메일 형식으로 받게 만들어야한다.
// const postUsersSchema = Joi.object({
//   email: Joi.string().pattern(new RegExp("^[0-9a-zA-Z]([-_.0-9a-zA-Z])*@[0-9a-zA-Z]([-_.0-9a-zA-Z])*.([a-zA-Z])*")).required(),
//   password: Joi.string().required(),
//   passwordCheck: Joi.string().required(),
//   name: Joi.string().required(),
//   birthday: Joi.string().required(),
//   gender: Joi.string(),
// });

router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      passwordCheck,
      name,
      // birthday,
      // gender,
      // } = await postUsersSchema.validateAsync(req.body);
    } = req.body;
    if (password !== passwordCheck) {
      res.status(400).send({
        errorMessage: '패스워드가 불일치합니다.',
      });
      return;
    }

    const dup_id = await User.find({
      $or: [{ email }],
    });
    if (dup_id.length) {
      res.status(400).send({
        errorMessage: '중복된 아이디입니다.',
      });
      return;
    }

    //이하는 비밀번호 암호화 과정.
    //Crypto 모듈의 randomBytes 메소드를 통해 Salt를 반환하는 함수를 작성한다.
    const createSalt = () =>
      new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
          if (err) reject(err);
          resolve(buf.toString('base64'));
        });
      });

    // 암호화가 안된 비밀번호를 인자로 받아 위에서 작성한 createSalt 함수로 salt를 생성하고 sha-512로 해싱한 암호화된 비밀번호가 생성된다.
    const createHashedPassword = (password) =>
      new Promise(async (resolve, reject) => {
        const salt = await createSalt();
        //인자 순서대로 : ( password, salt, iterations, keylen, digest, callback )
        crypto.pbkdf2(password, salt, 9999, 256, 'sha512', (err, key) => {
          if (err) reject(err);
          resolve({ crypt_password: key.toString('base64'), salt });
        });
      });

    const { crypt_password, salt } = await createHashedPassword(
      req.body.password
    );

    const user = new User({
      email,
      password: crypt_password,
      salt,
      name,
      // birthday,
      // gender,
      // mannerScore,
      // point,
    });
    console.log(email, password, name);
    await user.save();
    res.status(201).json({ message: '회원가입을 축하합니다.' });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      errorMessage: '회원가입 형식을 확인해주세요.',
    });
  }
});

// <---email 중복확인 API-->
const postDupIdSchema = Joi.object({
  email: Joi.string()
    .pattern(
      new RegExp(
        '^[0-9a-zA-Z]([-_.0-9a-zA-Z])*@[0-9a-zA-Z]([-_.0-9a-zA-Z])*.([a-zA-Z])*'
      )
    )
    .required(),
});

router.post('/dup_userId', async (req, res) => {
  try {
    const { email } = await postDupIdSchema.validateAsync(req.body);

    const dup_email = await User.find({
      $or: [{ email }],
    });

    if (dup_email.length) {
      res.status(400).json({
        errorMessage: '중복된 아이디입니다.',
      });
      return;
    } else {
      res.status(200).json({
        message: '사용 가능한 ID입니다.',
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      errorMessage: '회원가입 형식을 확인해주세요.',
    });
  }
});

// <---로그인 API-->

router.post('/login', async (req, res) => {
  try {
    //사용자가 입력하는 password는 암호화 이전의 값임. Joi로 validation 부터 검사.
    const { email, password } = req.body;
    const existUser = await User.findOne({ email });

    if (!existUser) {
      res.status(400).json({
        errorMessage: '아이디 또는 패스워드를 확인해주세요.',
      });
      return;
    }

    //입력받은 password를 회원가입시와 동일한 로직으로 암호화한다.
    //이때 회원가입시 함께 저장해둔 salt를 가져와서 사용.
    const makePasswordHashed = (email, password) =>
      new Promise(async (resolve, reject) => {
        const userFinder = await User.findOne({ email: email });
        const salt = userFinder.salt;

        crypto.pbkdf2(password, salt, 9999, 256, 'sha512', (err, key) => {
          if (err) reject(err);
          resolve(key.toString('base64'));
        });
      });
    const crypt_password = await makePasswordHashed(email, password);

    const user = await User.findOne({
      email,
      password: crypt_password,
    }).exec();

    await User.updateOne({ email: email }, { $set: { loggedin: '🟢' } });

    const token = jwt.sign(
      { userId: user._id.toHexString() },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '120m',
      }
    );
    res.status(200).send({
      token,

      user: {
        userId: user.userId,
        nickname: user.nickname,
        userNum: user.userNum,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      errorMessage: '아이디 또는 패스워드를 확인해주세요.',
    });
  }
});

// 로그아웃 시 is_login값 변경기능, 토큰은 프론트에서 삭제해야함
router.post('/logout', authMiddleware, async (req, res) => {
  const { userNum } = res.locals.user;
  await User.updateOne({ userNum }, { $set: { loggedin: ' ' } });
  res.status(200).send({ message: '로그아웃 성공' });
});

// 최초 로그인시 추가정보 입력 기능
router.put(
  '/signup/first',
  authMiddleware,
  upload.array('userImage'),
  async (req, res) => {
    console.log(req.body);
    const email = res.locals.user.email;
    const { nickname, gender, birthday, mbti, introduction } = req.body;

    const imageReq = req.files;
    console.log(imageReq);
    let imageArray = [];
    function locationPusher() {
      for (let i = 0; i < imageReq.length; i++) {
        imageArray.push(imageReq[i].location);
      }
      return imageArray;
    }
    const userImage = locationPusher();

    const existEmail = await User.findOne({ email });
    console.log(userImage);

    if (
      !userImage ||
      !nickname ||
      !gender ||
      !birthday ||
      !mbti ||
      !introduction
    ) {
      return res.status(400).json({
        errorMessage: '작성란을 모두 입력해주세요.',
      });
    }
    if (email === existEmail['email']) {
      //현재 로그인한 사용자가 숙소를 등록한 사용자라면 숙소 정보 수정을 실행한다.
      await User.updateOne(
        { email },
        {
          $set: {
            userImage,
            nickname,
            gender,
            birthday,
            mbti,
            introduction,
          },
        }
      );
      res.status(200).json({ message: '추가정보를 입력하였습니다.' });
    } else {
      return res
        .status(400)
        .json({ errorMessage: '등록자만 수정할 수 있습니다.' });
    }
  }
);

// 약식 mbti 테스트
router.post('/mbtitest', async (req, res) => {
  const { first, second, third, fourth } = req.body;

  let mbti = '';

  if (first.toString().match(/E/g)?.length > 2) {
    mbti += 'E';
  } else {
    mbti += 'I';
  }

  if (second.toString().match(/S/g)?.length > 2) {
    mbti += 'S';
  } else {
    mbti += 'N';
  }

  if (third.toString().match(/T/g)?.length > 2) {
    mbti += 'T';
  } else {
    mbti += 'F';
  }

  if (fourth.toString().match(/J/g)?.length > 2) {
    mbti += 'J';
  } else {
    mbti += 'P';
  }

  res.status(200).send({ mbti });
});

// 로그인한 유저와 잘 맞는 mbti 유저 추천 기능
router.get('/suggest', authMiddleware, async (req, res) => {
  const { mbti } = res.locals.user; // 로그인한 유저의 mbti

  // 재사용을 위해 유저정보 찾는 과정 함수화
  let user = []; // 전역 변수 선언

  let lookingFor = [];

  // 매개변수의 갯수를 알 수 없으므로 rest 파라미터 사용
  async function suggest(...args) {
    for (let i = 0; i < args.length; i++) {
      lookingFor.push({ mbti: args[i] });
    }
    return (user = await User.find({
      $or: lookingFor,
    }));
  }

  // 로그인한 유저의 mbti를 매개변수로 받는 switch 문 (case 16개)
  // 함수 내에 비동기적으로 처리되는 과정이 있으면 함수앞에 await 써주기
  switch (mbti) {
    case 'INFP':
      await suggest('ENFJ', 'ENTJ');
      break;

    case 'ENFP':
      await suggest('INFJ', 'INTJ');
      break;

    case 'INFJ':
      await suggest('ENFP', 'ENTP');
      break;

    case 'ENFJ':
      await suggest('INFP', 'ISFP');
      break;

    case 'INTJ':
      await suggest('ENFP', 'ENTP');
      break;

    case 'ENTJ':
      await suggest('INFP', 'INTP');
      break;

    case 'INTP':
      await suggest('ENTJ', 'ESTJ');
      break;

    case 'ENTP':
      await suggest('INFJ', 'INTJ');
      break;

    case 'ISFP':
      await suggest('ENFJ', 'ESFJ', 'ESTJ');
      break;

    case 'ESFP':
      await suggest('ISFJ', 'ISTJ');
      break;

    case 'ISTP':
      await suggest('ESFJ', 'ESTJ');
      break;

    case 'ESTP':
      await suggest('ISFJ');
      break;

    case 'ISFJ':
      await suggest('ESFP', 'ESTP');
      break;

    case 'ESFJ':
      await suggest('ISFP', 'ISTP');
      break;

    case 'ISTJ':
      await suggest('ESFP');
      break;

    case 'ESTJ':
      await suggest('INTP', 'ISFP', 'ISTP');
      break;
  }
  res.status(200).json({ success: true, user });
});

//소셜 로그인 카카오 구현
router.get('/kakao', passport.authenticate('kakao'));

// const kakaoCallback = (req, res, next) => {
//   passport.authenticate(
//       'kakao',
//       { failureRedirect: '/' },
//       (err, user, info) => {
//           if (err) return next(err)
//           console.log('콜백~~~')
//           const userInfo = user
//           const { userId } = user
//           const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY)

//           result = {
//               token,
//               userInfo,
//           }
//           console.log('카카오 콜백 함수 결과', result)
//           res.send({ user: result })
//       }
//   )(req, res, next)
// }

// router.get('/kakao/callback', kakaoCallback)


router.get(
  '/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// <---유저정보조회(토큰 내용 확인) API-->
router.get('/auth', authMiddleware, async (req, res) => {
  // res.locals에는 user DB로 관리되는 모든 값이 들어 있다.

  const { user } = res.locals;
  res.status(200).send({
    user: {
      userId: user.userId,
      nickname: user.nickname,
      userNum: user.userNum,
    },
  });
});

module.exports = router;
