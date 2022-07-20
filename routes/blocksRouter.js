const router = require('express').Router();
const User = require('../schemas/usersSchema');
const authMiddleware = require('../middlewares/auth-middleware');

// 유저 차단하기 기능 (채팅 못걸게)
router.put('/block', authMiddleware, async (req, res) => {
  try {
    const { userNum } = res.locals.user;
    const blockedUserNum = parseInt(req.body.userNum);

    const existingUser = await User.findOne({ userNum });
    let existingBlockedUsers = existingUser.blockedUsers;

    if (existingBlockedUsers.includes(blockedUserNum) === true) {
      res.status(400).send({ message: '이미 차단한 유저입니다' });
    } else {
      existingBlockedUsers.push(blockedUserNum);
      await User.updateOne(
        { userNum },
        { $set: { blockedUsers: existingBlockedUsers } }
      );
      res.status(200).send({ message: '차단 성공' });
    }
  } catch (err) {
    res.status(400).send({ errorMessage: '차단 실패' });
    console.log('실패 로그: ' + err);
  }
});

// 유저 차단 해제 기능
router.put('/blockRemove', authMiddleware, async (req, res) => {
  try {
    const { userNum } = res.locals.user;
    const blockedUserNum = parseInt(req.body.userNum);

    const existingUser = await User.findOne({ userNum });

    let blockedUsers = existingUser.blockedUsers;

    if (blockedUsers.includes(blockedUserNum) === true) {
      blockedUsers = blockedUsers.filter((data) => {
        return data !== blockedUserNum;
      });

      await User.updateOne({ userNum }, { $set: { blockedUsers } });
      res.status(200).send({ message: '차단 해제 성공' });
    } else if (blockedUsers.includes(blockedUserNum) === false) {
      res.status(400).send({ message: '이 유저를 차단하지 않았습니다.' });
    }
  } catch (err) {
    res.status(400).send({ errorMessage: '차단 해제 실패' });
    console.log('실패 로그: ' + err);
  }
});
module.exports = router;
