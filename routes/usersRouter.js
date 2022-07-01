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
const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'seohobucket',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname.split('.').pop()); // 이름 설정
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
    } = await req.body;
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

    const token = jwt.sign(
      { userId: user._id.toHexString() },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '120m',
      }
    );
    res.send({
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      errorMessage: '아이디 또는 패스워드를 확인해주세요.',
    });
  }
});

router.put(
  '/signup/first',
  authMiddleware,
  upload.array('userImage'),
  async (req, res) => {
    console.log(req.body);
    const email = res.locals.user.email;
    const { nickname, gender, birthday, mbti, introduction } = req.body;

    const imageReq = req.files;
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

// <---유저정보조회(토큰 내용 확인) API-->
router.get('/auth', authMiddleware, async (req, res) => {
  // res.locals에는 user DB로 관리되는 모든 값이 들어 있다.

  const { user } = res.locals;
  res.status(200).send({
    user: {
      userId: user.userId,
    },
  });
});

module.exports = router;
