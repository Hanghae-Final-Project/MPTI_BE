const router = require('express').Router();
const authMiddleware = require('../middlewares/auth-middleware');
const Comment = require('../schemas/commentsSchema');
const User = require('../schemas/usersSchema');
const Post = require('../schemas/postsSchema');
const Like = require('../schemas/likesSchema');
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

// Post 전체 정보 불러오기
router.get('/postList', async (req, res) => {
  try {
    const posts = await Post.find().sort({ postId: -1 }); //오름차순 정렬
    res.status(200).json({
      posts,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Post 상세 보기
router.get(
  '/:postId',
  // authMiddleware,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const existLikes = await Post.findOne({ postId: postId });
      const countLikes = existLikes.countLikes;
      const posts = await Post.findOne({ postId: parseInt(postId) });
      const existingComment = await Comment.find({
        postId: parseInt(postId),
      }).sort({ commentId: 1 });

      res.status(200).json({
        posts,
        existingComment,
        countLikes,
        message: '상세페이지 보기 성공',
      });
    } catch (err) {
      res.status(400).json({
        errorMessage: '상세페이지 보기 실패',
      });
      console.log('Post 상세페이지 보기 실패: ' + err);
    }
  }
);
//Post 작성
router.post(
  '/',
  authMiddleware,
  upload.array('postImage'),
  async (req, res) => {
    try {
      console.log(res.locals.user);
      const { userId, nickname, userImage, userNum } = res.locals.user;
      const { postCategory, postContent } = req.body;

      const imageReq = req.files;
      let imageArray = [];
      function locationPusher() {
        for (let i = 0; i < imageReq.length; i++) {
          imageArray.push(imageReq[i].location);
        }
        return imageArray;
      }
      const postImage = locationPusher();

      const now = new Date();
      const date = now.toLocaleDateString('ko-KR');
      const year = Number(date.split('.')[0]);
      let month = Number(date.split('.')[1].trim());
      if (month < 10) {
        month = '0' + month;
      }
      let day = Number(date.split('.')[2].trim());
      if (day < 10) {
        day = '0' + day;
      }
      const createdAt = `${year}. ${month}. ${day}`;
      // const createdAt = new Date().toLocaleDateString('ko-KR');

      let countLikes = 0;

      const createPost = await Post.create({
        postCategory,
        postImage,
        createdAt,
        postContent,
        userId,
        userNum,
        countLikes,
        nickname,
        userImage,
      });

      res.status(200).json({ Posts: createPost, message: 'Post 생성 성공.' });
    } catch (err) {
      console.log(err);
      res.status(400).json({
        errorMessage: 'Post생성 실패',
      });
    }
  }
);

// Post 수정 :

router.put(
  '/:postId',
  authMiddleware,
  // upload.array('postImage'),
  async (req, res) => {
    const { postId } = req.params;
    const { userId } = res.locals.user;
    const { postCategory, postContent, postImage } = req.body;

    // const imageReq = req.files;
    // let imageArray = [];
    // function locationPusher() {
    //   for (let i = 0; i < imageReq.length; i++) {
    //     imageArray.push(imageReq[i].location);
    //   }
    //   return imageArray;
    // }
    // const postImage = locationPusher();

    const existingPost = await Post.findOne({ postId: parseInt(postId) });

    if (userId !== existingPost.userId.toString()) {
      res.status(400).json({ success: false, message: '내 게시물이 아닙니다' });
    } else {
      await Post.updateOne(
        { postId: parseInt(postId) },
        {
          $set: {
            postCategory,
            postImage,
            postContent,
          },
        }
      );
      res.status(200).json({ success: true, message: '게시물 수정 완료' });
    }
  }
);

// Post 삭제 : 유저확인,삭제되는 포스트와 같은 postId값 가진 댓글들도 삭제
router.delete('/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;

  const existPost = await Post.findOne({ postId: parseInt(postId) });
  const existComment = await Comment.find({ postId: parseInt(postId) });

  if (userId === existPost.userId.toString()) {
    if (existPost && existComment) {
      await Post.deleteOne({ postId: parseInt(postId) });
      await Comment.deleteMany({ postId: parseInt(postId) });
      res.send({ result: ' 성공' });
    } else if (existPost) {
      await Post.deleteOne({ postId: parseInt(postId) });
      res.status(200).send({ result: '포스트 삭제 성공' });
    }
  } else {
    res.status(401).send({ result: '내 게시물이 아닙니다' });
  }
});

// 좋아요 추가 기능
router.post('/likes/:postId', authMiddleware, async (req, res) => {
  const { userId, userNum } = res.locals.user;
  const { postId } = req.params;
  const isLike = await Like.findOne({ userId: userId, postId });
  if (isLike) {
    return res
      .status(400)
      .json({ errorMessage: '이미 좋아요 되어있는 상태입니다.' });
  } else {
    await Like.create({ userId, postId, userNum });
    const existLikes = await Post.findOne({ postId: postId });
    if (existLikes) {
      const countLikes = existLikes.countLikes + 1;
      await Post.updateOne({ postId: postId }, { $set: { countLikes } });
    }
  }
  res.status(201).json({ message: '좋아요 추가 되었습니다.' });
});

// 좋아요 제거 기능
router.delete('/likes/:postId', authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;
  const isLike = await Like.findOne({ postId, userId });
  if (!isLike) {
    return res
      .status(400)
      .json({ errorMessage: '이미 좋아요 되어있지 않은 상태입니다.' });
  } else {
    await Like.deleteOne({ userId, postId });
    const existLikes = await Post.findOne({ postId: postId });
    if (existLikes) {
      const countLikes = existLikes.countLikes - 1;
      await Post.updateOne({ postId: postId }, { $set: { countLikes } });
    }
  }
  res.status(201).json({ message: '좋아요 취소 되었습니다.' });
});

// 좋아요 조회기능
router.get(
  '/likes/:postId',
  //  authMiddleware,
  async (req, res) => {
    const { postId } = req.params;
    const existLikeUsers = await Like.find({ postId });
    const existLikes = await Post.findOne({ postId: postId });
    const countLikes = existLikes.countLikes;
    const likeUsers = existLikeUsers.map((item) => item.userNum);
    res.json({ likeUsers, countLikes });
  }
);

module.exports = router;
