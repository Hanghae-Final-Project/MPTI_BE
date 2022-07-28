const router = require('express').Router();
require('dotenv').config();
const User = require('../schemas/usersSchema');
const Post = require('../schemas/postsSchema');
const Comment = require('../schemas/commentsSchema');
const Room = require('../schemas/roomsSchema');
const Message = require('../schemas/messagesSchema');
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
    contentType: function (req, file, cb) {
      cb(null, file.mimetype);
    },
    key: function (req, file, cb) {
      cb(null, Date.now() + '.' + file.originalname); // 이름 설정
    },
  }),
});

// 프로필 사진 업로드 기능
router.post(
  '/images',
  // authMiddleware,
  upload.single('profileImages'),
  async (req, res) => {
    try {
      const profileImages = req.file.location;
      res.status(200).json({ success: true, profileImages });
    } catch (err) {
      res.status(400).send({ result: 'fail' });
    }
  }
);

// 마이페이지 조회: 사용자 인증
router.get(
  '/mypage/:userNum',
  //  authMiddleware,
  async (req, res) => {
    const { userNum } = req.params;
    const existingUser = await User.findOne({ userNum: parseInt(userNum) });
    res
      .status(200)
      .json({ existingUser, message: '마이 페이지 불러오기 성공' });
  }
);

// 마이페이지 수정: 사용자 인증
router.put(
  '/mypage/:userNum',
  authMiddleware,
  upload.array('userImage'),
  async (req, res, next) => {
    const { userNum } = req.params;
    const { userId } = res.locals.user;
    const { nickname } = req.body;

    const imageReq = req.files;
    let imageArray = [];
    function locationPusher() {
      for (let i = 0; i < imageReq.length; i++) {
        imageArray.push(imageReq[i].location);
      }
      return imageArray;
    }
    const userImage = locationPusher();

    const existingUser = await User.findOne({ userNum: parseInt(userNum) });

    const chatList = await Room.find({ members: parseInt(userNum) });

    if (userId !== existingUser.userId) {
      res.status(400).json({ success: false, message: '내 정보가 아닙니다' });
    } else {
      // 유저정보 수정
      await User.updateOne(
        { userNum: parseInt(userNum) },
        { $set: { nickname, userImage } }
      );
      // 유저정보 들어간 모든 곳 수정(게시물, 댓글, 채팅방, 메세지)
      await Post.updateMany(
        { userNum: parseInt(userNum) },
        { $set: { nickname, userImage } }
      );
      await Comment.updateMany(
        { userNum: parseInt(userNum) },
        { $set: { nickname, userImage } }
      );
      await Message.updateMany(
        { userNum: parseInt(userNum) },
        { $set: { userImage } }
      );
      await chatList.forEach((chatList) => {
        if (parseInt(userNum) === chatList.leftUserNum) {
          Room.updateMany(
            { leftUserNum: parseInt(userNum) },
            { $set: { leftUserNickname: nickname, leftUserImage: userImage } }
          ).then((a) => {
            next();
          });
        } else if (parseInt(userNum) === chatList.receiverUserNum) {
          Room.updateMany(
            { receiverUserNum: parseInt(userNum) },
            {
              $set: {
                receiverNickname: nickname,
                receiverUserImage: userImage,
              },
            }
          ).then((a) => {
            next();
          });
        } else if (parseInt(userNum) === chatList.senderUserNum) {
          Room.updateMany(
            { senderUserNum: parseInt(userNum) },
            { $set: { senderNickname: nickname, senderUserImage: userImage } }
          ).then((a) => {
            next();
          });
        }
      });
      res.status(200).json({ success: true, message: '내 정보 수정 성공' });
    }
  }
);

// 프로필 수정 : 사용자 인증
router.put(
  '/mypage/profile/:userNum',
  authMiddleware,
  // upload.array('profileImages'),
  async (req, res, next) => {
    const { userNum } = req.params;
    const { userId } = res.locals.user;
    const { introduction, profileImages } = req.body;

    // const imageReq = req.files;
    // let imageArray = [];
    // function locationPusher() {
    //   for (let i = 0; i < imageReq.length; i++) {
    //     imageArray.push(imageReq[i].location);
    //   }
    //   return imageArray;
    // }
    // const profileImages = locationPusher();

    const existingUser = await User.findOne({ userNum: parseInt(userNum) });

    const chatList = await Room.find({ members: parseInt(userNum) });

    if (userId !== existingUser.userId) {
      res.status(400).json({ success: false, message: '내 프로필이 아닙니다' });
    } else {
      await User.updateOne(
        { userNum: parseInt(userNum) },
        { $set: { profileImages, introduction } }
      );
      await Message.updateMany(
        { userNum: parseInt(userNum) },
        { $set: { profileImages } }
      );
      await chatList.forEach((chatList) => {
        if (parseInt(userNum) === chatList.leftUserNum) {
          Room.updateMany(
            {
              leftUserNum: parseInt(userNum),
            },
            {
              $set: {
                leftUserIntroduction: introduction,
                leftUserProfileImages: profileImages,
              },
            }
          ).then((a) => {
            next();
          });
        } else if (parseInt(userNum) === chatList.receiverUserNum) {
          Room.updateMany(
            { receiverUserNum: parseInt(userNum) },
            {
              $set: {
                receiverIntroduction: introduction,
                receiverProfileImages: profileImages,
              },
            }
          ).then((a) => {
            next();
          });
        } else if (parseInt(userNum) === chatList.senderUserNum) {
          Room.updateMany(
            { senderUserNum: parseInt(userNum) },
            {
              $set: {
                senderIntroduction: introduction,
                senderProfileImages: profileImages,
              },
            }
          ).then((a) => {
            next();
          });
        }
      });
      res.status(200).json({ success: true, message: '프로필 수정 성공' });
    }
  }
);

// MBTI 성격 별 검색 기능: 사용자 인증
router.get(
  '/userList',
  //  authMiddleware,
  async (req, res) => {
    const userList = await User.find();
    res.status(200).send({ userList });
  }
);

module.exports = router;
