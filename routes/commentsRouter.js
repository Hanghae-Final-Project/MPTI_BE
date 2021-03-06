const router = require('express').Router();
const Post = require('../schemas/postsSchema');
const Comment = require('../schemas/commentsSchema');
const User = require('../schemas/usersSchema');
const authMiddleware = require('../middlewares/auth-middleware');

// 코멘트 작성: 사용자 인증 넣어야함

router.post('/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId, nickname, userImage, userNum } = res.locals.user;
  const { comment } = req.body;

  const existingPost = await Post.findOne({ postId: parseInt(postId) });
  const postUserNum = existingPost.userNum;
  const author = await User.findOne({ userNum: postUserNum });
  const blockedUsers = author.blockedUsers;

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

  if (!comment) {
    return res
      .status(400)
      .json({ success: false, message: '내용을 입력하세요' });
  } else if (blockedUsers.includes(userNum) === true) {
    res.status(400).send({
      message: '상대방이 당신을 차단해서 댓글을 달 수 없습니다.',
      blocked: 'blocked',
    });
  } else {
    const createdComment = await Comment.create({
      comment,
      createdAt,
      userId,
      userNum,
      nickname,
      userImage,
      postId,
    });
    const commentCount = await Comment.find({ postId: parseInt(postId) });
    await Post.updateOne(
      { postId: parseInt(postId) },
      { $set: { commentCount: commentCount.length } }
    );
    res.status(200).json({
      success: true,
      message: '댓글 저장 성공',
      comment: createdComment,
    });
  }
});

// 코멘트 삭제: 유저인증
router.delete('/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const { userId } = res.locals.user;
  const existingComment = await Comment.findOne({
    commentId: parseInt(commentId),
  });
  if (userId !== existingComment.userId.toString()) {
    res
      .status(400)
      .json({ success: false, message: '내가 쓴 댓글이 아닙니다' });
  } else {
    await Comment.deleteOne({ commentId: parseInt(commentId) });
    const commentCount = await Comment.find({
      postId: existingComment.postId,
    });
    await Post.updateOne(
      { postId: existingComment.postId },
      { $set: { commentCount: commentCount.length } }
    );
    res.status(200).json({ success: true, message: '댓글 삭제 성공' });
  }
});

// 코멘트 수정: 유저인증
router.put('/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;
  const { userId } = res.locals.user;
  const { comment } = req.body;
  const existingComment = await Comment.findOne({
    commentId: parseInt(commentId),
  });

  if (userId !== existingComment.userId.toString()) {
    res
      .status(400)
      .json({ success: false, message: '내가 쓴 댓글이 아닙니다' });
  } else {
    await Comment.updateOne(
      { commentId: parseInt(commentId) },
      { $set: { comment } }
    );
    res.status(200).json({ success: true, message: '댓글 수정 완료' });
  }
});

module.exports = router;
