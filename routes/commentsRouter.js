const router = require('express').Router();
const Post = require('../schemas/postsSchema');
const Comment = require('../schemas/commentsSchema');
const User = require('../schemas/usersSchema');
const authMiddleware = require('../middlewares/auth-middleware');

// 코멘트 작성: 사용자 인증 넣어야함

router.post('/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;
  const { comment } = req.body;

  const createdAt = new Date().toLocaleDateString('ko-KR');

  if (!comment) {
    return res
      .status(400)
      .json({ success: false, message: '내용을 입력하세요' });
  } else {
    const createdComment = await Comment.create({
      comment,
      createdAt,
      userId,
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
